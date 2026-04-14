/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Exploration & Crafting
   ═══════════════════════════════════════════ */

var Exploration = {

  startExplore: function(zoneId) {
    if (G.explore.active) {
      addLog('Already exploring — wait for the scout to return.', '');
      return;
    }
    if (G.combat.active) {
      addLog('Cannot scout while in combat.', '');
      return;
    }
    var zone = DATA.zones[zoneId];
    if (!zone || !zone.unlockCondition(G)) return;

    var duration = getExploreTime(zoneId);
    G.explore.active    = true;
    G.explore.zoneId    = zoneId;
    G.explore.startTime = Date.now();
    G.explore.endTime   = Date.now() + duration;

    addLog('Scouting: ' + zone.name + '...', '');
    RENDER.markDirty();
  },

  cancelExplore: function() {
    if (!G.explore.active) return;
    G.explore.active = false;
    if (G.buffs) G.buffs.exploreSpeedBonus = 0;
    addLog('Exploration cancelled.', '');
    RENDER.markDirty();
  },

  getExploreProgress: function() {
    if (!G.explore.active) return 0;
    var elapsed  = Date.now() - G.explore.startTime;
    var duration = G.explore.endTime - G.explore.startTime;
    return Math.min(100, (elapsed / duration) * 100);
  },

  getExploreTimeLeft: function() {
    if (!G.explore.active) return 0;
    return Math.max(0, G.explore.endTime - Date.now());
  }
};

/* ── CRAFTING ──────────────────────────── */
var Crafting = {

  canCraft: function(recipeId) {
    var recipe = DATA.recipes[recipeId];
    if (!recipe) return false;
    if (!recipe.unlockCondition(G)) return false;
    if (!canAfford(recipe.cost)) return false;
    var freeSlot = Crafting.getFreeSlot();
    return freeSlot !== null;
  },

  getFreeSlot: function() {
    if (!G.crafting.slot0) return 'slot0';
    if (!G.crafting.slot1) return 'slot1';
    return null;
  },

  startCraft: function(recipeId) {
    var recipe = DATA.recipes[recipeId];
    if (!recipe) return;
    if (!recipe.unlockCondition(G)) return;
    if (!canAfford(recipe.cost)) {
      addLog('Not enough resources to craft ' + recipe.name + '.', '');
      return;
    }

    if (recipe.output.resource) {
      var res = recipe.output.resource;
      var cap = G.resCap[res];
      if (cap !== undefined && cap !== Infinity && (G.res[res] || 0) >= cap) {
        addLog(recipe.name + ' at capacity. Make room first.', '');
        return;
      }
    }

    var slot = Crafting.getFreeSlot();
    if (slot === null) {
      addLog('No free crafting slot.', '');
      return;
    }

    // Check if crafting a unique equipment already in inventory
    if (recipe.output.equipment) {
      var eqId = recipe.output.equipment;
      var isConsumable = DATA.equipment[eqId] && DATA.equipment[eqId].slot === 'consumable';
      if (!isConsumable && (
          G.inventory.indexOf(eqId) !== -1 ||
          G.hero.equipment.weapon === eqId ||
          G.hero.equipment.armor  === eqId ||
          G.hero.equipment.accessory === eqId)) {
        addLog('You already have a ' + DATA.equipment[eqId].name + '.', '');
        return;
      }
    }

    spendResources(recipe.cost);
    var craftTime = recipe.time;
    /* Prestige 4: recipes using Memory Shards decode 2x faster */
    if (G.prestige.count >= 4 && recipe.cost.memoryShard) {
      craftTime = Math.floor(craftTime / 2);
    }
    G.crafting[slot] = {
      recipeId:  recipeId,
      startTime: Date.now(),
      endTime:   Date.now() + craftTime
    };
    addLog('Started crafting: ' + recipe.name + '.', '');
    RENDER.markDirty();
  },

  cancelCraft: function(slot) {
    var s = G.crafting[slot];
    if (!s) return;
    // Refund half the cost
    var recipe = DATA.recipes[s.recipeId];
    if (recipe) {
      for (var k in recipe.cost) {
        resAdd(k, Math.floor(recipe.cost[k] / 2));
      }
    }
    G.crafting[slot] = null;
    addLog('Crafting cancelled (50% refund).', '');
    RENDER.markDirty();
  },

  getSlotProgress: function(slot) {
    var s = G.crafting[slot];
    if (!s) return 0;
    var elapsed  = Date.now() - s.startTime;
    var duration = s.endTime - s.startTime;
    return Math.min(100, (elapsed / duration) * 100);
  },

  getSlotTimeLeft: function(slot) {
    var s = G.crafting[slot];
    if (!s) return 0;
    return Math.max(0, s.endTime - Date.now());
  }
};

/* ── EQUIPMENT ─────────────────────────── */
var Equipment = {

  equip: function(eqId) {
    var eq = DATA.equipment[eqId];
    if (!eq) return;

    var idx = G.inventory.indexOf(eqId);
    if (idx === -1) return;

    // Unequip current item in that slot and return to inventory
    var current = G.hero.equipment[eq.slot];
    if (current) {
      G.inventory.push(current);
    }

    G.hero.equipment[eq.slot] = eqId;
    G.inventory.splice(idx, 1);

    addLog('Equipped: ' + eq.name, 'log-loot');
    showNotification('Equipped: ' + eq.name, 'notif-loot');
    RENDER.markDirty();
  },

  unequip: function(slot) {
    var current = G.hero.equipment[slot];
    if (!current) return;
    G.inventory.push(current);
    G.hero.equipment[slot] = null;
    addLog('Unequipped: ' + DATA.equipment[current].name, '');
    RENDER.markDirty();
  }
};
