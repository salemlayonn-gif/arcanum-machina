/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Game Engine
   ═══════════════════════════════════════════ */

var Engine = {
  running: false,
  tickInterval: null,
  renderInterval: null,
  saveInterval: null,
  lastTick: 0,

  start: function() {
    Engine.running = true;
    Engine.lastTick = Date.now();
    Engine.tickInterval   = setInterval(Engine.tick,   100);
    Engine.renderInterval = setInterval(RENDER.render, 300);
    Engine.saveInterval   = setInterval(function() { saveGame(); }, 30000);
    window.addEventListener('beforeunload', function() { saveGame(); });
  },

  tick: function() {
    var now = Date.now();
    var dt  = (now - Engine.lastTick) / 1000;
    Engine.lastTick = now;
    if (dt > 60) dt = 60; // clamp very large gaps (a throttled background tab still earns its minute)

    G.playTime += dt;

    Engine.checkBuildingCapEffects();
    Engine.produceResources(dt);
    Engine.checkAmbient(now);

    /* During an Awakening or the ending, the world holds its breath */
    if (G.awakening || G.ending) {
      Prestige.tick(now);
      RENDER.markDirty();
      return;
    }

    Engine.checkCrafting(now);
    Engine.checkExplore(now);
    Engine.checkCombatTurn(now);
    Engine.checkLoreUnlocks();
    Engine.checkDecoding(dt);
    Engine.checkFlagUnlocks();
    Engine.checkAnnotations();
    Engine.checkHeroRegen(dt);
    Engine.checkVeritasHints();
    Engine.checkVeritasTransmission();
    Engine.checkRepeater(now);
    Engine.checkRelicPulse(now);
    Engine.checkDaylight();
  },

  /* Nightfall and first light, on the real clock */
  _lastHour: null,
  checkDaylight: function() {
    var h = new Date().getHours();
    if (Engine._lastHour === null) { Engine._lastHour = h; return; }
    if (h === Engine._lastHour) return;
    Engine._lastHour = h;
    if (h === 21) { addLog('Night comes down over the valley. The walls hold their light.', 'log-lore'); RENDER.markDirty(); }
    if (h === 6)  { addLog('First light over the eastern ridge. The conduit glow fades into it.', 'log-lore'); RENDER.markDirty(); }
  },

  /* The relic pulses. Once. Never on a schedule you could learn. */
  checkRelicPulse: function(now) {
    if ((G.buildings.resonanceBeacon || 0) >= 1) return;
    if (G.combat.active) return;
    if (!G.nextRelicPulse) { G.nextRelicPulse = now + 45000 + Math.random() * 75000; return; }
    if (now < G.nextRelicPulse) return;
    G.nextRelicPulse = now + 60000 + Math.random() * 100000;
    G.relicFlashAt = now;
    addLog('The relic pulses. Once.', 'log-lore');
    if (typeof Sounds !== 'undefined') Sounds.relicPulse();
    RENDER.markDirty();
  },

  _lastAmbient: 0,
  checkAmbient: function(now) {
    if (now - Engine._lastAmbient < 1000) return;
    Engine._lastAmbient = now;
    if (typeof Ambient !== 'undefined') Ambient.update();
  },

  /* The Signal Repeater still pulses every 3.7 seconds toward a receiver that no longer exists. Old habits. */
  _lastPulse: 0,
  checkRepeater: function(now) {
    if (G.ui.screen !== 'relics') return;
    if ((G.relics || []).indexOf('signalRepeater') === -1) return;
    if (now - Engine._lastPulse < 3700) return;
    Engine._lastPulse = now;
    if (typeof Sounds !== 'undefined') Sounds.repeaterPulse();
  },

  produceResources: function(dt) {
    var mana  = getManaPerSec();
    var scrap = getScrapPerSec();
    var shard = getMemoryPerSec();

    resAdd('mana',  mana  * dt);
    resAdd('scrap', scrap * dt);
    if (shard > 0) resAdd('memoryShard', shard * dt);

    G.resProd.mana   = mana;
    G.resProd.scrap  = scrap;
    G.resProd.memoryShard = shard;
  },

  checkBuildingCapEffects: function() {
    /* Recompute caps from buildings each tick — the Archive's capacitors grow with it */
    var b = G.buildings;
    G.resCap.mana        = 200 + (b.manaConduit || 0) * 50 + (b.leyTap || 0) * 300;
    G.resCap.scrap       = 30  + (b.scrapDepot  || 0) * 25;
    G.resCap.arcaneCore  = 20  + (b.ancientWorkshop || 0) * 40 + (b.golemForge || 0) * 120;
    G.resCap.memoryShard = 15  + (b.memoryTerminal  || 0) * 6;
    G.resCap.etherCell   = 20  + (b.golemForge      || 0) * 40;
  },

  checkHeroRegen: function(dt) {
    if (G.combat.active) return;
    var maxHp = getHeroMaxHp();
    var regen = getHeroRegen();
    if (regen > 0) {
      G.hero.hp = Math.min(G.hero.hp + regen * dt, maxHp);
    } else if (G.hero.hp < maxHp) {
      G.hero.hp = Math.min(G.hero.hp + 0.5 * dt, maxHp);
    }
  },

  checkCrafting: function(now) {
    ['slot0', 'slot1'].forEach(function(slot) {
      var s = G.crafting[slot];
      if (!s) return;
      if (now >= s.endTime) {
        Engine.completeCraft(slot, s);
        G.crafting[slot] = null;
      }
    });
  },

  completeCraft: function(slot, slotData) {
    var recipe = DATA.recipes[slotData.recipeId];
    if (!recipe) return;

    var firstEver = G.stats.coresCrafted === 0 && G.stats.itemsCrafted === 0;
    if (recipe.output.resource) {
      resAdd(recipe.output.resource, recipe.output.amount);
      addLog('The bench goes quiet. ' + recipe.name + ' ×' + recipe.output.amount + '.', 'log-loot');
      if (recipe.output.resource === 'arcaneCore') G.stats.coresCrafted += recipe.output.amount;
    } else if (recipe.output.equipment) {
      var eqId = recipe.output.equipment;
      G.inventory.push(eqId);
      G.stats.itemsCrafted++;
      addLog('The bench goes quiet. ' + DATA.equipment[eqId].name + ' is finished.', 'log-loot');
      showNotification(DATA.equipment[eqId].name + ' — finished', 'notif-loot');
    }
    if (typeof Sounds !== 'undefined') { if (firstEver) Sounds.recognition(); else Sounds.tick(); }
  },

  checkExplore: function(now) {
    if (!G.explore.active) return;
    if (now < G.explore.endTime) return;

    var zone = DATA.zones[G.explore.zoneId];
    if (!zone) { G.explore.active = false; return; }

    var gained = [];
    zone.exploreLoot.forEach(function(entry) {
      if (Math.random() < entry.chance) {
        var amt = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
        if (entry.id === 'memoryShard') {
          var acc = G.hero.equipment.accessory;
          if (acc && DATA.equipment[acc] && DATA.equipment[acc].stats.shardFind) {
            if (Math.random() < DATA.equipment[acc].stats.shardFind) amt++;
          }
          // Lattice Fragment relic bonus
          if ((G.relics || []).indexOf('latticeFragment') !== -1) amt++;
        }
        resAdd(entry.id, amt);
        gained.push(fmt(amt) + ' ' + resName(entry.id));
      }
    });

    // Check for relic drops
    if (zone.relicPool) {
      zone.relicPool.forEach(function(entry) {
        if ((G.relics || []).indexOf(entry.id) !== -1) return;
        if (Math.random() < entry.chance) {
          G.relics.push(entry.id);
          G.relicsNew.push(entry.id);
          var relic = DATA.relics[entry.id];
          if (relic) {
            addLog('◆ Your boot catches on something in the soil. ' + relic.name + '.', 'log-loot');
            showNotification('◆ ' + relic.name, 'notif-loot', 8100);
            if (typeof Sounds !== 'undefined') Sounds.relicFound();
            if (!G.flags.relicsVisible) {
              G.flags.relicsVisible = true;
              addLog('The first thing that was carried, not built. You clear a shelf for it.', 'log-important');
            }
          }
        }
      });
    }

    G.explore.runsCompleted++;
    G.stats.exploreRuns++;
    var zid = G.explore.zoneId;
    var firstVisit = (G.explore.visited || []).indexOf(zid) === -1;
    if (firstVisit) G.explore.visited.push(zid);
    if (!G.explore.zoneRuns) G.explore.zoneRuns = {};
    G.explore.zoneRuns[zid] = (G.explore.zoneRuns[zid] || 0) + 1;
    G.explore.active = false;
    if (G.buffs) G.buffs.exploreSpeedBonus = 0;
    if (typeof Music !== 'undefined') Music.autoRestore();
    if (typeof Sounds !== 'undefined') Sounds.footsteps();

    /* Seeded moment: the shard positioned where the runoff keeps it findable (Ch. 14) */
    if (zid === 'ruined_outpost' && G.prestige.count === 0 && !G.seeds.outpostShard && G.explore.zoneRuns[zid] >= 2) {
      G.seeds.outpostShard = true;
      resAdd('memoryShard', 1);
      gained.push('1 Shard');
      addLog('A cavity in the south wall, where the water runs off the roof. Something crystalline inside, kept damp, kept readable.', 'log-lore');
    }

    var msg = firstVisit ? 'You reach ' + zone.name + ' and mark it on the map.' : 'Back from ' + zone.name + '.';
    if (gained.length) msg += ' Recovered: ' + gained.join(', ') + '.';
    else msg += ' Nothing this time.';
    addLog(msg, 'log-loot');
  },

  checkCombatTurn: function(now) {
    if (!G.combat.active) return;
    if (G.combat.result) return;
    if (now - G.combat.lastTurnTime < 1600) return;
    G.combat.lastTurnTime = now;
    Combat.processTurn();
  },

  checkLoreUnlocks: function() {
    DATA.lore.forEach(function(entry) {
      if (G.loreUnlocked.indexOf(entry.id) !== -1) return;
      if (entry.unlockCondition(G)) {
        G.loreUnlocked.push(entry.id);
        if (!G.loreAt) G.loreAt = {};
        G.loreAt[entry.id] = G.playTime;
        if (!G.flags.loreVisible) G.flags.loreVisible = true;
        if (entry.decode) {
          /* A Shard: recovered, not yet read. The Terminal has to decode it, layer by layer. */
          G.decoding[entry.id] = { done: 0, progress: 0, complete: false };
          G.loreNew.push(entry.id);
          addLog('Shard recovered: ' + entry.title + '. It will need the Terminal.', 'log-lore');
          showNotification('◆ Shard recovered — ' + entry.title, 'notif-lore', 7000);
          if (typeof Sounds !== 'undefined') Sounds.shardRecovered();
        } else {
          G.loreNew.push(entry.id);
          addLog('Recorded: ' + entry.title, 'log-lore');
          showNotification('◆ ' + entry.title, 'notif-lore', 7000);
          if (typeof Sounds !== 'undefined') Sounds.loreUnlocked();
        }
      }
    });
  },

  /* Advance every shard currently on the Terminal by `seconds`. Returns segments completed. */
  decodedReport: {},
  advanceDecoding: function(seconds, quiet) {
    Engine.decodedReport = {};
    if (getBuildingCount('memoryTerminal') < 1) return 0;
    var completedSegments = 0;
    var per = decodeSegmentSeconds();
    for (var id in G.decoding) {
      var d = G.decoding[id];
      if (!d || d.complete) continue;
      var entry = getLoreEntry(id);
      if (!entry) { d.complete = true; continue; }
      var segs = loreSegments(entry).length;
      d.progress += seconds / per;
      while (d.progress >= 1 && d.done < segs) {
        d.progress -= 1;
        d.done++;
        completedSegments++;
        Engine.decodedReport[entry.title] = (Engine.decodedReport[entry.title] || 0) + 1;
        if (!quiet) d.lastDoneAt = Date.now();
        if (!quiet) {
          if (typeof Sounds !== 'undefined') Sounds.decodeTick();
          if (d.done < segs) addLog('Terminal: segment ' + d.done + ' of ' + segs + ' — ' + entry.title, 'log-lore');
        }
      }
      if (d.done >= segs) {
        d.complete = true;
        d.progress = 0;
        if (G.loreNew.indexOf(id) === -1) G.loreNew.push(id);
        addLog('Decode complete: ' + entry.title, 'log-lore');
        if (!quiet) {
          showNotification('◆ Decoded — ' + entry.title, 'notif-lore', 8100);
          if (typeof Sounds !== 'undefined') Sounds.loreUnlocked();
        }
      }
    }
    return completedSegments;
  },

  checkDecoding: function(dt) {
    Engine.advanceDecoding(dt, false);
  },

  checkAnnotations: function() {
    DATA.annotations.forEach(function(ann) {
      if (G.annotations.indexOf(ann.id) !== -1) return;
      if (ann.condition(G)) {
        G.annotations.push(ann.id);
        G.annotationsNew.push(ann.id);
        addLog('Margin note: ' + ann.title, 'log-lore');
        if (!G.flags.codexVisible) {
          G.flags.codexVisible = true;
        }
      }
    });
  },

  checkVeritasHints: function() {
    if (G.prestige.count < 4) return;
    if (!G.veritasHint) G.veritasHint = { lastTime: 0, count: 0 };
    if (G.playTime - G.veritasHint.lastTime < 180) return;
    G.veritasHint.lastTime = G.playTime;
    var hints = DATA.veritasHints;
    var hint = hints[G.veritasHint.count % hints.length];
    G.veritasHint.count++;
    if (typeof Sounds !== 'undefined') Sounds.veritasMotif(false);
    addLog('[VERITAS]: ' + hint.text, 'log-lore');
    if (hint.bonus) {
      var before = G.res[hint.bonus.resource] || 0;
      resAdd(hint.bonus.resource, hint.bonus.amount);
      var got = Math.floor((G.res[hint.bonus.resource] || 0) - before);
      if (got > 0) addLog('Something shifts in the capacitors: +' + got + ' ' + resName(hint.bonus.resource) + '.', 'log-loot');
    }
    RENDER.markDirty();
  },

  checkVeritasTransmission: function() {
    if (G.prestige.count < 5) return;
    if (!G.veritasTransmission) G.veritasTransmission = { lastTime: 0, count: 0 };
    if (G.playTime - G.veritasTransmission.lastTime < 600) return; // every 10 min
    G.veritasTransmission.lastTime = G.playTime;
    var transmissions = DATA.veritasTransmissions;
    var t = transmissions[G.veritasTransmission.count % transmissions.length];
    G.veritasTransmission.count++;
    if (typeof Sounds !== 'undefined') Sounds.veritasMotif(false);
    addLog('[VERITAS — PARTIAL TRANSMISSION]: ' + t.text, 'log-lore');
    if (t.bonus) {
      var before = G.res[t.bonus.resource] || 0;
      resAdd(t.bonus.resource, t.bonus.amount);
      var got = Math.floor((G.res[t.bonus.resource] || 0) - before);
      if (got > 0) addLog('Something shifts in the capacitors: +' + got + ' ' + resName(t.bonus.resource) + '.', 'log-loot');
    }
    showNotification('◆ Partial transmission', 'notif-lore', 6000);
    RENDER.markDirty();
  },

  checkFlagUnlocks: function() {
    if ((G.buildings.runicWorkbench || 0) >= 1 && !G.flags.craftingVisible) {
      G.flags.craftingVisible = true;
      addLog('The workbench channels illuminate. It is waiting for materials.', 'log-important');
      showNotification('The workbench is waiting.', 'notif-unlock');
    }
    if ((G.buildings.scoutPost || 0) >= 1 && !G.flags.mapVisible) {
      G.flags.mapVisible = true;
      addLog('The Scout Post is active. Under the moss, in every direction: roads.', 'log-important');
      showNotification('The Scout Post reads the roads.', 'notif-unlock');
    }
    if ((G.buildings.resonanceBeacon || 0) >= 1 && !G.flags.prestigeVisible) {
      G.flags.prestigeVisible = true;
      addLog('The Beacon hums. You know what it will cost.', 'log-lore');
      showNotification('★ The Beacon hums.', 'notif-prestige');
    }
    if (!G.flags.heroVisible && G.stats.totalMana >= 20) {
      G.flags.heroVisible = true;
    }
  }
};

/* ── SCAVENGE ACTION ───────────────────── */
function doScavenge() {
  if (Date.now() < G.scavenge.cooldownUntil) return;
  if (G.awakening || G.ending) return;
  if (typeof Sounds !== 'undefined') Sounds.scavenge();
  if (!G.seeds.firstCache) {
    /* The first search finds the cache from Chapter Three: arranged, not fallen */
    G.seeds.firstCache = true;
    resAdd('scrap', 6);
    G.scavenge.cooldownUntil = Date.now() + 30000;
    addLog('Behind a collapsed section of the lower wall: fragments of pale alloy. Not fallen. Arranged — simplest at the outside, most intricate at the centre. Six pieces. (+6 scrap)', 'log-loot');
    addLog('Someone left this here for someone to find.', 'log-lore');
    RENDER.markDirty();
    return;
  }
  var gained = 1 + Math.floor(Math.random() * 3); // 1–3 scrap
  resAdd('scrap', gained);
  G.scavenge.cooldownUntil = Date.now() + 30000; // 30s cooldown
  var lines = [
    'You work the debris with your hands. ' + gained + ' scrap.',
    'A bracket, a housing panel, a length of channel-threaded wire. ' + gained + ' scrap.',
    'Under the silt, more of the pale alloy. It hums faintly against the conduit current. ' + gained + ' scrap.'
  ];
  addLog(lines[Math.floor(Math.random() * lines.length)], 'log-loot');
  RENDER.markDirty();
}

/* ── BUILDING PURCHASE ─────────────────── */
function buyBuilding(id) {
  var bld = DATA.buildings[id];
  if (!bld) return;
  if (G.awakening || G.ending) return;

  var count = G.buildings[id] || 0;
  if (bld.max && count >= bld.max) return;

  var cost = getBuildingCost(id, count);
  if (!canAfford(cost)) return;

  spendResources(cost);
  G.buildings[id] = count + 1;
  if (typeof Sounds !== 'undefined') Sounds.build(id, count);

  if (count === 0) {
    addLog((bld.built || (bld.name + ' — installed.')), 'log-important');
    if (bld.flavor) addLog(bld.flavor, 'log-lore');
  } else {
    addLog(bld.name + ' ×' + (count + 1) + '.', '');
  }
  RENDER.markDirty();
}

/* ── TOGGLE MAXED BUILDINGS ────────────── */
function toggleHideMaxed() {
  G.ui.hideMaxedBuildings = !G.ui.hideMaxedBuildings;
}

/* ── USE CONSUMABLE ────────────────────── */
function useConsumable(id) {
  var idx = G.inventory.indexOf(id);
  if (idx === -1) return;
  var item = DATA.equipment[id];
  if (!item || item.slot !== 'consumable' || !item.effect) return;
  G.inventory.splice(idx, 1);
  item.effect();
  RENDER.markDirty();
}

/* ── MANUAL SAVE ───────────────────────── */
function manualSave() {
  saveGame();
  showNotification('Field notes saved.', '');
}

/* ── SETTINGS: THEME & FONT ────────────── */
var THEMES = [
  { id: 'default',   label: 'Arcanum',   swatch: '#7b9cff' },
  { id: 'amber',     label: 'Amber CRT', swatch: '#ffa020' },
  { id: 'phosphor',  label: 'Phosphor',  swatch: '#44ff44' },
  { id: 'crimson',   label: 'Blood&Iron',swatch: '#ff4444' },
  { id: 'abyss',     label: 'Deep Abyss',swatch: '#2288ff' },
  { id: 'parchment', label: 'Parchment', swatch: '#8a4400' }
];

var Settings = {
  themeIndex: 0,
  fontSize: 14,

  init: function() {
    var savedTheme = localStorage.getItem('am_theme');
    var savedFont  = parseInt(localStorage.getItem('am_font') || '14', 10);
    var idx = -1;
    for (var i = 0; i < THEMES.length; i++) { if (THEMES[i].id === savedTheme) { idx = i; break; } }
    Settings.themeIndex = idx >= 0 ? idx : 0;
    Settings.fontSize   = isNaN(savedFont) ? 14 : Math.min(20, Math.max(11, savedFont));
    Settings.applyTheme();
    Settings.applyFont();
  },

  applyTheme: function() {
    var t = THEMES[Settings.themeIndex];
    if (t.id === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', t.id);
    }
    localStorage.setItem('am_theme', t.id);
  },

  applyFont: function() {
    document.documentElement.style.fontSize = Settings.fontSize + 'px';
    localStorage.setItem('am_font', Settings.fontSize);
  },

  setTheme: function(idx) {
    Settings.themeIndex = idx;
    Settings.applyTheme();
  },

  cycleTheme: function() {
    Settings.themeIndex = (Settings.themeIndex + 1) % THEMES.length;
    Settings.applyTheme();
  },

  fontUp: function() {
    if (Settings.fontSize >= 30) return;
    Settings.fontSize++;
    Settings.applyFont();
  },

  fontDown: function() {
    if (Settings.fontSize <= 11) return;
    Settings.fontSize--;
    Settings.applyFont();
  }
};

/* ── NOTIFICATIONS ─────────────────────── */
var _notifQueue = [];
function showNotification(msg, cls, duration) {
  var area = document.getElementById('notification-area');
  if (!area) return;
  var el = document.createElement('div');
  el.className = 'notification ' + (cls || '');
  el.textContent = msg;
  area.appendChild(el);
  if (typeof Sounds !== 'undefined' && !/notif-(lore|prestige|loot)/.test(cls || '')) Sounds.tick();
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, duration || 3100);
}
