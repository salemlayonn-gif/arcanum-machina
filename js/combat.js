/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Combat System
   ═══════════════════════════════════════════ */

var Combat = {

  startFight: function(zoneId) {
    if (G.combat.active) return;
    if (G.explore.active) {
      addLog('Cannot fight while scouting — wait for the scout to return.', '');
      return;
    }
    if (Date.now() < G.combat.cooldownUntil) {
      addLog('Still recovering from last fight...', '');
      return;
    }

    var zone = DATA.zones[zoneId];
    if (!zone) return;

    /* Check unlock condition */
    if (!zone.unlockCondition(G)) return;

    /* Pick a random enemy from zone */
    var enemies = zone.enemies;
    var enemyId = enemies[Math.floor(Math.random() * enemies.length)];
    var enemy   = DATA.enemies[enemyId];
    if (!enemy) return;

    /* Ensure hero is alive */
    if (G.hero.hp <= 0) {
      G.hero.hp = 1;
    }

    G.combat.active      = true;
    G.combat.zoneId      = zoneId;
    G.combat.enemyId     = enemyId;
    G.combat.heroHp      = G.hero.hp;
    G.combat.enemyHp     = enemy.hp;
    G.combat.enemyMaxHp  = enemy.hp;
    G.combat.log         = [];
    G.combat.result      = null;
    G.combat.lastTurnTime= Date.now();
    G.combat.turnCount   = 0;

    // Golem companion
    if ((G.buildings.golemForge || 0) >= 1) {
      G.combat.golemHp    = G.combat.golemMaxHp;
    } else {
      G.combat.golemHp    = 0;
    }

    Combat.combatLog('ENCOUNTER: ' + enemy.name + ' appears!', 'cl-system');
    if (G.combat.golemHp > 0) {
      Combat.combatLog('Your golem companion joins the fight.', 'cl-system');
    }

    // Switch to map screen for combat view
    G.ui.screen = 'map';

    addLog('Combat started: ' + enemy.name + ' in ' + zone.name + '.', 'log-combat');
    RENDER.markDirty();
  },

  processTurn: function() {
    var enemy = DATA.enemies[G.combat.enemyId];
    if (!enemy) return;

    G.combat.turnCount++;

    /* Hero attacks */
    var heroAtk   = getHeroAttack();
    var enemyDef  = Math.max(0, enemy.defense);
    var heroDmg   = Math.max(1, heroAtk - enemyDef + Math.floor(Math.random() * 3) - 1);
    var crit      = Math.random() < 0.12;
    if (crit) heroDmg = Math.floor(heroDmg * 1.8);

    G.combat.enemyHp -= heroDmg;
    var critText = crit ? ' [CRITICAL!]' : '';
    Combat.combatLog(G.heroName + ' attacks for ' + heroDmg + ' damage.' + critText, 'cl-hero');

    /* Golem attacks if alive */
    if (G.combat.golemHp > 0) {
      var golemDmg = Math.max(1, 6 - Math.floor(enemyDef / 2) + Math.floor(Math.random() * 4));
      G.combat.enemyHp -= golemDmg;
      Combat.combatLog('Golem strikes for ' + golemDmg + '.', 'cl-hero');
    }

    /* Check enemy death */
    if (G.combat.enemyHp <= 0) {
      G.combat.enemyHp = 0;
      Combat.winFight(enemy);
      return;
    }

    /* Enemy attacks */
    var enemyAtk  = enemy.attack;
    var heroDef   = getHeroDefense();
    var enemyDmg  = Math.max(1, enemyAtk - heroDef + Math.floor(Math.random() * 3) - 1);

    /* Split damage: golem tanks if alive */
    if (G.combat.golemHp > 0) {
      var golemTank = Math.floor(enemyDmg * 0.4);
      var heroTake  = enemyDmg - golemTank;
      G.combat.golemHp -= golemTank;
      G.combat.heroHp  -= heroTake;
      if (G.combat.golemHp < 0) G.combat.golemHp = 0;
      Combat.combatLog(enemy.name + ' ' + enemy.attackVerb + ' you for ' + heroTake + '. (Golem absorbs ' + golemTank + ')', 'cl-hit');
    } else {
      G.combat.heroHp -= enemyDmg;
      Combat.combatLog(enemy.name + ' ' + enemy.attackVerb + ' you for ' + enemyDmg + '.', 'cl-hit');
    }

    /* Check hero death */
    if (G.combat.heroHp <= 0) {
      G.combat.heroHp = 0;
      Combat.loseFight(enemy);
      return;
    }

    /* Keep log trimmed */
    if (G.combat.log.length > 12) G.combat.log.shift();
  },

  winFight: function(enemy) {
    G.combat.result = 'win';
    G.combat.active = false;
    G.hero.hp       = Math.max(1, G.combat.heroHp);

    Combat.combatLog(enemy.deathMsg, 'cl-system');

    /* Loot */
    var lootLines = [];
    enemy.loot.forEach(function(entry) {
      if (Math.random() < entry.chance) {
        var amt = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
        resAdd(entry.id, amt);
        lootLines.push(fmt(amt) + ' ' + entry.id);
      }
    });

    if (lootLines.length) {
      Combat.combatLog('Loot: ' + lootLines.join(', '), 'cl-loot');
    } else {
      Combat.combatLog('No loot.', 'cl-system');
    }

    /* EXP */
    grantExp(enemy.exp);
    Combat.combatLog('Gained ' + enemy.exp + ' EXP.', 'cl-loot');
    Combat.combatLog('Victory!', 'cl-win');

    G.stats.enemiesDefeated++;
    addLog('Defeated: ' + enemy.name, 'log-combat');

    G.combat.cooldownUntil = Date.now() + 2000;
    if (G.buffs) G.buffs.attackBonus = 0;
  },

  loseFight: function(enemy) {
    G.combat.result = 'lose';
    G.combat.active = false;
    G.hero.hp       = 1;

    Combat.combatLog('You are overwhelmed. Retreating...', 'cl-system');
    Combat.combatLog('Defeat.', 'cl-lose');

    /* Penalty: lose some mana */
    var manaLost = Math.floor(G.res.mana * 0.1);
    if (manaLost > 0) {
      resSub('mana', manaLost);
      Combat.combatLog('Lost ' + fmt(manaLost) + ' mana in the retreat.', 'cl-hit');
    }

    addLog('Defeated by ' + enemy.name + '. Retreated.', 'log-combat');
    G.combat.cooldownUntil = Date.now() + 5000;
    if (G.buffs) G.buffs.attackBonus = 0;
  },

  flee: function() {
    if (!G.combat.active) return;
    var enemy = DATA.enemies[G.combat.enemyId];
    G.combat.active = false;
    G.combat.result = 'flee';
    G.hero.hp = Math.max(1, G.combat.heroHp);

    var manaLost = Math.floor(G.res.mana * 0.05);
    if (manaLost > 0) resSub('mana', manaLost);

    Combat.combatLog('You flee the battle.', 'cl-system');
    addLog('Fled from ' + (enemy ? enemy.name : 'enemy') + '.', 'log-combat');
    G.combat.cooldownUntil = Date.now() + 3000;
    if (G.buffs) G.buffs.attackBonus = 0;
    RENDER.markDirty();
  },

  combatLog: function(msg, cls) {
    G.combat.log.push({ msg: msg, cls: cls });
    if (G.combat.log.length > 14) G.combat.log.shift();
  },

  clearResult: function() {
    G.combat.result   = null;
    G.combat.log      = [];
    G.combat.enemyId  = null;
    G.combat.zoneId   = null;
    RENDER.markDirty();
  },

  getHpClass: function(hp, max) {
    var pct = hp / max;
    if (pct > 0.5) return 'hp-high';
    if (pct > 0.25) return 'hp-mid';
    return 'hp-low';
  },

  hpPct: function(hp, max) {
    return Math.max(0, Math.min(100, (hp / max) * 100)).toFixed(1);
  }
};
