/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Sound Effects
   ═══════════════════════════════════════════ */

var Sounds = (function() {
  function ctx() {
    if (!window._sfxCtx) {
      try { window._sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    if (window._sfxCtx.state === 'suspended') { try { window._sfxCtx.resume(); } catch(e) {} }
    return window._sfxCtx;
  }

  function osc(ac, type, freq, dest, startT, endT, vol, fadeStart) {
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, startT);
    g.gain.setValueAtTime(vol, startT);
    if (fadeStart !== undefined) {
      g.gain.setValueAtTime(vol, fadeStart);
      g.gain.linearRampToValueAtTime(0, endT);
    } else {
      g.gain.linearRampToValueAtTime(0, endT);
    }
    o.connect(g);
    g.connect(dest);
    o.start(startT);
    o.stop(endT);
  }

  function swell(ac, type, freq, dest, startT, peakT, endT, vol) {
    var o = ac.createOscillator();
    var g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, startT);
    g.gain.linearRampToValueAtTime(vol, peakT);
    g.gain.setValueAtTime(vol, endT - 2.0);
    g.gain.exponentialRampToValueAtTime(0.0001, endT);
    o.connect(g); g.connect(dest);
    o.start(startT); o.stop(endT + 0.05);
  }

  function comp(ac, thr, ratio) {
    var c = ac.createDynamicsCompressor();
    c.threshold.value = thr; c.ratio.value = ratio;
    c.connect(ac.destination);
    return c;
  }

  return {
    /* Deep resonant relic-found chord */
    relicFound: function() {
      var ac = ctx(); if (!ac) return;
      var t = ac.currentTime + 0.02;
      var c = comp(ac, -18, 4);
      osc(ac, 'sine',     55,  c, t,        t + 3.5, 0.30, t + 0.8);
      osc(ac, 'triangle', 110, c, t,        t + 3.2, 0.22, t + 0.5);
      osc(ac, 'triangle', 220, c, t + 0.08, t + 2.8, 0.16, t + 0.4);
      osc(ac, 'sine',     440, c, t + 0.18, t + 2.2, 0.10, t + 0.3);
      osc(ac, 'sine',     880, c, t + 0.32, t + 1.6, 0.06, t + 0.5);

      var vibLfo = ac.createOscillator(), vibGain = ac.createGain();
      var fundOsc = ac.createOscillator(), fundGain = ac.createGain();
      vibLfo.type = 'sine'; vibLfo.frequency.value = 4.5; vibGain.gain.value = 6;
      fundOsc.type = 'sine'; fundOsc.frequency.value = 110;
      fundGain.gain.setValueAtTime(0.18, t + 0.1);
      fundGain.gain.linearRampToValueAtTime(0.18, t + 0.6);
      fundGain.gain.linearRampToValueAtTime(0, t + 3.5);
      vibLfo.connect(vibGain); vibGain.connect(fundOsc.detune);
      fundOsc.connect(fundGain); fundGain.connect(c);
      vibLfo.start(t); vibLfo.stop(t + 3.5);
      fundOsc.start(t); fundOsc.stop(t + 3.5);
    },

    /* Soft ascending arpeggio — a record fully read */
    loreUnlocked: function() {
      var ac = ctx(); if (!ac) return;
      var t = ac.currentTime + 0.02;
      var c = comp(ac, -20, 3);
      var notes = [220, 261.63, 329.63, 440];
      var offsets = [0, 0.13, 0.26, 0.42];
      var dur = 1.1;
      notes.forEach(function(freq, i) {
        var st = t + offsets[i];
        osc(ac, 'triangle', freq,     c, st,        st + dur,       0.14, st + 0.1);
        osc(ac, 'sine',     freq / 2, c, st,        st + dur * 0.7, 0.07, st + 0.15);
        osc(ac, 'sine',     freq * 2, c, st + 0.02, st + dur * 0.6, 0.04, st + 0.1);
      });
      osc(ac, 'sine', 880, c, t + 0.55, t + 1.9, 0.05, t + 0.7);
    },

    /* One segment of a shard resolved on the Terminal: a single quiet tick */
    decodeTick: function() {
      var ac = ctx(); if (!ac) return;
      var t = ac.currentTime + 0.01;
      var c = comp(ac, -24, 3);
      osc(ac, 'sine', 1174.66, c, t, t + 0.09, 0.05, t + 0.02);
      osc(ac, 'sine', 587.33,  c, t, t + 0.14, 0.03, t + 0.03);
    },

    /* The Signal Repeater: one directional pulse. Every 3.7 seconds. Old habits. */
    repeaterPulse: function() {
      var ac = ctx(); if (!ac) return;
      var t = ac.currentTime + 0.01;
      var c = comp(ac, -26, 3);
      osc(ac, 'sine', 196, c, t, t + 0.12, 0.04, t + 0.02);
    },

    /* The Beacon: every ley line in the valley sings. A minor, stacked, ~10 s. */
    awakeningChord: function() {
      var ac = ctx(); if (!ac) return;
      var t = ac.currentTime + 0.05;
      var c = comp(ac, -14, 6);
      var stack = [
        [55.00,   'sine',     0.28, 0.0],
        [110.00,  'triangle', 0.20, 0.4],
        [164.81,  'triangle', 0.14, 0.9],
        [220.00,  'sine',     0.14, 1.3],
        [261.63,  'sine',     0.10, 1.8],
        [329.63,  'sine',     0.09, 2.3],
        [440.00,  'sine',     0.07, 2.9],
        [659.25,  'sine',     0.04, 3.6]
      ];
      stack.forEach(function(s) {
        swell(ac, s[1], s[0], c, t + s[3], t + s[3] + 1.6, t + 10.5, s[2]);
      });
      // a slow beat between the two lowest partials: the valley's three lines not quite in phase
      swell(ac, 'sine', 55.6, c, t + 0.2, t + 2.0, t + 10.5, 0.12);
    }
  };
})();
