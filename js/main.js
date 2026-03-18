/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Entry Point
   ═══════════════════════════════════════════ */

(function() {

  /* ── INTRO SEQUENCE ────────────────────── */
  function showIntro() {
    var el = document.getElementById('intro-screen');
    if (!el) return;

    el.innerHTML =
      '<pre class="intro-title">' + DATA.ASCII.title + '</pre>' +
      '<div class="intro-subtitle">── E C H O E S &nbsp; O F &nbsp; T H E &nbsp; F I R S T &nbsp; A G E ──</div>' +
      '<div class="intro-divider">════════════════════════════════════════════════</div>' +
      '<div class="intro-body">' +
        '<p>The relic surfaces from the earth at dawn.</p>' +
        '<p>Nobody else comes to look at it.</p>' +
        '<p>You do.</p>' +
      '</div>' +
      '<div class="intro-prompt">' +
        '<label>WHO ARE YOU, WANDERER?</label>' +
        '<input type="text" class="game-input" id="hero-name-input" maxlength="20" placeholder="Enter your name..." autocomplete="off">' +
        '<button class="intro-begin" onclick="beginGame()">[ BEGIN ]</button>' +
      '</div>';

    // Allow Enter key to begin
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

  /* ── START GAME (after naming) ─────────── */
  window.beginGame = function() {
    var input = document.getElementById('hero-name-input');
    var name  = input ? input.value.trim() : '';
    if (!name) name = 'Archivist';

    G.heroName = name;
    G.flags.introComplete = true;

    // Hide intro, show game
    document.getElementById('intro-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');

    // Initial log
    addLog('The Archive is established. Welcome, ' + name + '.', 'log-important');
    addLog('Mana flows from the ley line. The work begins.', '');

    // Unlock first lore immediately
    Engine.checkLoreUnlocks();

    // Start engine
    Engine.start();
    RENDER.render();
  };

  /* ── INIT ──────────────────────────────── */
  function init() {
    Settings.init();
    Music.loadPrefs();
    var saved = loadGame();

    if (saved && G.flags.introComplete) {
      // Resume saved game
      document.getElementById('intro-screen').classList.add('hidden');
      document.getElementById('game-container').classList.remove('hidden');

      Engine.start();
      RENDER.render();

      // Notify of offline progress
      setTimeout(function() {
        var logs = G.gameLog.filter(function(l) { return l.msg.indexOf('Offline') !== -1; });
        if (logs.length) showNotification(logs[0].msg, 'notif-loot');
      }, 500);

    } else {
      // Fresh game — show intro
      showIntro();
    }
  }

  /* ── KEYBOARD SHORTCUTS ────────────────── */
  document.addEventListener('keydown', function(e) {
    if (!G.flags.introComplete) return;
    switch(e.key) {
      case '1': setScreen('archive');  break;
      case '2': if (G.flags.mapVisible)     setScreen('map');      break;
      case '3': if (G.flags.loreVisible)    setScreen('lore');     break;
      case '4': if (G.flags.heroVisible)    setScreen('hero');     break;
      case '5': if (G.flags.prestigeVisible) setScreen('prestige'); break;
    }
  });

  /* ── START ─────────────────────────────── */
  init();

})();
