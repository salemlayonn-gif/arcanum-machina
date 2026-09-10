/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Music System
   Procedural chiptune via Web Audio, scheduled bar by bar so the score
   can react to the game: the Archive wakes, the music wakes.
   ═══════════════════════════════════════════ */

var Music = (function() {

  var _ctx = null, _master = null, _comp = null, _noiseBuf = null, _timer = null;
  var _droneA = null, _droneB = null, _droneGain = null;
  var _nextBar = 0, _barIndex = 0, _phraseBars = 0, _lastPhraseAt = 0;

  var N = {
    D2:73.42,  E2:82.41,  F2:87.31,  G2:98.00,  A2:110.00, Bb2:116.54, B2:123.47,
    C3:130.81, D3:146.83, Eb3:155.56, E3:164.81, F3:174.61, Fs3:185.00, G3:196.00, A3:220.00, Bb3:233.08, B3:246.94,
    C4:261.63, D4:293.66, Eb4:311.13, E4:329.63, F4:349.23, Fs4:369.99, G4:392.00, A4:440.00, Bb4:466.16, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25
  };

  var SONGS = [
    /* ── Song 0: Echoes of the First Age — A minor · 70 BPM ── */
    {
      name: 'Echoes of the First Age', bpm: 70,
      melody: [ [N.A4,2],[N.E4,1],[N.F4,1], [N.G4,1],[N.E4,1.5],[N.D4,0.5],[N.E4,1], [N.C4,1.5],[N.D4,0.5],[N.E4,1],[N.F4,1], [N.E4,2],[null,1],[N.A4,1],
                [N.A4,1],[N.B4,0.5],[N.C5,0.5],[N.B4,1],[N.A4,1], [N.G4,1.5],[N.A4,0.5],[N.B4,1],[N.G4,1], [N.F4,1],[N.G4,1],[N.A4,0.5],[N.G4,0.5],[N.F4,1], [N.E4,1.5],[N.D4,0.5],[N.A3,1],[null,1] ],
      melodyType: 'square', melodyVol: 0.18, melodyDuty: 0.80,
      bass: [ [N.A2,4], [N.E2,2],[N.A2,2], [N.F2,2],[N.C3,2], [N.E2,4], [N.A2,2],[N.D3,2], [N.C3,2],[N.G2,2], [N.F2,2],[N.E2,2], [N.A2,4] ],
      bassType: 'triangle', bassVol: 0.26, bassDuty: 0.88,
      arpBeat: 16, arpCount: 32, arpSeq: [N.A3, N.E4, N.A4, N.E4], arpType: 'square', arpVol: 0.07, arpDur: 0.5, arpDuty: 0.45,
      drums: [
        { b:0,f:'K',v:0.75 },{ b:0,f:'D',v:0.35 },{ b:2,f:'H',v:0.06 },{ b:3,f:'H',v:0.04 },
        { b:4,f:'K',v:0.55 },{ b:4,f:'D',v:0.22 },{ b:5,f:'H',v:0.06 },{ b:6,f:'S',v:0.13 },{ b:7,f:'H',v:0.05 },
        { b:8,f:'K',v:0.68 },{ b:8,f:'D',v:0.28 },{ b:9,f:'H',v:0.06 },{ b:10,f:'S',v:0.12 },{ b:11,f:'H',v:0.06 },
        { b:12,f:'K',v:0.65 },{ b:12,f:'D',v:0.26 },{ b:12.5,f:'H',v:0.08 },{ b:13,f:'S',v:0.16 },{ b:13.5,f:'H',v:0.07 },{ b:14,f:'K',v:0.50 },{ b:14.5,f:'S',v:0.14 },{ b:15,f:'S',v:0.20 },{ b:15.5,f:'S',v:0.16 },
        { b:16,f:'K',v:0.95 },{ b:16,f:'D',v:0.42 },{ b:16.5,f:'H',v:0.12 },{ b:17,f:'S',v:0.25 },{ b:17.5,f:'H',v:0.10 },{ b:18,f:'K',v:0.72 },{ b:18.5,f:'H',v:0.12 },{ b:19,f:'S',v:0.23 },{ b:19.5,f:'H',v:0.10 },
        { b:20,f:'K',v:0.88 },{ b:20,f:'D',v:0.32 },{ b:20.5,f:'H',v:0.12 },{ b:21,f:'S',v:0.24 },{ b:21.5,f:'H',v:0.09 },{ b:22,f:'K',v:0.70 },{ b:22.5,f:'H',v:0.12 },{ b:23,f:'S',v:0.24 },{ b:23.5,f:'H',v:0.09 },
        { b:24,f:'K',v:0.90 },{ b:24,f:'D',v:0.34 },{ b:24.5,f:'H',v:0.13 },{ b:25,f:'S',v:0.26 },{ b:25.5,f:'H',v:0.10 },{ b:26,f:'K',v:0.72 },{ b:26.5,f:'H',v:0.13 },{ b:27,f:'S',v:0.26 },{ b:27.5,f:'H',v:0.10 },
        { b:28,f:'K',v:0.95 },{ b:28,f:'D',v:0.40 },{ b:28.5,f:'H',v:0.13 },{ b:29,f:'S',v:0.28 },{ b:29.33,f:'S',v:0.20 },{ b:29.67,f:'S',v:0.16 },{ b:30,f:'K',v:0.82 },{ b:30.5,f:'S',v:0.22 },{ b:31,f:'K',v:0.78 },{ b:31,f:'S',v:0.20 },{ b:31.5,f:'H',v:0.10 }
      ]
    },
    /* ── Song 1: The Sunken Archive — E minor · 55 BPM ── */
    {
      name: 'The Sunken Archive', bpm: 55,
      melody: [ [N.B4,2],[N.G4,1],[N.A4,1], [N.E4,2],[N.D4,1.5],[N.E4,0.5], [N.Fs4,1.5],[N.E4,0.5],[N.D4,1],[N.C4,1], [N.B3,3],[null,1],
                [N.G4,1],[N.A4,1],[N.B4,2], [N.C4,2],[N.B3,1.5],[N.A3,0.5], [N.D4,1],[N.E4,1.5],[N.Fs4,0.5],[N.G4,1], [N.E4,2],[N.B3,1],[N.E4,1] ],
      melodyType: 'sawtooth', melodyVol: 0.12, melodyDuty: 0.85,
      bass: [ [N.E2,4], [N.B2,2],[N.A2,2], [N.C3,2],[N.G2,2], [N.B2,4], [N.G2,2],[N.A2,2], [N.C3,2],[N.B2,2], [N.A2,2],[N.D3,2], [N.E2,4] ],
      bassType: 'sine', bassVol: 0.22, bassDuty: 0.92,
      arpBeat: null,
      drums: [
        { b:0,f:'K',v:0.60 },{ b:0,f:'D',v:0.28 },{ b:2,f:'H',v:0.04 },
        { b:4,f:'K',v:0.48 },{ b:4,f:'D',v:0.20 },{ b:6,f:'H',v:0.04 },
        { b:8,f:'K',v:0.55 },{ b:8,f:'D',v:0.24 },{ b:10,f:'S',v:0.09 },{ b:11,f:'H',v:0.04 },
        { b:12,f:'K',v:0.52 },{ b:12,f:'D',v:0.22 },{ b:15,f:'H',v:0.04 },
        { b:16,f:'K',v:0.75 },{ b:16,f:'D',v:0.32 },{ b:16.5,f:'H',v:0.07 },{ b:18,f:'S',v:0.16 },{ b:18.5,f:'H',v:0.06 },{ b:19.5,f:'H',v:0.06 },
        { b:20,f:'K',v:0.70 },{ b:20,f:'D',v:0.28 },{ b:20.5,f:'H',v:0.07 },{ b:22,f:'S',v:0.17 },{ b:23,f:'H',v:0.06 },
        { b:24,f:'K',v:0.72 },{ b:24,f:'D',v:0.30 },{ b:24.5,f:'H',v:0.08 },{ b:26,f:'S',v:0.18 },{ b:27,f:'H',v:0.07 },{ b:27.5,f:'H',v:0.06 },
        { b:28,f:'K',v:0.75 },{ b:28,f:'D',v:0.32 },{ b:29,f:'S',v:0.17 },{ b:30,f:'H',v:0.06 },{ b:31,f:'S',v:0.14 },{ b:31.5,f:'H',v:0.05 }
      ]
    },
    /* ── Song 2: Architect's Protocol — G minor · 88 BPM ── */
    {
      name: "Architect's Protocol", bpm: 88,
      melody: [ [N.G4,1],[N.Bb4,0.5],[N.C5,0.5],[N.Bb4,1],[N.G4,1], [N.F4,1.5],[N.G4,0.5],[N.A4,1],[N.F4,1], [N.Eb4,1],[N.F4,1],[N.G4,1],[N.Eb4,1], [N.D4,2],[null,1],[N.G4,1],
                [N.G4,0.5],[N.A4,0.5],[N.Bb4,1],[N.C5,1],[N.Bb4,1], [N.A4,1.5],[N.G4,0.5],[N.F4,1],[N.Eb4,1], [N.D4,1],[N.F4,1],[N.G4,0.5],[N.A4,0.5],[N.Bb4,1], [N.G4,1.5],[N.F4,0.5],[N.Eb4,1],[N.D4,1] ],
      melodyType: 'square', melodyVol: 0.16, melodyDuty: 0.78,
      bass: [ [N.G2,2],[N.D3,2], [N.F3,2],[N.C3,2], [N.Eb3,2],[N.Bb2,2], [N.D3,4], [N.G2,2],[N.C3,2], [N.F3,2],[N.Eb3,2], [N.D3,2],[N.Bb2,2], [N.G2,4] ],
      bassType: 'triangle', bassVol: 0.24, bassDuty: 0.86,
      arpBeat: 8, arpCount: 24, arpSeq: [N.G3, N.D4, N.G4, N.D4], arpType: 'square', arpVol: 0.06, arpDur: 0.5, arpDuty: 0.42,
      drums: [
        { b:0,f:'K',v:0.88 },{ b:0,f:'D',v:0.40 },{ b:0.5,f:'H',v:0.12 },{ b:1,f:'S',v:0.28 },{ b:1.5,f:'H',v:0.12 },{ b:1.75,f:'K',v:0.68 },
        { b:2,f:'K',v:0.82 },{ b:2,f:'D',v:0.32 },{ b:2.5,f:'H',v:0.12 },{ b:3,f:'S',v:0.28 },{ b:3.5,f:'H',v:0.12 },
        { b:4,f:'K',v:0.88 },{ b:4,f:'D',v:0.38 },{ b:4.5,f:'H',v:0.12 },{ b:5,f:'S',v:0.26 },{ b:5.5,f:'H',v:0.12 },{ b:6,f:'K',v:0.78 },{ b:6,f:'D',v:0.28 },{ b:6.5,f:'H',v:0.12 },{ b:7,f:'S',v:0.28 },{ b:7.5,f:'H',v:0.12 },{ b:7.75,f:'K',v:0.65 },
        { b:8,f:'K',v:0.90 },{ b:8,f:'D',v:0.40 },{ b:8.5,f:'H',v:0.13 },{ b:9,f:'S',v:0.28 },{ b:9.5,f:'H',v:0.13 },{ b:9.75,f:'K',v:0.65 },{ b:10,f:'K',v:0.82 },{ b:10,f:'D',v:0.32 },{ b:10.5,f:'H',v:0.13 },{ b:11,f:'S',v:0.28 },{ b:11.5,f:'H',v:0.13 },
        { b:12,f:'K',v:0.88 },{ b:12,f:'D',v:0.38 },{ b:12.5,f:'H',v:0.13 },{ b:13,f:'S',v:0.28 },{ b:13.5,f:'H',v:0.13 },{ b:14,f:'K',v:0.78 },{ b:14.5,f:'H',v:0.13 },{ b:15,f:'S',v:0.28 },{ b:15.5,f:'H',v:0.13 },
        { b:16,f:'K',v:0.95 },{ b:16,f:'D',v:0.44 },{ b:16.5,f:'H',v:0.14 },{ b:17,f:'S',v:0.30 },{ b:17.5,f:'H',v:0.14 },{ b:17.75,f:'K',v:0.72 },{ b:18,f:'K',v:0.88 },{ b:18,f:'D',v:0.36 },{ b:18.5,f:'H',v:0.14 },{ b:19,f:'S',v:0.30 },{ b:19.5,f:'H',v:0.14 },
        { b:20,f:'K',v:0.92 },{ b:20,f:'D',v:0.40 },{ b:20.5,f:'H',v:0.14 },{ b:21,f:'S',v:0.30 },{ b:21.5,f:'H',v:0.14 },{ b:21.75,f:'K',v:0.70 },{ b:22,f:'K',v:0.85 },{ b:22,f:'D',v:0.34 },{ b:22.5,f:'H',v:0.14 },{ b:23,f:'S',v:0.30 },{ b:23.5,f:'H',v:0.14 },
        { b:24,f:'K',v:0.92 },{ b:24,f:'D',v:0.42 },{ b:24.5,f:'H',v:0.14 },{ b:25,f:'S',v:0.32 },{ b:25.5,f:'H',v:0.14 },{ b:25.75,f:'K',v:0.68 },{ b:26,f:'K',v:0.85 },{ b:26,f:'D',v:0.34 },{ b:26.5,f:'H',v:0.14 },{ b:27,f:'S',v:0.32 },{ b:27.5,f:'H',v:0.14 },
        { b:28,f:'K',v:0.95 },{ b:28,f:'D',v:0.44 },{ b:28.5,f:'H',v:0.14 },{ b:29,f:'S',v:0.32 },{ b:29.33,f:'S',v:0.24 },{ b:29.67,f:'S',v:0.20 },{ b:30,f:'K',v:0.88 },{ b:30,f:'D',v:0.38 },{ b:30.5,f:'S',v:0.24 },{ b:31,f:'K',v:0.85 },{ b:31,f:'S',v:0.28 },{ b:31.5,f:'H',v:0.12 }
      ]
    }
  ];

  /* Convert [note, beats] sequences into absolute-beat events once */
  function toEvents(seq) {
    var b = 0, out = [];
    seq.forEach(function(ev) { if (ev[0]) out.push({ b: b, f: ev[0], d: ev[1] }); b += ev[1]; });
    return out;
  }
  SONGS.forEach(function(s) {
    s.melodyEv = toEvents(s.melody);
    s.bassEv   = toEvents(s.bass);
    s.arpEv    = [];
    if (s.arpBeat != null) for (var i = 0; i < s.arpCount; i++) s.arpEv.push({ b: s.arpBeat + i * s.arpDur, f: s.arpSeq[i % s.arpSeq.length], d: s.arpDur });
  });

  /* ── Percussion ─────────────────────── */
  function _makeNoise() {
    var len = Math.floor(_ctx.sampleRate * 1.0);
    _noiseBuf = _ctx.createBuffer(1, len, _ctx.sampleRate);
    var d = _noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  function _kick(t, vol) {
    var osc = _ctx.createOscillator(), g = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.075);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    osc.connect(g); g.connect(_master); osc.start(t); osc.stop(t + 0.22);
  }
  function _snare(t, vol) {
    if (!_noiseBuf) return;
    var src = _ctx.createBufferSource(); src.buffer = _noiseBuf;
    var flt = _ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 2200; flt.Q.value = 0.4;
    var g = _ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(flt); flt.connect(g); g.connect(_master);
    src.start(t, Math.random() * 0.8, 0.14);
    var osc = _ctx.createOscillator(), og = _ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 220;
    og.gain.setValueAtTime(vol * 0.28, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(og); og.connect(_master); osc.start(t); osc.stop(t + 0.05);
  }
  function _hihat(t, vol) {
    if (!_noiseBuf) return;
    var src = _ctx.createBufferSource(); src.buffer = _noiseBuf;
    var flt = _ctx.createBiquadFilter(); flt.type = 'highpass'; flt.frequency.value = 9000;
    var g = _ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
    src.connect(flt); flt.connect(g); g.connect(_master);
    src.start(t, Math.random() * 0.8, 0.04);
  }
  function _deepPulse(t, vol) {
    var osc = _ctx.createOscillator(), g = _ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 55;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.025); g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(g); g.connect(_master); osc.start(t); osc.stop(t + 0.6);
  }

  /* ── Voices ─────────────────────────── */
  function _note(freq, t, dur, type, vol) {
    if (!_ctx || !freq || dur <= 0) return;
    var osc = _ctx.createOscillator(), g = _ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    var att = 0.008, rel = Math.min(0.055, dur * 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, Math.max(t + att + 0.001, t + dur - rel));
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g); g.connect(_master); osc.start(t); osc.stop(t + dur + 0.02);
  }
  /* The hymn: sine with two harmonics, slow attack. What the Church hears. */
  function _organ(freq, t, dur, vol) {
    if (!_ctx || !freq || dur <= 0) return;
    [[1, 1], [2, 0.45], [3, 0.2]].forEach(function(h) {
      var osc = _ctx.createOscillator(), g = _ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq * h[0];
      var v = vol * h[1], att = Math.min(0.25, dur * 0.3), rel = Math.min(0.3, dur * 0.3);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + att);
      g.gain.setValueAtTime(v, Math.max(t + att, t + dur - rel));
      g.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(g); g.connect(_master); osc.start(t); osc.stop(t + dur + 0.02);
    });
  }
  /* The wraiths: two sines almost in tune, trembling. A message that cannot find its receiver. */
  function _shimmer(freq, t, dur, vol) {
    if (!_ctx || !freq || dur <= 0) return;
    [0.997, 1.003].forEach(function(det) {
      var osc = _ctx.createOscillator(), g = _ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq * 2 * det;
      var lfo = _ctx.createOscillator(), ld = _ctx.createGain();
      lfo.frequency.value = 5.5; ld.gain.value = vol * 0.35;
      lfo.connect(ld); ld.connect(g.gain); lfo.start(t); lfo.stop(t + dur + 0.02);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * 0.55, t + 0.08);
      g.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(g); g.connect(_master); osc.start(t); osc.stop(t + dur + 0.02);
    });
  }

  /* ── What plays, right now ──────────── */
  /* Layers keyed to the state of the Archive: the score is the Lattice reassembling. */
  function layersFor(G) {
    var b = G.buildings || {}, p = (G.prestige && G.prestige.count) || 0;
    return {
      drone: true,
      bass: (b.manaConduit || 0) >= 1,
      arp: (b.runicWorkbench || 0) >= 1,
      drums: (b.golemForge || 0) >= 1 || p >= 1 ? 'full' : ((b.scoutPost || 0) >= 1 ? 'sparse' : 'none'),
      melody: (b.ancientWorkshop || 0) >= 1 || p >= 1,
      melodyOctave: p >= 1,
      subBass: p >= 2,
      arpFifth: p >= 3,
      bright: p >= 4
    };
  }

  /* Returns { song, layers, voice, bpmMult } for the next bar */
  function planFor(G) {
    var mode = Music.mode;
    if (mode !== 'adaptive') {
      return { song: SONGS[mode], layers: { drone: false, bass: true, arp: true, drums: 'full', melody: true }, voice: 'normal', bpmMult: 1 };
    }
    var place = currentPlace();
    var L = layersFor(G);
    var plan = { song: SONGS[0], layers: L, voice: 'normal', bpmMult: 1 };
    switch (place) {
      case 'district':
        plan.song = SONGS[1];
        plan.layers = { drone: false, bass: true, arp: false, drums: 'full', melody: true, melodyOctave: false, subBass: L.subBass };
        break;
      case 'spire':
        plan.voice = 'shimmer';
        plan.layers = Object.assign({}, L, { drums: 'none', melody: true, melodyOctave: false });
        break;
      case 'vault':
        plan.layers = { drone: true, bass: false, arp: false, drums: 'pulse', melody: false };
        break;
      case 'cathedral':
        plan.voice = 'organ'; plan.bpmMult = 0.5;
        plan.layers = { drone: true, bass: true, arp: false, drums: 'none', melody: true, melodyOctave: L.melodyOctave };
        break;
      case 'core':
        plan.layers = Object.assign({}, L, { drums: 'full', melody: true, melodyOctave: true, arpFifth: true, bright: true });
        break;
    }
    /* Combat ducks the tune; the pulse stays */
    if (G.combat && G.combat.active && !G.combat.script) {
      plan.layers = Object.assign({}, plan.layers, { melody: false, arp: false, melodyOctave: false, arpFifth: false });
    }
    /* After the ending the music becomes occasional */
    if (G.flags && G.flags.ended && place === 'archive') {
      var now = Date.now();
      if (_phraseBars <= 0 && (_barIndex % 8) === 0 && now - _lastPhraseAt > 180000) { _phraseBars = 2; _lastPhraseAt = now; }
      if (_phraseBars > 0) {
        _phraseBars--;
        plan.layers = { drone: true, bass: true, arp: false, drums: 'none', melody: true, melodyOctave: true };
      } else {
        plan.layers = { drone: true, bass: false, arp: false, drums: 'none', melody: false };
      }
    }
    return plan;
  }

  /* ── Schedule one bar ───────────────── */
  function _scheduleBar(t0, bar, plan) {
    var song = plan.song, L = plan.layers;
    var BEAT = (60 / song.bpm) / plan.bpmMult;
    var lo = bar * 4, hi = lo + 4;
    function inBar(ev) { return ev.b >= lo && ev.b < hi; }
    function at(ev) { return t0 + (ev.b - lo) * BEAT; }
    var mv = song.melodyVol * (L.bright ? 1.25 : 1);

    if (L.melody) song.melodyEv.filter(inBar).forEach(function(ev) {
      var d = ev.d * BEAT * song.melodyDuty;
      if (plan.voice === 'organ')        _organ(ev.f, at(ev), d, mv * 0.9);
      else if (plan.voice === 'shimmer') _shimmer(ev.f, at(ev), d, mv * 0.6);
      else                               _note(ev.f, at(ev), d, song.melodyType, mv);
    });
    if (L.melodyOctave) song.melodyEv.filter(inBar).forEach(function(ev) {
      _note(ev.f * 2, at(ev), ev.d * BEAT * song.melodyDuty, 'sine', mv * 0.3);
    });
    if (L.bass) song.bassEv.filter(inBar).forEach(function(ev) {
      _note(ev.f, at(ev), ev.d * BEAT * song.bassDuty, song.bassType, song.bassVol);
    });
    if (L.subBass) song.bassEv.filter(inBar).forEach(function(ev) {
      _note(ev.f / 2, at(ev), ev.d * BEAT * song.bassDuty, 'sine', song.bassVol * 0.5);
    });
    if (L.arp && song.arpEv.length) song.arpEv.filter(inBar).forEach(function(ev) {
      _note(ev.f, at(ev), ev.d * BEAT * song.arpDuty, song.arpType, song.arpVol);
    });
    if (L.arpFifth && song.arpEv.length) song.arpEv.filter(inBar).forEach(function(ev) {
      _note(ev.f * 1.5, at(ev), ev.d * BEAT * song.arpDuty, 'sine', song.arpVol * 0.6);
    });
    if (L.drums && L.drums !== 'none') song.drums.filter(inBar).forEach(function(ev) {
      var t = at(ev);
      if (L.drums === 'pulse')       { if (ev.f === 'D') _deepPulse(t, ev.v * 1.2); return; }
      if (L.drums === 'sparse')      { if (ev.f === 'K') _kick(t, ev.v * 0.6); else if (ev.f === 'D') _deepPulse(t, ev.v * 0.8); return; }
      if      (ev.f === 'K') _kick(t, ev.v);
      else if (ev.f === 'S') _snare(t, ev.v);
      else if (ev.f === 'H') _hihat(t, ev.v);
      else if (ev.f === 'D') _deepPulse(t, ev.v);
    });
    if (_droneGain) _droneGain.gain.setTargetAtTime(L.drone ? 0.16 : 0.0001, t0, 0.8);
    return 4 * BEAT;
  }

  function _tick() {
    if (!Music.playing || !_ctx) return;
    while (_nextBar < _ctx.currentTime + 1.2) {
      var plan = planFor(G);
      var dur = _scheduleBar(_nextBar, _barIndex % 8, plan);
      _nextBar += dur;
      _barIndex++;
    }
    _timer = setTimeout(_tick, 250);
  }

  /* ── Public API ─────────────────────── */
  return {
    playing: false,
    mode: 'adaptive',       // 'adaptive' | 0 | 1 | 2
    currentSong: -1,        // -1 = adaptive
    _autoPrev: null,

    layersFor: layersFor,
    planFor: planFor,
    getSongs: function() { return ['Adaptive — the Archive wakes'].concat(SONGS.map(function(s) { return s.name; })); },

    loadPrefs: function() {
      var s = localStorage.getItem('am_music_song');
      if (s === null || s === 'adaptive' || s === '-1') { Music.mode = 'adaptive'; Music.currentSong = -1; }
      else { var i = parseInt(s, 10); if (!isNaN(i) && i >= 0 && i < SONGS.length) { Music.mode = i; Music.currentSong = i; } }
    },

    toggle: function() { Music.playing ? Music.stop() : Music.play(); },

    /* idx: -1 / 'adaptive' for the adaptive score, else a fixed song index */
    setSong: function(idx, transient) {
      var mode = (idx === 'adaptive' || idx === -1) ? 'adaptive' : idx;
      if (mode !== 'adaptive' && (mode < 0 || mode >= SONGS.length)) return;
      if (mode === Music.mode) return;
      Music.mode = mode;
      Music.currentSong = mode === 'adaptive' ? -1 : mode;
      if (!transient) localStorage.setItem('am_music_song', mode === 'adaptive' ? 'adaptive' : String(mode));
      if (typeof RENDER !== 'undefined') RENDER.markDirty();
    },
    autoSwitch: function(idx) {
      if (Music.mode === 'adaptive' || !Music.playing || Music._autoPrev !== null || Music.mode === idx) return;
      Music._autoPrev = Music.mode; Music.setSong(idx, true);
    },
    autoRestore: function() {
      if (Music._autoPrev === null) return;
      var prev = Music._autoPrev; Music._autoPrev = null; Music.setSong(prev, true);
    },

    play: function() {
      if (Music.playing) return;
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
        _comp = _ctx.createDynamicsCompressor();
        _comp.threshold.value = -18; _comp.knee.value = 10; _comp.ratio.value = 5; _comp.attack.value = 0.003; _comp.release.value = 0.12;
        _comp.connect(_ctx.destination);
        _master = _ctx.createGain(); _master.gain.value = Mixer.gain('music'); _master.connect(_comp);
        _makeNoise();
        /* The drone: the valley's three lines, not quite in phase */
        _droneGain = _ctx.createGain(); _droneGain.gain.value = 0.0001; _droneGain.connect(_master);
        _droneA = _ctx.createOscillator(); _droneA.type = 'sine'; _droneA.frequency.value = 55;   _droneA.connect(_droneGain); _droneA.start();
        _droneB = _ctx.createOscillator(); _droneB.type = 'sine'; _droneB.frequency.value = 55.6; var bg = _ctx.createGain(); bg.gain.value = 0.5; _droneB.connect(bg); bg.connect(_droneGain); _droneB.start();

        Music.playing = true;
        _barIndex = 0; _phraseBars = 0;
        _nextBar = _ctx.currentTime + 0.15;
        _tick();
      } catch(e) {
        console.warn('Web Audio unavailable:', e);
      }
      if (typeof RENDER !== 'undefined') RENDER.markDirty();
    },

    stop: function() {
      Music.playing = false;
      clearTimeout(_timer);
      if (_ctx) { try { _ctx.close(); } catch(e) {} }
      _ctx = null; _master = null; _comp = null; _noiseBuf = null; _droneA = null; _droneB = null; _droneGain = null;
      if (typeof RENDER !== 'undefined') RENDER.markDirty();
    },

    applyGain: function() {
      if (_master && _ctx) _master.gain.setTargetAtTime(Mixer.gain('music'), _ctx.currentTime, 0.05);
    },
    /* Kept for old callers; the mixer owns the level now */
    get volume() { return Mixer.levels.music; },
    setVolume: function(v) { Mixer.set('music', v); }
  };
})();
