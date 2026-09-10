/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Combat System
   "Combat is terse, functional, unglamorous." — nothing here dies.
   ═══════════════════════════════════════════ */

var Combat = {

  startFight: function(zoneId) {
    if (G.combat.active) return;
    if (G.awakening || G.ending) return;
    if (G.explore.active) {
      addLog('You are still out on the road. Wait until you are back.', '');
      return;
    }
    if (Date.now() < G.combat.cooldownUntil) {
      addLog('Your hands are still shaking from the last one.', '');
      return;
    }

    var zone = DATA.zones[zoneId];
    if (!zone) return;
    if (!zone.unlockCondition(G)) return;

    var enemies = zone.enemies;
    var enemyId = enemies[Math.floor(Math.random() * enemies.length)];
    var enemy   = DATA.enemies[enemyId];
    if (!enemy) return;

    if (G.hero.hp <= 0) G.hero.hp = 1;

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
    G.combat.modifier    = null;
    G.combat.script      = null;

    // Golem companion — HP scales with hero level
    if ((G.buildings.golemForge || 0) >= 1) {
      var golemMax = 30 + G.hero.level * 5;
      G.combat.golemMaxHp = golemMax;
      G.combat.golemHp    = golemMax;
    } else {
      G.combat.golemHp    = 0;
    }

    G.ui.screen = 'map';

    /* ── Seeded moments: VERITAS positions what can be positioned (Ch. 14) ── */
    var firstCycle = G.prestige.count === 0;

    if (enemy.noncombat) {
      Combat.combatLog(enemy.encounterIntro || ('Something is here. ' + enemy.name + '.'), 'cl-system');
      G.combat.script = { lines: enemy.encounter.slice(), idx: 0, resolve: 'grant' };
      addLog('Descent: ' + zone.name + '. ' + enemy.name + '.', 'log-combat');
      RENDER.markDirty();
      return;
    }

    if (firstCycle && enemyId === 'forest_wolf' && !G.seeds.wolfStare &&
        G.stats.enemiesDefeated >= 1 && Math.random() < 0.35) {
      G.seeds.wolfStare = true;
      Combat.combatLog('Something moves on the road. A wolf.', 'cl-system');
      G.combat.script = {
        lines: [
          'It stops at the edge of the paving.',
          'It looks at you for a long moment.',
          'Then it turns and goes back into the trees. You do not know why.'
        ],
        idx: 0, resolve: 'pass'
      };
      addLog('A wolf on the road. It did not attack.', 'log-combat');
      RENDER.markDirty();
      return;
    }

    if (firstCycle && enemyId === 'road_bandit' && !G.seeds.tiredBandit &&
        G.stats.enemiesDefeated >= 1 && G.stats.enemiesDefeated <= 8 && Math.random() < 0.5) {
      G.combat.modifier = 'tired';
    }

    Combat.combatLog('Something moves on the road. ' + enemy.name + '.', 'cl-system');
    if (G.combat.modifier === 'tired') {
      Combat.combatLog('His arm is slow. He has been walking for days. He is exhausted.', 'cl-system');
    }
    if (G.combat.golemHp > 0) {
      Combat.combatLog('The golem steps up beside you.', 'cl-system');
    }

    addLog(enemy.name + ' — ' + zone.name + '.', 'log-combat');
    RENDER.markDirty();
  },

  /* Scripted non-combat encounters advance one line per turn */
  stepScript: function() {
    var s = G.combat.script;
    var enemy = DATA.enemies[G.combat.enemyId];
    if (!s || !enemy) return;
    if (s.idx < s.lines.length) {
      Combat.combatLog(s.lines[s.idx], s.resolve === 'grant' ? 'cl-hero' : 'cl-system');
      s.idx++;
      return;
    }
    G.combat.script = null;
    if (s.resolve === 'grant') {
      Combat.winFight(enemy, { encounter: true });
    } else {
      Combat.resolvePass(enemy, {});
    }
  },

  processTurn: function() {
    if (!G.combat.active || G.combat.result) return;
    if (G.combat.script) { Combat.stepScript(); return; }

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
    Combat.combatLog('You strike for ' + heroDmg + '.' + (crit ? ' A clean hit.' : ''), 'cl-hero');

    if (G.combat.enemyHp <= 0) {
      G.combat.enemyHp = 0;
      Combat.winFight(enemy);
      return;
    }

    /* Golem attacks if alive — scales with hero level */
    if (G.combat.golemHp > 0) {
      var golemBase = 6 + Math.floor(G.hero.level / 2);
      var golemDmg = Math.max(2, golemBase - Math.floor(enemyDef / 4) + Math.floor(Math.random() * 4));
      G.combat.enemyHp -= golemDmg;
      Combat.combatLog('The golem strikes for ' + golemDmg + '.', 'cl-hero');
    }

    if (G.combat.enemyHp <= 0) {
      G.combat.enemyHp = 0;
      Combat.winFight(enemy);
      return;
    }

    /* Enemy attacks */
    var enemyAtk  = enemy.attack;
    if (G.combat.modifier === 'tired') enemyAtk = Math.ceil(enemyAtk * 0.5);
    var heroDef   = getHeroDefense();
    var enemyDmg  = Math.max(1, enemyAtk - heroDef + Math.floor(Math.random() * 3) - 1);

    if (G.buffs && G.buffs.enemyStunned) {
      Combat.combatLog('The pulse holds it. It does not strike.', 'cl-hero');
      G.buffs.enemyStunned = false;
    } else if (G.buffs && G.buffs.shieldActive) {
      Combat.combatLog('The shield takes the blow.', 'cl-hero');
      G.buffs.shieldActive = false;
      if (G.combat.golemHp > 0) {
        var golemTankShield = Math.floor(enemyDmg * 0.4);
        G.combat.golemHp -= golemTankShield;
        if (G.combat.golemHp < 0) G.combat.golemHp = 0;
        Combat.combatLog(enemy.name + ' ' + enemy.attackVerb + ' the shield. The golem absorbs ' + golemTankShield + '.', 'cl-hit');
      }
    } else {
      if (G.combat.golemHp > 0) {
        var golemTank = Math.floor(enemyDmg * 0.4);
        var heroTake  = enemyDmg - golemTank;
        G.combat.golemHp -= golemTank;
        G.combat.heroHp  -= heroTake;
        if (G.combat.golemHp < 0) G.combat.golemHp = 0;
        Combat.combatLog(enemy.name + ' ' + enemy.attackVerb + ' you for ' + heroTake + '. The golem absorbs ' + golemTank + '.', 'cl-hit');
      } else {
        G.combat.heroHp -= enemyDmg;
        Combat.combatLog(enemy.name + ' ' + enemy.attackVerb + ' you for ' + enemyDmg + '.', 'cl-hit');
      }
    }

    if (G.combat.heroHp <= 0) {
      G.combat.heroHp = 0;
      Combat.loseFight(enemy);
      return;
    }

    if (G.combat.log.length > 12) G.combat.log.shift();
  },

  grantLoot: function(enemy) {
    var lootLines = [];
    enemy.loot.forEach(function(entry) {
      if (Math.random() < entry.chance) {
        var amt = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
        if (entry.id === 'memoryShard') {
          var acc = G.hero.equipment.accessory;
          if (acc && DATA.equipment[acc] && DATA.equipment[acc].stats.shardFind) {
            if (Math.random() < DATA.equipment[acc].stats.shardFind) amt++;
          }
          if ((G.relics || []).indexOf('latticeFragment') !== -1) amt++;
        }
        resAdd(entry.id, amt);
        lootLines.push(fmt(amt) + ' ' + resName(entry.id));
      }
    });
    return lootLines;
  },

  winFight: function(enemy, opts) {
    opts = opts || {};
    G.combat.result = 'win';
    G.combat.active = false;
    G.hero.hp       = Math.max(1, G.combat.heroHp);

    Combat.combatLog(enemy.deathMsg, 'cl-system');

    var lootLines = Combat.grantLoot(enemy);
    if (lootLines.length) {
      Combat.combatLog('Recovered: ' + lootLines.join(', ') + '.', 'cl-loot');
    } else if (!opts.encounter) {
      Combat.combatLog('Nothing worth keeping.', 'cl-system');
    }

    /* Prestige 2: broken golems occasionally yield Memory Shards */
    if (enemy.golemType && G.prestige.count >= 2 && Math.random() < 0.18) {
      resAdd('memoryShard', 1);
      Combat.combatLog('A Memory Shard, intact, in the housing.', 'cl-loot');
    }

    grantExp(enemy.exp);
    Combat.combatLog('You learn something from it. (+' + enemy.exp + ')', 'cl-loot');
    Combat.combatLog(opts.encounter ? 'You sit down at the nearest terminal.' : 'It is over.', 'cl-win');

    G.stats.enemiesDefeated++;
    if (G.combat.modifier === 'tired') G.seeds.tiredBandit = true;
    addLog((opts.encounter ? 'Access granted: ' : 'Resolved: ') + enemy.name, 'log-combat');

    G.combat.cooldownUntil = Date.now() + 2000;
    if (G.buffs) { G.buffs.attackBonus = 0; G.buffs.shieldActive = false; G.buffs.enemyStunned = false; }

    if (!opts.encounter && Math.random() < 0.20) {
      G.buffs.attackBonus = 3;
      Combat.combatLog('Your grip is surer than it was.', 'cl-loot');
    }
  },

  /* The encounter ends without a fight — no loot, optional partial exp */
  resolvePass: function(enemy, opts) {
    opts = opts || {};
    G.combat.result = 'pass';
    G.combat.active = false;
    G.hero.hp       = Math.max(1, G.combat.heroHp);
    if (opts.exp) {
      grantExp(opts.exp);
      Combat.combatLog('You learn something from it. (+' + opts.exp + ')', 'cl-loot');
    }
    G.combat.cooldownUntil = Date.now() + 2000;
    if (G.buffs) { G.buffs.attackBonus = 0; G.buffs.shieldActive = false; G.buffs.enemyStunned = false; }
    RENDER.markDirty();
  },

  loseFight: function(enemy) {
    G.combat.result = 'lose';
    G.combat.active = false;
    G.hero.hp       = Math.max(1, Math.floor(getHeroMaxHp() * 0.25));

    Combat.combatLog('You are overwhelmed. You fall back toward the valley.', 'cl-system');
    Combat.combatLog('Not today.', 'cl-lose');

    var manaLost = Math.floor(G.res.mana * 0.1);
    if (manaLost > 0) {
      resSub('mana', manaLost);
      Combat.combatLog('You drop ' + fmt(manaLost) + ' mana in the retreat.', 'cl-hit');
    }

    addLog('Driven back by ' + enemy.name + '.', 'log-combat');
    G.combat.cooldownUntil = Date.now() + 5000;
    if (G.buffs) { G.buffs.attackBonus = 0; G.buffs.shieldActive = false; G.buffs.enemyStunned = false; }
  },

  flee: function() {
    if (!G.combat.active) return;
    var enemy = DATA.enemies[G.combat.enemyId];
    G.combat.active = false;
    G.combat.result = 'flee';
    G.combat.script = null;
    G.hero.hp = Math.max(1, G.combat.heroHp);

    var manaLost = Math.floor(G.res.mana * 0.05);
    if (manaLost > 0) resSub('mana', manaLost);

    Combat.combatLog('You withdraw. It does not follow.', 'cl-system');
    addLog('Withdrew from ' + (enemy ? enemy.name : 'the encounter') + '.', 'log-combat');
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
    G.combat.modifier = null;
    G.combat.script   = null;
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
      addLog('Not enough to repair the golem (5 scrap + 1 Ether).', '');
      return;
    }
    spendResources(cost);
    var repairHp = Math.floor(G.combat.golemMaxHp * 0.4);
    G.combat.golemHp = repairHp;
    Combat.combatLog('You re-seat the golem\'s core. It stands.', 'cl-hero');
    addLog('Golem repaired in the field.', 'log-combat');
    RENDER.markDirty();
  }
};

/* ── SPELLS ────────────────────────────── */
var Spells = {
  list: [
    {
      id: 'broadcastAuth',
      name: 'Broadcast Authorization',
      manaCost: 40,
      minPrestige: 0,
      desc: 'Run the Lattice authorization pattern through the staff. The wraiths recognise the shape of it.',
      available: function() {
        return G.combat.enemyId === 'mana_wraith' && (G.relics || []).indexOf('architectsSeal') !== -1;
      },
      use: function() {
        var enemy = DATA.enemies[G.combat.enemyId];
        resSub('mana', 40);
        Combat.combatLog('You run the authorization pattern through the staff.', 'cl-hero');
        Combat.combatLog('The wraith pauses. Shifts frequency. Withdraws.', 'cl-system');
        Combat.combatLog('It did not recognise you. It recognised the shape of you.', 'cl-system');
        Combat.resolvePass(enemy, { exp: Math.floor(enemy.exp / 2) });
      }
    },
    {
      id: 'manaBolt',
      name: 'Mana Bolt',
      manaCost: 30,
      minPrestige: 3,
      desc: 'Channel ley current in a single directed pulse. 20–35 damage.',
      use: function() {
        resSub('mana', 30);
        var dmg = 20 + Math.floor(Math.random() * 16);
        G.combat.enemyHp -= dmg;
        if (G.combat.enemyHp < 0) G.combat.enemyHp = 0;
        Combat.combatLog('The pulse takes it for ' + dmg + '.', 'cl-hero');
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
      minPrestige: 3,
      desc: 'Absorb the next blow.',
      use: function() {
        resSub('mana', 50);
        G.buffs.shieldActive = true;
        Combat.combatLog('You raise the current into a shield.', 'cl-hero');
        RENDER.markDirty();
      }
    },
    {
      id: 'leyPulse',
      name: 'Ley Pulse',
      manaCost: 80,
      minPrestige: 3,
      desc: 'Borrow the valley\'s voice. The enemy loses its next turn.',
      use: function() {
        resSub('mana', 80);
        G.buffs.enemyStunned = true;
        Combat.combatLog('You pull the gradient up through the staff. The air goes still.', 'cl-hero');
        RENDER.markDirty();
      }
    }
  ],

  visible: function(spell) {
    if (spell.minPrestige > G.prestige.count) return false;
    if (spell.available && !spell.available()) return false;
    return true;
  },

  canUse: function(spell) {
    return G.combat.active && !G.combat.result && !G.combat.script && G.res.mana >= spell.manaCost && Spells.visible(spell);
  },

  useSpell: function(id) {
    for (var i = 0; i < Spells.list.length; i++) {
      if (Spells.list[i].id === id) {
        if (Spells.canUse(Spells.list[i])) Spells.list[i].use();
        return;
      }
    }
  }
};
