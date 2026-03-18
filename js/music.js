/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Music System
   Procedural 8-bit chiptune via Web Audio API
   Three tracks · select in Config
   ═══════════════════════════════════════════ */

var Music = (function() {

  var _ctx      = null;
  var _master   = null;
  var _drums    = null;
  var _comp     = null;
  var _noiseBuf = null;
  var _timer    = null;
  var _nextLoop = 0;
  var _currentSong = 0;

  /* ── Expanded note frequency table ───────── */
  var N = {
    /* Octave 2 */
    D2:73.42,  E2:82.41,  F2:87.31,  G2:98.00,
    A2:110.00, Bb2:116.54, B2:123.47,
    /* Octave 3 */
    C3:130.81, D3:146.83, Eb3:155.56, E3:164.81,
    F3:174.61, Fs3:185.00, G3:196.00, A3:220.00,
    Bb3:233.08, B3:246.94,
    /* Octave 4 */
    C4:261.63, D4:293.66, Eb4:311.13, E4:329.63,
    F4:349.23, Fs4:369.99, G4:392.00, A4:440.00,
    Bb4:466.16, B4:493.88,
    /* Octave 5 */
    C5:523.25, D5:587.33, E5:659.25
  };

  /* ══════════════════════════════════════════
     SONG DEFINITIONS
     Each song: name, bpm, melody, bass,
     arpBeat (null = no arp), arpSeq, arpCount,
     drums. Plus per-voice type/vol/duty.
  ══════════════════════════════════════════ */
  var SONGS = [

    /* ── Song 1: Echoes of the First Age ──
       A minor · 70 BPM · mysterious → epic   */
    {
      name: 'Echoes of the First Age',
      bpm:  70,

      melody: [
        /* bar 1 */ [N.A4,2],   [N.E4,1],   [N.F4,1],
        /* bar 2 */ [N.G4,1],   [N.E4,1.5], [N.D4,0.5], [N.E4,1],
        /* bar 3 */ [N.C4,1.5], [N.D4,0.5], [N.E4,1],   [N.F4,1],
        /* bar 4 */ [N.E4,2],   [null,1],   [N.A4,1],
        /* bar 5 */ [N.A4,1],   [N.B4,0.5], [N.C5,0.5], [N.B4,1], [N.A4,1],
        /* bar 6 */ [N.G4,1.5], [N.A4,0.5], [N.B4,1],   [N.G4,1],
        /* bar 7 */ [N.F4,1],   [N.G4,1],   [N.A4,0.5], [N.G4,0.5],[N.F4,1],
        /* bar 8 */ [N.E4,1.5], [N.D4,0.5], [N.A3,1],   [null,1]
      ],
      melodyType: 'square', melodyVol: 0.18, melodyDuty: 0.80,

      bass: [
        /* bar 1 */ [N.A2,4],
        /* bar 2 */ [N.E2,2],  [N.A2,2],
        /* bar 3 */ [N.F2,2],  [N.C3,2],
        /* bar 4 */ [N.E2,4],
        /* bar 5 */ [N.A2,2],  [N.D3,2],
        /* bar 6 */ [N.C3,2],  [N.G2,2],
        /* bar 7 */ [N.F2,2],  [N.E2,2],
        /* bar 8 */ [N.A2,4]
      ],
      bassType: 'triangle', bassVol: 0.26, bassDuty: 0.88,

      arpBeat: 16, arpCount: 32,
      arpSeq:  [N.A3, N.E4, N.A4, N.E4],
      arpType: 'square', arpVol: 0.07, arpDur: 0.5, arpDuty: 0.45,

      drums: [
        // Bar 1: lonely kick + distant hihat
        { b:0,    f:'K', v:0.75 }, { b:0,    f:'D', v:0.35 },
        { b:2,    f:'H', v:0.06 }, { b:3,    f:'H', v:0.04 },
        // Bar 2: kick + soft snare
        { b:4,    f:'K', v:0.55 }, { b:4,    f:'D', v:0.22 },
        { b:5,    f:'H', v:0.06 }, { b:6,    f:'S', v:0.13 },
        { b:7,    f:'H', v:0.05 },
        // Bar 3: kick + sparse hihats
        { b:8,    f:'K', v:0.68 }, { b:8,    f:'D', v:0.28 },
        { b:9,    f:'H', v:0.06 }, { b:10,   f:'S', v:0.12 },
        { b:11,   f:'H', v:0.06 },
        // Bar 4: tension fill
        { b:12,   f:'K', v:0.65 }, { b:12,   f:'D', v:0.26 },
        { b:12.5, f:'H', v:0.08 }, { b:13,   f:'S', v:0.16 },
        { b:13.5, f:'H', v:0.07 }, { b:14,   f:'K', v:0.50 },
        { b:14.5, f:'S', v:0.14 }, { b:15,   f:'S', v:0.20 },
        { b:15.5, f:'S', v:0.16 },
        // Bar 5: THE DROP
        { b:16,   f:'K', v:0.95 }, { b:16,   f:'D', v:0.42 },
        { b:16.5, f:'H', v:0.12 }, { b:17,   f:'S', v:0.25 },
        { b:17.5, f:'H', v:0.10 }, { b:18,   f:'K', v:0.72 },
        { b:18.5, f:'H', v:0.12 }, { b:19,   f:'S', v:0.23 },
        { b:19.5, f:'H', v:0.10 },
        // Bar 6
        { b:20,   f:'K', v:0.88 }, { b:20,   f:'D', v:0.32 },
        { b:20.5, f:'H', v:0.12 }, { b:21,   f:'S', v:0.24 },
        { b:21.5, f:'H', v:0.09 }, { b:22,   f:'K', v:0.70 },
        { b:22.5, f:'H', v:0.12 }, { b:23,   f:'S', v:0.24 },
        { b:23.5, f:'H', v:0.09 },
        // Bar 7
        { b:24,   f:'K', v:0.90 }, { b:24,   f:'D', v:0.34 },
        { b:24.5, f:'H', v:0.13 }, { b:25,   f:'S', v:0.26 },
        { b:25.5, f:'H', v:0.10 }, { b:26,   f:'K', v:0.72 },
        { b:26.5, f:'H', v:0.13 }, { b:27,   f:'S', v:0.26 },
        { b:27.5, f:'H', v:0.10 },
        // Bar 8: epic climax fill
        { b:28,   f:'K', v:0.95 }, { b:28,   f:'D', v:0.40 },
        { b:28.5, f:'H', v:0.13 }, { b:29,   f:'S', v:0.28 },
        { b:29.33,f:'S', v:0.20 }, { b:29.67,f:'S', v:0.16 },
        { b:30,   f:'K', v:0.82 }, { b:30.5, f:'S', v:0.22 },
        { b:31,   f:'K', v:0.78 }, { b:31,   f:'S', v:0.20 },
        { b:31.5, f:'H', v:0.10 }
      ]
    },

    /* ── Song 2: The Sunken Archive ──────────
       E minor · 55 BPM · haunting, melancholic
       Sawtooth melody, sine bass, sparse drums  */
    {
      name: 'The Sunken Archive',
      bpm:  55,

      melody: [
        /* bar 1 */ [N.B4,2],   [N.G4,1],   [N.A4,1],
        /* bar 2 */ [N.E4,2],   [N.D4,1.5], [N.E4,0.5],
        /* bar 3 */ [N.Fs4,1.5],[N.E4,0.5], [N.D4,1],   [N.C4,1],
        /* bar 4 */ [N.B3,3],   [null,1],
        /* bar 5 */ [N.G4,1],   [N.A4,1],   [N.B4,2],
        /* bar 6 */ [N.C4,2],   [N.B3,1.5], [N.A3,0.5],
        /* bar 7 */ [N.D4,1],   [N.E4,1.5], [N.Fs4,0.5],[N.G4,1],
        /* bar 8 */ [N.E4,2],   [N.B3,1],   [N.E4,1]
      ],
      melodyType: 'sawtooth', melodyVol: 0.12, melodyDuty: 0.85,

      bass: [
        /* bar 1 */ [N.E2,4],
        /* bar 2 */ [N.B2,2],  [N.A2,2],
        /* bar 3 */ [N.C3,2],  [N.G2,2],
        /* bar 4 */ [N.B2,4],
        /* bar 5 */ [N.G2,2],  [N.A2,2],
        /* bar 6 */ [N.C3,2],  [N.B2,2],
        /* bar 7 */ [N.A2,2],  [N.D3,2],
        /* bar 8 */ [N.E2,4]
      ],
      bassType: 'sine', bassVol: 0.22, bassDuty: 0.92,

      arpBeat: null, // no arpeggio — keep it ambient

      drums: [
        // Bar 1: lone deep pulse, barely there
        { b:0,    f:'K', v:0.60 }, { b:0,    f:'D', v:0.28 },
        { b:2,    f:'H', v:0.04 },
        // Bar 2
        { b:4,    f:'K', v:0.48 }, { b:4,    f:'D', v:0.20 },
        { b:6,    f:'H', v:0.04 },
        // Bar 3: first whisper of snare
        { b:8,    f:'K', v:0.55 }, { b:8,    f:'D', v:0.24 },
        { b:10,   f:'S', v:0.09 }, { b:11,   f:'H', v:0.04 },
        // Bar 4: tension breathes
        { b:12,   f:'K', v:0.52 }, { b:12,   f:'D', v:0.22 },
        { b:15,   f:'H', v:0.04 },
        // Bar 5: the water rises — beat solidifies
        { b:16,   f:'K', v:0.75 }, { b:16,   f:'D', v:0.32 },
        { b:16.5, f:'H', v:0.07 }, { b:18,   f:'S', v:0.16 },
        { b:18.5, f:'H', v:0.06 }, { b:19.5, f:'H', v:0.06 },
        // Bar 6
        { b:20,   f:'K', v:0.70 }, { b:20,   f:'D', v:0.28 },
        { b:20.5, f:'H', v:0.07 }, { b:22,   f:'S', v:0.17 },
        { b:23,   f:'H', v:0.06 },
        // Bar 7
        { b:24,   f:'K', v:0.72 }, { b:24,   f:'D', v:0.30 },
        { b:24.5, f:'H', v:0.08 }, { b:26,   f:'S', v:0.18 },
        { b:27,   f:'H', v:0.07 }, { b:27.5, f:'H', v:0.06 },
        // Bar 8: gentle drift back
        { b:28,   f:'K', v:0.75 }, { b:28,   f:'D', v:0.32 },
        { b:29,   f:'S', v:0.17 }, { b:30,   f:'H', v:0.06 },
        { b:31,   f:'S', v:0.14 }, { b:31.5, f:'H', v:0.05 }
      ]
    },

    /* ── Song 3: Architect's Protocol ────────
       G minor · 88 BPM · mechanical, urgent
       Square melody, triangle bass, syncopated  */
    {
      name: "Architect's Protocol",
      bpm:  88,

      melody: [
        /* bar 1 */ [N.G4,1],   [N.Bb4,0.5],[N.C5,0.5], [N.Bb4,1], [N.G4,1],
        /* bar 2 */ [N.F4,1.5], [N.G4,0.5], [N.A4,1],   [N.F4,1],
        /* bar 3 */ [N.Eb4,1],  [N.F4,1],   [N.G4,1],   [N.Eb4,1],
        /* bar 4 */ [N.D4,2],   [null,1],   [N.G4,1],
        /* bar 5 */ [N.G4,0.5], [N.A4,0.5], [N.Bb4,1],  [N.C5,1],  [N.Bb4,1],
        /* bar 6 */ [N.A4,1.5], [N.G4,0.5], [N.F4,1],   [N.Eb4,1],
        /* bar 7 */ [N.D4,1],   [N.F4,1],   [N.G4,0.5], [N.A4,0.5],[N.Bb4,1],
        /* bar 8 */ [N.G4,1.5], [N.F4,0.5], [N.Eb4,1],  [N.D4,1]
      ],
      melodyType: 'square', melodyVol: 0.16, melodyDuty: 0.78,

      bass: [
        /* bar 1 */ [N.G2,2],  [N.D3,2],
        /* bar 2 */ [N.F3,2],  [N.C3,2],
        /* bar 3 */ [N.Eb3,2], [N.Bb2,2],
        /* bar 4 */ [N.D3,4],
        /* bar 5 */ [N.G2,2],  [N.C3,2],
        /* bar 6 */ [N.F3,2],  [N.Eb3,2],
        /* bar 7 */ [N.D3,2],  [N.Bb2,2],
        /* bar 8 */ [N.G2,4]
      ],
      bassType: 'triangle', bassVol: 0.24, bassDuty: 0.86,

      arpBeat: 8, arpCount: 24,
      arpSeq:  [N.G3, N.D4, N.G4, N.D4],
      arpType: 'square', arpVol: 0.06, arpDur: 0.5, arpDuty: 0.42,

      drums: [
        // Bars 1-2: full beat from bar 1, syncopated kick
        { b:0,    f:'K', v:0.88 }, { b:0,    f:'D', v:0.40 },
        { b:0.5,  f:'H', v:0.12 }, { b:1,    f:'S', v:0.28 },
        { b:1.5,  f:'H', v:0.12 }, { b:1.75, f:'K', v:0.68 },
        { b:2,    f:'K', v:0.82 }, { b:2,    f:'D', v:0.32 },
        { b:2.5,  f:'H', v:0.12 }, { b:3,    f:'S', v:0.28 },
        { b:3.5,  f:'H', v:0.12 },
        { b:4,    f:'K', v:0.88 }, { b:4,    f:'D', v:0.38 },
        { b:4.5,  f:'H', v:0.12 }, { b:5,    f:'S', v:0.26 },
        { b:5.5,  f:'H', v:0.12 }, { b:6,    f:'K', v:0.78 },
        { b:6,    f:'D', v:0.28 }, { b:6.5,  f:'H', v:0.12 },
        { b:7,    f:'S', v:0.28 }, { b:7.5,  f:'H', v:0.12 },
        { b:7.75, f:'K', v:0.65 },
        // Bars 3-4: arp kicks in, beat tightens
        { b:8,    f:'K', v:0.90 }, { b:8,    f:'D', v:0.40 },
        { b:8.5,  f:'H', v:0.13 }, { b:9,    f:'S', v:0.28 },
        { b:9.5,  f:'H', v:0.13 }, { b:9.75, f:'K', v:0.65 },
        { b:10,   f:'K', v:0.82 }, { b:10,   f:'D', v:0.32 },
        { b:10.5, f:'H', v:0.13 }, { b:11,   f:'S', v:0.28 },
        { b:11.5, f:'H', v:0.13 },
        { b:12,   f:'K', v:0.88 }, { b:12,   f:'D', v:0.38 },
        { b:12.5, f:'H', v:0.13 }, { b:13,   f:'S', v:0.28 },
        { b:13.5, f:'H', v:0.13 }, { b:14,   f:'K', v:0.78 },
        { b:14.5, f:'H', v:0.13 }, { b:15,   f:'S', v:0.28 },
        { b:15.5, f:'H', v:0.13 },
        // Bars 5-6: full intensity
        { b:16,   f:'K', v:0.95 }, { b:16,   f:'D', v:0.44 },
        { b:16.5, f:'H', v:0.14 }, { b:17,   f:'S', v:0.30 },
        { b:17.5, f:'H', v:0.14 }, { b:17.75,f:'K', v:0.72 },
        { b:18,   f:'K', v:0.88 }, { b:18,   f:'D', v:0.36 },
        { b:18.5, f:'H', v:0.14 }, { b:19,   f:'S', v:0.30 },
        { b:19.5, f:'H', v:0.14 },
        { b:20,   f:'K', v:0.92 }, { b:20,   f:'D', v:0.40 },
        { b:20.5, f:'H', v:0.14 }, { b:21,   f:'S', v:0.30 },
        { b:21.5, f:'H', v:0.14 }, { b:21.75,f:'K', v:0.70 },
        { b:22,   f:'K', v:0.85 }, { b:22,   f:'D', v:0.34 },
        { b:22.5, f:'H', v:0.14 }, { b:23,   f:'S', v:0.30 },
        { b:23.5, f:'H', v:0.14 },
        // Bars 7-8: drive to climax
        { b:24,   f:'K', v:0.92 }, { b:24,   f:'D', v:0.42 },
        { b:24.5, f:'H', v:0.14 }, { b:25,   f:'S', v:0.32 },
        { b:25.5, f:'H', v:0.14 }, { b:25.75,f:'K', v:0.68 },
        { b:26,   f:'K', v:0.85 }, { b:26,   f:'D', v:0.34 },
        { b:26.5, f:'H', v:0.14 }, { b:27,   f:'S', v:0.32 },
        { b:27.5, f:'H', v:0.14 },
        { b:28,   f:'K', v:0.95 }, { b:28,   f:'D', v:0.44 },
        { b:28.5, f:'H', v:0.14 }, { b:29,   f:'S', v:0.32 },
        { b:29.33,f:'S', v:0.24 }, { b:29.67,f:'S', v:0.20 },
        { b:30,   f:'K', v:0.88 }, { b:30,   f:'D', v:0.38 },
        { b:30.5, f:'S', v:0.24 }, { b:31,   f:'K', v:0.85 },
        { b:31,   f:'S', v:0.28 }, { b:31.5, f:'H', v:0.12 }
      ]
    }

  ]; // end SONGS

  /* ── Build noise buffer ───────────────── */
  function _makeNoise() {
    var len = Math.floor(_ctx.sampleRate * 1.0);
    _noiseBuf = _ctx.createBuffer(1, len, _ctx.sampleRate);
    var d = _noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  /* ── Percussion voices ────────────────── */
  function _kick(t, vol) {
    var osc = _ctx.createOscillator();
    var g   = _ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.075);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    osc.connect(g); g.connect(_drums);
    osc.start(t); osc.stop(t + 0.22);
  }

  function _snare(t, vol) {
    if (!_noiseBuf) return;
    var off = Math.floor(Math.random() * (_ctx.sampleRate * 0.8));
    var src = _ctx.createBufferSource();
    src.buffer = _noiseBuf;
    var flt = _ctx.createBiquadFilter();
    flt.type = 'bandpass'; flt.frequency.value = 2200; flt.Q.value = 0.4;
    var g = _ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    src.connect(flt); flt.connect(g); g.connect(_drums);
    src.start(t, off / _ctx.sampleRate, 0.14);
    var osc = _ctx.createOscillator();
    var og  = _ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 220;
    og.gain.setValueAtTime(vol * 0.28, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(og); og.connect(_drums);
    osc.start(t); osc.stop(t + 0.05);
  }

  function _hihat(t, vol) {
    if (!_noiseBuf) return;
    var off = Math.floor(Math.random() * (_ctx.sampleRate * 0.8));
    var src = _ctx.createBufferSource();
    src.buffer = _noiseBuf;
    var flt = _ctx.createBiquadFilter();
    flt.type = 'highpass'; flt.frequency.value = 9000;
    var g = _ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
    src.connect(flt); flt.connect(g); g.connect(_drums);
    src.start(t, off / _ctx.sampleRate, 0.04);
  }

  function _deepPulse(t, vol) {
    var osc = _ctx.createOscillator();
    var g   = _ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = 55;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.025);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    osc.connect(g); g.connect(_drums);
    osc.start(t); osc.stop(t + 0.6);
  }

  /* ── Melodic note ─────────────────────── */
  function _note(freq, t, dur, type, vol) {
    if (!_ctx || !freq || dur <= 0) return;
    var osc = _ctx.createOscillator();
    var g   = _ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    var att = 0.008;
    var rel = Math.min(0.055, dur * 0.12);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + att);
    g.gain.setValueAtTime(vol, Math.max(t + att + 0.001, t + dur - rel));
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g); g.connect(_master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  /* ── Schedule one full 8-bar loop ─────── */
  function _scheduleLoop(t0) {
    var song = SONGS[_currentSong];
    var BEAT = 60 / song.bpm;

    // Melody
    var t = t0;
    song.melody.forEach(function(ev) {
      var d = ev[1] * BEAT;
      _note(ev[0], t, d * song.melodyDuty, song.melodyType, song.melodyVol);
      t += d;
    });

    // Bass
    t = t0;
    song.bass.forEach(function(ev) {
      var d = ev[1] * BEAT;
      _note(ev[0], t, d * song.bassDuty, song.bassType, song.bassVol);
      t += d;
    });

    // Arpeggio (optional)
    if (song.arpBeat != null) {
      t = t0 + song.arpBeat * BEAT;
      var seq = song.arpSeq;
      for (var i = 0; i < song.arpCount; i++) {
        var d = song.arpDur * BEAT;
        _note(seq[i % seq.length], t, d * song.arpDuty, song.arpType, song.arpVol);
        t += d;
      }
    }

    // Drums
    song.drums.forEach(function(ev) {
      var t2 = t0 + ev.b * BEAT;
      if      (ev.f === 'K') _kick(t2, ev.v);
      else if (ev.f === 'S') _snare(t2, ev.v);
      else if (ev.f === 'H') _hihat(t2, ev.v);
      else if (ev.f === 'D') _deepPulse(t2, ev.v);
    });
  }

  /* ── Scheduler tick ───────────────────── */
  function _tick() {
    if (!Music.playing) return;
    var BEAT     = 60 / SONGS[_currentSong].bpm;
    var LOOP_DUR = 32 * BEAT;
    if (_ctx.currentTime + 1.5 >= _nextLoop) {
      _scheduleLoop(_nextLoop);
      _nextLoop += LOOP_DUR;
    }
    _timer = setTimeout(_tick, 300);
  }

  /* ── Public API ───────────────────────── */
  return {
    playing:     false,
    volume:      0.35,
    currentSong: 0,

    getSongs: function() {
      return SONGS.map(function(s) { return s.name; });
    },

    loadPrefs: function() {
      var v = parseFloat(localStorage.getItem('am_music_vol'));
      if (!isNaN(v)) Music.volume = Math.min(1, Math.max(0, v));
      var s = parseInt(localStorage.getItem('am_music_song'), 10);
      if (!isNaN(s) && s >= 0 && s < SONGS.length) {
        _currentSong = s;
        Music.currentSong = s;
      }
    },

    toggle: function() { Music.playing ? Music.stop() : Music.play(); },

    setSong: function(idx) {
      if (idx < 0 || idx >= SONGS.length || idx === _currentSong) return;
      _currentSong = idx;
      Music.currentSong = idx;
      localStorage.setItem('am_music_song', idx);
      if (Music.playing) { Music.stop(); Music.play(); }
      if (typeof RENDER !== 'undefined') RENDER.markDirty();
    },

    play: function() {
      if (Music.playing) return;
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();

        _comp = _ctx.createDynamicsCompressor();
        _comp.threshold.value = -18;
        _comp.knee.value      = 10;
        _comp.ratio.value     = 5;
        _comp.attack.value    = 0.003;
        _comp.release.value   = 0.12;
        _comp.connect(_ctx.destination);

        _master = _ctx.createGain();
        _master.gain.value = Music.volume;
        _master.connect(_comp);

        _drums = _ctx.createGain();
        _drums.gain.value = 0.72;
        _drums.connect(_comp);

        _makeNoise();

        var BEAT     = 60 / SONGS[_currentSong].bpm;
        var LOOP_DUR = 32 * BEAT;

        Music.playing = true;
        _nextLoop = _ctx.currentTime + 0.15;
        _scheduleLoop(_nextLoop);
        _nextLoop += LOOP_DUR;
        _timer = setTimeout(_tick, (LOOP_DUR - 1.5) * 1000);
      } catch(e) {
        console.warn('Web Audio unavailable:', e);
      }
    },

    stop: function() {
      Music.playing = false;
      clearTimeout(_timer);
      if (_ctx) {
        try { _ctx.close(); } catch(e) {}
        _ctx = null; _master = null; _drums = null; _comp = null; _noiseBuf = null;
      }
    },

    setVolume: function(v) {
      Music.volume = Math.min(1, Math.max(0, v));
      if (_master) _master.gain.value = Music.volume;
      localStorage.setItem('am_music_vol', Music.volume);
    }
  };

})();
