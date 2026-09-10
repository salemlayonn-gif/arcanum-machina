/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Exploration & Crafting
   ═══════════════════════════════════════════ */

var Exploration = {

  startExplore: function(zoneId) {
    if (G.awakening || G.ending) return;
    if (G.explore.active) {
      addLog('You are already out. One road at a time.', '');
      return;
    }
    if (G.combat.active) {
      addLog('Not now.', '');
      return;
    }
    var zone = DATA.zones[zoneId];
    if (!zone || !zoneUnlocked(zoneId)) return;

    var duration = getExploreTime(zoneId);
    G.explore.active    = true;
    G.explore.zoneId    = zoneId;
    G.explore.startTime = Date.now();
    G.explore.endTime   = Date.now() + duration;

    if (zoneId === 'sunken_district' && typeof Music !== 'undefined') Music.autoSwitch(1);

    var visited = (G.explore.visited || []).indexOf(zoneId) !== -1;
    addLog(visited ? 'You take the road to ' + zone.name + '.' : 'You take the road toward something the Scout Post cannot name yet.', '');
    RENDER.markDirty();
  },

  cancelExplore: function() {
    if (!G.explore.active) return;
    G.explore.active = false;
    if (G.buffs) G.buffs.exploreSpeedBonus = 0;
    if (typeof Music !== 'undefined') Music.autoRestore();
    addLog('You turn back.', '');
    RENDER.markDirty();
  },

  /* The Spire's administrative terminal (Appendix A): clear the emergency flag the Sentries have held for a thousand years. */
  spireFlagCost: { arcaneCore: 30, etherCell: 10, memoryShard: 5 },
  canClearSpireFlag: function() {
    if (G.seeds.spireAllClear) return false;
    if ((G.relics || []).indexOf('architectsSeal') === -1) return false;
    if (((G.explore.zoneRuns || {}).shattered_spire || 0) < 5) return false;
    return true;
  },
  clearSpireFlag: function() {
    if (!Exploration.canClearSpireFlag()) return;
    if (G.explore.active || G.combat.active || G.awakening || G.ending) return;
    if (!canAfford(Exploration.spireFlagCost)) {
      addLog('The terminal needs power you do not have yet.', '');
      return;
    }
    spendResources(Exploration.spireFlagCost);
    G.seeds.spireAllClear = true;
    addLog('Third landing of the base section. The door recognises the Seal before you have finished raising it.', 'log-lore');
    addLog('emergency_flag: SET. The terminal asks for confirmation twice. You confirm twice.', 'log-lore');
    addLog('emergency_flag: ---. Somewhere below, something lowers its weapons.', 'log-important');
    showNotification('◆ The Sentries stand down.', 'notif-lore', 7000);
    if (typeof Sounds !== 'undefined') Sounds.loreUnlocked();
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
      addLog('Not enough for ' + recipe.name + '.', '');
      return;
    }

    if (recipe.output.resource) {
      var res = recipe.output.resource;
      var cap = G.resCap[res];
      if (cap !== undefined && cap !== Infinity && (G.res[res] || 0) >= cap) {
        addLog('Nowhere to keep another ' + recipe.name + '. The capacitors are full.', '');
        return;
      }
    }

    var slot = Crafting.getFreeSlot();
    if (slot === null) {
      addLog('Both bench slots are busy.', '');
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
    var craftTime = getCraftTime(recipe);
    G.crafting[slot] = {
      recipeId:  recipeId,
      startTime: Date.now(),
      endTime:   Date.now() + craftTime
    };
    addLog('You lay the components on the bench. The channels light the first step: ' + recipe.name + '.', '');
    RENDER.markDirty();
  },

  cancelCraft: function(slot) {
    var s = G.crafting[slot];
    if (!s) return;
    // Refund half the cost (rounded up, so a single shard is never lost)
    var recipe = DATA.recipes[s.recipeId];
    if (recipe) {
      for (var k in recipe.cost) {
        resAdd(k, Math.ceil(recipe.cost[k] / 2));
      }
    }
    G.crafting[slot] = null;
    addLog('You clear the bench. Half the materials are still usable.', '');
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
