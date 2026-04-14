/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Game State
   ═══════════════════════════════════════════ */

var G = {
  version: '1.0.0',
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

  /* Resource caps */
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
    visited: []    // zone IDs explored at least once
  },

  /* Combat */
  combat: {
    active: false,
    zoneId: null,
    enemyId: null,
    heroHp: 0,
    enemyHp: 0,
    enemyMaxHp: 0,
    log: [],
    result: null,    // 'win' | 'lose' | null
    lastTurnTime: 0,
    turnCount: 0,
    golemHp: 0,
    golemMaxHp: 30,
    cooldownUntil: 0
  },

  /* Prestige */
  prestige: {
    count: 0,
    resonance: 0,         // current resonance (persists)
    totalEarned: 0,
    multiplier: 1.0
  },

  /* Statistics */
  stats: {
    totalMana: 0,
    enemiesDefeated: 0,
    exploreRuns: 0,
    coresCrafted: 0,
    itemsCrafted: 0,
    prestigeCount: 0
  },

  /* Unlocked lore IDs */
  loreUnlocked: [],
  loreNew: [],        // IDs shown as "NEW"
  annotationsNew: [], // unread annotations

  /* UI state */
  ui: {
    screen: 'archive',    // archive | map | lore | hero | prestige
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
    relicsVisible: false
  },

  /* Temporary buffs */
  buffs: {
    attackBonus: 0,
    exploreSpeedBonus: 0,
    shieldActive: false,
    enemyStunned: false
  },

  /* VERITAS hint tracking */
  veritasHint: { lastTime: 0, count: 0 },

  /* VERITAS partial transmission tracking (prestige 5+) */
  veritasTransmission: { lastTime: 0, count: 0 },

  /* Relics found */
  relics: [],
  relicsNew: [],

  /* Annotations unlocked */
  annotations: []
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

function getManaPerSec() {
  var base = 0.2;
  var n = getBuildingCount('manaConduit');
  base += n * 0.3;
  var l = getBuildingCount('leyTap');
  base += l * 1.5;
  var w = getBuildingCount('ancientWorkshop');
  base += w * 0.5;
  var weapon = G.hero.equipment.weapon;
  if (weapon && DATA.equipment[weapon]) base += (DATA.equipment[weapon].stats.manaPerSec || 0);
  var acc = G.hero.equipment.accessory;
  if (acc && DATA.equipment[acc]) base += (DATA.equipment[acc].stats.manaPerSec || 0);
  base += getRelicBonus('manaPerSec') + getAnnotationBonus('manaPerSec');
  base *= G.prestige.multiplier * (1 + getRelicBonus('prestigeMultBonus'));
  return base;
}

function getScrapPerSec() {
  var n = getBuildingCount('scrapDepot');
  var base = n * 0.06;
  base += getRelicBonus('scrapPerSec');
  base *= G.prestige.multiplier * (1 + getRelicBonus('prestigeMultBonus'));
  return base;
}

function getMemoryPerSec() {
  var n = getBuildingCount('memoryTerminal');
  var base = n * 0.02;
  // Ancient Workshop passively recovers trace memory data from the ruins
  if (getBuildingCount('ancientWorkshop') >= 1) base += 0.002;
  return base;
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

function heroLevelUp() {
  G.hero.level++;
  G.hero.expToNext = Math.floor(50 * Math.pow(1.4, G.hero.level - 1));
  G.hero.exp = 0;
  G.hero.maxHp += 10;
  G.hero.hp = getHeroMaxHp();
  G.hero.baseAttack += 2;
  G.hero.baseDefense += 1;
  addLog('Level up! Now level ' + G.hero.level + '.', 'log-important');
  showNotification('Level ' + G.hero.level + '!', 'notif-level');
}

function grantExp(amount) {
  G.hero.exp += amount;
  while (G.hero.exp >= G.hero.expToNext) {
    G.hero.exp -= G.hero.expToNext;
    heroLevelUp();
  }
}

/* ── EXPORT / IMPORT ───────────────────── */

function exportSave() {
  try {
    var raw = localStorage.getItem('arcanum_machina_save');
    if (!raw) { alert('No save data found.'); return; }
    var encoded = btoa(unescape(encodeURIComponent(raw)));
    var el = document.getElementById('save-export-box');
    if (el) {
      el.value = encoded;
      el.select();
      document.execCommand('copy');
      el.blur();
      showNotification('Save copied to clipboard!', 'notif-loot');
    }
  } catch(e) {
    alert('Export failed: ' + e);
  }
}

function importSave() {
  try {
    var el = document.getElementById('save-import-box');
    if (!el || !el.value.trim()) { alert('Paste your save code first.'); return; }
    var decoded = decodeURIComponent(escape(atob(el.value.trim())));
    var data = JSON.parse(decoded);
    if (!data.version) { alert('Invalid save data.'); return; }
    localStorage.setItem('arcanum_machina_save', decoded);
    location.reload();
  } catch(e) {
    alert('Import failed — make sure you pasted the full save code.');
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
      stats: G.stats,
      loreUnlocked: G.loreUnlocked,
      prestige: G.prestige,
      flags: G.flags,
      relics: G.relics,
      annotations: G.annotations,
      exploreVisited: G.explore.visited || [],
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

    G.heroName  = data.heroName || '';
    G.playTime  = data.playTime || 0;
    G.res       = Object.assign({mana:0,scrap:0,arcaneCore:0,memoryShard:0,etherCell:0,resonance:0}, data.res);
    G.resCap    = Object.assign({mana:200,scrap:30,arcaneCore:20,memoryShard:15,etherCell:20,resonance:Infinity}, data.resCap);
    G.buildings = data.buildings || {};
    G.hero      = Object.assign({level:1,exp:0,expToNext:50,maxHp:50,hp:50,baseAttack:5,baseDefense:2,equipment:{weapon:null,armor:null,accessory:null}}, data.hero);
    G.inventory = data.inventory || [];
    G.stats     = Object.assign({totalMana:0,enemiesDefeated:0,exploreRuns:0,coresCrafted:0,itemsCrafted:0,prestigeCount:0}, data.stats);
    G.loreUnlocked = data.loreUnlocked || [];
    G.prestige  = Object.assign({count:0,resonance:0,totalEarned:0,multiplier:1.0}, data.prestige);
    G.flags     = Object.assign({introComplete:false,craftingVisible:false,mapVisible:false,loreVisible:false,heroVisible:false,prestigeVisible:false,codexVisible:false,relicsVisible:false}, data.flags);
    G.buffs = Object.assign({ attackBonus: 0, exploreSpeedBonus: 0, shieldActive: false, enemyStunned: false }, {});
    G.veritasHint = Object.assign({ lastTime: 0, count: 0 }, data.veritasHint || {});
    G.veritasTransmission = Object.assign({ lastTime: 0, count: 0 }, data.veritasTransmission || {});
    G.relics      = data.relics      || [];
    G.relicsNew   = [];
    G.annotations = data.annotations || [];
    G.explore.visited = data.exploreVisited || [];

    /* Offline progress */
    if (data.savedAt) {
      var elapsed = Math.min((Date.now() - data.savedAt) / 1000, 28800); // cap 8h
      if (elapsed > 30) {
        var manaGain  = getManaPerSec() * elapsed * 0.5;
        var scrapGain = getScrapPerSec() * elapsed * 0.5;
        resAdd('mana', manaGain);
        resAdd('scrap', scrapGain);
        addLog('Offline for ' + formatTime(elapsed) + '. Gained ' + fmt(manaGain) + ' mana, ' + fmt(scrapGain) + ' scrap.', 'log-important');
      }
    }

    return true;
  } catch(e) {
    console.warn('Load failed:', e);
    return false;
  }
}

function resetForPrestige() {
  var keep = {
    heroName: G.heroName,
    prestige: G.prestige,
    stats: G.stats,
    loreUnlocked: G.loreUnlocked,
    relics: G.relics,
    annotations: G.annotations,
    hero: {
      level: 1, exp: 0, expToNext: 50,
      maxHp: 50, hp: 50, baseAttack: 5, baseDefense: 2,
      equipment: { weapon: null, armor: null, accessory: null }
    },
    inventory: [],
    flags: { introComplete: true, craftingVisible: false, mapVisible: false, loreVisible: false, heroVisible: false, prestigeVisible: false, codexVisible: true, relicsVisible: G.relics.length > 0 }
  };

  G.res       = { mana: 0, scrap: 0, arcaneCore: 0, memoryShard: 0, etherCell: 0, resonance: G.prestige.resonance };
  G.resCap    = { mana: 200, scrap: 30, arcaneCore: 20, memoryShard: 15, etherCell: 20, resonance: Infinity };
  G.buildings = {};
  G.hero      = keep.hero;
  G.inventory = keep.inventory;
  G.crafting  = { slot0: null, slot1: null };
  G.explore   = { active: false, zoneId: null, startTime: 0, endTime: 0, runsCompleted: 0, visited: [] };
  G.combat    = { active: false, zoneId: null, enemyId: null, heroHp: 0, enemyHp: 0, enemyMaxHp: 0, log: [], result: null, lastTurnTime: 0, turnCount: 0, golemHp: 0, golemMaxHp: 30, cooldownUntil: 0 };
  G.flags     = keep.flags;
  G.gameLog   = [];
  G.ui.screen = 'archive';
  G.buffs = { attackBonus: 0, exploreSpeedBonus: 0, shieldActive: false, enemyStunned: false };
  G.veritasHint = { lastTime: 0, count: 0 };
  G.veritasTransmission = { lastTime: 0, count: 0 };
  G.relics      = keep.relics;
  G.relicsNew   = [];
  G.annotations = keep.annotations;
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

function loreText(text) {
  var name = (G.heroName && G.heroName.trim()) ? G.heroName.trim() : 'Archivist';
  return text.replace(/\{heroName\}/g, name);
}
