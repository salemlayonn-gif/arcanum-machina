/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Savegame files
   The browser keeps its own copy in localStorage. This writes a real file
   to a folder you choose, and remembers it so later saves are one click.
   ═══════════════════════════════════════════ */

var Saves = (function() {
  var SAVE_KEY = 'arcanum_machina_save';
  var _handle = null;          // FileSystemFileHandle for the current savegame
  var _handleName = '';

  /* ── the handle store (IndexedDB, so it survives a restart) ── */
  function idb(mode, fn) {
    return new Promise(function(resolve, reject) {
      if (!window.indexedDB) return reject(new Error('no indexedDB'));
      var open = indexedDB.open('arcanum-machina', 1);
      open.onupgradeneeded = function() { open.result.createObjectStore('handles'); };
      open.onerror = function() { reject(open.error); };
      open.onsuccess = function() {
        var db = open.result;
        var tx = db.transaction('handles', mode);
        var req = fn(tx.objectStore('handles'));
        tx.oncomplete = function() { db.close(); resolve(req && req.result); };
        tx.onerror = function() { db.close(); reject(tx.error); };
      };
    });
  }

  function rememberHandle(h) {
    _handle = h; _handleName = h ? h.name : '';
    idb('readwrite', function(store) { return store.put(h, 'savefile'); }).catch(function() {});
  }

  function fileName() {
    var who = (G.heroName || 'archivist').replace(/[^\w-]+/g, '_').toLowerCase();
    return 'arcanum-machina-' + who + '.save.json';
  }

  function currentSaveText() {
    saveGame();
    var raw = localStorage.getItem(SAVE_KEY) || '{}';
    try { return JSON.stringify(JSON.parse(raw), null, 2); } catch(e) { return raw; }
  }

  /* Accepts our pretty JSON, a raw save object, or the old base64 code */
  function applySaveText(text) {
    text = String(text || '').trim();
    var data = null;
    try { data = JSON.parse(text); } catch(e) {
      try { data = JSON.parse(decodeURIComponent(escape(atob(text)))); } catch(e2) { data = null; }
    }
    if (!data || !data.version) return false;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  }

  function download(text, name) {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 2000);
  }

  function pickFileFallback(onText) {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,.save,application/json,text/plain';
    input.addEventListener('change', function() {
      var f = input.files && input.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function() { onText(String(r.result), f.name); };
      r.readAsText(f);
    });
    input.click();
  }

  return {
    supported: function() { return typeof window !== 'undefined' && !!window.showSaveFilePicker; },
    handleName: function() { return _handleName; },

    /* Called at startup: pick the remembered savegame file back up */
    restoreHandle: function() {
      if (!Saves.supported()) return;
      idb('readonly', function(store) { return store.get('savefile'); }).then(function(h) {
        if (h && h.name) { _handle = h; _handleName = h.name; if (typeof RENDER !== 'undefined') RENDER.markDirty(); }
      }).catch(function() {});
    },

    /* Write to the remembered file when we have one, otherwise ask where to put it */
    write: function(forcePicker) {
      var text = currentSaveText();
      if (!Saves.supported()) {
        download(text, fileName());
        showNotification('Save written to your downloads.', 'notif-loot');
        return;
      }
      var chain;
      if (_handle && !forcePicker) {
        chain = _handle.queryPermission({ mode: 'readwrite' }).then(function(p) {
          return p === 'granted' ? _handle : _handle.requestPermission({ mode: 'readwrite' }).then(function(p2) {
            if (p2 !== 'granted') throw new Error('permission');
            return _handle;
          });
        });
      } else {
        chain = window.showSaveFilePicker({
          suggestedName: fileName(),
          types: [{ description: 'Arcanum Machina savegame', accept: { 'application/json': ['.json'] } }]
        }).then(function(h) { rememberHandle(h); return h; });
      }
      chain.then(function(h) {
        return h.createWritable().then(function(w) {
          return w.write(text).then(function() { return w.close(); });
        }).then(function() {
          showNotification('Saved to ' + h.name, 'notif-loot');
          if (typeof RENDER !== 'undefined') RENDER.markDirty();
        });
      }).catch(function(err) {
        if (err && err.name === 'AbortError') return;
        download(text, fileName());
        showNotification('Save written to your downloads.', 'notif-loot');
      });
    },

    read: function() {
      function finish(text, name) {
        if (applySaveText(text)) {
          showNotification('Loading ' + (name || 'savegame') + '…', 'notif-loot');
          setTimeout(function() { location.reload(); }, 400);
        } else {
          showNotification('That file is not a savegame.', 'notif-lore');
        }
      }
      if (!Saves.supported()) { pickFileFallback(finish); return; }
      window.showOpenFilePicker({
        types: [{ description: 'Arcanum Machina savegame', accept: { 'application/json': ['.json', '.save'] } }],
        multiple: false
      }).then(function(handles) {
        var h = handles[0];
        rememberHandle(h);
        return h.getFile().then(function(f) { return f.text().then(function(t) { finish(t, f.name); }); });
      }).catch(function(err) {
        if (err && err.name === 'AbortError') return;
        pickFileFallback(finish);
      });
    },

    forget: function() {
      _handle = null; _handleName = '';
      idb('readwrite', function(store) { return store.delete('savefile'); }).catch(function() {});
      if (typeof RENDER !== 'undefined') RENDER.markDirty();
    }
  };
})();
