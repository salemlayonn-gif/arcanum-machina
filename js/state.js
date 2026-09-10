/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Game State
   ═══════════════════════════════════════════ */

var G = {
  version: '1.7.0',
  heroName: '',
  playTime: 0,
  lastSave: 0,
  lastTick: 0,

  /* Resources */
  res: {
    mana: 0,
    scrap: 0,
    arcaneCore: 0,
    memoryShard: 0,
    etherCell: 0,
    resonance: 0
  },

  /* Resource caps — recomputed from buildings every tick (Engine.checkBuildingCapEffects) */
  resCap: {
    mana: 200,
    scrap: 30,
    arcaneCore: 20,
    memoryShard: 15,
    etherCell: 20,
    resonance: Infinity
  },

  /* Resource production per second (computed) */
  resProd: {
    mana: 0.2,
    scrap: 0,
    arcaneCore: 0,
    memoryShard: 0,
    etherCell: 0,
    resonance: 0
  },

  /* Buildings owned: { buildingId: count } */
  buildings: {},

  /* Hero */
  hero: {
    level: 1,
    exp: 0,
    expToNext: 50,
    maxHp: 50,
    hp: 50,
    baseAttack: 5,
    baseDefense: 2,
    equipment: { weapon: null, armor: null, accessory: null }
  },

  /* Inventory: array of equipment IDs */
  inventory: [],

  /* Crafting: up to 2 slots */
  crafting: {
    slot0: null, // { recipeId, startTime, endTime }
    slot1: null
  },

  /* Exploration */
  explore: {
    active: false,
    zoneId: null,
    startTime: 0,
    endTime: 0,
    runsCompleted: 0,
    visited: [],   // zone IDs explored at least once
    zoneRuns: {}   // zoneId -> completed runs
  },

  /* Combat (transient — not saved) */
  combat: {
    active: false,
    zoneId: null,
    enemyId: null,
    heroHp: 0,
    enemyHp: 0,
    enemyMaxHp: 0,
    log: [],
    result: null,    // 'win' | 'lose' | 'flee' | 'pass' | null
    lastTurnTime: 0,
    turnCount: 0,
    golemHp: 0,
    golemMaxHp: 30,
    cooldownUntil: 0,
    modifier: null,  // one-shot narrative modifier, e.g. 'tired'
    script: null     // scripted non-combat encounter { lines, idx, resolve }
  },

  /* Prestige */
  prestige: {
    count: 0,
    resonance: 0,
    totalEarned: 0,
    multiplier: 1.0
  },

  /* Statistics (lifetime — kept through Awakenings) */
  stats: {
    totalMana: 0,
    enemiesDefeated: 0,
    exploreRuns: 0,
    coresCrafted: 0,
    itemsCrafted: 0,
    prestigeCount: 0
  },

  /* Lore */
  loreUnlocked: [],
  loreNew: [],
  annotationsNew: [],

  /* Shard decoding: loreId -> { done, progress, complete } */
  decoding: {},

  /* playTime at which each record was unlocked — lets later records wait a while after earlier ones */
  loreAt: {},

  /* One-shot narrative events already seen (kept through Awakenings) */
  seeds: {},

  /* The golem's name (kept) and which places it has reacted to this cycle */
  golemName: '',
  golemSeen: {},

  /* A scene in progress (transient): { id, start, shown } */
  scene: null,

  /* The sealed cabinet in the side chamber: four days of directed current (kept through Awakenings) */
  cabinet: { noticed: false, steps: 0, lastStepAt: 0, opened: false },

  /* Volumes already seen on the shelf (kept); new ones since the last visit (transient) */
  libraryKnown: [],
  libraryNew: [],

  /* UI state */
  ui: {
    screen: 'archive',
    lastScreen: 'archive',
    hideMaxedBuildings: false
  },

  /* Game log lines */
  gameLog: [],

  /* Scavenge action */
  scavenge: {
    cooldownUntil: 0
  },

  /* Flags */
  flags: {
    introComplete: false,
    craftingVisible: false,
    mapVisible: false,
    loreVisible: false,
    heroVisible: false,
    prestigeVisible: false,
    codexVisible: false,
    relicsVisible: false,
    libraryVisible: false,
    ended: false
  },

  /* Temporary buffs */
  buffs: {
    attackBonus: 0,
    exploreSpeedBonus: 0,
    shieldActive: false,
    enemyStunned: false
  },

  veritasHint: { lastTime: 0, count: 0 },
  veritasTransmission: { lastTime: 0, count: 0 },

  relics: [],
  relicsNew: [],
  annotations: [],

  /* Transient scripted sequences (not saved) */
  awakening: null,
  ending: null,

  /* Transient animation timestamps (not saved) */
  relicFlashAt: 0,
  nextRelicPulse: 0,

  /* What happened while the tab was closed (shown once, not saved) */
  awayReport: null
};

/* ── STATE HELPERS ─────────────────────── */

function resAdd(id, amount) {
  var cap = G.resCap[id];
  G.res[id] = Math.min((G.res[id] || 0) + amount, cap === Infinity ? 1e15 : cap);
  if (id === 'mana' && amount > 0) G.stats.totalMana += amount;
}

function resSub(id, amount) {
  G.res[id] = Math.max(0, (G.res[id] || 0) - amount);
}

function canAfford(costObj) {
  for (var k in costObj) {
    if (Math.floor(G.res[k] || 0) < costObj[k]) return false;
  }
  return true;
}

function spendResources(costObj) {
  for (var k in costObj) {
    resSub(k, costObj[k]);
  }
}

function getBuildingCount(id) {
  return G.buildings[id] || 0;
}

var RES_NAMES = { mana: 'mana', scrap: 'scrap', arcaneCore: 'Cores', memoryShard: 'Shards', etherCell: 'Ether', resonance: 'Resonance' };
function resName(id) { return RES_NAMES[id] || id; }

function addLog(msg, cls) {
  G.gameLog.unshift({ msg: msg, cls: cls || '' });
  if (G.gameLog.length > 50) G.gameLog.pop();
}

function getRelicBonus(stat) {
  var total = 0;
  (G.relics || []).forEach(function(id) {
    var r = DATA.relics[id];
    if (r && r.bonus && r.bonus[stat]) total += r.bonus[stat];
  });
  return total;
}

function getAnnotationBonus(stat) {
  var total = 0;
  (G.annotations || []).forEach(function(id) {
    for (var i = 0; i < DATA.annotations.length; i++) {
      if (DATA.annotations[i].id === id) {
        var ann = DATA.annotations[i];
        if (ann.bonus && ann.bonus[stat]) total += ann.bonus[stat];
        break;
      }
    }
  });
  return total;
}

function getHeroAttack() {
  var base = G.hero.baseAttack;
  var weapon = G.hero.equipment.weapon;
  if (weapon && DATA.equipment[weapon]) base += (DATA.equipment[weapon].stats.attack || 0);
  base += (G.buffs ? G.buffs.attackBonus : 0);
  base += getRelicBonus('attack') + getAnnotationBonus('attack');
  return base;
}

function getHeroDefense() {
  var base = G.hero.baseDefense;
  var armor = G.hero.equipment.armor;
  if (armor && DATA.equipment[armor]) base += (DATA.equipment[armor].stats.defense || 0);
  base += getRelicBonus('defense') + getAnnotationBonus('defense');
  return base;
}

function getHeroMaxHp() {
  var base = G.hero.maxHp;
  var armor = G.hero.equipment.armor;
  if (armor && DATA.equipment[armor]) base += (DATA.equipment[armor].stats.maxHp || 0);
  base += getRelicBonus('maxHp') + getAnnotationBonus('maxHp');
  return base;
}

function getHeroRegen() {
  var armor = G.hero.equipment.armor;
  if (armor && DATA.equipment[armor]) return DATA.equipment[armor].stats.hpRegen || 0;
  return 0;
}

function getHeroHp() {
  return G.combat.active ? G.combat.heroHp : G.hero.hp;
}

function getManaPerSec() {
  var base = 0.2;
  base += getBuildingCount('manaConduit') * 0.3;
  base += getBuildingCount('leyTap') * 1.5;
  base += getBuildingCount('ancientWorkshop') * 0.5;
  var weapon = G.hero.equipment.weapon;
  if (weapon && DATA.equipment[weapon]) base += (DATA.equipment[weapon].stats.manaPerSec || 0);
  var acc = G.hero.equipment.accessory;
  if (acc && DATA.equipment[acc]) base += (DATA.equipment[acc].stats.manaPerSec || 0);
  base += getRelicBonus('manaPerSec') + getAnnotationBonus('manaPerSec');
  base *= G.prestige.multiplier * (1 + getRelicBonus('prestigeMultBonus'));
  return base;
}

function getScrapPerSec() {
  var base = getBuildingCount('scrapDepot') * 0.06;
  base += getRelicBonus('scrapPerSec');
  base *= G.prestige.multiplier * (1 + getRelicBonus('prestigeMultBonus'));
  return base;
}

function getMemoryPerSec() {
  var base = getBuildingCount('memoryTerminal') * 0.02;
  // Ancient Workshop passively recovers trace memory data from the ruins
  if (getBuildingCount('ancientWorkshop') >= 1) base += 0.002;
  return base;
}

/* ── AWAKENING SCALING ─────────────────── */
/* Each cycle the hands know more: costs and times shrink (the book: 4 hours → 10 minutes). */
function prestigeCostMult() { return Math.pow(0.85, G.prestige.count); }
function prestigeTimeMult() { return Math.pow(0.80, G.prestige.count); }

function getBuildingCost(id, count) {
  var bld  = DATA.buildings[id];
  var base = bld.baseCost(count);
  var mult = prestigeCostMult();
  if (id === 'resonanceBeacon' && G.prestige.count >= 5) mult *= 0.5;
  var out = {};
  for (var k in base) out[k] = Math.max(1, Math.floor(base[k] * mult));
  return out;
}

function getCraftTime(recipe) {
  var t = recipe.time * prestigeTimeMult();
  if (G.prestige.count >= 4 && recipe.cost.memoryShard) t = t / 2;
  return Math.max(3000, Math.floor(t));
}

function getExploreTime(zoneId) {
  var zone = DATA.zones[zoneId];
  if (!zone) return 10000;
  var t = zone.exploreTime;
  var speedBonus = 0;
  var acc = G.hero.equipment.accessory;
  if (acc && DATA.equipment[acc] && DATA.equipment[acc].stats.exploreSpeed) {
    speedBonus += DATA.equipment[acc].stats.exploreSpeed;
  }
  if (G.buffs && G.buffs.exploreSpeedBonus > 0) {
    speedBonus += G.buffs.exploreSpeedBonus;
  }
  speedBonus += getRelicBonus('exploreSpeed') + getAnnotationBonus('exploreSpeed');
  if (speedBonus > 0) t = t * (1 - Math.min(speedBonus, 0.9));
  t *= prestigeTimeMult();
  return Math.max(t, 2000);
}

function computeResonanceGain() {
  var manaScore = Math.floor(Math.log(G.stats.totalMana / 100 + 1) * 3);
  var killScore  = Math.floor(G.stats.enemiesDefeated / 5);
  var buildScore = 0;
  for (var k in G.buildings) buildScore += G.buildings[k];
  var base = manaScore + killScore + Math.floor(buildScore / 3);
  return Math.max(1, base);
}

/* ── SHARD DECODING ────────────────────── */
/* The book: "one layer per working day." Shard records arrive in segments, read by the Terminal. */
function loreSegments(entry) {
  return entry.text.split(/\n[ \t]*\n/);
}

function decodeSegmentSeconds() {
  var terminals = getBuildingCount('memoryTerminal');
  var t = 150 / (1 + 0.35 * Math.max(0, terminals - 1));
  if (G.prestige.count >= 4) t /= 2;
  return t;
}

/* Seconds of play since a record was unlocked; -1 if it has not been */
function loreAgo(id) {
  if (!G.loreAt || G.loreAt[id] === undefined) return -1;
  return G.playTime - G.loreAt[id];
}

function isNight(hour) {
  var h = (hour === undefined) ? new Date().getHours() : hour;
  return h < 6 || h >= 21;
}

function isLoreDecoded(id) {
  var d = G.decoding[id];
  return !d || !!d.complete;
}

/* Where the player is, for music and ambient: the zone being explored or fought in, else the Archive. */
var ZONE_PLACE = {
  overgrown_road: 'road', ruined_outpost: 'outpost', sunken_district: 'district', shattered_spire: 'spire',
  deep_vault: 'vault', cathedral_of_first_light: 'cathedral', lattice_core: 'core'
};
function currentPlace() {
  if (G.ending) return 'core';
  if (G.awakening) return 'archive';
  if (G.scene && DATA.scenes[G.scene.id]) return DATA.scenes[G.scene.id].place || 'archive';
  if (G.combat.active && G.combat.zoneId) return ZONE_PLACE[G.combat.zoneId] || 'archive';
  if (G.explore.active && G.explore.zoneId) return ZONE_PLACE[G.explore.zoneId] || 'archive';
  return 'archive';
}

function reducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch(e) { return false; }
}

/* A road, once walked, stays on the map — even if the resources that opened it are spent. */
function zoneUnlocked(zoneId) {
  var zone = DATA.zones[zoneId];
  if (!zone) return false;
  if ((G.explore.visited || []).indexOf(zoneId) !== -1) return true;
  return !!zone.unlockCondition(G);
}

function getLoreEntry(id) {
  for (var i = 0; i < DATA.lore.length; i++) if (DATA.lore[i].id === id) return DATA.lore[i];
  return null;
}

/* ── HERO ──────────────────────────────── */

function heroLevelUp() {
  G.hero.level++;
  G.hero.expToNext = Math.floor(50 * Math.pow(1.4, G.hero.level - 1));
  G.hero.exp = 0;
  G.hero.maxHp += 10;
  G.hero.hp = getHeroMaxHp();
  G.hero.baseAttack += 2;
  G.hero.baseDefense += 1;
  addLog('You are steadier with the staff. (Level ' + G.hero.level + ')', 'log-important');
}

function grantExp(amount) {
  G.hero.exp += amount;
  while (G.hero.exp >= G.hero.expToNext) {
    G.hero.exp -= G.hero.expToNext;
    heroLevelUp();
  }
}

function heroNameSafe(name) {
  return String(name || '').replace(/<[^>]*>/g, '').replace(/[<>&"'`]/g, '').trim().slice(0, 20);
}

/* ── EXPORT / IMPORT ───────────────────── */

function exportSave() {
  try {
    saveGame();
    var raw = localStorage.getItem('arcanum_machina_save');
    if (!raw) { showNotification('No save data found.', ''); return; }
    var encoded = btoa(unescape(encodeURIComponent(raw)));
    var el = document.getElementById('save-export-box');
    if (el) {
      el.value = encoded;
      el.select();
      try { document.execCommand('copy'); } catch(e) {}
      el.blur();
      showNotification('Save code copied.', 'notif-loot');
    }
  } catch(e) {
    showNotification('Export failed.', 'notif-lore');
  }
}

function importSave() {
  try {
    var el = document.getElementById('save-import-box');
    if (!el || !el.value.trim()) { showNotification('Paste your save code first.', ''); return; }
    var decoded = decodeURIComponent(escape(atob(el.value.trim())));
    var data = JSON.parse(decoded);
    if (!data.version) { showNotification('Invalid save data.', 'notif-lore'); return; }
    localStorage.setItem('arcanum_machina_save', decoded);
    location.reload();
  } catch(e) {
    showNotification('Import failed — paste the full save code.', 'notif-lore');
  }
}

/* ── SERIALIZATION ─────────────────────── */

function saveGame() {
  try {
    // Sync hero HP from active combat so closing mid-fight saves correctly
    if (G.combat.active && G.combat.heroHp > 0) {
      G.hero.hp = Math.max(1, Math.floor(G.combat.heroHp));
    }
    var data = {
      version: G.version,
      heroName: G.heroName,
      playTime: G.playTime,
      res: G.res,
      resCap: G.resCap,
      buildings: G.buildings,
      hero: G.hero,
      inventory: G.inventory,
      crafting: G.crafting,
      stats: G.stats,
      loreUnlocked: G.loreUnlocked,
      prestige: G.prestige,
      flags: G.flags,
      relics: G.relics,
      annotations: G.annotations,
      exploreVisited: G.explore.visited || [],
      zoneRuns: G.explore.zoneRuns || {},
      decoding: G.decoding,
      loreAt: G.loreAt,
      seeds: G.seeds,
      golemName: G.golemName,
      golemSeen: G.golemSeen,
      cabinet: G.cabinet,
      libraryKnown: G.libraryKnown,
      veritasHint: G.veritasHint,
      veritasTransmission: G.veritasTransmission,
      savedAt: Date.now()
    };
    localStorage.setItem('arcanum_machina_save', JSON.stringify(data));
    G.lastSave = Date.now();
  } catch(e) {
    console.warn('Save failed:', e);
  }
}

function loadGame() {
  try {
    var raw = localStorage.getItem('arcanum_machina_save');
    if (!raw) return false;
    var data = JSON.parse(raw);

    G.heroName  = heroNameSafe(data.heroName);
    G.playTime  = data.playTime || 0;
    G.res       = Object.assign({mana:0,scrap:0,arcaneCore:0,memoryShard:0,etherCell:0,resonance:0}, data.res);
    G.resCap    = Object.assign({mana:200,scrap:30,arcaneCore:20,memoryShard:15,etherCell:20,resonance:Infinity}, data.resCap);
    G.buildings = data.buildings || {};
    G.hero      = Object.assign({level:1,exp:0,expToNext:50,maxHp:50,hp:50,baseAttack:5,baseDefense:2,equipment:{weapon:null,armor:null,accessory:null}}, data.hero);
    G.inventory = data.inventory || [];
    G.crafting  = Object.assign({ slot0: null, slot1: null }, data.crafting || {});
    G.stats     = Object.assign({totalMana:0,enemiesDefeated:0,exploreRuns:0,coresCrafted:0,itemsCrafted:0,prestigeCount:0}, data.stats);
    G.loreUnlocked = data.loreUnlocked || [];
    G.prestige  = Object.assign({count:0,resonance:0,totalEarned:0,multiplier:1.0}, data.prestige);
    G.flags     = Object.assign({introComplete:false,craftingVisible:false,mapVisible:false,loreVisible:false,heroVisible:false,prestigeVisible:false,codexVisible:false,relicsVisible:false,libraryVisible:false,ended:false}, data.flags);
    G.buffs     = { attackBonus: 0, exploreSpeedBonus: 0, shieldActive: false, enemyStunned: false };
    G.veritasHint = Object.assign({ lastTime: 0, count: 0 }, data.veritasHint || {});
    G.veritasTransmission = Object.assign({ lastTime: 0, count: 0 }, data.veritasTransmission || {});
    G.relics      = data.relics      || [];
    G.relicsNew   = [];
    G.annotations = data.annotations || [];
    G.explore.visited  = data.exploreVisited || [];
    G.explore.zoneRuns = data.zoneRuns || {};
    G.decoding = data.decoding || {};
    G.loreAt   = data.loreAt || {};
    G.seeds    = data.seeds || {};
    G.golemName = heroNameSafe(data.golemName || '');
    G.golemSeen = data.golemSeen || {};
    G.cabinet = Object.assign({ noticed: false, steps: 0, lastStepAt: 0, opened: false }, data.cabinet || {});
    G.libraryKnown = data.libraryKnown || [];
    G.libraryNew = [];
    if (G.loreUnlocked.length && !G.flags.loreVisible) G.flags.loreVisible = true;

    /* Offline progress — and the notebook page for it */
    if (data.savedAt) {
      var rawElapsed = (Date.now() - data.savedAt) / 1000;
      var elapsed = Math.min(rawElapsed, 28800); // cap 8h of production
      if (elapsed > 30) {
        var manaBefore = G.res.mana, manaRate = getManaPerSec();
        var manaGain  = manaRate * elapsed * 0.5;
        var scrapGain = getScrapPerSec() * elapsed * 0.5;
        resAdd('mana', manaGain);
        resAdd('scrap', scrapGain);
        var manaGot = G.res.mana - manaBefore;
        var filledIn = (G.res.mana >= G.resCap.mana && manaRate > 0) ? ((G.resCap.mana - manaBefore) / (manaRate * 0.5)) : 0;
        var decoded = (typeof Engine !== 'undefined') ? Engine.advanceDecoding(elapsed, true) : 0;
        var report = {
          seconds: rawElapsed, mana: manaGot, scrap: G.res.scrap - (G.res.scrap - scrapGain > 0 ? G.res.scrap - scrapGain : 0),
          filledIn: filledIn, decodedSegments: decoded,
          decodedEntries: (typeof Engine !== 'undefined' && Engine.decodedReport) ? Engine.decodedReport : {},
          hasTerminal: getBuildingCount('memoryTerminal') >= 1,
          shardsWaiting: Object.keys(G.decoding).filter(function(id) { return !G.decoding[id].complete; }).length,
          visitors: [], pulses: 0
        };
        if ((G.buildings.scoutPost || 0) >= 1 && G.stats.exploreRuns >= 3 && !G.flags.ended) {
          var n = Math.min(3, Math.floor(rawElapsed / 1500));
          var base = Math.floor(data.savedAt / 360000);
          for (var i = 0; i < n; i++) report.visitors.push(DATA.travellers[(base + i * 2) % DATA.travellers.length].who);
        }
        if (!(G.buildings.resonanceBeacon || 0)) report.pulses = Math.min(4, Math.floor(rawElapsed / 110));
        G.awayReport = report;
        addLog('You were away ' + formatTimeProse(rawElapsed) + '. The notebook has a page for it.', 'log-important');
      }
    }

    return true;
  } catch(e) {
    console.warn('Load failed:', e);
    return false;
  }
}

/* keepDeep: after the sixth Awakening the deep structures remain lit (Appendix E). */
function resetForPrestige(keepDeep) {
  var keptBuildings = {};
  if (keepDeep) {
    keptBuildings.manaConduit = Math.min(G.buildings.manaConduit || 0, 5);
    ['runicWorkbench', 'scoutPost', 'ancientWorkshop', 'memoryTerminal'].forEach(function(id) {
      if (G.buildings[id]) keptBuildings[id] = G.buildings[id];
    });
  } else {
    // The hands know the first sockets: one conduit already lit per completed Awakening
    var pre = Math.min(G.prestige.count, 5);
    if (pre > 0) keptBuildings.manaConduit = pre;
  }
  for (var k in keptBuildings) if (!keptBuildings[k]) delete keptBuildings[k];

  G.res       = { mana: 0, scrap: 0, arcaneCore: 0, memoryShard: 0, etherCell: 0, resonance: G.prestige.resonance };
  G.resCap    = { mana: 200, scrap: 30, arcaneCore: 20, memoryShard: 15, etherCell: 20, resonance: Infinity };
  G.buildings = keptBuildings;
  G.hero      = {
    level: 1, exp: 0, expToNext: 50,
    maxHp: 50, hp: 50, baseAttack: 5, baseDefense: 2,
    equipment: { weapon: null, armor: null, accessory: null }
  };
  G.inventory = [];
  G.crafting  = { slot0: null, slot1: null };
  /* The roads are re-found each cycle (the map fogs again), but how often you have walked them is lifetime */
  G.explore   = {
    active: false, zoneId: null, startTime: 0, endTime: 0, runsCompleted: 0,
    visited:  keepDeep ? (G.explore.visited || []) : [],
    zoneRuns: G.explore.zoneRuns || {}
  };
  G.combat    = { active: false, zoneId: null, enemyId: null, heroHp: 0, enemyHp: 0, enemyMaxHp: 0, log: [], result: null, lastTurnTime: 0, turnCount: 0, golemHp: 0, golemMaxHp: 30, cooldownUntil: 0, modifier: null, script: null };
  G.flags     = {
    introComplete: true,
    craftingVisible: !!keptBuildings.runicWorkbench,
    mapVisible: !!keptBuildings.scoutPost,
    loreVisible: G.loreUnlocked.length > 0,
    heroVisible: true,
    prestigeVisible: false,
    codexVisible: true,
    relicsVisible: G.relics.length > 0,
    libraryVisible: !!(G.seeds && G.seeds.cabinetOpened),
    ended: !!G.flags.ended
  };
  G.gameLog   = [];
  G.ui.screen = 'archive';
  G.buffs = { attackBonus: 0, exploreSpeedBonus: 0, shieldActive: false, enemyStunned: false };
  G.veritasHint = { lastTime: G.playTime, count: 0 };
  G.veritasTransmission = { lastTime: G.playTime, count: 0 };
  G.relicsNew   = [];
  G.golemSeen   = {};
  G.scene       = null;
}

/* Volumes on the shelf right now */
function libraryUnlocked() {
  if (!G.flags.libraryVisible) return [];
  return DATA.library.filter(function(v) { try { return !!v.unlock(G); } catch(e) { return false; } });
}

/* The cabinet wants full capacitors and a day between attempts */
var CABINET_REST_MS = 20 * 3600 * 1000;
function cabinetRestLeft(now) {
  var c = G.cabinet;
  if (!c || !c.lastStepAt) return 0;
  return Math.max(0, CABINET_REST_MS - ((now || Date.now()) - c.lastStepAt));
}

function golemName() {
  return (G.golemName && G.golemName.length) ? G.golemName : 'the golem';
}

/* ── A RECORD IN FULL — this run, as a text document ── */
function buildRecord() {
  var name = (G.heroName && G.heroName.trim()) ? G.heroName.trim() : 'Archivist';
  var L = [];
  var rule = '═══════════════════════════════════════════════════════════';
  L.push('ARCANUM MACHINA — A RECORD IN FULL');
  L.push('Being the Field Notes, Recovered Fragments and Margin Notes of ' + name + ', Archivist-Technomage');
  L.push(rule);
  L.push(formatTimeProse(G.playTime) + ' in the valley · ' + G.prestige.count + ' Awakening' + (G.prestige.count === 1 ? '' : 's') +
         ' · ' + G.stats.exploreRuns + ' roads walked · ' + G.stats.enemiesDefeated + ' encounters resolved · ' + G.stats.itemsCrafted + ' things made at the bench');
  if (G.golemName) L.push('Companion: ' + G.golemName + '.');
  L.push('');
  L.push('I. FIELD NOTES AND RECOVERED RECORDS — in the order they were found');
  L.push(rule);
  G.loreUnlocked.forEach(function(id) {
    var e = getLoreEntry(id); if (!e) return;
    L.push('');
    L.push('── ' + e.title + ' ──');
    L.push(e.chapter);
    L.push('');
    if (isLoreDecoded(id)) L.push(loreText(e.text));
    else {
      var d = G.decoding[id] || { done: 0 };
      var segs = loreSegments(e).slice(0, d.done).map(loreText);
      if (segs.length) L.push(segs.join('\n\n'));
      L.push('[ the remaining segments are still on the Terminal ]');
    }
  });
  L.push('');
  L.push('II. MARGIN NOTES');
  L.push(rule);
  G.annotations.forEach(function(id) {
    for (var i = 0; i < DATA.annotations.length; i++) if (DATA.annotations[i].id === id) { L.push('· ' + DATA.annotations[i].title + ' — ' + DATA.annotations[i].note); break; }
  });
  L.push('');
  L.push('III. RELICS');
  L.push(rule);
  if (!G.relics.length) L.push('· none yet');
  G.relics.forEach(function(id) { var r = DATA.relics[id]; if (r) L.push('· ' + r.name + ' — ' + r.flavor); });
  L.push('');
  L.push('IV. THE AWAKENINGS');
  L.push(rule);
  for (var k = 0; k < G.prestige.count && k < DATA.prestigeLevels.length; k++) L.push('· ' + (k + 1) + '. ' + DATA.prestigeLevels[k].name + ' — ' + DATA.prestigeLevels[k].shortDesc);
  if (!G.prestige.count) L.push('· none yet. The Beacon is not built.');
  if (G.flags.ended) { L.push(''); L.push('"Ask me again in another thousand years. And we will answer together."'); }
  L.push('');
  L.push('— ' + name);
  L.push('  The Archive, Aethoria');
  return L.join('\n');
}

/* ── NUMBER FORMATTING ─────────────────── */
function fmt(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1) + 'k';
  return String(n);
}

function fmtDec(n) {
  if (n >= 1000) return fmt(n);
  return n.toFixed(1);
}

function formatTime(secs) {
  secs = Math.floor(secs);
  if (secs < 60) return secs + 's';
  if (secs < 3600) return Math.floor(secs/60) + 'm ' + (secs%60) + 's';
  return Math.floor(secs/3600) + 'h ' + Math.floor((secs%3600)/60) + 'm';
}

/* Durations in prose: "a minute", "41 minutes", "3 hours 12 minutes", "2 days" */
function formatTimeProse(secs) {
  secs = Math.floor(secs);
  if (secs < 90) return 'a minute';
  var m = Math.round(secs / 60);
  if (m < 60) return m + ' minutes';
  var h = Math.floor(m / 60), rm = m % 60;
  if (h < 24) return h + (h === 1 ? ' hour' : ' hours') + (rm ? ' ' + rm + ' minutes' : '');
  var d = Math.floor(h / 24), rh = h % 24;
  return d + (d === 1 ? ' day' : ' days') + (rh ? ' ' + rh + (rh === 1 ? ' hour' : ' hours') : '');
}

function loreText(text) {
  var name = (G.heroName && G.heroName.trim()) ? G.heroName.trim() : 'Archivist';
  return text.replace(/\{heroName\}/g, name);
}
