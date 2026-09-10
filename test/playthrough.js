/* Arcanum Machina — headless playthrough bot.
   Run:  node test/playthrough.js [hours=300] [seed=12345]
   Plays the real game logic at accelerated time with a greedy, reasonable player and prints
   when each milestone happens. Use it to judge pacing, not to win. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'js') + path.sep;
const MAX_HOURS = parseFloat(process.argv[2] || '300');
let seed = parseInt(process.argv[3] || '12345', 10);

global.window = global;
global.document = { getElementById: () => null, addEventListener(){}, activeElement: null, documentElement:{style:{},setAttribute(){},removeAttribute(){}} };
global.localStorage = { getItem: () => null, setItem(){} };
global.location = { reload(){} };
let simNow = 1700000000000;
Date.now = () => simNow;
Math.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
for (const f of ['data.js','state.js','engine.js','combat.js','exploration.js','prestige.js','render.js']) vm.runInThisContext(fs.readFileSync(dir+f,'utf8'), {filename:f});

G.heroName = 'Bot'; G.flags.introComplete = true; Engine.lastTick = simNow;
const start = simNow;
const events = [];
function hms(s) { s = Math.floor(s); const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return (h ? h + 'h ' : '') + String(m).padStart(2, '0') + 'm'; }
function mark(label) { events.push({ t: (simNow - start) / 1000, label }); }

/* ── policy ── */
const GEAR = ['ironStaff','scrapCoat','leyConduitWand','circuitVest','arcaneGoggles','architectBlade','echoLantern','latticeBrace','golemChassis','resonancePendant','veritasShard','architectsCodex'];
function owned(id) { return G.inventory.indexOf(id) !== -1 || Object.values(G.hero.equipment).indexOf(id) !== -1; }
function score(eqId) { const s = DATA.equipment[eqId].stats; return (s.attack||0)*3 + (s.defense||0)*3 + (s.maxHp||0)*0.3 + (s.manaPerSec||0)*4 + (s.exploreSpeed||0)*20 + (s.shardFind||0)*20 + (s.hpRegen||0)*4; }

function tryBuild() {
  const order = ['resonanceBeacon','golemForge','memoryTerminal','ancientWorkshop','scoutPost','runicWorkbench','scrapDepot','leyTap','manaConduit'];
  for (const id of order) {
    const b = DATA.buildings[id], count = G.buildings[id] || 0;
    if (!b.unlockCondition(G) || (b.max && count >= b.max)) continue;
    if (id === 'scrapDepot' && count >= 6) continue;
    const cost = getBuildingCost(id, count);
    if (!canAfford(cost)) continue;
    if (id === 'leyTap' && (G.res.arcaneCore || 0) < cost.arcaneCore + 12) continue;
    if (id === 'manaConduit' && count >= 3 && G.res.mana < G.resCap.mana * 0.6) continue;
    buyBuilding(id); return true;
  }
  return false;
}
function tryScavenge() {
  if ((G.buildings.scoutPost || 0) >= 1) return;
  if (Date.now() < G.scavenge.cooldownUntil) return;
  doScavenge();
}
function tryCraft() {
  if (!G.flags.craftingVisible) return;
  for (const id of GEAR) {
    if (!Crafting.getFreeSlot()) return;
    if (owned(id)) continue;
    const r = DATA.recipes[id];
    if (r.unlockCondition(G) && canAfford(r.cost)) Crafting.startCraft(id);
  }
  if (Crafting.getFreeSlot() && DATA.recipes.etherCell.unlockCondition(G) && (G.res.arcaneCore || 0) >= 10 && G.res.etherCell < G.resCap.etherCell && G.res.mana >= 100) Crafting.startCraft('etherCell');
  if (Crafting.getFreeSlot() && DATA.recipes.arcaneCore.unlockCondition(G) && G.res.arcaneCore < G.resCap.arcaneCore && G.res.mana >= 60 && G.res.scrap >= 8) Crafting.startCraft('arcaneCore');
}
function tryEquip() {
  for (const id of G.inventory.slice()) {
    const eq = DATA.equipment[id]; if (!eq || eq.slot === 'consumable') continue;
    const cur = G.hero.equipment[eq.slot];
    if (!cur || score(id) > score(cur)) Equipment.equip(id);
  }
}
function worstEnemyRisk(z) {
  let worst = 0;
  for (const eid of DATA.zones[z].enemies) {
    const e = DATA.enemies[eid]; if (e.noncombat) continue;
    const turns = Math.ceil(e.hp / Math.max(1, getHeroAttack() - e.defense));
    const taken = turns * Math.max(1, e.attack - getHeroDefense());
    worst = Math.max(worst, taken / getHeroMaxHp());
  }
  return worst;
}
let lastWasFight = false;
function act() {
  if (G.explore.active || G.combat.active || G.awakening || G.ending) return true;
  if (G.combat.result) { Combat.clearResult(); }
  if (Date.now() < G.combat.cooldownUntil) return true;
  const zones = DATA.zoneOrder.filter(z => zoneUnlocked(z));
  if (!zones.length) return false;
  const unvisited = zones.find(z => G.explore.visited.indexOf(z) === -1);
  if (unvisited) { Exploration.startExplore(unvisited); return true; }
  const hpFrac = getHeroHp() / getHeroMaxHp();
  const fightable = zones.filter(z => worstEnemyRisk(z) < 0.7);
  const fightZone = fightable.length ? fightable[fightable.length - 1] : null;
  const exploreZone = zones[zones.length - 1];
  if (fightZone && hpFrac > 0.6 && !lastWasFight) { Combat.startFight(fightZone); lastWasFight = true; return true; }
  Exploration.startExplore(exploreZone); lastWasFight = false; return true;
}

/* ── run ── */
const seen = { buildings: {}, zones: {}, lore: {}, decoded: {}, prestige: 0, ended: false };
let idleTicks = 0, ticks = 0, cycleStart = 0;
const cycleIdle = [];
while ((simNow - start) / 1000 < MAX_HOURS * 3600) {
  simNow += 1000; ticks++;
  Engine.tick();
  tryScavenge(); tryBuild(); tryCraft(); tryEquip();
  const busy = act();
  if (!busy && !G.crafting.slot0 && !G.crafting.slot1) idleTicks++;
  if (G.awakening === null && G.ending === null && Prestige.canAwaken()) { Prestige.doAwaken(); }
  if (G.ending && G.ending.phase === 'done') { Ending.finalize(); }

  for (const id in G.buildings) if (!seen.buildings[id] && G.buildings[id]) { seen.buildings[id] = true; mark('built    ' + DATA.buildings[id].name); }
  for (const z of G.explore.visited) if (!seen.zones[z]) { seen.zones[z] = true; mark('reached  ' + DATA.zones[z].name); }
  for (const id of G.loreUnlocked) if (!seen.lore[id]) { seen.lore[id] = true; mark((getLoreEntry(id).decode ? 'shard    ' : 'record   ') + getLoreEntry(id).title); }
  for (const id in G.decoding) if (G.decoding[id].complete && !seen.decoded[id]) { seen.decoded[id] = true; mark('decoded  ' + getLoreEntry(id).title); }
  if (G.prestige.count > seen.prestige) {
    seen.prestige = G.prestige.count;
    const t = (simNow - start) / 1000;
    cycleIdle.push({ cycle: seen.prestige, dur: t - cycleStart, idle: idleTicks });
    idleTicks = 0; cycleStart = t;
    mark('★ AWAKENING ' + seen.prestige + ' — ' + DATA.prestigeLevels[seen.prestige - 1].name);
  }
  if (G.flags.ended && !seen.ended) { seen.ended = true; mark('■ THE ENDING'); break; }
}

/* ── report ── */
console.log('ARCANUM MACHINA — playthrough (seed ' + process.argv[3] + ', cap ' + MAX_HOURS + ' h)\n');
let prev = 0;
for (const e of events) { console.log(hms(e.t).padStart(9) + '  (+' + hms(e.t - prev).padStart(7) + ')  ' + e.label); prev = e.t; }
console.log('\n── cycles ──');
for (const c of cycleIdle) console.log('cycle ' + c.cycle + ': ' + hms(c.dur) + '  (idle with nothing to do: ' + hms(c.idle) + ')');
const total = (simNow - start) / 1000;
console.log('\nsim time ' + hms(total) + ' · level ' + G.hero.level + ' · kills ' + G.stats.enemiesDefeated + ' · runs ' + G.stats.exploreRuns + ' · prestige ' + G.prestige.count + (seen.ended ? ' · ENDED' : ' · NOT ENDED'));
if (!seen.ended) {
  console.log('state: res ' + JSON.stringify(Object.fromEntries(Object.entries(G.res).map(([k,v]) => [k, Math.floor(v)]))) + ' caps ' + JSON.stringify(G.resCap));
  console.log('buildings ' + JSON.stringify(G.buildings));
  const next = DATA.prestigeLevels[G.prestige.count];
  if (next) console.log('next awakening needs resonance ' + next.resonanceReq + ' (have ' + G.prestige.resonance + '), lifetime mana ' + next.manaReq + ' (have ' + Math.floor(G.stats.totalMana) + '), beacon ' + (G.buildings.resonanceBeacon ? 'built' : 'not built'));
}
