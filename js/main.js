/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Entry Point
   ═══════════════════════════════════════════ */

(function() {

  var prologueBeat = -1;

  /* ── PROLOGUE: three days before the relic ── */
  function showIntro() {
    var el = document.getElementById('intro-screen');
    if (!el) return;
    prologueBeat = -1;
    renderBeat();
  }

  function renderBeat() {
    var el = document.getElementById('intro-screen');
    var beats = DATA.prologue;
    var html = '<pre class="intro-title">' + DATA.ASCII.title + '</pre>' +
      '<div class="intro-subtitle">── E C H O E S &nbsp; O F &nbsp; T H E &nbsp; F I R S T &nbsp; A G E ──</div>' +
      '<div class="intro-divider">════════════════════════════════════════════════</div>';

    if (prologueBeat < 0) {
      html += '<div class="intro-body prologue-fade">' +
        '<p class="text-dim" style="letter-spacing:2px;font-size:0.8rem;">FIELD NOTES — BEFORE DAY ONE</p>' +
        '<p>The valley sits where three ley lines meet.</p>' +
        '<p>It is on no official chart.</p>' +
        '</div>' +
        '<div class="intro-prompt prologue-fade"><button class="intro-begin" onclick="prologueNext()">[ BEGIN THE SURVEY ]</button>' +
        '<div class="text-dim" style="font-size:0.76rem;margin-top:10px;">or <a href="#" onclick="prologueSkip();return false;" style="color:var(--dim);">skip to the relic</a></div></div>';
    } else if (prologueBeat < beats.length) {
      var b = beats[prologueBeat];
      html += '<pre class="ascii-art prologue-art ' + (b.color || 'text-dim') + ' prologue-fade">' + b.ascii + '</pre>';
      html += '<div class="intro-body prologue-fade">';
      b.text.forEach(function(p) { html += '<p>' + p + '</p>'; });
      html += '</div>';
      html += '<div class="intro-prompt prologue-fade"><button class="intro-begin" onclick="prologueNext()">[ ' + (b.next || 'CONTINUE') + ' ]</button></div>';
    } else {
      html += '<div class="intro-body prologue-fade">' +
        '<p>The relic surfaces from the earth at dawn.</p>' +
        '<p>Nobody else comes to look at it.</p>' +
        '<p>You do.</p>' +
        '</div>' +
        '<div class="intro-prompt prologue-fade">' +
          '<label>WHO ARE YOU, WANDERER?</label>' +
          '<input type="text" class="game-input" id="hero-name-input" maxlength="20" placeholder="Enter your name..." autocomplete="off">' +
          '<button class="intro-begin" onclick="beginGame()">[ BEGIN ]</button>' +
        '</div>';
    }
    el.innerHTML = html;
    if (prologueBeat < 0) animateTitle(el.querySelector('.intro-title'));

    setTimeout(function() {
      var input = document.getElementById('hero-name-input');
      if (input) {
        input.focus();
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') beginGame();
        });
      }
    }, 100);
  }

  /* The title surfaces from the earth: noise resolving into letters, bottom row first */
  function animateTitle(pre) {
    if (!pre || reducedMotion()) return;
    var rows = pre.textContent.split('\n');
    var glyphs = '▒░▓·';
    var frames = 34, f = 0;
    var timer = setInterval(function() {
      f++;
      var out = rows.map(function(row, r) {
        var rowStart = (rows.length - 1 - r) * 4;
        var chars = row.split('');
        for (var c = 0; c < chars.length; c++) {
          if (chars[c] === ' ') continue;
          var jitter = (c * 7 + r * 13) % 6;
          if (f < rowStart + jitter) chars[c] = glyphs[(c + f + r) % glyphs.length];
        }
        return chars.join('');
      });
      pre.textContent = out.join('\n');
      if (f >= frames) { clearInterval(timer); pre.textContent = rows.join('\n'); }
    }, 60);
  }

  window.prologueNext = function() { prologueBeat++; renderBeat(); };
  window.prologueSkip = function() { prologueBeat = DATA.prologue.length; renderBeat(); };

  /* ── START GAME (after naming) ─────────── */
  window.beginGame = function() {
    var input = document.getElementById('hero-name-input');
    var name  = heroNameSafe(input ? input.value : '');
    if (!name) name = 'Archivist';

    G.heroName = name;
    G.flags.introComplete = true;

    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');

    addLog('You set your notebooks on a cleared stone and name the place: the Archive.', 'log-important');
    addLog('The relic pulses once. Mana moves in the ley line beneath you, slow and steady.', '');

    Engine.checkLoreUnlocks();
    Engine.start();
    RENDER.render();
  };

  /* ── INIT ──────────────────────────────── */
  function init() {
    Settings.init();
    Mixer.load();
    Music.loadPrefs();
    /* Browsers gate audio behind a gesture; the first click or key opens it. Ambient pauses when the tab is hidden. */
    var unlock = function() { Sounds.unlock(); };
    document.addEventListener('click', unlock, { passive: true });
    document.addEventListener('keydown', unlock, { passive: true });
    document.addEventListener('visibilitychange', function() { Ambient.pause(document.hidden); });
    var saved = loadGame();

    if (saved && G.flags.introComplete) {
      document.getElementById('intro-screen').classList.add('hidden');
      document.getElementById('game-container').classList.remove('hidden');

      Engine.start();
      RENDER.render();

      setTimeout(function() {
        var logs = G.gameLog.filter(function(l) { return l.msg.indexOf('You were away') !== -1; });
        if (logs.length) showNotification(logs[0].msg, 'notif-loot', 6000);
      }, 500);

    } else {
      showIntro();
    }
  }

  /* ── KEYBOARD SHORTCUTS ────────────────── */
  document.addEventListener('keydown', function(e) {
    if (!G.flags.introComplete) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (G.awakening || G.ending) return;
    switch(e.key) {
      case '1': setScreen('archive');  break;
      case '2': if (G.flags.mapVisible)      setScreen('map');      break;
      case '3': if (G.flags.loreVisible)     setScreen('lore');     break;
      case '4': if (G.flags.heroVisible)     setScreen('hero');     break;
      case '5': if (G.flags.prestigeVisible) setScreen('prestige'); break;
      case '6': if (G.flags.codexVisible)    setScreen('codex');    break;
      case '7': if (G.flags.relicsVisible)   setScreen('relics');   break;
    }
  });

  init();

})();
