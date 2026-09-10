/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Mixer, Sound Effects, Ambient
   All procedural Web Audio. Nothing is loaded from disk.
   ═══════════════════════════════════════════ */

/* ── MIXER — one set of levels for the three buses ── */
var Mixer = {
  levels: { master: 1.0, music: 0.35, ambient: 0.5, sfx: 0.7 },
  muted: false,

  load: function() {
    try {
      var raw = localStorage.getItem('am_mix');
      if (raw) {
        var d = JSON.parse(raw);
        for (var k in Mixer.levels) if (typeof d[k] === 'number') Mixer.levels[k] = Math.min(1, Math.max(0, d[k]));
        Mixer.muted = !!d.muted;
      } else {
        var legacy = parseFloat(localStorage.getItem('am_music_vol'));
        if (!isNaN(legacy)) Mixer.levels.music = Math.min(1, Math.max(0, legacy));
      }
    } catch(e) {}
  },
  save: function() {
    try { localStorage.setItem('am_mix', JSON.stringify(Object.assign({ muted: Mixer.muted }, Mixer.levels))); } catch(e) {}
  },
  gain: function(bus) { return Mixer.muted ? 0 : Mixer.levels.master * (bus === 'master' ? 1 : Mixer.levels[bus]); },
  set: function(bus, v) {
    Mixer.levels[bus] = Math.min(1, Math.max(0, v));
    Mixer.save();
    Mixer.apply();
  },
  toggleMute: function() {
    Mixer.muted = !Mixer.muted;
    Mixer.save();
    Mixer.apply();
    if (typeof RENDER !== 'undefined') RENDER.markDirty();
  },
  apply: function() {
    if (typeof Music   !== 'undefined') Music.applyGain();
    if (typeof Sounds  !== 'undefined') Sounds.applyGain();
    if (typeof Ambient !== 'undefined') Ambient.applyGain();
  }
};

/* ── SOUND EFFECTS ─────────────────────── */
var Sounds = (function() {
  var _ctx = null, _comp = null, _bus = null, _ambBus = null, _noise = null;

  function ctx() {
    if (!_ctx) {
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
        _comp = _ctx.createDynamicsCompressor();
        _comp.threshold.value = -18; _comp.knee.value = 12; _comp.ratio.value = 4;
        _comp.attack.value = 0.003; _comp.release.value = 0.15;
        _comp.connect(_ctx.destination);
        _bus = _ctx.createGain();    _bus.gain.value = Mixer.gain('sfx');       _bus.connect(_comp);
        _ambBus = _ctx.createGain(); _ambBus.gain.value = Mixer.gain('ambient'); _ambBus.connect(_comp);
      } catch(e) { return null; }
    }
    if (_ctx.state === 'suspended') { try { _ctx.resume(); } catch(e) {} }
    return _ctx;
  }

  function noise(ac) {
    if (!_noise) {
      var len = Math.floor(ac.sampleRate * 1.0);
      _noise = ac.createBuffer(1, len, ac.sampleRate);
      var d = _noise.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return _noise;
  }

  /* tone: freq (or [start,end] glide), dur, {type, vol, attack, release, dest} */
  function tone(ac, freq, t, dur, o) {
    o = o || {};
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    if (Array.isArray(freq)) {
      osc.frequency.setValueAtTime(freq[0], t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freq[1]), t + dur);
    } else osc.frequency.value = freq;
    var vol = o.vol || 0.1, att = o.attack || 0.01, rel = Math.min(o.release || 0.08, dur * 0.6);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, Math.max(t + att, t + dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.dest || _bus);
    osc.start(t); osc.stop(t + dur + 0.02);
    return { osc: osc, gain: g };
  }

  /* burst: filtered noise. {filter:'lowpass'|'highpass'|'bandpass', freq, q, vol, dur, dest} */
  function burst(ac, t, o) {
    o = o || {};
    var src = ac.createBufferSource(); src.buffer = noise(ac);
    var off = Math.random() * 0.8;
    var flt = ac.createBiquadFilter();
    flt.type = o.filter || 'lowpass'; flt.frequency.value = o.freq || 800; flt.Q.value = o.q || 0.7;
    var g = ac.createGain();
    var dur = o.dur || 0.08, vol = o.vol || 0.1;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(o.dest || _bus);
    src.start(t, off, dur + 0.02);
    return { src: src, gain: g, filter: flt };
  }

  return {
    ctx: ctx,
    ambientBus: function() { ctx(); return _ambBus; },
    noiseBuffer: function(ac) { return noise(ac); },
    tone: function(freq, t, dur, o) { var ac = ctx(); if (!ac) return null; return tone(ac, freq, t, dur, o); },
    burst: function(t, o) { var ac = ctx(); if (!ac) return null; return burst(ac, t, o); },

    /* Browsers need a gesture before audio. Called from the first click/keypress. */
    unlock: function() { var ac = ctx(); if (ac && ac.state === 'suspended') { try { ac.resume(); } catch(e) {} } },
    unlocked: function() { return !!(_ctx && _ctx.state === 'running'); },

    applyGain: function() {
      if (_bus)    _bus.gain.setTargetAtTime(Mixer.gain('sfx'), _ctx.currentTime, 0.05);
      if (_ambBus) _ambBus.gain.setTargetAtTime(Mixer.gain('ambient'), _ctx.currentTime, 0.05);
    },

    /* ── Interface ── */
    tick: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.01;
      tone(ac, 1318.5, t, 0.05, { vol: 0.03, attack: 0.005, release: 0.03 });
    },

    /* ── Discovery ── */
    relicFound: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.02;
      tone(ac, 55,  t,        3.5, { type: 'sine',     vol: 0.30, attack: 0.05, release: 2.5 });
      tone(ac, 110, t,        3.2, { type: 'triangle', vol: 0.22, attack: 0.05, release: 2.5 });
      tone(ac, 220, t + 0.08, 2.8, { type: 'triangle', vol: 0.16, attack: 0.05, release: 2.2 });
      tone(ac, 440, t + 0.18, 2.2, { type: 'sine',     vol: 0.10, attack: 0.05, release: 1.8 });
      tone(ac, 880, t + 0.32, 1.6, { type: 'sine',     vol: 0.06, attack: 0.05, release: 1.0 });
      var lfo = ac.createOscillator(), lg = ac.createGain();
      var f = tone(ac, 110, t, 3.5, { type: 'sine', vol: 0.18, attack: 0.1, release: 2.8 });
      lfo.type = 'sine'; lfo.frequency.value = 4.5; lg.gain.value = 6;
      lfo.connect(lg); lg.connect(f.osc.detune); lfo.start(t); lfo.stop(t + 3.5);
    },
    loreUnlocked: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.02;
      var notes = [220, 261.63, 329.63, 440], off = [0, 0.13, 0.26, 0.42];
      notes.forEach(function(freq, i) {
        var st = t + off[i];
        tone(ac, freq,     st,        1.1, { type: 'triangle', vol: 0.14, attack: 0.02, release: 0.9 });
        tone(ac, freq / 2, st,        0.8, { type: 'sine',     vol: 0.07, attack: 0.02, release: 0.6 });
        tone(ac, freq * 2, st + 0.02, 0.7, { type: 'sine',     vol: 0.04, attack: 0.02, release: 0.5 });
      });
      tone(ac, 880, t + 0.55, 1.4, { type: 'sine', vol: 0.05, attack: 0.1, release: 1.0 });
    },
    shardRecovered: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.02;
      [1760, 2217, 2637, 3520].forEach(function(f, i) {
        tone(ac, f, t + i * 0.04, 0.9, { type: 'sine', vol: 0.035, attack: 0.01, release: 0.7 });
      });
      tone(ac, 220, t, 0.6, { type: 'triangle', vol: 0.05, attack: 0.02, release: 0.4 });
    },
    decodeTick: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.01;
      tone(ac, 1174.66, t, 0.09, { vol: 0.05, attack: 0.005, release: 0.05 });
      tone(ac, 587.33,  t, 0.14, { vol: 0.03, attack: 0.005, release: 0.08 });
    },
    /* The bench: "It hummed when I finished it. A sound like recognition." */
    recognition: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.02;
      tone(ac, 523.25, t,        0.7, { type: 'sine', vol: 0.09, attack: 0.03, release: 0.5 });
      tone(ac, 659.25, t + 0.22, 0.9, { type: 'sine', vol: 0.09, attack: 0.03, release: 0.7 });
      tone(ac, 130.81, t,        1.1, { type: 'triangle', vol: 0.05, attack: 0.1, release: 0.8 });
    },
    repeaterPulse: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.01;
      tone(ac, 196, t, 0.12, { vol: 0.04, attack: 0.005, release: 0.08 });
    },
    /* The relic pulses. Once. Felt more than heard. */
    relicPulse: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.01;
      tone(ac, [48, 36], t, 0.45, { type: 'sine', vol: 0.22, attack: 0.01, release: 0.35 });
    },

    /* ── Buildings — each has a timbre ── */
    build: function(id, count) {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.01;
      if (count > 0 && id !== 'leyTap') {
        burst(ac, t, { filter: 'highpass', freq: 3000, vol: 0.05, dur: 0.03 });
        tone(ac, [110, 220], t + 0.02, 0.25, { type: 'sine', vol: 0.06, attack: 0.02, release: 0.15 });
        return;
      }
      switch (id) {
        case 'manaConduit':
          burst(ac, t, { filter: 'highpass', freq: 3000, vol: 0.06, dur: 0.03 });
          tone(ac, [110, 220], t + 0.02, 0.35, { type: 'sine', vol: 0.09, attack: 0.02, release: 0.2 });
          break;
        case 'scrapDepot':
          burst(ac, t, { filter: 'lowpass', freq: 500, q: 1.5, vol: 0.14, dur: 0.09 });
          burst(ac, t + 0.14, { filter: 'lowpass', freq: 400, q: 1.5, vol: 0.10, dur: 0.08 });
          break;
        case 'runicWorkbench':
          Sounds.recognition();
          break;
        case 'scoutPost':
          burst(ac, t, { filter: 'bandpass', freq: 600, q: 4, vol: 0.06, dur: 0.6 });
          tone(ac, [300, 1400], t, 0.6, { type: 'sine', vol: 0.03, attack: 0.05, release: 0.3 });
          break;
        case 'leyTap':
          tone(ac, [55, 110], t, 0.7, { type: 'sine', vol: 0.16, attack: 0.05, release: 0.4 });
          tone(ac, 165, t + 0.2, 0.5, { type: 'sine', vol: 0.05, attack: 0.05, release: 0.3 });
          break;
        case 'ancientWorkshop':
          [220, 277.18, 329.63].forEach(function(f, i) { tone(ac, f, t + i * 0.18, 0.5, { type: 'triangle', vol: 0.07, attack: 0.02, release: 0.35 }); });
          tone(ac, 55, t, 1.2, { type: 'sine', vol: 0.12, attack: 0.2, release: 0.8 });
          break;
        case 'memoryTerminal':
          for (var i = 0; i < 9; i++) tone(ac, 800 + Math.random() * 1200, t + i * 0.045, 0.03, { type: 'square', vol: 0.015, attack: 0.003, release: 0.02 });
          tone(ac, 1174.66, t + 0.45, 0.25, { vol: 0.05, attack: 0.01, release: 0.15 });
          break;
        case 'golemForge':
          tone(ac, 120, t, 0.18, { type: 'square', vol: 0.08, attack: 0.005, release: 0.12 });
          burst(ac, t, { filter: 'bandpass', freq: 2500, q: 2, vol: 0.10, dur: 0.12 });
          tone(ac, [90, 60], t + 0.2, 0.4, { type: 'triangle', vol: 0.08, attack: 0.01, release: 0.3 });
          break;
        case 'resonanceBeacon':
          tone(ac, 55,   t, 3.0, { type: 'sine', vol: 0.25, attack: 0.6, release: 2.0 });
          tone(ac, 55.6, t, 3.0, { type: 'sine', vol: 0.12, attack: 0.8, release: 2.0 });
          tone(ac, 110,  t + 0.5, 2.5, { type: 'triangle', vol: 0.08, attack: 0.5, release: 1.8 });
          break;
        default:
          tone(ac, [110, 220], t, 0.25, { type: 'sine', vol: 0.06, attack: 0.02, release: 0.15 });
      }
    },
    scavenge: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.01;
      for (var i = 0; i < 4; i++) burst(ac, t + i * 0.07 + Math.random() * 0.03, { filter: 'lowpass', freq: 700 + Math.random() * 600, q: 1, vol: 0.07, dur: 0.05 });
    },

    /* ── Combat — dry, unglamorous ── */
    zap: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.005;
      tone(ac, [900, 180], t, 0.07, { type: 'sawtooth', vol: 0.05, attack: 0.003, release: 0.04 });
    },
    hit: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.005;
      burst(ac, t, { filter: 'lowpass', freq: 300, q: 1, vol: 0.14, dur: 0.09 });
      tone(ac, [120, 60], t, 0.1, { type: 'sine', vol: 0.08, attack: 0.003, release: 0.06 });
    },
    clank: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.005;
      tone(ac, 150, t, 0.07, { type: 'square', vol: 0.05, attack: 0.003, release: 0.05 });
      burst(ac, t, { filter: 'bandpass', freq: 2800, q: 3, vol: 0.07, dur: 0.06 });
    },
    footsteps: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.01;
      burst(ac, t,        { filter: 'lowpass', freq: 400, q: 1, vol: 0.08, dur: 0.06 });
      burst(ac, t + 0.32, { filter: 'lowpass', freq: 380, q: 1, vol: 0.07, dur: 0.06 });
    },

    /* ── Narrative sounds ── */
    /* "The sound that means the conversation is over." Two blunt tones, down. */
    conversationOver: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.02;
      var a = tone(ac, 440, t,        0.28, { type: 'sawtooth', vol: 0.06, attack: 0.01, release: 0.1 });
      var b = tone(ac, 370, t + 0.34, 0.42, { type: 'sawtooth', vol: 0.06, attack: 0.01, release: 0.2 });
      [a, b].forEach(function(n) {
        var flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 900; flt.Q.value = 2;
        n.osc.disconnect(); n.osc.connect(flt); flt.connect(n.gain);
      });
    },
    /* VERITAS: a descending fifth. Always the same. In full, once, at the end. */
    veritasMotif: function(full) {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.02;
      var seq = full ? [[329.63, 0], [220, 0.55], [261.63, 1.3], [329.63, 1.85], [440, 2.6]] : [[329.63, 0], [220, 0.55]];
      seq.forEach(function(n, i) {
        var last = i === seq.length - 1;
        tone(ac, n[0], t + n[1], last ? 1.6 : 0.5, { type: 'sine', vol: full ? 0.07 : 0.045, attack: 0.03, release: last ? 1.2 : 0.3 });
        tone(ac, n[0] / 2, t + n[1], last ? 1.6 : 0.5, { type: 'sine', vol: 0.02, attack: 0.03, release: last ? 1.2 : 0.3 });
      });
    },

    /* The Beacon: every ley line in the valley sings. A minor, stacked, ~10 s. */
    awakeningChord: function() {
      var ac = ctx(); if (!ac) return; var t = ac.currentTime + 0.05;
      var stack = [
        [55.00,  'sine',     0.28, 0.0], [110.00, 'triangle', 0.20, 0.4], [164.81, 'triangle', 0.14, 0.9],
        [220.00, 'sine',     0.14, 1.3], [261.63, 'sine',     0.10, 1.8], [329.63, 'sine',     0.09, 2.3],
        [440.00, 'sine',     0.07, 2.9], [659.25, 'sine',     0.04, 3.6]
      ];
      stack.forEach(function(s) { tone(ac, s[0], t + s[3], 10.5 - s[3], { type: s[1], vol: s[2], attack: 1.6, release: 2.0 }); });
      tone(ac, 55.6, t + 0.2, 10.3, { type: 'sine', vol: 0.12, attack: 1.8, release: 2.0 });
    }
  };
})();

/* ── AMBIENT — a bed for each place ─────── */
var Ambient = (function() {
  var _place = null, _nodes = null, _timers = [], _paused = false;

  function bed(ac, dest, place) {
    var g = ac.createGain(); g.gain.value = 0; g.connect(dest);
    var stops = [];
    function keep(n) { stops.push(n); return n; }
    function noiseLayer(filterType, freq, q, vol, lfoHz, lfoDepth) {
      var src = ac.createBufferSource(); src.buffer = Sounds.noiseBuffer(ac); src.loop = true;
      var flt = ac.createBiquadFilter(); flt.type = filterType; flt.frequency.value = freq; flt.Q.value = q;
      var lg = ac.createGain(); lg.gain.value = vol;
      if (lfoHz) {
        var lfo = ac.createOscillator(), ld = ac.createGain();
        lfo.frequency.value = lfoHz; ld.gain.value = vol * lfoDepth;
        lfo.connect(ld); ld.connect(lg.gain); lfo.start(); keep(lfo);
      }
      src.connect(flt); flt.connect(lg); lg.connect(g); src.start(); keep(src);
    }
    function sine(freq, vol, tremHz) {
      var o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
      var og = ac.createGain(); og.gain.value = vol;
      if (tremHz) {
        var lfo = ac.createOscillator(), ld = ac.createGain();
        lfo.frequency.value = tremHz; ld.gain.value = vol * 0.6;
        lfo.connect(ld); ld.connect(og.gain); lfo.start(); keep(lfo);
      }
      o.connect(og); og.connect(g); o.start(); keep(o);
    }
    switch (place) {
      case 'valley':
        noiseLayer('lowpass', 380, 0.5, 0.045, 0.09, 0.5);
        break;
      case 'district':
        noiseLayer('lowpass', 220, 0.8, 0.07, 0.28, 0.8);
        noiseLayer('bandpass', 900, 3, 0.012, 0.6, 0.9);
        break;
      case 'spire':
        sine(1760, 0.018, 0.4); sine(1768, 0.018, 0.33); sine(880, 0.01, 0.2);
        noiseLayer('highpass', 6000, 0.7, 0.012, 0.15, 0.7);
        break;
      case 'vault':
        sine(55, 0.07, 0); sine(55.6, 0.035, 0);
        break;
      case 'cathedral':
        sine(110, 0.03, 0); sine(164.81, 0.022, 0); sine(220, 0.018, 0.1);
        noiseLayer('lowpass', 300, 0.5, 0.02, 0.05, 0.5);
        break;
      case 'core':
        sine(55, 0.06, 0); sine(1760, 0.012, 0.3); sine(1766, 0.012, 0.37);
        noiseLayer('lowpass', 300, 0.5, 0.02, 0.07, 0.5);
        break;
      default:
        noiseLayer('lowpass', 380, 0.5, 0.045, 0.09, 0.5);
    }
    return { gain: g, stop: function() { stops.forEach(function(n) { try { n.stop(); } catch(e) {} }); } };
  }

  function clearTimers() { _timers.forEach(clearTimeout); _timers = []; }

  function scheduleEvents(ac, place) {
    clearTimers();
    function later(fn, ms) { _timers.push(setTimeout(fn, ms)); }
    if (place === 'valley' && (G.buildings.scoutPost || 0) >= 1) {
      var bird = function() {
        if (_place !== 'valley' || _paused) return;
        if (isNight()) { later(bird, 60000); return; }
        var t = ac.currentTime + 0.01;
        var f0 = 2200 + Math.random() * 900;
        Sounds.tone([f0, f0 * 1.25], t, 0.12, { type: 'sine', vol: 0.02, attack: 0.01, release: 0.06, dest: Sounds.ambientBus() });
        Sounds.tone([f0 * 1.1, f0 * 0.9], t + 0.18, 0.1, { type: 'sine', vol: 0.016, attack: 0.01, release: 0.05, dest: Sounds.ambientBus() });
        later(bird, 20000 + Math.random() * 40000);
      };
      later(bird, 8000 + Math.random() * 20000);
    }
    if (place === 'vault' || place === 'core') {
      var pulse = function() {
        if ((_place !== 'vault' && _place !== 'core') || _paused) return;
        var t = ac.currentTime + 0.01;
        Sounds.tone([60, 40], t, 0.5, { type: 'sine', vol: 0.12, attack: 0.02, release: 0.4, dest: Sounds.ambientBus() });
        later(pulse, 4000);
      };
      later(pulse, 1500);
    }
    if (place === 'district') {
      var drip = function() {
        if (_place !== 'district' || _paused) return;
        var t = ac.currentTime + 0.01;
        Sounds.tone([1800 + Math.random() * 800, 600], t, 0.09, { type: 'sine', vol: 0.02, attack: 0.005, release: 0.06, dest: Sounds.ambientBus() });
        later(drip, 5000 + Math.random() * 12000);
      };
      later(drip, 3000);
    }
  }

  return {
    place: function() { return _place; },

    setPlace: function(place) {
      if (place === _place) return;
      var ac = Sounds.ctx(); if (!ac || ac.state !== 'running') return;
      var dest = Sounds.ambientBus();
      var now = ac.currentTime;
      if (_nodes) {
        var old = _nodes;
        old.gain.gain.cancelScheduledValues(now);
        old.gain.gain.setValueAtTime(old.gain.gain.value, now);
        old.gain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
        setTimeout(function() { old.stop(); }, 1700);
      }
      _place = place;
      _nodes = bed(ac, dest, place);
      _nodes.gain.gain.setValueAtTime(0.0001, now);
      _nodes.gain.gain.linearRampToValueAtTime(1, now + 2.0);
      scheduleEvents(ac, place);
    },

    stop: function() {
      clearTimers();
      if (_nodes) { var old = _nodes; try { old.gain.gain.setTargetAtTime(0, Sounds.ctx().currentTime, 0.4); } catch(e) {} setTimeout(function() { old.stop(); }, 1500); }
      _nodes = null; _place = null;
    },

    pause: function(p) {
      _paused = p;
      var ac = Sounds.ctx(); if (!ac) return;
      var bus = Sounds.ambientBus();
      bus.gain.setTargetAtTime(p ? 0 : Mixer.gain('ambient'), ac.currentTime, 0.5);
    },

    applyGain: function() {
      var ac = Sounds.ctx(); if (!ac || _paused) return;
      Sounds.ambientBus().gain.setTargetAtTime(Mixer.gain('ambient'), ac.currentTime, 0.05);
    },

    /* Called by the engine about once a second */
    update: function() {
      if (!Sounds.unlocked()) return;
      if (!G.flags.introComplete) return;
      if (Mixer.gain('ambient') <= 0) { if (_nodes) Ambient.stop(); return; }
      var place = currentPlace();
      var bedName = (place === 'archive' || place === 'road' || place === 'outpost') ? 'valley' : place;
      Ambient.setPlace(bedName);
    }
  };
})();
