/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Prestige: the Awakenings
   "The world resets. You do not."
   ═══════════════════════════════════════════ */

var Prestige = {

  canAwaken: function() {
    if (G.awakening || G.ending) return false;
    if ((G.buildings.resonanceBeacon || 0) < 1) return false;
    var nextLevel = G.prestige.count + 1;
    if (nextLevel > 6) return false;
    var lvl = DATA.prestigeLevels[nextLevel - 1];
    if (!lvl) return false;
    if (G.prestige.resonance < lvl.resonanceReq) return false;
    if (G.stats.totalMana < lvl.manaReq) return false;
    return true;
  },

  getResonanceGain: function() {
    return computeResonanceGain();
  },

  /* ── The sequence timeline (seconds from activation) ── */
  timeline: function(level) {
    var v = DATA.awakeningVariants[level] || DATA.awakeningVariants[1];
    var tl = [
      { t: 0,    text: 'The Beacon activates.',                                              mode: 'blaze' },
      { t: 2.5,  text: 'For four seconds, every ley line in the valley sings.' },
      { t: 6,    text: 'Every channel lit. The Archive is what it was before the Silence.' },
      { t: 9.5,  text: 'Then: quiet.',                                                        mode: 'normal' }
    ];
    if (level >= 6) {
      tl.push({ t: 12,   text: 'The quality of the light changes. Not dimmer. Not brighter. Different.', mode: 'cool' });
      tl.push({ t: 15.5, text: 'The frequency the Lattice once spoke on.' });
      tl.push({ t: 18.5, text: 'The Memory Terminal lights up.', ending: true });
      return tl;
    }
    tl.push({ t: 12,   mode: 'dimming' });
    tl.push({ t: 17,   text: 'The workbench fades. The conduit network goes inert.',                 mode: 'dark' });
    tl.push({ t: 21,   text: 'By morning, the Archive is a ruin again.',                              mode: 'ruin' });
    tl.push({ t: 24.5, text: v[0] });
    tl.push({ t: 28,   text: v[1] });
    tl.push({ t: 31.5, text: 'First conduit: ten minutes. Your hands know where to go.' });
    tl.push({ t: 34.5, done: true });
    return tl;
  },

  doAwaken: function() {
    if (!Prestige.canAwaken()) return;

    var gain     = computeResonanceGain();
    var newLevel = G.prestige.count + 1;
    var lvlData  = DATA.prestigeLevels[newLevel - 1];

    G.prestige.resonance   += gain;
    G.prestige.totalEarned += gain;
    G.prestige.count        = newLevel;
    G.stats.prestigeCount++;
    G.prestige.multiplier = 1.0 + (newLevel * 0.25);
    G.res.resonance = G.prestige.resonance;

    addLog('THE AWAKENING — ' + lvlData.name, 'log-lore');
    addLog('Resonance: +' + gain + '. It is in you now. Total ' + G.prestige.resonance + '.', 'log-important');

    G.awakening = { level: newLevel, start: Date.now(), phase: -1, lines: [], mode: 'blaze', lit: null };
    G.ui.screen = 'archive';
    if (typeof Sounds !== 'undefined') Sounds.awakeningChord();
    saveGame();
    RENDER.markDirty();
  },

  tick: function(now) {
    if (G.ending) { Ending.tick(now); return; }
    var a = G.awakening;
    if (!a) return;
    var t  = (now - a.start) / 1000;
    var tl = Prestige.timeline(a.level);
    for (var i = a.phase + 1; i < tl.length; i++) {
      if (t < tl[i].t) break;
      a.phase = i;
      var step = tl[i];
      if (step.mode) a.mode = step.mode;
      if (step.text) a.lines.push(step.text);
      if (step.ending) { Ending.begin(); return; }
      if (step.done)   { Prestige.finish(); return; }
    }
    if (a.mode === 'dimming') {
      var n = getBuildingCount('manaConduit');
      var elapsed = t - 12;
      a.lit = Math.max(0, n - Math.floor(elapsed / 0.4));
    }
  },

  skip: function() {
    var a = G.awakening;
    if (!a || a.level >= 6) return;
    if ((Date.now() - a.start) / 1000 < 4) return;
    Prestige.finish();
  },

  finish: function() {
    if (!G.awakening) return;
    var level = G.awakening.level;
    var lvlData = DATA.prestigeLevels[level - 1];
    G.awakening = null;
    resetForPrestige(false);
    G.res.resonance = G.prestige.resonance;
    addLog('You wake in the courtyard. The Archive is stone and silt again.', 'log-important');
    var pre = getBuildingCount('manaConduit');
    if (pre === 1) addLog('The first conduit is already lit. Your hands did it before you were awake.', '');
    else if (pre > 1) addLog('The first ' + pre + ' conduits are already lit. Your hands did it before you were awake.', '');
    showNotification('★ ' + lvlData.name, 'notif-prestige', 6000);
    G.ui.screen = 'archive';
    saveGame();
    RENDER.markDirty();
  },

  getPrestigeInfo: function() {
    var lines = [];
    var nextIdx = G.prestige.count;
    if (nextIdx >= DATA.prestigeLevels.length) {
      lines.push({ text: 'Six Awakenings. The record is complete.', cls: 'text-gold' });
      lines.push({ text: 'The deep structures stay lit. The valley holds its light.', cls: 'text-arcane' });
      lines.push({ text: '"Ask me again in another thousand years."', cls: 'text-dim' });
      return lines;
    }

    var next = DATA.prestigeLevels[nextIdx];
    lines.push({ text: '── NEXT AWAKENING ──────────────────────', cls: 'text-dim' });
    lines.push({ text: 'Level ' + next.num + ': ' + next.name, cls: 'text-gold' });
    lines.push({ text: next.shortDesc, cls: 'text-arcane' });
    lines.push({ text: '', cls: '' });
    lines.push({ text: 'What it needs:', cls: 'text-dim' });
    lines.push({ text: '  · The Resonance Beacon, built', cls: (G.buildings.resonanceBeacon || 0) >= 1 ? 'text-green' : 'text-red' });
    lines.push({ text: '  · Resonance: ' + G.prestige.resonance + ' / ' + next.resonanceReq, cls: G.prestige.resonance >= next.resonanceReq ? 'text-green' : 'text-dim' });
    lines.push({ text: '  · Lifetime mana: ' + fmt(G.stats.totalMana) + ' / ' + fmt(next.manaReq), cls: G.stats.totalMana >= next.manaReq ? 'text-green' : 'text-dim' });
    lines.push({ text: '', cls: '' });
    lines.push({ text: 'Resonance you would carry out: +' + computeResonanceGain(), cls: 'text-resonance' });
    lines.push({ text: '', cls: '' });
    lines.push({ text: 'What changes:', cls: 'text-dim' });
    next.bonuses.forEach(function(b) {
      lines.push({ text: '  ◆ ' + b, cls: 'text-arcane' });
    });

    return lines;
  }
};

/* ═══════════════════════════════════════════
   THE ENDING — Sixth Awakening
   "Hello. I have waited a very long time to say that."
   ═══════════════════════════════════════════ */
var Ending = {

  begin: function() {
    G.awakening = null;
    G.ending = { start: Date.now(), phase: 'scroll', lines: [], idx: -1, talkStart: 0 };
    G.ui.screen = 'archive';
    RENDER.markDirty();
  },

  /* Sequence after the scroll: an array of { who, text, delay } */
  script: function() {
    var e = DATA.ending;
    var out = [{ who: 'veritas', text: loreText(e.hello), delay: 0 }];
    e.exchange.forEach(function(x) {
      out.push({ who: 'veritas', text: x.q, delay: 4.5 });
      out.push({ who: 'hero',    text: x.a, delay: 4.5 });
    });
    out.push({ who: 'hero',    text: e.question,  delay: 5 });
    out.push({ who: 'pause',   text: '4.7 seconds.', delay: 4.7 });
    out.push({ who: 'veritas', text: e.answer,    delay: 0.2 });
    e.closing.forEach(function(c) { out.push({ who: 'note', text: c, delay: 4 }); });
    out.push({ who: 'done', text: '', delay: 3 });
    return out;
  },

  /* Wall-clock driven, like the Awakening: a throttled tab catches up instead of stalling. */
  tick: function(now) {
    var e = G.ending;
    if (!e) return;
    var t = (now - e.start) / 1000;
    if (e.phase === 'scroll') {
      if (t >= 9) { e.phase = 'talk'; e.talkStart = e.start + 9000; e.idx = -1; }
      return;
    }
    if (e.phase === 'talk') {
      var script = Ending.script();
      var tt = (now - e.talkStart) / 1000;
      var due = 0;
      for (var i = 0; i < script.length; i++) {
        due += script[i].delay;
        if (i <= e.idx) continue;
        if (tt < due) break;
        e.idx = i;
        if (script[i].who === 'done') { e.phase = 'done'; return; }
        e.lines.push(script[i]);
      }
    }
  },

  finalize: function() {
    if (!G.ending || G.ending.phase !== 'done') return;
    G.ending = null;
    G.flags.ended = true;
    resetForPrestige(true);
    G.res.resonance = G.prestige.resonance;
    addLog('In the morning the Beacon is inert alloy. The deep structures are still lit.', 'log-important');
    addLog('Something was kept.', 'log-lore');
    showNotification('★ The Final Convergence', 'notif-prestige', 8000);
    G.ui.screen = 'archive';
    saveGame();
    RENDER.markDirty();
  }
};
