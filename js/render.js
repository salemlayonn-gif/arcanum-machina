/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Render System
   ═══════════════════════════════════════════ */

var RENDER = {

  _dirty: false,

  // Call after any action that should immediately update the screen.
  markDirty: function() { RENDER._dirty = true; },

  render: function() {
    RENDER.renderHeader();
    RENDER.renderNav();
    RENDER.renderContent();
    RENDER.renderLog();
  },

  /* ── DOM HELPER ──────────────────────── */
  setHtml: function(el, html) {
    if (el.innerHTML !== html) el.innerHTML = html;
  },

  /* ── HEADER ──────────────────────────── */
  renderHeader: function() {
    var el = document.getElementById('header');
    if (!el) return;

    var days  = Math.floor(G.playTime / 86400);
    var hours = Math.floor((G.playTime % 86400) / 3600);
    var mins  = Math.floor((G.playTime % 3600) / 60);
    var timeStr = (days > 0 ? days + 'd ' : '') + hours + 'h ' + mins + 'm';

    var resList = [
      { id: 'mana',        sym: '~', cls: 'res-mana',   label: 'Mana',   rate: getManaPerSec() },
      { id: 'scrap',       sym: '#', cls: 'res-scrap',  label: 'Scrap',  rate: getScrapPerSec() },
      { id: 'arcaneCore',  sym: '*', cls: 'res-core',   label: 'Cores',  rate: 0 },
      { id: 'memoryShard', sym: '+', cls: 'res-shard',  label: 'Shards', rate: getMemoryPerSec() },
      { id: 'etherCell',   sym: 'o', cls: 'res-ether',  label: 'Ether',  rate: 0 },
      { id: 'resonance',   sym: '§', cls: 'res-res',    label: 'Resonance', rate: 0 }
    ];

    var resHtml = resList.map(function(r) {
      var amt  = G.res[r.id] || 0;
      var cap  = G.resCap[r.id];
      var show = amt > 0 || r.id === 'mana' || r.id === 'scrap';
      if (!show && r.id === 'resonance' && G.prestige.resonance <= 0) return '';
      if (!show && r.id !== 'mana' && r.id !== 'scrap') return '';

      var capStr = cap === Infinity ? '' : ' / ' + fmt(cap);
      var rateStr = r.rate > 0 ? ' <span class="res-rate">(+' + fmtDec(r.rate) + '/s)</span>' : '';

      return '<span class="res-entry"><span class="' + r.cls + '">' + r.sym + '</span>' +
             '<span class="res-label">' + r.label + ':</span>' +
             '<span class="res-amount">' + fmtDec(amt) + capStr + '</span>' +
             rateStr + '</span>';
    }).filter(Boolean).join('');

    RENDER.setHtml(el,
      '<div class="header-top">' +
        '<span class="game-title">ARCANUM MACHINA</span>' +
        '<span class="header-info">' + G.heroName + ' · Lv.' + G.hero.level + ' · ' + timeStr + '</span>' +
      '</div>' +
      '<div class="resource-bar">' + resHtml + '</div>');
  },

  /* ── NAV ─────────────────────────────── */
  renderNav: function() {
    var el = document.getElementById('nav');
    if (!el) return;

    var tabs = [
      { id: 'archive', label: '[ARCHIVE]',  always: true },
      { id: 'map',     label: '[MAP]',      show: G.flags.mapVisible },
      { id: 'lore',    label: G.loreNew.length > 0 ? '[LORE ◆]' : '[LORE]', show: G.flags.loreVisible, notify: G.loreNew.length > 0 },
      { id: 'hero',    label: '[HERO]',     show: G.flags.heroVisible },
      { id: 'prestige',label: '[AWAKENING]',show: G.flags.prestigeVisible },
      { id: 'codex',   label: G.annotationsNew.length > 0 ? '[CODEX ◆]' : '[CODEX]', show: G.flags.codexVisible, notify: G.annotationsNew.length > 0 },
      { id: 'relics',  label: '[RELICS]',   show: G.flags.relicsVisible },
      { id: 'library', label: G.libraryNew.length > 0 ? '[LIBRARY ◆]' : '[LIBRARY]', show: G.flags.libraryVisible, notify: G.libraryNew.length > 0 },
      { id: 'config',  label: '[CONFIG]',   always: true }
    ];

    var tabHtml = tabs.filter(function(t) { return t.always || t.show; }).map(function(t) {
      var active = G.ui.screen === t.id ? ' active' : '';
      var notify = t.notify ? ' notify' : '';
      return '<button class="nav-btn' + active + notify + '" onclick="setScreen(\'' + t.id + '\')">' + t.label + '</button>';
    }).join('');

    // Right-side: save button
    var secAgo = G.lastSave ? Math.floor((Date.now() - G.lastSave) / 1000) : null;
    var saveLabel = secAgo === null ? '' : (secAgo < 5 ? ' ✓' : ' ' + secAgo + 's ago');
    tabHtml += '<span style="margin-left:auto;">';
    tabHtml += '<button class="nav-btn" style="color:var(--dim);" onclick="manualSave()">[SAVE' + saveLabel + ']</button>';
    tabHtml += '</span>';

    RENDER.setHtml(el, tabHtml);
  },

  /* ── CONTENT ROUTER ──────────────────── */
  renderContent: function() {
    var el = document.getElementById('content');
    if (!el) return;

    // Skip re-render while the user is hovering an *enabled* button —
    // unless markDirty() was called (a game action just fired).
    if (!RENDER._dirty) {
      var hovered = el.querySelector('button:hover');
      var focused = document.activeElement && document.activeElement !== document.body && el.contains(document.activeElement);
      if ((hovered && !hovered.disabled) || focused) return;
    }
    RENDER._dirty = false;

    // Preserve combat log scroll position across re-renders.
    var combatLog = el.querySelector('.combat-log');
    var savedScroll = combatLog ? combatLog.scrollTop : 0;

    var html;
    if (G.ending)         html = RENDER.screenEnding();
    else if (G.awakening) html = RENDER.screenAwakening();
    else if (G.scene)     html = RENDER.screenScene();
    else switch (G.ui.screen) {
      case 'archive':  html = RENDER.screenArchive();  break;
      case 'map':      html = RENDER.screenMap();      break;
      case 'lore':     html = RENDER.screenLore();     break;
      case 'hero':     html = RENDER.screenHero();     break;
      case 'prestige': html = RENDER.screenPrestige(); break;
      case 'codex':    html = RENDER.screenCodex();    break;
      case 'relics':   html = RENDER.screenRelics();   break;
      case 'library':  html = RENDER.screenLibrary();  break;
      case 'config':   html = RENDER.screenConfig();   break;
      default:         html = RENDER.screenArchive();  break;
    }
    RENDER.setHtml(el, html);

    // Restore combat log scroll after DOM replacement.
    if (savedScroll > 0) {
      var newCombatLog = el.querySelector('.combat-log');
      if (newCombatLog) newCombatLog.scrollTop = savedScroll;
    }
  },

  /* ── ARCHIVE SCREEN ──────────────────── */
  screenArchive: function() {
    var html = '';

    // The notebook page for the time you were away
    if (G.awayReport) html += RENDER.awayPanel(G.awayReport);

    // The Archive itself, and a line of the field notes
    html += '<div class="section">';
    html += RENDER.archivePanel({});
    html += '<div class="section-flavor">' + RENDER.getStatusFlavor() + '</div>';
    html += '</div>';

    // Search the ruins by hand (until the Scout Post gives you roads)
    if ((G.buildings.scoutPost || 0) < 1) {
      html += RENDER.renderScavenge();
    }

    // The sealed cabinet in the side chamber
    if (G.cabinet && G.cabinet.noticed && !G.cabinet.opened) {
      html += RENDER.renderCabinet();
    }

    // Buildings
    html += RENDER.renderBuildings();

    // Crafting
    if (G.flags.craftingVisible) {
      html += RENDER.renderCrafting();
    }

    // A visitor on the road (once the Scout Post has read a few roads; before the Scholar)
    var visitor = RENDER.currentVisitor();
    if (visitor) {
      html += '<div class="section">';
      html += '<div class="section-header">── A VISITOR ───────────────────────────────────</div>';
      html += '<div style="display:flex;align-items:flex-start;gap:16px;padding:8px 0;">';
      html += '<pre class="ascii-art text-tech" style="margin:0;flex-shrink:0;">' + escapeHtml(visitor.ascii) + '</pre>';
      html += '<div>';
      html += '<div class="text-dim" style="font-size:0.79rem;margin-bottom:6px;">' + escapeHtml(visitor.who) + ' has come up the valley road.</div>';
      html += '<div style="font-size:0.86rem;line-height:1.6;">' + escapeHtml(visitor.text) + '</div>';
      html += '</div></div>';
      html += '</div>';
    }

    // Architect Ghost NPC (prestige 2+)
    if (G.prestige.count >= 2) {
      var ghostIdx = Math.floor(G.playTime / 300) % DATA.ghostDialogue.length;
      var ghostEntry = DATA.ghostDialogue[ghostIdx];
      html += '<div class="section">';
      html += '<div class="section-header">── ARCHITECT ECHO ──────────────────────────────</div>';
      html += '<div style="display:flex;align-items:flex-start;gap:16px;padding:8px 0;">';
      html += '<pre class="ascii-art text-dim" style="margin:0;flex-shrink:0;"> &#x2248;&#x2248;&#x2248; \n[ &#x224B; ]\n &#x2248;&#x2248;&#x2248; \n   |   </pre>';
      html += '<div>';
      html += '<div class="text-dim" style="font-size:0.79rem;margin-bottom:6px;font-style:italic;">A resonance echo lingers near the relic.</div>';
      var ghostCls = ghostEntry.type === 'warning' ? 'text-red' : (ghostEntry.type === 'wisdom' ? 'text-arcane' : 'text-memory');
      html += '<div class="' + ghostCls + '" style="font-style:italic;font-size:0.86rem;line-height:1.6;">' + escapeHtml(ghostEntry.text) + '</div>';
      html += '</div></div>';
      html += '</div>';
    }

    // Church Scholar NPC (prestige 3+)
    if (G.prestige.count >= 3) {
      var scholarIdx = Math.floor(G.playTime / 420) % DATA.scholarDialogue.length;
      var scholarEntry = DATA.scholarDialogue[scholarIdx];
      html += '<div class="section">';
      html += '<div class="section-header">── CHURCH SCHOLAR ──────────────────────────────</div>';
      html += '<div style="display:flex;align-items:flex-start;gap:16px;padding:8px 0;">';
      html += '<pre class="ascii-art text-dim" style="margin:0;flex-shrink:0;">  o  \n /|\\ \n / \\ \n[&#x2020;&#x2020;]</pre>';
      html += '<div>';
      html += '<div class="text-dim" style="font-size:0.79rem;margin-bottom:6px;">A Church scholar has taken up residence near the Archive.</div>';
      html += '<div class="text-tech" style="font-size:0.86rem;line-height:1.6;">' + escapeHtml(scholarEntry.text) + '</div>';
      html += '</div></div>';
      html += '</div>';
    }

    return html;
  },

  /* While you were away — a page of the notebook, in Salem's voice */
  awayPanel: function(r) {
    var lines = [];
    lines.push('You were gone ' + formatTimeProse(r.seconds) + '.');
    var flow = 'The lines kept flowing: +' + fmt(r.mana) + ' mana, +' + fmt(r.scrap) + ' scrap.';
    if (r.filledIn > 0 && r.filledIn < r.seconds) flow += ' The capacitors were full after ' + formatTimeProse(r.filledIn) + '. The rest went back into the ground.';
    lines.push(flow);
    if (r.decodedSegments > 0) {
      var parts = Object.keys(r.decodedEntries).map(function(t) { return '"' + t + '"' + (r.decodedEntries[t] > 1 ? ' ×' + r.decodedEntries[t] : ''); });
      lines.push('The Terminal decoded ' + r.decodedSegments + ' segment' + (r.decodedSegments === 1 ? '' : 's') + ': ' + parts.join(', ') + '.');
    } else if (r.shardsWaiting > 0 && !r.hasTerminal) {
      lines.push('The shards waited on the shelf. There is still no Terminal to read them.');
    } else if (r.hasTerminal) {
      lines.push('The Terminal was quiet. Nothing on it to read.');
    }
    if (r.visitors.length) {
      r.visitors.forEach(function(v) { lines.push(v.charAt(0).toUpperCase() + v.slice(1) + ' came up the road, waited a while, and left.'); });
    } else if ((G.buildings.scoutPost || 0) >= 1) {
      lines.push('Nobody came up the road.');
    }
    if (r.pulses > 0) lines.push('The relic pulsed ' + (r.pulses === 1 ? 'once' : r.pulses === 2 ? 'twice' : r.pulses + ' times') + '. Nobody saw it.');
    var html = '<div class="section away-panel">';
    html += '<div class="section-header">── WHILE YOU WERE AWAY ─────────────────────────</div>';
    lines.forEach(function(l) { html += '<div class="away-line">' + escapeHtml(l) + '</div>'; });
    html += '<div style="margin-top:10px;"><button class="btn btn-small" onclick="G.awayReport=null;RENDER.markDirty();">[ CLOSE THE NOTEBOOK ]</button></div>';
    html += '</div>';
    return html;
  },

  /* The hero figure with whatever is equipped drawn beside it */
  heroFigure: function() {
    var body = ['   O   ', '  /|\\  ', '  / \\  ', ' [===] '];
    var eq = G.hero.equipment;
    var slots = ['accessory', 'weapon', 'armor'];
    var out = '';
    for (var i = 0; i < 4; i++) {
      var line = '<span class="hero-art">' + body[i] + '</span>';
      if (i < 3) {
        var id = eq[slots[i]];
        line += '  ' + (id && DATA.equipment[id]
          ? '<span class="text-tech">' + escapeHtml(DATA.equipment[id].ascii.trim()) + '</span>'
          : '<span class="text-dim" style="opacity:.5">· · ·</span>');
      }
      out += line + (i < 3 ? '\n' : '');
    }
    return '<pre class="ascii-art">' + out + '</pre>';
  },

  /* Visitors come in six-minute windows: two windows present, one window the road is quiet. Never at night. */
  currentVisitor: function() {
    if ((G.buildings.scoutPost || 0) < 1 || G.stats.exploreRuns < 3) return null;
    if (G.flags.ended || isNight()) return null;
    var win = Math.floor(G.playTime / 360);
    if (win % 3 === 2) return null;
    var list = DATA.travellers;
    return list[Math.floor(win / 3) % list.length];
  },

  getStatusFlavor: function() {
    if (G.flags.ended) return 'The valley is full of students. The Terminal still displays messages, sometimes. They are always worth reading.';
    if (isNight() && G.prestige.count < 4 && (G.buildings.manaConduit || 0) >= 1 && !(G.buildings.resonanceBeacon || 0) && Math.floor(G.playTime / 120) % 2 === 0) {
      return 'Night. The channel light in the walls is the only light in the valley. It has begun to feel, for an hour at a time, like company.';
    }
    if (G.prestige.count >= 5) return 'Every pulse gives it more of itself back. You are not only rebuilding the Archive. You are rebuilding the mind that designed it.';
    if (G.prestige.count >= 4) return 'You were never alone in this. Not for a single day.';
    if (G.prestige.count >= 3) return 'Every mage in Aethoria has been using a tool they do not understand. So were you.';
    if (G.prestige.count >= 2) return 'She cried for two hours. Then she voted yes. You are working in a world that exists because of that.';
    if (G.prestige.count >= 1) return 'The relic pulsed when you touched it. It knew you were coming. You know that now.';
    if ((G.buildings.resonanceBeacon || 0) >= 1) return 'The Beacon hums in the main hall. Everything you have built points at it. You know what it will cost.';
    if ((G.buildings.golemForge || 0) >= 1) return 'In the lower level, the assembly line runs a self-check every hour. It has not been asked to build anything yet.';
    if ((G.buildings.memoryTerminal || 0) >= 1) return 'The Terminal reads a shard one layer at a time. It is slow. It is slower than you would like. It is the only way.';
    if ((G.buildings.ancientWorkshop || 0) >= 1) return '"It hummed when I touched it. Like it remembered." — field notes, month six';
    if ((G.buildings.scoutPost || 0) >= 1) return 'The Scout Post reads the roads under the moss. Something out there still carries current.';
    if ((G.buildings.runicWorkbench || 0) >= 1) return 'You argued with the workbench for two days. The workbench was right.';
    if ((G.buildings.manaConduit || 0) >= 3) return 'Lines of pale light in the walls that have not been visible in darkness for a thousand years. You sit on the floor and look at them.';
    if ((G.buildings.manaConduit || 0) >= 1) return 'The ley current is stable. Measurable. The conduit works the way the schematics promised. The old ones were not liars.';
    return 'The relic sits on a cleared stone in the side chamber. It has not pulsed again. It does not need to. The air smells of old metal and lightning.';
  },

  renderCabinet: function() {
    var c = G.cabinet, now = Date.now();
    var rest = cabinetRestLeft(now);
    var full = G.res.mana >= G.resCap.mana * 0.9;
    var gauge = '';
    for (var i = 0; i < 4; i++) gauge += (i < c.steps ? '■' : '□');
    var state, disabled = false;
    if (rest > 0) { state = 'The contact needs to rest. ' + (rest > 3600000 ? Math.ceil(rest / 3600000) + ' hours' : 'less than an hour') + '.'; disabled = true; }
    else if (!full) { state = 'It wants everything the capacitors hold. ' + fmt(G.res.mana) + ' / ' + fmt(G.resCap.mana) + '.'; disabled = true; }
    else state = 'The capacitors are full. Day ' + (c.steps + 1) + '.';
    var art = c.steps === 0
      ? ' ╔════════╗\n ║ ▒▒ ▒▒  ║\n ║ ▒▒ ▒▒  ║\n ╚═══[⊙]══╝'
      : ' ╔════════╗\n ║ ▒▒ ▒▒  ║\n ║ ▒▒ ▒▒  ║\n ╚═══[' + (c.steps >= 3 ? '◉' : '⊙') + ']══╝';
    return '<div class="section">' +
      '<div class="section-header">── THE SEALED CABINET ──────────────────────────</div>' +
      '<div style="display:flex;align-items:flex-start;gap:16px;padding:8px 0;">' +
        '<pre class="ascii-art text-tech" style="margin:0;flex-shrink:0;">' + art + '</pre>' +
        '<div style="flex:1;">' +
          '<div class="bld-desc" style="margin-bottom:6px;">Side chamber. Pale alloy. No lock, no hinge you can find. The release wants a sustained, directed output of ley current through the contact point — and, it seems, wants it more than once.</div>' +
          '<div style="font-size:0.86rem;margin-bottom:6px;"><span class="text-dim">Days:</span> <span class="text-tech" style="letter-spacing:3px;">' + gauge + '</span> <span class="text-dim">· ' + state + '</span></div>' +
          '<button class="btn btn-tech"' + (disabled ? ' disabled' : '') + ' onclick="pushCabinet()">[PUSH CURRENT INTO THE CONTACT]</button>' +
        '</div>' +
      '</div></div>';
  },

  renderScavenge: function() {
    var now = Date.now();
    var onCooldown = now < G.scavenge.cooldownUntil;
    var timeLeft = onCooldown ? Math.ceil((G.scavenge.cooldownUntil - now) / 1000) : 0;
    var label = onCooldown ? '[WORKING... ' + timeLeft + 's]' : '[SEARCH THE RUINS]';

    return '<div class="section">' +
      '<div class="section-header">── BY HAND ─────────────────────────────────────</div>' +
      '<div class="building-row">' +
        '<div class="bld-left">' +
          '<div class="bld-name">Search the Ruins</div>' +
          '<div class="bld-desc">Work the debris in the lower level by hand. 1–3 scrap. <span class="text-dim">(30s)</span></div>' +
        '</div>' +
        '<button class="btn btn-tech"' + (onCooldown ? ' disabled' : '') + ' onclick="doScavenge()">' + label + '</button>' +
      '</div>' +
    '</div>';
  },

  renderBuildings: function() {
    var hideMaxed = G.ui.hideMaxedBuildings;
    var toggleLabel = hideMaxed ? '[SHOW MAXED]' : '[HIDE MAXED]';
    var html = '<div class="section">' +
      '<div class="section-header" style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span>── CONSTRUCTIONS ──────────────────────────────</span>' +
        '<button class="btn btn-small" onclick="toggleHideMaxed()">' + toggleLabel + '</button>' +
      '</div>';
    var any = false;

    DATA.buildingOrder.forEach(function(id) {
      var bld = DATA.buildings[id];
      if (!bld) return;
      if (!bld.unlockCondition(G)) return;

      var count = G.buildings[id] || 0;
      var maxed = bld.max && count >= bld.max;

      if (hideMaxed && maxed) return;

      any = true;
      var cost    = getBuildingCost(id, count);
      var afford  = canAfford(cost);
      var costStr = maxed ? '<span class="text-dim">BUILT</span>' : RENDER.costStr(cost);
      var btnClass = afford && !maxed ? 'btn btn-mana' : 'btn';
      var btnLabel = maxed ? 'MAX' : 'BUILD';
      var btnDisabled = (!afford || maxed) ? ' disabled' : '';
      var eta = (!afford && !maxed) ? RENDER.timeToAfford(cost) : '';

      html += '<div class="building-row">' +
        '<div class="bld-left">' +
          '<div class="bld-name">' + bld.name + (count > 0 && !maxed ? ' <span class="text-dim">×' + count + '</span>' : '') + (maxed && bld.max === 1 ? ' <span class="text-green">✓</span>' : '') + '</div>' +
          '<div class="bld-desc">' + bld.desc + '</div>' +
        '</div>' +
        '<div class="bld-cost">' + costStr + (eta ? '<div class="text-dim" style="font-size:0.76rem;margin-top:2px;">' + eta + '</div>' : '') + '</div>' +
        '<button class="' + btnClass + '"' + btnDisabled + ' onclick="buyBuilding(\'' + id + '\')">' + btnLabel + '</button>' +
      '</div>';
    });

    if (!any) {
      var msg = hideMaxed
        ? '<span class="text-dim">All constructions complete.</span> <button class="btn btn-small" onclick="toggleHideMaxed()">[SHOW ALL]</button>'
        : 'Nothing else is ready to be built yet. The current keeps flowing.';
      html += '<div class="text-dim" style="padding:8px;">' + msg + '</div>';
    }

    html += '</div>';
    return html;
  },

  renderCrafting: function() {
    var html = '<div class="section"><div class="section-header">── CRAFTING ────────────────────────────────────</div>';

    // Recipes
    var anyRecipe = false;
    DATA.recipeOrder.forEach(function(id) {
      var recipe = DATA.recipes[id];
      if (!recipe || !recipe.unlockCondition(G)) return;
      anyRecipe = true;

      var afford   = canAfford(recipe.cost);
      var freeSlot = Crafting.getFreeSlot();
      var atCap = recipe.output.resource &&
        G.resCap[recipe.output.resource] !== undefined &&
        G.resCap[recipe.output.resource] !== Infinity &&
        (G.res[recipe.output.resource] || 0) >= G.resCap[recipe.output.resource];
      var canStart = afford && freeSlot !== null && !atCap;
      var btnClass = canStart ? 'btn btn-arcane' : 'btn';
      var timeStr  = formatTime(getCraftTime(recipe) / 1000);
      var outputStr = recipe.output.resource ?
        recipe.output.amount + '× ' + recipe.output.resource :
        (DATA.equipment[recipe.output.equipment] ? DATA.equipment[recipe.output.equipment].name : '?');

      // Don't show if already have this equipment equipped or in inventory
      if (recipe.output.equipment) {
        var eqId = recipe.output.equipment;
        var isConsumable = DATA.equipment[eqId] && DATA.equipment[eqId].slot === 'consumable';
        if (!isConsumable) {
          var owned = G.inventory.indexOf(eqId) !== -1 ||
                      G.hero.equipment.weapon === eqId ||
                      G.hero.equipment.armor  === eqId ||
                      G.hero.equipment.accessory === eqId;
          if (owned) return;
        }
      }

      html += '<div class="craft-row">' +
        '<div class="craft-left">' +
          '<div class="craft-name">' + recipe.name + ' <span class="text-dim" style="font-size:0.82rem;">→ ' + outputStr + ' · ' + timeStr + '</span></div>' +
          '<div class="craft-desc">' + recipe.desc + '</div>' +
        '</div>' +
        '<div class="craft-actions">' +
          '<span class="craft-cost">' + RENDER.costStr(recipe.cost) + '</span>' +
          '<button class="' + btnClass + '"' + (canStart ? '' : ' disabled') + ' onclick="Crafting.startCraft(\'' + id + '\')">[CRAFT]</button>' +
        '</div>' +
      '</div>';
    });

    if (!anyRecipe) {
      html += '<div class="text-dim" style="padding:8px;">The bench shows nothing yet. It is waiting for you to bring it something it recognises.</div>';
    }

    // Crafting slots
    html += '<div style="margin-top:12px;">';
    ['slot0', 'slot1'].forEach(function(slot, i) {
      var s = G.crafting[slot];
      html += '<div class="craft-slot">';
      html += '<div class="craft-slot-label">WORKBENCH SLOT ' + (i + 1) + '</div>';
      if (s) {
        var recipe  = DATA.recipes[s.recipeId];
        var pct     = Crafting.getSlotProgress(slot);
        var timeLeft = formatTime(Crafting.getSlotTimeLeft(slot) / 1000);
        html += '<div>' + (recipe ? recipe.name : '?') + ' — ' + timeLeft + ' remaining</div>';
        html += '<div class="progress-wrap"><div class="progress-bar"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
                '<button class="btn btn-danger" style="padding:2px 8px;font-size:0.79rem;" onclick="Crafting.cancelCraft(\'' + slot + '\')">[X]</button></div>';
      } else {
        html += '<span class="text-dim">— empty —</span>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '</div>';
    return html;
  },

  /* ── MAP SCREEN ──────────────────────── */
  screenMap: function() {
    var html = '';

    // World map — drawn from what has actually been found
    html += '<div class="section">';
    html += '<pre class="world-map">' + RENDER.worldMap() + '</pre>';
    html += '</div>';

    // Combat panel (if active)
    if (G.combat.active || G.combat.result) {
      html += RENDER.renderCombatPanel();
    }

    // Zone list
    html += '<div class="section"><div class="section-header">── KNOWN LOCATIONS ─────────────────────────────</div>';
    html += '<div class="zone-list">';

    DATA.zoneOrder.forEach(function(zid) {
      var zone = DATA.zones[zid];
      if (!zone) return;
      var unlocked = zoneUnlocked(zid);

      if (!unlocked) {
        // Show locked if the previous zone is known
        var zIdx = DATA.zoneOrder.indexOf(zid);
        var prevKnown = zIdx === 0 || zoneUnlocked(DATA.zoneOrder[zIdx-1]);
        if (prevKnown) {
          html += '<div class="zone-locked"><div class="zone-name">— — —</div>' +
                  '<div class="text-dim" style="font-size:0.79rem;">The road continues past here. You are not ready for what is at the end of it.</div></div>';
        }
        return;
      }

      var visited = (G.explore.visited || []).indexOf(zid) !== -1;
      var exploreInProgress = G.explore.active && G.explore.zoneId === zid;
      var combatInProgress  = G.combat.active && G.combat.zoneId === zid;
      var onCooldown = Date.now() < G.combat.cooldownUntil;

      html += '<div class="zone-row">';
      if (zone.ascii) {
        html += '<div class="zone-layout">';
        html += '<pre class="zone-art ' + (visited ? (zone.asciiColor || 'text-dim') : 'text-dim zone-art-unknown') + '">' + (visited ? RENDER.liveArt(zone.ascii, zid) : '?  ?  ?\n ?  ?  ?\n  ???  \n ?  ?  ?') + '</pre>';
        html += '<div class="zone-info">';
      }
      if (visited) {
        html += '<div class="zone-name">' + zone.name + '</div>';
        html += '<div class="zone-desc">' + zone.desc + '</div>';
        html += '<div class="zone-loot"><span class="text-dim">Loot:</span> ' + zone.lootHint + '</div>';
      } else {
        html += '<div class="zone-name text-dim">? ? ?</div>';
        html += '<div class="zone-desc text-dim" style="font-style:italic;">The Scout Post reads something here. Structural. Regular. Go and look.</div>';
      }
      html += '<div class="zone-controls">';

      // Explore button
      if (exploreInProgress) {
        var pct  = Exploration.getExploreProgress();
        var left = formatTime(Exploration.getExploreTimeLeft() / 1000);
        var hymn = G.explore.mode === 'hymn';
        html += '<div class="explore-status">' +
                '<div class="explore-label">' + (hymn ? 'IN THE NAVE — THE HYMN' : 'ON THE ROAD — ' + (visited ? zone.name.toUpperCase() : '? ? ?')) + '</div>' +
                '<div class="progress-wrap">' + (hymn ? RENDER.hymnProgress(pct) : RENDER.roadProgress(pct)) +
                '<span class="text-dim">' + left + '</span></div>' +
                '<button class="btn" style="margin-top:6px;font-size:0.79rem;" onclick="Exploration.cancelExplore()">' + (hymn ? '[LEAVE EARLY]' : '[TURN BACK]') + '</button>' +
                '</div>';
      } else {
        var exploreDisabled = (G.explore.active || G.combat.active) ? ' disabled' : '';
        html += '<button class="btn btn-memory"' + exploreDisabled + ' onclick="Exploration.startExplore(\'' + zid + '\')">[EXPLORE]</button>';
      }

      // Fight button
      if (combatInProgress) {
        html += '<span class="text-red" style="font-size:0.86rem;margin-left:8px;">⚔ ENGAGED</span>';
      } else if (G.combat.result) {
        html += '<button class="btn btn-mana" onclick="Combat.clearResult()">[CONTINUE]</button>';
      } else {
        var fightDisabled = (G.combat.active || G.explore.active || onCooldown) ? ' disabled' : '';
        var recoverLeft = onCooldown ? Math.ceil((G.combat.cooldownUntil - Date.now()) / 1000) : 0;
        var fightVerb = zid === 'deep_vault' ? '[DESCEND]' : '[FIGHT]';
        var fightLabel = onCooldown ? '[CATCHING BREATH ' + recoverLeft + 's]' : fightVerb;
        html += '<button class="btn btn-danger"' + fightDisabled + ' onclick="Combat.startFight(\'' + zid + '\')">' + fightLabel + '</button>';
      }

      html += '</div>';

      // The Cathedral: attend the hymn
      if (zid === 'cathedral_of_first_light' && visited) {
        var busyH = G.explore.active || G.combat.active;
        if (Exploration.canAttendHymn()) {
          html += '<div style="margin-top:8px;font-size:0.82rem;">' +
            '<span class="text-dim">The scholars sing at the chancel every morning. </span>' +
            '<button class="btn btn-arcane btn-small"' + (busyH ? ' disabled' : '') + ' onclick="Exploration.attendHymn()">[ATTEND THE HYMN]</button>' +
            '<span class="text-dim"> · ' + formatTime(Math.max(30000, Math.floor(90000 * prestigeTimeMult())) / 1000) + ' · the capacitors come back full</span></div>';
        } else if (!G.explore.active) {
          html += '<div class="text-dim" style="font-size:0.79rem;margin-top:8px;font-style:italic;">The choir rests. Next hymn in ' + formatTime(Exploration.hymnRestLeft()) + ' of play.</div>';
        }
      }

      // The Lattice Core: the chairs
      if (zid === 'lattice_core' && visited) {
        if (G.seeds.satInChairs) {
          html += '<div class="text-dim" style="font-size:0.79rem;margin-top:8px;">The chairs are still here. One of them is turned a little toward the door.</div>';
        } else {
          var busyC = G.explore.active || G.combat.active;
          html += '<div style="margin-top:8px;font-size:0.82rem;">' +
            '<span class="text-dim">The Antechamber. The chairs are still here. </span>' +
            '<button class="btn btn-memory btn-small"' + (busyC ? ' disabled' : '') + ' onclick="Scene.play(\'core_chairs\')">[SIT DOWN]</button></div>';
        }
      }

      // The Spire's administrative terminal
      if (zid === 'shattered_spire' && visited) {
        if (G.seeds.spireAllClear) {
          html += '<div class="text-dim" style="font-size:0.79rem;margin-top:8px;">Emergency flag cleared. The Sentries stand down.</div>';
        } else if (Exploration.canClearSpireFlag()) {
          var busy = G.explore.active || G.combat.active;
          var ok = canAfford(Exploration.spireFlagCost) && !busy;
          html += '<div style="margin-top:8px;font-size:0.82rem;">' +
            '<span class="text-dim">Admin terminal, third landing — the Seal opens it. </span>' +
            '<span class="craft-cost">' + RENDER.costStr(Exploration.spireFlagCost) + '</span> ' +
            '<button class="btn btn-tech btn-small"' + (ok ? '' : ' disabled') + ' onclick="Exploration.clearSpireFlag()">[CLEAR THE EMERGENCY FLAG]</button>' +
            '</div>';
        } else if ((G.relics || []).indexOf('architectsSeal') !== -1) {
          html += '<div class="text-dim" style="font-size:0.79rem;margin-top:8px;font-style:italic;">There is an administrative terminal somewhere in the base section. You have not found the landing yet.</div>';
        }
      }

      if (zone.ascii) html += '</div></div>';
      html += '</div>';
    });

    html += '</div></div>';
    return html;
  },

  renderCombatPanel: function() {
    var html = '<div class="section"><div class="section-header">── COMBAT ──────────────────────────────────────</div>';
    html += '<div class="combat-arena">';

    var enemy = G.combat.enemyId ? DATA.enemies[G.combat.enemyId] : null;
    if (!enemy && G.combat.result === null) {
      html += '</div></div>';
      return html;
    }

    // Stage
    html += '<div class="combat-stage">';

    // Hero
    var heroHpPct = Combat.hpPct(G.combat.heroHp, getHeroMaxHp());
    var heroHpCls = Combat.getHpClass(G.combat.heroHp, getHeroMaxHp());
    html += '<div class="combatant">' +
      RENDER.heroFigure() +
      '<div class="combatant-name">' + G.heroName + '</div>' +
      '<div class="hp-bar-wrap"><div class="hp-bar"><div class="hp-fill ' + heroHpCls + '" style="width:' + heroHpPct + '%"></div></div>' +
      '<span>' + Math.ceil(G.combat.heroHp) + '/' + getHeroMaxHp() + '</span></div>' +
      '</div>';

    html += '<div class="vs-label">── VS ──</div>';

    // Enemy (or result)
    if (enemy) {
      var enemyHpPct = Combat.hpPct(G.combat.enemyHp, G.combat.enemyMaxHp);
      var enemyHpCls = Combat.getHpClass(G.combat.enemyHp, G.combat.enemyMaxHp);
      html += '<div class="combatant">' +
        '<pre class="ascii-art ' + (enemy.color || 'enemy-art') + '">' + RENDER.liveArt(enemy.ascii, enemy.id) + '</pre>' +
        (enemy.backdrop ? '<pre class="ascii-art combat-backdrop">' + RENDER.liveArt(enemy.backdrop, 'backdrop') + '</pre>' : '') +
        '<div class="combatant-name">' + enemy.name + '</div>';
      if (enemy.noncombat) {
        html += '<div class="text-dim" style="font-size:0.82rem;">sensors steady · not running down</div>';
      } else {
        html += '<div class="hp-bar-wrap"><div class="hp-bar"><div class="hp-fill ' + enemyHpCls + '" style="width:' + enemyHpPct + '%"></div>' +
          '</div><span>' + Math.ceil(G.combat.enemyHp) + '/' + G.combat.enemyMaxHp + '</span></div>';
      }
      html += '</div>';
    }

    // Golem
    if (G.combat.golemHp > 0) {
      var golemHpPct = Combat.hpPct(G.combat.golemHp, G.combat.golemMaxHp);
      html += '<div class="combatant">' +
        '<pre class="ascii-art golem-art">' + DATA.ASCII.golem_ally + '</pre>' +
        '<div class="combatant-name">' + escapeHtml(G.golemName || 'Golem') + '</div>' +
        '<div class="hp-bar-wrap"><div class="hp-bar"><div class="hp-fill hp-mid" style="width:' + golemHpPct + '%"></div></div>' +
        '<span>' + Math.ceil(G.combat.golemHp) + '/' + G.combat.golemMaxHp + '</span></div>' +
        '</div>';
    }

    html += '</div>'; // combat-stage

    // Combat log
    html += '<div class="combat-log">';
    G.combat.log.slice().reverse().forEach(function(entry) {
      html += '<div class="cl-entry ' + (entry.cls || '') + '">&gt; ' + entry.msg + '</div>';
    });
    html += '</div>';

    // Spells — the current, shaped (prestige 3+), plus relic-gated protocols
    var visibleSpells = Spells.list.filter(Spells.visible);
    if (visibleSpells.length && G.combat.active && !G.combat.result && !G.combat.script) {
      html += '<div class="combat-spells">';
      html += '<div class="spells-label text-dim" style="font-size:0.79rem;margin-bottom:4px;">── THE CURRENT ──────</div>';
      for (var si = 0; si < visibleSpells.length; si++) {
        var sp = visibleSpells[si];
        var spCanUse = Spells.canUse(sp);
        var spCls = spCanUse ? 'btn btn-arcane' : 'btn';
        html += '<button class="' + spCls + '" style="font-size:0.79rem;margin-right:4px;margin-bottom:4px;"' +
          (spCanUse ? '' : ' disabled') +
          ' onclick="Spells.useSpell(\'' + sp.id + '\')" title="' + sp.desc + '">' +
          '[' + sp.name + ' · ' + sp.manaCost + ' mana]</button>';
      }
      if (G.buffs && G.buffs.shieldActive) {
        html += '<div class="text-arcane" style="font-size:0.82rem;margin-top:2px;">◈ Shield active</div>';
      }
      if (G.buffs && G.buffs.enemyStunned) {
        html += '<div class="text-gold" style="font-size:0.82rem;margin-top:2px;">&#9889; Enemy stunned</div>';
      }
      html += '</div>';
    }

    // Controls
    html += '<div class="combat-controls">';
    if (G.combat.active) {
      if (!G.combat.script) {
        html += '<button class="btn btn-danger" onclick="Combat.flee()">[WITHDRAW]</button>';
        if (enemy && enemy.calmable) {
          html += '<button class="btn btn-memory" onclick="Combat.moveSlowly()" title="No loot. Half the lesson. Nobody gets hurt.">' + enemy.calmLabel + '</button>';
        }
      }
      else html += '<span class="text-dim" style="font-size:0.82rem;">Hold still.</span>';
      /* Golem repair (prestige 5+, golem down) */
      if (G.prestige.count >= 5 && G.combat.golemHp === 0 && (G.buildings.golemForge || 0) >= 1 && !G.combat.script) {
        var canRepair = Math.floor(G.res.scrap || 0) >= 5 && Math.floor(G.res.etherCell || 0) >= 1;
        html += '<button class="btn' + (canRepair ? ' btn-tech' : '') + '"' +
          (canRepair ? '' : ' disabled') +
          ' onclick="Combat.repairGolem()">[RE-SEAT THE GOLEM · 5 scrap + 1 Ether]</button>';
      }
    } else if (G.combat.result) {
      html += '<button class="btn btn-mana" onclick="Combat.clearResult()">[CONTINUE]</button>';
    }
    html += '</div>';

    html += '</div></div>';
    return html;
  },

  /* ── LORE SCREEN ─────────────────────── */
  screenLore: function() {
    var html = '<div class="section"><div class="section-header">── THE ARCHIVE — LORE RECORDS ──────────────────</div>';

    if (G.loreUnlocked.length === 0) {
      html += '<div class="text-dim" style="padding:8px;">No records yet.</div>';
    } else {
      var hasTerminal = getBuildingCount('memoryTerminal') >= 1;
      // Show newest first
      var unlocked = G.loreUnlocked.slice().reverse();
      unlocked.forEach(function(loreId) {
        var entry = getLoreEntry(loreId);
        if (!entry) return;
        var isNew = G.loreNew.indexOf(loreId) !== -1;
        var decoded = isLoreDecoded(loreId);
        html += '<div class="lore-entry' + (isNew ? ' lore-new' : '') + (decoded ? '' : ' lore-decoding') + '">' +
          '<div class="lore-title">' + entry.title + (decoded ? '' : ' <span class="decode-tag">[ON THE TERMINAL]</span>') + '</div>' +
          '<div class="lore-chapter">' + entry.chapter + '</div>' +
          (entry.ascii ? '<pre class="ascii-art lore-art ' + (entry.asciiColor || '') + '">' + entry.ascii + '</pre>' : '');
        var dd = G.decoding[loreId];
        if (decoded) {
          html += '<div class="lore-text">' + (dd && dd.lastDoneAt ? RENDER.typedSegments(entry, loreSegments(entry).length, dd.lastDoneAt) : escapeHtml(loreText(entry.text))) + '</div>';
        } else {
          var segs = loreSegments(entry);
          var d = dd || { done: 0, progress: 0 };
          html += '<div class="lore-text">' + RENDER.typedSegments(entry, d.done, d.lastDoneAt) + '</div>';
          if (!hasTerminal) {
            html += '<div class="decode-line text-red">[ SHARD RECOVERED — NO TERMINAL TO READ IT ]</div>';
            html += '<div class="decode-corrupt" style="font-style:italic;">It is trying to tell you something. You do not yet have the ears for it. Build a Memory Terminal.</div>';
          } else {
            var filled = Math.floor(d.progress * 10);
            var bar = new Array(filled + 1).join('▓') + new Array(10 - filled + 1).join('░');
            html += '<div class="decode-line">[ SEGMENT ' + (d.done + 1) + ' / ' + segs.length + ' — DECODING ' + bar + ' ' + Math.floor(d.progress * 100) + '% ]</div>';
            var remaining = segs.length - d.done - 1;
            for (var r = 0; r < Math.min(remaining, 3); r++) html += '<div class="decode-corrupt">[ SEGMENT ' + (d.done + 2 + r) + ' — CORRUPTED — awaiting decode ]</div>';
            if (remaining > 3) html += '<div class="decode-corrupt">[ … ' + (remaining - 3) + ' more ]</div>';
          }
        }
        html += '</div>';
      });
    }

    // Clear "new" markers when lore screen is visited
    G.loreNew = [];

    html += '</div>';
    return html;
  },

  /* The first `done` segments of an entry; the most recent one types itself in at ~40 chars/s */
  typedSegments: function(entry, done, lastDoneAt) {
    var segs = loreSegments(entry).slice(0, done).map(function(s) { return loreText(s); });
    if (!segs.length) return '';
    var elapsed = lastDoneAt ? (Date.now() - lastDoneAt) : Infinity;
    var last = segs[segs.length - 1];
    var chars = reducedMotion() ? last.length : Math.floor(elapsed / 25);
    var typing = chars < last.length;
    var head = segs.slice(0, -1).map(escapeHtml).join('<br><br>');
    var tail = escapeHtml(typing ? last.slice(0, chars) : last) + (typing ? '<span class="type-cursor">▌</span>' : '');
    return head ? head + '<br><br>' + tail : tail;
  },

  /* ── HERO SCREEN ─────────────────────── */
  screenHero: function() {
    var html = '';

    // Hero panel
    html += '<div class="section"><div class="section-header">── THE TECHNOMAGE ───────────────────────────────</div>';
    html += '<div class="hero-panel">';

    // ASCII + level
    html += '<div class="hero-ascii-panel">';
    html += RENDER.heroFigure();
    var expPct = ((G.hero.exp / G.hero.expToNext) * 100).toFixed(1);
    html += '<div style="font-size:0.86rem;margin-top:8px;color:var(--dim);">EXP</div>';
    html += '<div class="progress-wrap"><div class="progress-bar"><div class="progress-fill mana-fill" style="width:' + expPct + '%"></div></div>' +
            '<span class="text-dim" style="font-size:0.79rem;">' + G.hero.exp + '/' + G.hero.expToNext + '</span></div>';
    html += '</div>';

    // Stats
    html += '<div class="hero-stats-panel">';
    var maxHp = getHeroMaxHp();
    var curHp = getHeroHp();
    var hpPct  = ((curHp / maxHp) * 100).toFixed(1);
    html += '<div class="stat-row"><span class="stat-label">Name</span><span class="stat-value">' + G.heroName + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">Level</span><span class="stat-value">' + G.hero.level + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">HP</span><span class="stat-value">' +
            '<div class="progress-wrap" style="margin:0;">' +
            '<div class="progress-bar" style="width:120px;"><div class="hp-fill ' + Combat.getHpClass(curHp, maxHp) + '" style="width:' + hpPct + '%"></div></div>' +
            '<span>' + Math.ceil(curHp) + '/' + maxHp + '</span>' +
            '</div></span></div>';
    html += '<div class="stat-row"><span class="stat-label">Attack</span><span class="stat-value text-red">' + getHeroAttack() + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">Defense</span><span class="stat-value text-mana">' + getHeroDefense() + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">Enemies</span><span class="stat-value">' + G.stats.enemiesDefeated + '</span></div>';
    html += '<div class="stat-row"><span class="stat-label">Awakenings</span><span class="stat-value text-gold">' + G.prestige.count + '</span></div>';
    if (G.buffs && (G.buffs.attackBonus > 0 || G.buffs.exploreSpeedBonus > 0)) {
      if (G.buffs.attackBonus > 0) {
        html += '<div class="stat-row"><span class="stat-label text-gold">⚔ ' + (G.buffs.attackBonus >= 15 ? 'Stimulant' : 'Surer grip') + '</span><span class="stat-value text-gold">+' + G.buffs.attackBonus + ' ATK next fight</span></div>';
      }
      if (G.buffs.exploreSpeedBonus > 0) {
        html += '<div class="stat-row"><span class="stat-label text-memory">◈ Compass</span><span class="stat-value text-memory">Next explore ×' + Math.round(G.buffs.exploreSpeedBonus * 100) + '% faster</span></div>';
      }
    }
    html += '</div>';

    html += '</div></div>'; // hero-panel + section

    // Equipment
    html += '<div class="section"><div class="section-header">── EQUIPMENT ────────────────────────────────────</div>';
    ['weapon', 'armor', 'accessory'].forEach(function(slot) {
      var eqId = G.hero.equipment[slot];
      var eq   = eqId ? DATA.equipment[eqId] : null;
      html += '<div class="equip-slot">';
      html += '<span class="equip-slot-label">[' + slot.toUpperCase() + ']</span>';
      if (eq) {
        html += '<span class="equip-slot-item">' + eq.name + '</span>';
        html += '<span class="equip-slot-stats">' + eq.desc + '</span>';
        html += '<button class="btn" style="font-size:0.79rem;padding:2px 8px;" onclick="Equipment.unequip(\'' + slot + '\')">[REMOVE]</button>';
      } else {
        html += '<span class="equip-slot-empty">— empty —</span>';
      }
      html += '</div>';
    });

    // Inventory
    if (G.inventory.length > 0) {
      html += '<div class="section-header" style="margin-top:16px;">── INVENTORY ───────────────────────────────────</div>';
      html += '<div class="inventory-grid">';
      G.inventory.forEach(function(eqId, idx) {
        var eq = DATA.equipment[eqId];
        if (!eq) return;
        html += '<div class="inv-item">' +
          '<span class="inv-item-name">' + eq.name + '</span>' +
          '<span class="inv-item-slot">[' + eq.slot + ']</span>' +
          '<span class="text-dim" style="font-size:0.79rem;">' + eq.desc + '</span>' +
          (eq.slot === 'consumable'
            ? '<button class="btn btn-arcane" style="font-size:0.79rem;padding:2px 8px;" onclick="useConsumable(\'' + eqId + '\')">[USE]</button>'
            : '<button class="btn btn-tech" style="font-size:0.79rem;padding:2px 8px;" onclick="Equipment.equip(\'' + eqId + '\')">[EQUIP]</button>') +
        '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="text-dim" style="font-size:0.86rem;padding:8px;">Craft equipment to fill your inventory.</div>';
    }

    // Golem companion info (if forge is built)
    if ((G.buildings.golemForge || 0) >= 1) {
      var golemMaxHp = 30 + G.hero.level * 5;
      var golemLastHp = G.combat.golemHp > 0 ? G.combat.golemHp : golemMaxHp;
      var golemStatus = G.combat.active ? 'IN COMBAT' : 'STANDBY';
      html += '<div class="section-header" style="margin-top:16px;">── ' + (G.golemName ? escapeHtml(G.golemName.toUpperCase()) : 'GOLEM COMPANION') + ' ─────────────────────────────</div>';
      html += '<div style="display:flex;align-items:flex-start;gap:16px;padding:8px 0;">';
      html += '<pre class="ascii-art golem-art" style="margin:0;">' + DATA.ASCII.golem_ally + '</pre>';
      html += '<div style="font-size:0.86rem;line-height:2;color:var(--dim);">';
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
        '<span class="text-dim">' + (G.golemName ? 'Name:' : 'It has no name yet. Give it one.') + '</span>' +
        '<input type="text" id="golem-name-input" class="game-input" style="width:150px;font-size:0.86rem;padding:3px 8px;letter-spacing:1px;" maxlength="20" value="' + escapeHtml(G.golemName || '') + '" placeholder="…" autocomplete="off" onkeydown="if(event.key===\'Enter\'){nameGolem();}">' +
        '<button class="btn btn-tech btn-small" onclick="nameGolem()">[' + (G.golemName ? 'RENAME' : 'NAME IT') + ']</button></div>';
      html += '<div><span class="text-dim">Status:</span> <span class="text-tech">' + golemStatus + '</span></div>';
      html += '<div><span class="text-dim">Max HP:</span> <span>' + golemMaxHp + '</span> <span class="text-dim">(base 30 + ' + G.hero.level * 5 + ' from level)</span></div>';
      html += '<div><span class="text-dim">Damage:</span> <span>' + (6 + Math.floor(G.hero.level / 2)) + '–' + (6 + Math.floor(G.hero.level / 2) + 3) + '</span> <span class="text-dim">(scales with hero level)</span></div>';
      html += '<div style="margin-top:4px;font-style:italic;color:var(--dim);font-size:0.79rem;">"Built to protect. Still remembers how."</div>';
      html += '</div></div>';
    }

    html += '</div>';
    return html;
  },

  /* ── PRESTIGE SCREEN ─────────────────── */
  screenPrestige: function() {
    var html = '<div class="section">';
    html += '<div class="section-header">── THE AWAKENING — RESONANCE PROTOCOL ──────────</div>';

    // Prestige levels history
    html += '<div style="margin-bottom:20px;">';
    DATA.prestigeLevels.forEach(function(lvl) {
      var done = G.prestige.count >= lvl.num;
      var next = G.prestige.count === lvl.num - 1;
      html += '<div class="prestige-level-row">';
      html += '<span class="pl-num">' + lvl.num + '.</span>';
      html += '<span class="pl-name">' + lvl.name + '</span>';
      if (done) {
        html += '<span class="pl-done">✓ COMPLETED</span>';
      } else if (next) {
        html += '<span class="pl-next">◆ NEXT</span>';
      } else {
        html += '<span class="pl-lock">LOCKED</span>';
      }
      html += '</div>';
    });
    html += '</div>';

    // Next awakening info
    var infoLines = Prestige.getPrestigeInfo();
    html += '<div class="prestige-panel">';
    infoLines.forEach(function(line) {
      html += '<div class="prestige-text ' + (line.cls || '') + '">' + (line.text || '&nbsp;') + '</div>';
    });

    // Awaken button
    if (G.prestige.count < 6) {
      var canDo = Prestige.canAwaken();
      html += '<div style="margin-top:16px;">';
      if (canDo) {
        html += '<button class="btn btn-prestige" onclick="Prestige.doAwaken()">★ ACTIVATE THE BEACON</button>';
        html += '<div class="text-dim" style="font-size:0.79rem;margin-top:6px;">The Archive dissolves back into the earth. What you know stays in you.</div>';
      } else {
        html += '<button class="btn" disabled>★ ACTIVATE THE BEACON</button>';
        html += '<div class="text-dim" style="font-size:0.79rem;margin-top:6px;">Not yet.</div>';
      }
      html += '</div>';
    }

    html += '</div></div>';

    // Resonance info
    html += '<div class="section">';
    html += '<div class="section-header">── RESONANCE ─────────────────────────────────────</div>';
    html += '<div class="text-dim" style="font-size:0.86rem;line-height:1.8;">';
    html += '<div>Carried: <span class="text-gold">' + fmt(G.prestige.resonance) + '</span></div>';
    html += '<div>Earned in all: <span class="text-gold">' + fmt(G.prestige.totalEarned) + '</span></div>';
    html += '<div>Production: <span class="text-arcane">×' + G.prestige.multiplier.toFixed(2) + '</span> · Costs: <span class="text-arcane">×' + prestigeCostMult().toFixed(2) + '</span> · Bench and roads: <span class="text-arcane">×' + prestigeTimeMult().toFixed(2) + '</span></div>';
    html += '<div style="margin-top:8px;color:var(--dim);font-size:0.79rem;">Resonance is not stored in stone. It is stored in the person.</div>';
    html += '<div style="color:var(--dim);font-size:0.79rem;">You cannot lose what is in you. You can only lose what is in stone.</div>';
    html += '</div>';
    html += '</div>';

    return html;
  },

  /* ── CODEX SCREEN ────────────────────── */
  screenCodex: function() {
    var html = '';
    G.annotationsNew = [];

    // Annotations
    html += '<div class="section"><div class="section-header">── FIELD ANNOTATIONS ───────────────────────────</div>';
    var totalAnn = DATA.annotations.length;
    var foundAnn = G.annotations.length;
    html += '<div class="codex-count">' + foundAnn + ' / ' + totalAnn + ' annotations recorded</div>';
    DATA.annotations.forEach(function(ann) {
      var unlocked = G.annotations.indexOf(ann.id) !== -1;
      if (unlocked) {
        html += '<div class="annotation-entry">';
        html += '<div class="annotation-title">' + ann.title;
        if (ann.bonusDesc) {
          html += ' <span class="annotation-bonus">· ' + ann.bonusDesc + '</span>';
        }
        html += '</div>';
        html += '<div class="annotation-note">' + escapeHtml(ann.note) + '</div>';
        html += '</div>';
      } else {
        html += '<div class="annotation-entry annotation-locked">';
        html += '<div class="annotation-title">— unrecorded —</div>';
        html += '</div>';
      }
    });
    html += '</div>';
    return html;
  },

  /* ── RELICS SCREEN ───────────────────── */
  screenRelics: function() {
    var html = '';
    html += '<div class="section"><div class="section-header">── ARCHITECT RELICS ─────────────────────────────</div>';
    var totalRel = Object.keys(DATA.relics).length;
    var foundRel = (G.relics || []).length;
    html += '<div class="codex-count">' + foundRel + ' / ' + totalRel + ' relics recovered</div>';

    DATA.zoneOrder.forEach(function(zid) {
      var zone = DATA.zones[zid];
      if (!zone || !zone.relicPool) return;
      var zoneVisited = (G.explore.visited || []).indexOf(zid) !== -1;
      var foundInZone = zone.relicPool.filter(function(r) {
        return (G.relics || []).indexOf(r.id) !== -1;
      }).length;
      html += '<div class="relic-zone-group">';
      var zoneName = zoneVisited ? zone.name : '???';
      var zoneCount = zoneVisited ? foundInZone + '/' + zone.relicPool.length : '?/?';
      html += '<div class="relic-zone-name">' + zoneName + ' <span class="text-dim">— ' + zoneCount + '</span></div>';
      zone.relicPool.forEach(function(entry) {
        var relic = DATA.relics[entry.id];
        if (!relic) return;
        var found = (G.relics || []).indexOf(entry.id) !== -1;
        if (found) {
          html += '<div class="relic-entry">';
          html += '<pre class="ascii-art relic-art ' + (relic.asciiColor || '') + '">' + relic.ascii + '</pre>';
          html += '<div class="relic-info">';
          html += '<div class="relic-name">' + relic.name + '</div>';
          html += '<div class="relic-desc">' + relic.desc + '</div>';
          html += '<div class="relic-flavor">' + escapeHtml(relic.flavor) + '</div>';
          html += '<div class="relic-bonus">' + relic.bonusDesc + '</div>';
          html += '</div></div>';
        } else {
          html += '<div class="relic-entry relic-entry-locked">';
          html += '<span class="text-dim">[ ??? — Not yet recovered ]</span>';
          html += '</div>';
        }
      });
      html += '</div>';
    });

    html += '</div>';
    return html;
  },

  /* ── THE LIBRARY ─────────────────────── */
  screenLibrary: function() {
    G.libraryNew = [];
    var open = libraryUnlocked().map(function(v) { return v.id; });
    var total = DATA.library.length, count = open.length;
    var frame = Math.floor(Date.now() / 300);

    function rep(ch, k) { return new Array(Math.max(0, k) + 1).join(ch); }
    function padC(s, w) { var l = Math.floor((w - s.length) / 2); return rep(' ', l) + s + rep(' ', w - s.length - l); }
    function spine(v) {
      var isOpen = open.indexOf(v.id) !== -1;
      if (isOpen) return '<a class="spine-link" href="#" title="' + escapeHtml(v.title) + '" onclick="openBook(\'' + v.id + '\');return false;">│' + padC(v.num, 3) + '│</a>';
      if (v.sealed) return '<span class="spine-sealed" title="It will not resolve, however you turn the light.">' + (reducedMotion() ? '░░░░░' : ['░░░░░', '░▒░░░', '░░░▒░'][frame % 3]) + '</span>';
      return '<span class="spine-empty">▒▒▒▒▒</span>';
    }
    var parts = [
      { n: 1, label: 'PART ONE — THE SCHOLAR ALONE' },
      { n: 2, label: 'PART TWO — THE WORLD OUTSIDE' },
      { n: 3, label: 'PART THREE — THE RECOVERED ARCHIVES' },
      { n: 4, label: 'PART FOUR — THE AWAKENINGS' },
      { n: 5, label: 'PART FIVE — AND AFTER' },
      { n: 6, label: 'APPENDICES' },
      { n: 0, label: 'THE TWO THAT WERE ALREADY THERE' }
    ];
    var W = 46;
    var out = [];
    out.push('╔' + rep('═', W) + '╗');
    parts.forEach(function(p, pi) {
      var vols = DATA.library.filter(function(v) { return v.part === p.n; });
      var rowHtml = ' ', rowLen = 1;
      vols.forEach(function(v) { rowHtml += spine(v) + ' '; rowLen += 6; });
      out.push('║' + rowHtml + rep(' ', W - rowLen) + '║');
      var label = ' <span class="pnl-dim">' + p.label + '</span>';
      out.push('║' + label + rep(' ', W - 1 - p.label.length) + '║');
      out.push((pi < parts.length - 1 ? '╠' : '╚') + rep('═', W) + (pi < parts.length - 1 ? '╣' : '╝'));
    });
    out.push('  ' + rep('· ', 22) + ' <span class="pnl-dim">dust</span>');

    var html = '<div class="section">';
    html += '<div class="section-header">── THE LIBRARY WING ────────────────────────────</div>';
    html += '<div class="section-flavor">A rack for records that had not been written yet. ' + count + ' of ' + total + ' slots filled.' +
      (count < 8 ? ' The shelf is longer than what you have found.' : (count < total ? ' The slots fit.' : ' Every slot. The book is on the shelf.')) + '</div>';
    html += '<pre class="archive-panel shelf">' + out.join('\n') + '</pre>';
    html += '<div class="text-dim" style="font-size:0.79rem;margin-top:4px;">Each volume opens the chapter, in the book, in a new tab. The shelf knows what you have not done yet.</div>';
    html += '</div>';

    html += '<div class="section"><div class="section-header">── VOLUMES ─────────────────────────────────────</div>';
    var lastPart = null;
    DATA.library.forEach(function(v) {
      if (v.part !== lastPart) {
        lastPart = v.part;
        var p = parts.filter(function(x) { return x.n === v.part; })[0];
        html += '<div class="relic-zone-name" style="margin-top:10px;">' + p.label + '</div>';
      }
      var isOpen = open.indexOf(v.id) !== -1;
      if (isOpen) {
        html += '<div class="annotation-entry"><div class="annotation-title"><span class="text-tech">' + escapeHtml(v.num) + '</span> · ' + escapeHtml(v.title) +
          ' <a class="btn btn-small btn-arcane" style="margin-left:8px;text-decoration:none;" href="#" onclick="openBook(\'' + v.id + '\');return false;">[READ]</a></div></div>';
      } else {
        html += '<div class="annotation-entry annotation-locked"><div class="annotation-title">' + escapeHtml(v.num) + ' · — — —</div></div>';
      }
    });
    html += '</div>';
    return html;
  },

  /* ── CONFIG SCREEN ───────────────────── */
  screenConfig: function() {
    var html = '';

    // ── Colour Theme ──
    html += '<div class="config-section">';
    html += '<div class="section-header">── COLOUR THEME ────────────────────────────────</div>';
    html += '<div class="theme-grid">';

    var themeDescs = {
      'default':   'Dark blue-black · mana blue · amber tech',
      'amber':     'Warm amber glow · classic CRT monitor feel',
      'phosphor':  'Green phosphor screen · old terminal aesthetic',
      'crimson':   'Dark gothic red · blood and iron',
      'abyss':     'Cold deep ocean blue · vast and silent',
      'parchment': 'Light sepia · easy on the eyes in daylight'
    };

    THEMES.forEach(function(t, i) {
      var isActive = Settings.themeIndex === i;
      html += '<div class="theme-row' + (isActive ? ' active-theme' : '') + '" onclick="Settings.setTheme(' + i + ')">' +
        '<span class="theme-swatch" style="background:' + t.swatch + '"></span>' +
        '<span class="theme-name">' + t.label + '</span>' +
        '<span class="theme-desc">' + (themeDescs[t.id] || '') + '</span>' +
        (isActive ? '<span class="theme-badge">● ACTIVE</span>' : '') +
      '</div>';
    });

    html += '</div></div>';

    // ── Font Size ──
    html += '<div class="config-section">';
    html += '<div class="section-header">── FONT SIZE ───────────────────────────────────</div>';
    html += '<div class="font-controls">';
    html += '<button class="btn" onclick="Settings.fontDown()" ' + (Settings.fontSize <= 11 ? 'disabled' : '') + '>[  A-  ]</button>';
    html += '<span class="font-size-display">' + Settings.fontSize + 'px</span>';
    html += '<button class="btn" onclick="Settings.fontUp()" ' + (Settings.fontSize >= 30 ? 'disabled' : '') + '>[  A+  ]</button>';
    html += '<span class="font-preview" style="font-size:' + Settings.fontSize + 'px;margin-left:16px;color:var(--dim);">The Archive awaits.</span>';
    html += '</div>';
    html += '<div style="color:var(--dim);font-size:0.8em;margin-top:6px;">Range: 11px – 30px. Current: ' + Settings.fontSize + 'px.</div>';
    html += '</div>';

    // ── Sound ──
    html += '<div class="config-section">';
    html += '<div class="section-header">── SOUND ───────────────────────────────────────</div>';
    html += '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:8px;">';
    html += '<button class="' + (Mixer.muted ? 'btn btn-danger' : 'btn') + '" onclick="Mixer.toggleMute()">' + (Mixer.muted ? '[MUTED — UNMUTE]' : '[MUTE ALL]') + '</button>';
    html += '<span class="text-dim" style="font-size:0.82rem;">Everything is generated as you play. Nothing is loaded.</span>';
    html += '</div>';
    [['master', 'Master'], ['music', 'Music'], ['ambient', 'Ambient'], ['sfx', 'Effects']].forEach(function(b) {
      var v = Mixer.levels[b[0]];
      html += '<div class="mix-row"><label>' + b[1] + '</label>' +
        '<input type="range" min="0" max="1" step="0.05" value="' + v.toFixed(2) + '" oninput="Mixer.set(\'' + b[0] + '\', parseFloat(this.value)); this.nextElementSibling.textContent = Math.round(this.value*100) + \'%\';">' +
        '<span class="mix-val">' + Math.round(v * 100) + '%</span></div>';
    });
    html += '<div class="text-dim" style="font-size:0.79rem;margin-top:6px;">Ambient follows where you are: the valley, the drowned streets, the Spire, the Vault.</div>';
    html += '</div>';

    // ── Music ──
    html += '<div class="config-section">';
    html += '<div class="section-header">── MUSIC ───────────────────────────────────────</div>';
    var musicBtnLabel = Music.playing ? '[■ STOP MUSIC]' : '[▶ PLAY MUSIC]';
    var musicBtnClass = Music.playing ? 'btn btn-danger' : 'btn btn-mana';
    html += '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">';
    html += '<button class="' + musicBtnClass + '" onclick="Music.toggle()">' + musicBtnLabel + '</button>';
    html += '</div>';
    html += '<div class="section-header" style="margin-top:14px;">── SCORE ───────────────────────────────────────</div>';
    html += '<div class="track-selector">';
    var songDescs = [
      'one track that grows with the Archive · changes with the place · ducks in a fight',
      'A minor · 70 BPM · mysterious to epic',
      'E minor · 55 BPM · haunting and melancholic',
      'G minor · 88 BPM · mechanical and urgent'
    ];
    Music.getSongs().forEach(function(name, i) {
      var idx = i - 1; // -1 = adaptive
      var active = Music.currentSong === idx;
      html += '<div class="track-row' + (active ? ' track-row-active' : '') + '" onclick="Music.setSong(' + idx + ')">';
      html += '<span class="track-marker">' + (active ? '◆' : '·') + '</span>';
      html += '<span class="track-name">' + name + '</span>';
      html += '<span class="track-desc">' + songDescs[i] + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    html += '<div class="config-section">';
    html += '<div class="section-header">── SAVE DATA ───────────────────────────────────</div>';
    html += '<div class="save-io">';
    html += '<div class="text-dim" style="font-size:0.85em;margin-bottom:10px;">Export your save to transfer it to another device. Import a save code to restore progress.</div>';
    html += '<div class="save-row">';
    html += '<button class="btn btn-tech" onclick="exportSave()">[EXPORT SAVE]</button>';
    html += '<textarea id="save-export-box" class="save-box" readonly placeholder="Click Export — your save code will appear here and be copied to clipboard."></textarea>';
    html += '</div>';
    html += '<div class="save-row" style="margin-top:10px;">';
    html += '<button class="btn btn-arcane" onclick="importSave()">[IMPORT SAVE]</button>';
    html += '<textarea id="save-import-box" class="save-box" placeholder="Paste your save code here, then click Import."></textarea>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '<div class="config-section">';
    html += '<div class="section-header">── THE RECORD ──────────────────────────────────</div>';
    html += '<div class="text-dim" style="font-size:0.85em;margin-bottom:10px;">Everything this ' + escapeHtml(G.heroName || 'Archivist') + ' has found, in the order it was found — the field notes, the recovered fragments, the margin notes, the relics — as one text file. A Record in Full.</div>';
    html += '<button class="btn btn-arcane" onclick="exportRecord()">[WRITE THE RECORD]</button>';
    html += '<textarea id="record-box" class="save-box" readonly hidden style="height:180px;margin-top:10px;width:100%;font-size:0.8rem;"></textarea>';
    html += '</div>';

    html += '<div class="config-section">';
    html += '<div class="section-header">── ABOUT ───────────────────────────────────────</div>';
    html += '<div style="color:var(--dim);font-size:0.85em;line-height:2;">';
    html += '<div><span class="text-gold">ARCANUM MACHINA</span> · v' + G.version + '</div>';
    html += '<div>Echoes of the First Age</div>';
    html += '<div style="margin-top:8px;">Progress saves automatically every 30 seconds.</div>';
    html += '<div>Theme and font preferences are saved separately.</div>';
    html += '<div style="margin-top:8px;color:var(--arcane);">"The ley lines were always here. We just forgot how to listen."</div>';
    html += '</div>';
    html += '</div>';

    return html;
  },

  /* ── LOG ─────────────────────────────── */
  renderLog: function() {
    var el = document.getElementById('log-panel');
    if (!el) return;

    var html = '<div class="log-header">── EVENT LOG ─────────────────────────────────────────</div>';
    html += '<div class="log-scroll">';
    G.gameLog.slice(0, 20).forEach(function(entry) {
      html += '<div class="log-line ' + (entry.cls || '') + '">&gt; ' + escapeHtml(entry.msg) + '</div>';
    });
    html += '</div>';
    RENDER.setHtml(el, html);
  },

  /* ── HELPERS ─────────────────────────── */
  costStr: function(costObj) {
    return Object.keys(costObj).map(function(k) {
      var have  = G.res[k] || 0;
      var need  = costObj[k];
      var cls   = have >= need ? 'text-dim' : 'text-red';
      return '<span class="' + cls + '">' + fmt(need) + ' ' + resName(k) + '</span>';
    }).join(' + ');
  },

  /* ── THE ARCHIVE PANEL ───────────────── */
  /* A cutaway of the Archive that grows with every building and dissolves on Awakening. */
  archivePanel: function(opts) {
    opts = opts || {};
    var a    = G.awakening;
    var mode = opts.mode || (a ? a.mode : 'normal');
    var b    = G.buildings;
    var n    = b.manaConduit || 0;
    var lit  = Math.min(n, 12);
    if (mode === 'blaze' || mode === 'cool') lit = 12;
    if (mode === 'dimming' && a && a.lit !== null) lit = Math.min(a.lit, 12);
    if (mode === 'dark' || mode === 'ruin') lit = 0;
    var rooms = !(mode === 'dark' || mode === 'ruin');
    var W = 46;

    /* {braces} mark dim text and vanish on render — pad by visible width */
    function rep(ch, k) { return new Array(Math.max(0, k) + 1).join(ch); }
    function vlen(s) { return s.replace(/[{}]/g, '').length; }
    function padR(s, w) { return s + rep(' ', w - vlen(s)); }
    function padC(s, w) { var l = Math.floor((w - vlen(s)) / 2); return rep(' ', l) + s + rep(' ', w - vlen(s) - l); }
    function row(inner) { return '║' + padR(inner, W) + '║'; }

    var sock = '';
    for (var i = 0; i < 12; i++) sock += (i < lit ? '~' : '·') + ' ';
    var label = mode === 'ruin' ? 'sockets, dark' : (n > 12 ? 'conduits ×' + n : (n > 0 ? 'conduits' : 'conduit sockets'));
    var lines = [];
    lines.push(' ' + sock + ' {' + label + '}');
    lines.push('╔' + rep('═', W) + '╗');
    lines.push(row(padC(mode === 'ruin' ? '{— main hall, silted —}' : '{— main hall —}', W)));

    function box(built, name) {
      if (built && rooms) return ['┌────────┐', '│' + padC(name, 8) + '│', '└────────┘'];
      return ['          ', padC('{· · · ·}', 10), '          '];
    }
    var bench = box(b.runicWorkbench, 'BENCH');
    var scout = box(b.scoutPost, 'SCOUT');
    var beacon = b.resonanceBeacon && rooms;
    var flash = !beacon && (Date.now() - (G.relicFlashAt || 0)) < 450;
    var mid = [beacon ? '[ ★ ]' : (flash ? '[ ◉ ]' : '[ ⊙ ]'), beacon ? 'beacon' : 'relic', '     '];
    for (var r = 0; r < 3; r++) {
      lines.push(row('  ' + bench[r] + rep(' ', 8) + padC(mid[r], 5) + rep(' ', 9) + scout[r] + '  '));
    }
    var figures = '';
    if (rooms && G.prestige.count >= 2) figures += '[≋] ';
    if (rooms && G.prestige.count >= 3) figures += '†  ';
    var shelf = '';
    if (rooms && G.flags.libraryVisible) {
      var vols = libraryUnlocked().length, spines = Math.min(6, Math.ceil(vols / 5));
      shelf = '  ' + rep('║', spines) + rep('▒', 6 - spines) + ' {shelf}';
    }
    lines.push(row(shelf + rep(' ', Math.max(0, W - vlen(shelf) - figures.length - 2)) + figures));
    lines.push('╠' + rep('═', W) + '╣');

    function item(built, name, count) {
      if (!built || !rooms) return '{' + name + '} ·';
      return name + (count > 1 ? ' ×' + count : ' ✓');
    }
    var lower = '  ' + [
      item(b.scrapDepot, 'depot', b.scrapDepot),
      item(b.ancientWorkshop, 'workshop', 1),
      item(b.memoryTerminal, 'terminal', b.memoryTerminal),
      item(b.golemForge, 'forge', 1)
    ].join('   ');
    lines.push(row(lower));
    lines.push('╚' + rep('═', W) + '╝');
    var taps = Math.min(b.leyTap || 0, 20);
    var ley = '';
    for (var t = 0; t < 20; t++) ley += (t < taps && rooms ? '◈' : '≋') + ' ';
    lines.push('   ' + ley + ' {ley lines}');

    var cLit   = mode === 'blaze' ? 'pnl-gold' : (mode === 'cool' ? 'pnl-cool' : 'pnl-lit');
    var cFrame = mode === 'blaze' ? 'pnl-gold' : (mode === 'cool' ? 'pnl-cool' : (mode === 'ruin' ? 'pnl-ruin' : 'pnl-frame'));
    var cRoom  = mode === 'blaze' ? 'pnl-gold' : (mode === 'cool' ? 'pnl-cool' : 'pnl-room');
    function sp(cls, s, style) { return '<span class="' + cls + '"' + (style ? ' style="' + style + '"' : '') + '>' + s + '</span>'; }
    var breathing = mode === 'normal' && !reducedMotion();
    var litIdx = 0, leyIdx = 0;
    var cLey = (mode === 'normal' && rooms) ? 'pnl-ley' : 'pnl-dim';
    function colour(s) {
      return s
        .replace(/\{([^}]*)\}/g, function(m, inner) { return sp('pnl-dim', inner); })
        .replace(/[╔╗╚╝║═╠╣]/g, function(m) { return sp(cFrame, m); })
        .replace(/[┌┐└┘│─]/g, function(m) { return sp(cRoom, m); })
        .replace(/~/g, function() { return sp(cLit, '~', breathing ? 'animation-delay:-' + ((litIdx++ * 0.7) % 4.2).toFixed(2) + 's' : ''); })
        .replace(/·/g, sp('pnl-dim', '·'))
        .replace(/⊙/g, sp('pnl-gold', '⊙'))
        .replace(/◉/g, sp('pnl-flash', '◉'))
        .replace(/★/g, sp('pnl-res', '★'))
        .replace(/◈/g, sp(cLit, '◈'))
        .replace(/≋/g, function() { return sp(cLey, '≋', breathing ? 'animation-delay:-' + ((leyIdx++ * 0.45) % 6).toFixed(2) + 's' : ''); })
        .replace(/†/g, sp('pnl-tech', '†'))
        .replace(/✓/g, sp(cRoom, '✓'));
    }
    var night = mode === 'normal' && isNight();
    return '<pre class="archive-panel' + (mode === 'ruin' ? ' panel-ruin' : '') + (night ? ' panel-night' : '') + '">' + lines.map(colour).join('\n') + '</pre>';
  },

  /* ── WORLD MAP (fog of war) ──────────── */
  worldMap: function() {
    var vis = G.explore.visited || [];
    var IW = 42;
    function rep(ch, k) { return new Array(Math.max(0, k) + 1).join(ch); }
    function padR(s, w) { return s + rep(' ', w - s.length); }
    function padC(s, w) { var l = Math.floor((w - s.length) / 2); return rep(' ', l) + s + rep(' ', w - s.length - l); }
    function row(inner) { return '  ║' + padR(inner, IW) + '║'; }
    function state(id) {
      if (vis.indexOf(id) !== -1) return 'v';
      if (zoneUnlocked(id)) return 'u';
      return 'l';
    }
    var visitedLabels = [];
    var now = Date.now(), frame = Math.floor(now / 300);
    if (!RENDER._zoneSeen) RENDER._zoneSeen = {};
    function lab(id) {
      var s = state(id);
      if (s === 'v') { visitedLabels.push(DATA.zones[id].mapLabel); return padC(DATA.zones[id].mapLabel, 20); }
      if (s === 'u') {
        /* The Scout Post reads something: a newly reachable place flickers for a few seconds */
        if (!RENDER._zoneSeen[id]) RENDER._zoneSeen[id] = now;
        var fresh = (now - RENDER._zoneSeen[id]) < 6000 && !reducedMotion();
        return padC(fresh && (frame % 2) ? '▒ ? ▒ ? ▒' : '? ? ? ? ?', 20);
      }
      return padC('▓▓▓▓▓▓▓▓▓▓▓▓', 20);
    }
    function side(id, k) { return state(id) === 'l' ? '   ' : DATA.mapSides[id][k]; }
    function box(id, connectorBelow) {
      return [
        row('  ' + side(id, 0) + '  ╔════════════════════╗  ' + side(id, 2) + '        '),
        row('  ' + side(id, 1) + '  ║' + lab(id) + '║  ' + side(id, 3) + '        '),
        row('  ' + side(id, 1) + '  ╚══════════' + (connectorBelow ? '┬' : '═') + '═════════╝  ' + side(id, 3) + '        ')
      ].join('\n');
    }
    function connector(id) { return row('  ' + side(id, 0) + '             │            ' + side(id, 2) + '        '); }
    var cathedral = state('cathedral_of_first_light');
    var cathRow = cathedral === 'l'
      ? row(rep(' ', 18) + '│')
      : row('  † †' + rep(' ', 13) + (cathedral === 'v' ? '├────[† CATHEDRAL †]' : '├────[ ? ? ? ? ? ]'));
    if (cathedral === 'v') visitedLabels.push('† CATHEDRAL †');

    var lines = [
      '  ╔' + rep('═', IW) + '╗',
      row('  ≋ ≋ ≋  A E T H O R I A  ≋ ≋ ≋'),
      row('  ── what the Scout Post has read ──'),
      '  ╠' + rep('═', IW) + '╣',
      row(''),
      box('lattice_core', true),
      connector('lattice_core'),
      box('deep_vault', true),
      connector('deep_vault'),
      box('shattered_spire', true),
      cathRow,
      box('sunken_district', true),
      row(rep(' ', 18) + '├──────[★ THE ARCHIVE]'),
      box('overgrown_road', true),
      row(rep(' ', 18) + '│'),
      box('ruined_outpost', false),
      row(''),
      '  ╚' + rep('═', IW) + '╝'
    ];
    var out = lines.join('\n');
    out = out.replace(/\? \? \? \? \?/g, '<span class="text-dim" style="opacity:.8">? ? ? ? ?</span>')
             .replace(/▒ \? ▒ \? ▒/g, '<span class="text-memory" style="opacity:.8">▒ ? ▒ ? ▒</span>')
             .replace(/▓{12}/g, '<span style="opacity:.35">▓▓▓▓▓▓▓▓▓▓▓▓</span>')
             .replace(/★ THE ARCHIVE/g, '<span class="text-gold">★ THE ARCHIVE</span>');
    visitedLabels.forEach(function(l) {
      out = out.split(l).join('<span class="text-bright">' + l + '</span>');
    });
    return out;
  },

  /* ── THE AWAKENING ───────────────────── */
  screenAwakening: function() {
    var a = G.awakening;
    var lvl = DATA.prestigeLevels[a.level - 1];
    var html = '<div class="section awakening-screen">';
    html += '<div class="section-header">── THE AWAKENING — ' + lvl.name.toUpperCase() + ' ─────────────</div>';
    html += RENDER.archivePanel({});
    html += RENDER.chordBar(a);
    html += '<div class="awakening-lines">';
    a.lines.forEach(function(l) { html += '<div class="awakening-line">' + escapeHtml(l) + '</div>'; });
    html += '</div>';
    if (a.level < 6 && (Date.now() - a.start) / 1000 >= 4) {
      html += '<div style="margin-top:14px;"><button class="btn btn-small" style="opacity:.45;" onclick="Prestige.skip()">[ skip ]</button></div>';
    }
    html += '</div>';
    return html;
  },

  /* The chord, visible: a bar that rises with the audio envelope while the valley sings */
  chordBar: function(a) {
    if (!a) return '';
    var t = (Date.now() - a.start) / 1000;
    var level = t < 1.6 ? t / 1.6 : (t < 8 ? 1 : (t < 9.8 ? 1 - (t - 8) / 1.8 : 0));
    if (level <= 0.02) return '';
    var blocks = '▁▂▃▄▅▆▇█', out = '';
    for (var i = 0; i < 30; i++) {
      var h = level * (0.55 + 0.45 * Math.sin(i * 0.7 + t * 5));
      out += blocks[Math.max(0, Math.min(7, Math.round(h * 7)))];
    }
    return '<div class="chord-bar ' + (a.mode === 'cool' ? 'pnl-cool' : 'pnl-gold') + '">' + out + '</div>';
  },

  /* Zone and enemy art with a little life in it (water, sparks, wraiths, eyes) */
  liveArt: function(str, key) {
    if (!str || reducedMotion()) return str;
    var frame = Math.floor(Date.now() / 300);
    var out = str;
    if (key === 'sunken_district' || key === 'care_golem' || key === 'protocol_drone' || key === 'backdrop' || key === 'district_arrival') {
      if (frame % 2) { var w = 0; out = out.replace(/≈/g, function() { return (w++ % 2) ? '~' : '≈'; }); }
      else           { var w2 = 0; out = out.replace(/≈/g, function() { return (w2++ % 2) ? '≈' : '~'; }); }
    }
    if (key === 'ruined_outpost') {
      if (frame % 3 === 0) out = out.replace(/[*·]/g, function(m) { return m === '*' ? '·' : '*'; });
    }
    if (key === 'shattered_spire' || key === 'mana_wraith' || key === 'spire_chantor') {
      var cyc = ['~', '≈', '≋'][frame % 3];
      out = out.replace(/~/g, cyc);
    }
    if (key === 'care_golem' && G.combat.active && (Date.now() - (G.combat.lastEnemyHitAt || 0)) < 700) {
      out = out.replace('^ ^', '@ @');
    }
    return out;
  },

  /* The hymn: notes filling the nave */
  hymnProgress: function(pct) {
    var len = 26, filled = Math.min(len, Math.floor((pct / 100) * len));
    var s = '';
    for (var i = 0; i < len; i++) s += (i < filled) ? ((i % 3 === 1) ? '♪' : '─') : '·';
    return '<span class="road-line" style="color:var(--gold)">  ' + s + '</span>';
  },

  /* The scout on the road: a figure walking the paving; darker after nightfall */
  roadProgress: function(pct) {
    var len = 26, pos = Math.min(len - 1, Math.floor((pct / 100) * len));
    var s = '';
    for (var i = 0; i < len; i++) s += (i === pos) ? 'o' : ((i % 2) ? '─' : '·');
    var night = isNight();
    return '<span class="road-line' + (night ? ' road-night' : '') + '">' + (night ? '☾ ' : '  ') + s + '</span>';
  },

  /* ── A SCENE ─────────────────────────── */
  screenScene: function() {
    var sc = G.scene, s = DATA.scenes[sc.id];
    var html = '<div class="section scene-screen">';
    html += '<div class="section-header">── ' + s.title + ' ─────────────────────────────</div>';
    if (s.art && DATA.zones[s.art]) html += '<pre class="zone-art ' + (DATA.zones[s.art].asciiColor || 'text-dim') + '" style="border:none;opacity:.9;">' + RENDER.liveArt(DATA.zones[s.art].ascii, s.art) + '</pre>';
    html += '<div class="awakening-lines">';
    for (var i = 0; i < sc.shown; i++) html += '<div class="awakening-line scene-line">' + escapeHtml(s.lines[i]) + '</div>';
    html += '</div>';
    if (sc.shown >= s.lines.length) html += '<div style="margin-top:14px;"><button class="btn btn-memory" onclick="Scene.end()">[ ' + s.button + ' ]</button></div>';
    html += '</div>';
    return html;
  },

  /* ── THE ENDING ──────────────────────── */
  screenEnding: function() {
    var e = G.ending;
    var html = '<div class="section ending-screen">';
    html += '<div class="section-header">── THE MEMORY TERMINAL ─────────────────────────</div>';
    if (e.phase === 'scroll') {
      var glyphs = '▓░▒◈≋║═╬┼·~*#@0123456789';
      var pool = DATA.lore.map(function(l) { return loreText(l.text).replace(/\s+/g, ' '); });
      var out = '';
      for (var i = 0; i < 16; i++) {
        var src = pool[Math.floor(Math.random() * pool.length)];
        var start = Math.floor(Math.random() * Math.max(1, src.length - 60));
        var frag = src.substr(start, 30 + Math.floor(Math.random() * 30));
        var noise = '';
        for (var g = 0; g < 8 + Math.floor(Math.random() * 12); g++) noise += glyphs[Math.floor(Math.random() * glyphs.length)];
        out += (Math.random() < 0.5 ? noise + ' ' + frag : frag + ' ' + noise) + '\n';
      }
      html += '<pre class="terminal-scroll">' + escapeHtml(out) + '</pre>';
      html += '<div class="text-dim" style="font-size:0.82rem;font-style:italic;margin-top:8px;">Pages. Books. Everything it has been holding for a thousand years, faster than you can read.</div>';
    } else {
      html += '<div class="ending-lines">';
      e.lines.forEach(function(l) {
        if (l.who === 'veritas') html += '<div class="end-veritas">&gt; ' + escapeHtml(l.text) + '</div>';
        else if (l.who === 'hero') html += '<div class="end-hero">' + escapeHtml(G.heroName) + ': ' + escapeHtml(l.text) + '</div>';
        else if (l.who === 'pause') html += '<div class="end-pause">. . . ' + escapeHtml(l.text) + '</div>';
        else html += '<div class="end-note">' + escapeHtml(l.text) + '</div>';
      });
      if (e.phase !== 'done') html += '<div class="end-veritas" style="opacity:.5;">▌</div>';
      html += '</div>';
      if (e.phase === 'done') {
        html += '<div style="margin-top:18px;"><button class="btn btn-prestige" onclick="Ending.finalize()">[ THE MORNING ]</button></div>';
      }
    }
    html += '</div>';
    return html;
  },

  /* Returns a human-readable "time until affordable" string, or '' if unknown. */
  timeToAfford: function(costObj) {
    var maxSecs = 0;
    var anyMissing = false;
    /* Base passive rates */
    var rateMap = {
      mana: G.resProd.mana || 0,
      scrap: G.resProd.scrap || 0,
      memoryShard: G.resProd.memoryShard || 0,
      arcaneCore: 0,
      etherCell: 0
    };
    /* Estimate arcaneCore / etherCell rates from active crafting slots */
    var slotNames = ['slot0', 'slot1'];
    for (var s = 0; s < slotNames.length; s++) {
      var slot = G.crafting[slotNames[s]];
      if (!slot) continue;
      var recipe = DATA.recipes[slot.recipeId];
      if (!recipe || !recipe.output || !recipe.output.resource) continue;
      var timeLeftMs = slot.endTime - Date.now();
      if (timeLeftMs <= 0) continue;
      var timeLeftSecs = timeLeftMs / 1000;
      var outResource = recipe.output.resource;
      if (outResource === 'arcaneCore' || outResource === 'etherCell') {
        rateMap[outResource] += recipe.output.amount / timeLeftSecs;
      }
    }
    for (var k in costObj) {
      var need = costObj[k] - Math.floor(G.res[k] || 0);
      if (need <= 0) continue;
      anyMissing = true;
      var rate = rateMap[k];
      if (!rate || rate <= 0) return ''; // resource has no passive income — can't estimate
      var t = need / rate;
      if (t > maxSecs) maxSecs = t;
    }
    if (!anyMissing || maxSecs <= 0) return '';
    if (maxSecs > 3600) return ''; // too far out, not useful to show
    return '~' + formatTime(maxSecs);
  }
};

/* ── GLOBAL UI HELPERS ─────────────────── */
function setScreen(id) {
  G.ui.lastScreen = G.ui.screen;
  G.ui.screen = id;
  RENDER.render();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
