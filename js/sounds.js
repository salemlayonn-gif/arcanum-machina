/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Sound Effects
   ═══════════════════════════════════════════ */

var Sounds = (function() {
  function ctx() {
    if (!window._sfxCtx) {
      try { window._sfxCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
    }
    return window._sfxCtx;
  }

  function gain(ac, vol, dest) {
    var g = ac.createGain();
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.connect(dest || ac.destination);
    return g;
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

  return {
    /* Deep resonant relic-found chord:
       layered octaves with staggered attack + low-frequency rumble */
    relicFound: function() {
      var ac = ctx(); if (!ac) return;
      var t = ac.currentTime + 0.02;

      // Master compressor for richness
      var comp = ac.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.ratio.value = 4;
      comp.connect(ac.destination);

      // Low rumble / sub bass sine
      osc(ac, 'sine',     55,  comp, t,        t + 3.5, 0.30, t + 0.8);
      // Fundamental
      osc(ac, 'triangle', 110, comp, t,        t + 3.2, 0.22, t + 0.5);
      // Octave
      osc(ac, 'triangle', 220, comp, t + 0.08, t + 2.8, 0.16, t + 0.4);
      // Two-octave shimmer
      osc(ac, 'sine',     440, comp, t + 0.18, t + 2.2, 0.10, t + 0.3);
      // High sparkle
      osc(ac, 'sine',     880, comp, t + 0.32, t + 1.6, 0.06, t + 0.5);

      // Add a slow vibrato on the fundamental for "ancient power" feel
      var vibLfo = ac.createOscillator();
      var vibGain = ac.createGain();
      var fundOsc = ac.createOscillator();
      var fundGain = ac.createGain();
      vibLfo.type = 'sine';
      vibLfo.frequency.value = 4.5;
      vibGain.gain.value = 6;
      fundOsc.type = 'sine';
      fundOsc.frequency.value = 110;
      fundGain.gain.setValueAtTime(0.18, t + 0.1);
      fundGain.gain.linearRampToValueAtTime(0.18, t + 0.6);
      fundGain.gain.linearRampToValueAtTime(0, t + 3.5);
      vibLfo.connect(vibGain);
      vibGain.connect(fundOsc.detune);
      fundOsc.connect(fundGain);
      fundGain.connect(comp);
      vibLfo.start(t);
      vibLfo.stop(t + 3.5);
      fundOsc.start(t);
      fundOsc.stop(t + 3.5);
    },

    /* Soft ascending arpeggio — lore/record discovered:
       A3 → C4 → E4 → A4 staggered, each note with gentle decay */
    loreUnlocked: function() {
      var ac = ctx(); if (!ac) return;
      var t = ac.currentTime + 0.02;

      var comp = ac.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 3;
      comp.connect(ac.destination);

      // A3, C4, E4, A4 — A minor arpeggio (same key as the music)
      var notes = [220, 261.63, 329.63, 440];
      var offsets = [0, 0.13, 0.26, 0.42];
      var dur = 1.1;

      notes.forEach(function(freq, i) {
        var st = t + offsets[i];
        // Triangle for a soft, warm tone
        osc(ac, 'triangle', freq,     comp, st,        st + dur, 0.14, st + 0.1);
        // Sine sub-harmonic for body
        osc(ac, 'sine',     freq / 2, comp, st,        st + dur * 0.7, 0.07, st + 0.15);
        // Faint sine one octave up for air
        osc(ac, 'sine',     freq * 2, comp, st + 0.02, st + dur * 0.6, 0.04, st + 0.1);
      });

      // Final lingering high-A shimmer
      osc(ac, 'sine', 880, comp, t + 0.55, t + 1.9, 0.05, t + 0.7);
    }
  };
})();
