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

    // Golem companion — HP scales with hero level
    if ((G.buildings.golemForge || 0) >= 1) {
      var golemMax = 30 + G.hero.level * 5;
      G.combat.golemMaxHp = golemMax;
      G.combat.golemHp    = golemMax;
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

    /* Golem attacks if alive — scales with hero level */
    if (G.combat.golemHp > 0) {
      var golemBase = 6 + Math.floor(G.hero.level / 2);
      var golemDmg = Math.max(2, golemBase - Math.floor(enemyDef / 4) + Math.floor(Math.random() * 4));
      G.combat.enemyHp -= golemDmg;
      Combat.combatLog('Golem strikes for ' + golemDmg + '.', 'cl-hero');
    }

    /* Check enemy death */
    if (G.combat.enemyHp <= 0) {
      G.combat.enemyHp = 0;
      Combat.winFight(enemy);
      return;
    }

    /* Enemy attacks — check stun and shield buffs first */
    var enemyAtk  = enemy.attack;
    var heroDef   = getHeroDefense();
    var enemyDmg  = Math.max(1, enemyAtk - heroDef + Math.floor(Math.random() * 3) - 1);

    if (G.buffs && G.buffs.enemyStunned) {
      Combat.combatLog('Enemy stunned — attack negated!', 'cl-hero');
      G.buffs.enemyStunned = false;
    } else if (G.buffs && G.buffs.shieldActive) {
      Combat.combatLog('Arcane Shield absorbs the hit!', 'cl-hero');
      G.buffs.shieldActive = false;
      /* Golem still takes damage if active */
      if (G.combat.golemHp > 0) {
        var golemTankShield = Math.floor(enemyDmg * 0.4);
        G.combat.golemHp -= golemTankShield;
        if (G.combat.golemHp < 0) G.combat.golemHp = 0;
        Combat.combatLog(enemy.name + ' ' + enemy.attackVerb + ' the shield. (Golem absorbs ' + golemTankShield + ')', 'cl-hit');
      }
    } else {
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
    if (G.buffs) { G.buffs.attackBonus = 0; G.buffs.shieldActive = false; G.buffs.enemyStunned = false; }

    /* 20% chance of combat momentum: carry +3 ATK into the next fight */
    if (Math.random() < 0.20) {
      G.buffs.attackBonus = 3;
      Combat.combatLog('Combat momentum! (+3 ATK carries forward)', 'cl-loot');
    }
  },

  loseFight: function(enemy) {
    G.combat.result = 'lose';
    G.combat.active = false;
    G.hero.hp       = Math.max(1, Math.floor(getHeroMaxHp() * 0.25));

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
    if (G.buffs) { G.buffs.attackBonus = 0; G.buffs.shieldActive = false; G.buffs.enemyStunned = false; }
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
    if (G.buffs) { G.buffs.attackBonus = 0; G.buffs.shieldActive = false; G.buffs.enemyStunned = false; }
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
  },

  repairGolem: function() {
    if (G.prestige.count < 5) return;
    if (!G.combat.active) return;
    if (G.combat.golemHp > 0) return;
    if ((G.buildings.golemForge || 0) < 1) return;
    var cost = { scrap: 5, etherCell: 1 };
    if (!canAfford(cost)) {
      addLog('Not enough resources to repair golem (5 scrap + 1 etherCell).', '');
      return;
    }
    spendResources(cost);
    var repairHp = Math.floor(G.combat.golemMaxHp * 0.4);
    G.combat.golemHp = repairHp;
    Combat.combatLog('Golem repaired and re-engaged!', 'cl-hero');
    addLog('Golem repaired in combat.', 'log-combat');
    RENDER.markDirty();
  }
};

/* ── SPELLS ────────────────────────────── */
var Spells = {
  list: [
    {
      id: 'manaBolt',
      name: 'Mana Bolt',
      manaCost: 30,
      desc: 'Channel ley energy — 20-35 bonus damage.',
      use: function() {
        resSub('mana', 30);
        var dmg = 20 + Math.floor(Math.random() * 16);
        G.combat.enemyHp -= dmg;
        if (G.combat.enemyHp < 0) G.combat.enemyHp = 0;
        Combat.combatLog('Mana Bolt strikes for ' + dmg + ' arcane damage!', 'cl-hero');
        if (G.combat.enemyHp <= 0) {
          var enemy = DATA.enemies[G.combat.enemyId];
          if (enemy) Combat.winFight(enemy);
        }
        RENDER.markDirty();
      }
    },
    {
      id: 'arcaneShield',
      name: 'Arcane Shield',
      manaCost: 50,
      desc: 'Absorb the next enemy hit. 50 mana.',
      use: function() {
        resSub('mana', 50);
        G.buffs.shieldActive = true;
        Combat.combatLog('Arcane Shield raised — next hit absorbed.', 'cl-hero');
        RENDER.markDirty();
      }
    },
    {
      id: 'leyPulse',
      name: 'Ley Pulse',
      manaCost: 80,
      desc: 'Stun enemy — skip their next attack. 80 mana.',
      use: function() {
        resSub('mana', 80);
        G.buffs.enemyStunned = true;
        Combat.combatLog('Ley Pulse fired — enemy stunned!', 'cl-hero');
        RENDER.markDirty();
      }
    }
  ],

  canUse: function(spell) {
    return G.combat.active && !G.combat.result && G.res.mana >= spell.manaCost;
  },

  useSpell: function(id) {
    for (var i = 0; i < Spells.list.length; i++) {
      if (Spells.list[i].id === id) {
        if (Spells.canUse(Spells.list[i])) {
          Spells.list[i].use();
        }
        return;
      }
    }
  }
};
