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
    if (dt > 5) dt = 5; // clamp large gaps

    G.playTime += dt;

    Engine.checkBuildingCapEffects();
    Engine.produceResources(dt);
    Engine.checkCrafting(now);
    Engine.checkExplore(now);
    Engine.checkCombatTurn(now);
    Engine.checkLoreUnlocks();
    Engine.checkFlagUnlocks();
    Engine.checkAnnotations();
    Engine.checkHeroRegen(dt);
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
    /* Recompute caps from buildings each tick */
    var manaCap  = 200;
    var scrapCap = 30;
    manaCap  += (G.buildings.manaConduit  || 0) * 50;
    manaCap  += (G.buildings.leyTap       || 0) * 200;
    scrapCap += (G.buildings.scrapDepot   || 0) * 25;
    G.resCap.mana  = manaCap;
    G.resCap.scrap = scrapCap;
  },

  checkHeroRegen: function(dt) {
    var regen = getHeroRegen();
    if (regen > 0 && !G.combat.active) {
      var maxHp = getHeroMaxHp();
      G.hero.hp = Math.min(G.hero.hp + regen * dt, maxHp);
    }
    // Passive HP regen even without armor (slow)
    if (!G.combat.active && G.hero.hp < getHeroMaxHp()) {
      G.hero.hp = Math.min(G.hero.hp + 0.5 * dt, getHeroMaxHp());
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

    if (recipe.output.resource) {
      resAdd(recipe.output.resource, recipe.output.amount);
      addLog('Crafted: ' + recipe.name + ' x' + recipe.output.amount, 'log-loot');
      if (recipe.output.resource === 'arcaneCore') G.stats.coresCrafted += recipe.output.amount;
    } else if (recipe.output.equipment) {
      var eqId = recipe.output.equipment;
      G.inventory.push(eqId);
      G.stats.itemsCrafted++;
      addLog('Crafted: ' + DATA.equipment[eqId].name, 'log-loot');
      showNotification('Item crafted: ' + DATA.equipment[eqId].name, 'notif-loot');
    }
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
        gained.push(fmt(amt) + ' ' + entry.id);
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
            addLog('◆ RELIC FOUND: ' + relic.name + '!', 'log-loot');
            showNotification('◆ Relic: ' + relic.name, 'notif-loot', 8100);
            if (typeof Sounds !== 'undefined') Sounds.relicFound();
            if (!G.flags.relicsVisible) {
              G.flags.relicsVisible = true;
              addLog('Relics tab unlocked.', 'log-important');
            }
          }
        }
      });
    }

    G.explore.runsCompleted++;
    G.stats.exploreRuns++;
    if ((G.explore.visited || []).indexOf(G.explore.zoneId) === -1) {
      G.explore.visited.push(G.explore.zoneId);
    }
    G.explore.active = false;
    if (G.buffs) G.buffs.exploreSpeedBonus = 0;

    var msg = 'Explored ' + zone.name + '.';
    if (gained.length) msg += ' Found: ' + gained.join(', ') + '.';
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
        G.loreNew.push(entry.id);
        addLog('New lore entry: ' + entry.title, 'log-lore');
        showNotification('◆ New Record: ' + entry.title, 'notif-lore', 8100);
        if (typeof Sounds !== 'undefined') Sounds.loreUnlocked();
        if (!G.flags.loreVisible) {
          G.flags.loreVisible = true;
        }
      }
    });
  },

  checkAnnotations: function() {
    DATA.annotations.forEach(function(ann) {
      if (G.annotations.indexOf(ann.id) !== -1) return;
      if (ann.condition(G)) {
        G.annotations.push(ann.id);
        G.annotationsNew.push(ann.id);
        addLog('Annotation: ' + ann.title, 'log-lore');
        showNotification('◆ ' + ann.title, 'notif-lore');
        if (!G.flags.codexVisible) {
          G.flags.codexVisible = true;
        }
      }
    });
  },

  checkFlagUnlocks: function() {
    if ((G.buildings.runicWorkbench || 0) >= 1 && !G.flags.craftingVisible) {
      G.flags.craftingVisible = true;
      addLog('Runic Workbench operational. Crafting unlocked.', 'log-important');
      showNotification('Crafting unlocked!', 'notif-unlock');
    }
    if ((G.buildings.scoutPost || 0) >= 1 && !G.flags.mapVisible) {
      G.flags.mapVisible = true;
      addLog('Scout Post built. Exploration available.', 'log-important');
      showNotification('Exploration unlocked!', 'notif-unlock');
    }
    if ((G.buildings.resonanceBeacon || 0) >= 1 && !G.flags.prestigeVisible) {
      G.flags.prestigeVisible = true;
      addLog('The Resonance Beacon hums. The Awakening is near.', 'log-lore');
      showNotification('★ The Awakening is available', 'notif-prestige');
    }
    if (!G.flags.heroVisible && G.stats.totalMana >= 20) {
      G.flags.heroVisible = true;
    }
  }
};

/* ── SCAVENGE ACTION ───────────────────── */
function doScavenge() {
  if (Date.now() < G.scavenge.cooldownUntil) return;
  var gained = 1 + Math.floor(Math.random() * 3); // 1–3 scrap
  resAdd('scrap', gained);
  G.scavenge.cooldownUntil = Date.now() + 30000; // 30s cooldown
  addLog('Scavenged the ruins. Found ' + gained + ' scrap.', 'log-loot');
  RENDER.markDirty();
}

/* ── BUILDING PURCHASE ─────────────────── */
function buyBuilding(id) {
  var bld = DATA.buildings[id];
  if (!bld) return;

  var count = G.buildings[id] || 0;
  if (bld.max && count >= bld.max) return;

  var cost = bld.baseCost(count);
  if (!canAfford(cost)) return;

  spendResources(cost);
  G.buildings[id] = count + 1;

  addLog('Built: ' + bld.name + ' (' + (count + 1) + ')', '');
  if (count === 0) showNotification('Built: ' + bld.name, 'notif-unlock');
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
  showNotification('Used: ' + item.name, 'notif-loot');
  RENDER.markDirty();
}

/* ── MANUAL SAVE ───────────────────────── */
function manualSave() {
  saveGame();
  showNotification('Game saved.', '');
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
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, duration || 3100);
}
