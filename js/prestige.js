/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Prestige System
   ═══════════════════════════════════════════ */

var Prestige = {

  canAwaken: function() {
    if ((G.buildings.resonanceBeacon || 0) < 1) return false;
    var nextLevel = G.prestige.count + 1;
    if (nextLevel > 6) return false;
    var lvl = DATA.prestigeLevels[nextLevel - 1];
    if (!lvl) return false;
    if (G.prestige.resonance < lvl.resonanceReq) return false;
    if (G.stats.totalMana < lvl.manaReq) return false;
    return true;
  },

  getNextLevel: function() {
    return DATA.prestigeLevels[G.prestige.count]; // count is 0-indexed here
  },

  getResonanceGain: function() {
    return computeResonanceGain();
  },

  doAwaken: function() {
    if (!Prestige.canAwaken()) return;

    var gain    = computeResonanceGain();
    var newLevel = G.prestige.count + 1;
    var lvlData  = DATA.prestigeLevels[newLevel - 1];

    // Add resonance
    G.prestige.resonance  += gain;
    G.prestige.totalEarned += gain;
    G.prestige.count       = newLevel;
    G.stats.prestigeCount++;

    // Update multiplier: each prestige adds 25% mana bonus
    G.prestige.multiplier = 1.0 + (newLevel * 0.25);

    // Clear res.resonance then set from prestige.resonance
    G.res.resonance = G.prestige.resonance;

    addLog('THE AWAKENING — ' + lvlData.name, 'log-lore');
    addLog('Resonance gained: +' + gain + '. Total: ' + G.prestige.resonance, 'log-important');

    // Reset game state
    resetForPrestige();

    // Re-set resonance resource
    G.res.resonance = G.prestige.resonance;

    showNotification('★ THE AWAKENING: ' + lvlData.name, 'notif-prestige');

    // Switch to archive screen
    G.ui.screen = 'archive';
  },

  getPrestigeInfo: function() {
    var lines = [];
    var nextIdx = G.prestige.count; // 0-based index for next level
    if (nextIdx >= DATA.prestigeLevels.length) {
      lines.push({ text: 'You have completed all six Awakenings.', cls: 'text-gold' });
      lines.push({ text: 'VERITAS speaks. The work is done. The work is beginning.', cls: 'text-arcane' });
      return lines;
    }

    var next = DATA.prestigeLevels[nextIdx];
    lines.push({ text: '── NEXT AWAKENING ──────────────────────', cls: 'text-dim' });
    lines.push({ text: 'Level ' + next.num + ': ' + next.name, cls: 'text-gold' });
    lines.push({ text: next.shortDesc, cls: 'text-arcane' });
    lines.push({ text: '', cls: '' });
    lines.push({ text: 'Requirements:', cls: 'text-dim' });
    lines.push({ text: '  · Resonance Beacon built', cls: (G.buildings.resonanceBeacon || 0) >= 1 ? 'text-green' : 'text-red' });
    lines.push({ text: '  · Resonance: ' + G.prestige.resonance + ' / ' + next.resonanceReq, cls: G.prestige.resonance >= next.resonanceReq ? 'text-green' : 'text-dim' });
    lines.push({ text: '  · Lifetime Mana: ' + fmt(G.stats.totalMana) + ' / ' + fmt(next.manaReq), cls: G.stats.totalMana >= next.manaReq ? 'text-green' : 'text-dim' });
    lines.push({ text: '', cls: '' });
    lines.push({ text: 'Estimated Resonance gain: +' + computeResonanceGain(), cls: 'text-resonance' });
    lines.push({ text: '', cls: '' });
    lines.push({ text: 'Bonuses on Awakening:', cls: 'text-dim' });
    next.bonuses.forEach(function(b) {
      lines.push({ text: '  ◆ ' + b, cls: 'text-arcane' });
    });

    return lines;
  }
};
