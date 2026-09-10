/* Arcanum Machina — logic regression harness.
   Run:  node test/harness.js
   Loads the real game modules in Node with a stub DOM and drives the systems that
   are hard to reach by playing: caps, shard decoding, the Awakening timeline, the
   ending, scripted encounters, the ASCII renderers, and save/load. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', 'js') + path.sep;
const store = {};
global.window = global;
global.document = { getElementById: () => null, addEventListener(){}, activeElement: null, documentElement:{style:{},setAttribute(){},removeAttribute(){}} };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem(k,v){ store[k]=String(v); } };
global.location = { reload(){} };
for (const f of ['data.js','state.js','engine.js','combat.js','exploration.js','prestige.js','render.js','music.js','sounds.js']) vm.runInThisContext(fs.readFileSync(dir+f,'utf8'), {filename:f});
let fails = 0; function assert(c, msg){ console.log((c?'  ok   ':'  FAIL ')+msg); if(!c) fails++; }
const strip = s => s.replace(/<[^>]+>/g,'');

console.log('A. caps');
G.buildings = { manaConduit:35, leyTap:14, ancientWorkshop:1, memoryTerminal:5, golemForge:1 };
Engine.checkBuildingCapEffects();
assert(G.resCap.arcaneCore===180 && G.resCap.memoryShard===45 && G.resCap.etherCell===60 && G.resCap.mana===6150, 'caps: '+JSON.stringify(G.resCap));
['mana','scrap','arcaneCore','memoryShard','etherCell'].forEach(r=>resAdd(r,1e6));
assert(DATA.buildings.resonanceBeacon.unlockCondition(G), 'beacon unlock visible');
assert(canAfford(getBuildingCost('resonanceBeacon',0)), 'beacon affordable at full caps: '+JSON.stringify(getBuildingCost('resonanceBeacon',0)));
G.prestige.count=5; assert(getBuildingCost('resonanceBeacon',0).arcaneCore===Math.floor(150*Math.pow(0.85,5)*0.5), 'beacon half price + scaling at p5: '+getBuildingCost('resonanceBeacon',0).arcaneCore);
G.prestige.count=0;

console.log('B. decoding');
G.buildings = { memoryTerminal:1 }; G.res.memoryShard = 1; G.loreUnlocked=[]; G.decoding={};
Engine.checkLoreUnlocks();
assert(G.decoding.memory_shard_first && !G.decoding.memory_shard_first.complete, 'shard 0001 enters decoding');
const segs = loreSegments(getLoreEntry('memory_shard_first')).length;
const per = decodeSegmentSeconds();
let n = Engine.advanceDecoding(per*3+1, true);
assert(n===3 && G.decoding.memory_shard_first.done===3, 'three segments after 3×'+per+'s (got '+n+', done '+G.decoding.memory_shard_first.done+' of '+segs+')');
assert(Engine.decodedReport['Recovered Data Fragment — ID: 0001']===3, 'decoded report counts segments per entry');
Engine.advanceDecoding(per*segs, true);
assert(isLoreDecoded('memory_shard_first'), 'complete after enough time');
G.buildings = {}; G.decoding={x:{done:0,progress:0}}; assert(Engine.advanceDecoding(1000,true)===0, 'no terminal -> no progress');
G.decoding = {};

console.log('C. awakening timeline');
G.buildings = { manaConduit:6, resonanceBeacon:1, runicWorkbench:1, scrapDepot:2 }; G.stats.totalMana=5000; G.prestige={count:0,resonance:0,totalEarned:0,multiplier:1};
assert(Prestige.canAwaken(), 'can awaken');
Prestige.doAwaken();
assert(G.awakening && G.awakening.level===1, 'sequence started');
let t0 = G.awakening.start; let modes=[];
for (let t=0;t<=36;t+=0.5){ Prestige.tick(t0+t*1000); if(G.awakening&&modes[modes.length-1]!==G.awakening.mode) modes.push(G.awakening.mode); if(!G.awakening) break; }
assert(!G.awakening, 'sequence finished');
assert(modes.join(',')==='blaze,normal,dimming,dark,ruin', 'modes: '+modes.join(','));
assert(G.prestige.count===1 && G.buildings.manaConduit===1 && !G.buildings.resonanceBeacon, 'reset with 1 conduit pre-lit: '+JSON.stringify(G.buildings));
assert(G.veritasHint.lastTime===G.playTime, 'hint timer reset to playTime');

console.log('D. ending (6th)');
G.buildings = { manaConduit:8, resonanceBeacon:1, memoryTerminal:2, ancientWorkshop:1, golemForge:1, scoutPost:1, runicWorkbench:1 };
G.prestige={count:5,resonance:250,totalEarned:250,multiplier:2.25}; G.stats.totalMana=400000; G.heroName='Salem';
Prestige.doAwaken(); t0=G.awakening.start; let sawCool=false;
for (let t=0;t<=25;t+=0.5){ Prestige.tick(t0+t*1000); if(G.awakening&&G.awakening.mode==='cool') sawCool=true; if(G.ending) break; }
assert(sawCool && G.ending && G.ending.phase==='scroll', 'ending began after cool mode');
let e0=G.ending.start; let guard=0;
while (G.ending.phase!=='done' && guard++<2000){ Ending.tick(e0 + guard*500); }
assert(G.ending.phase==='done', 'ending reached done');
const heroLines = G.ending.lines.filter(l=>l.who==='hero').length, ver = G.ending.lines.filter(l=>l.who==='veritas').length;
assert(ver===5 && heroLines===4 && G.ending.lines.some(l=>l.who==='pause'), 'exchange lines: veritas '+ver+', hero '+heroLines);
assert(G.ending.lines[0].text.indexOf('Hello, Salem')===0, 'hello uses hero name');
Ending.finalize();
assert(G.flags.ended && !G.ending && G.buildings.memoryTerminal===2 && G.buildings.manaConduit===5 && !G.buildings.golemForge, 'deep structures kept: '+JSON.stringify(G.buildings));
assert(RENDER.getStatusFlavor().indexOf('students')!==-1, 'post-ending status line');

console.log('E. vault handshake');
G.prestige.count=0; G.buildings={golemForge:1, scoutPost:1}; G.stats.enemiesDefeated=60; G.hero.hp=50; G.combat.cooldownUntil=0; G.combat.active=false; G.combat.result=null;
G.res.memoryShard=0; Engine.checkBuildingCapEffects();
const realRandom=Math.random; Math.random=()=>0;
Combat.startFight('deep_vault');
assert(G.combat.enemyId==='vault_automaton' && G.combat.script, 'automaton scripted');
for (let i=0;i<8;i++) Combat.processTurn();
assert(G.combat.result==='win' && G.combat.heroHp===50 && G.res.memoryShard>=1, 'handshake resolved without damage, shards '+G.res.memoryShard);
assert(G.combat.log.some(l=>/ACCESS GRANTED/.test(l.msg)), 'access granted line');
Combat.clearResult();

console.log('F. wolf that does not attack');
G.stats.enemiesDefeated=1; G.seeds={}; G.combat.cooldownUntil=0; Math.random=()=>0.1;
Combat.startFight('overgrown_road');
assert(G.combat.enemyId==='forest_wolf' && G.combat.script && G.combat.script.resolve==='pass', 'wolf stare scripted');
for (let i=0;i<5;i++) Combat.processTurn();
assert(G.combat.result==='pass' && G.seeds.wolfStare===true && G.stats.enemiesDefeated===1, 'passes, no kill counted');
Combat.clearResult(); G.combat.cooldownUntil=0;
Combat.startFight('overgrown_road'); assert(!G.combat.script, 'second wolf is a real fight'); Combat.flee(); Combat.clearResult();
Math.random=realRandom;

console.log('F2. move slowly / all-clear / visitors');
G.buildings={scoutPost:1, ancientWorkshop:1}; G.stats.enemiesDefeated=25; G.seeds={}; G.combat.cooldownUntil=0; G.hero.hp=50; Math.random=()=>0;
Combat.startFight('sunken_district');
assert(G.combat.enemyId==='care_golem' && DATA.enemies.care_golem.calmable, 'care golem is calmable');
Combat.moveSlowly(); for (let i=0;i<5;i++) Combat.processTurn();
assert(G.combat.result==='pass' && G.seeds.movedSlowly && G.combat.cooldownUntil - Date.now() > 6000, 'moved slowly: pass, seed set, long cooldown');
Combat.clearResult(); G.combat.cooldownUntil=0;
G.relics=['architectsSeal']; G.explore.zoneRuns={shattered_spire:5}; G.res.arcaneCore=30; G.res.etherCell=10; G.res.memoryShard=5; G.stats.enemiesDefeated=40;
assert(Exploration.canClearSpireFlag(), 'spire flag clearable');
Exploration.clearSpireFlag();
assert(G.seeds.spireAllClear && G.res.arcaneCore===0, 'flag cleared and paid');
G.explore.visited=['shattered_spire']; G.res.memoryShard=0; assert(zoneUnlocked('shattered_spire') && strip(RENDER.worldMap()).indexOf('SHATTERED SPIRE')!==-1, 'visited zone stays unlocked with shards spent');
G.explore.visited=['shattered_spire']; G.res.memoryShard=3; Math.random=()=>0.9; // second enemy: architect_sentry
Combat.startFight('shattered_spire');
assert(G.combat.enemyId==='architect_sentry' && G.combat.script && G.combat.script.resolve==='stand', 'sentry stands down');
for (let i=0;i<5;i++) Combat.processTurn(); assert(G.combat.result==='pass', 'sentry encounter passes'); Combat.clearResult();
Math.random=realRandom;
const realIsNight = isNight; isNight = () => false;   // the tests run at whatever hour it happens to be
G.stats.exploreRuns=3; G.playTime=0; G.flags.ended=true; assert(RENDER.currentVisitor()===null, 'no visitors after the ending');
G.flags.ended=false; assert(RENDER.currentVisitor()&&RENDER.currentVisitor().who.indexOf('salt')!==-1, 'first visitor is H.');
G.playTime=2*360+1; assert(RENDER.currentVisitor()===null, 'third window: road quiet');
G.playTime=3*360+1; assert(RENDER.currentVisitor().who.indexOf('pilgrim')!==-1, 'next visitor is the pilgrim');
isNight = () => true; assert(RENDER.currentVisitor()===null, 'nobody comes up the road at night');
isNight = realIsNight;
G.playTime=0;

console.log('G. renderers');
G.buildings={manaConduit:4, runicWorkbench:1, scrapDepot:2}; G.awakening=null;
let panel = strip(RENDER.archivePanel({}));
assert((panel.match(/~/g)||[]).length===4 && panel.indexOf('BENCH')!==-1 && panel.indexOf('depot ×2')!==-1, 'panel reflects buildings');
let widths = [...new Set(panel.split('\n').slice(1,10).map(l=>l.length))];
assert(widths.length===1, 'panel frame lines equal width: '+widths.join(','));
G.buildings.scoutPost=1; G.explore.visited=[]; G.stats.enemiesDefeated=0;
let map = strip(RENDER.worldMap());
assert((map.indexOf('? ? ? ? ?')!==-1 || map.indexOf('▒ ? ▒ ? ▒')!==-1) && map.indexOf('OVERGROWN ROAD')===-1 && map.indexOf('LATTICE CORE')===-1, 'fog: road unknown (or freshly read), core hidden');
G.explore.visited=['overgrown_road']; map = strip(RENDER.worldMap());
assert(map.indexOf('OVERGROWN ROAD')!==-1, 'visited road named');
let mw=[...new Set(map.split('\n').map(l=>l.length))]; assert(mw.length===1, 'map lines equal width: '+mw.join(','));

console.log('H. save/load');
G.seeds={wolfStare:true}; G.decoding={memory_shard_first:{done:2,progress:0.5,complete:false}}; G.explore.zoneRuns={sunken_district:3}; G.heroName='<b>x</b>Sal';
saveGame(); G.seeds={}; G.decoding={}; G.explore.zoneRuns={};
assert(loadGame() && G.seeds.wolfStare && G.decoding.memory_shard_first.done===2 && G.explore.zoneRuns.sunken_district===3, 'persisted fields');
assert(G.heroName==='xSal', 'hero name sanitised: '+G.heroName);

console.log('J. mixer, adaptive score, animation helpers');
Mixer.set('music', 0.2); Mixer.levels.music = 0.9; Mixer.load();
assert(Math.abs(Mixer.levels.music - 0.2) < 1e-9, 'mixer level persists via localStorage');
Mixer.toggleMute(); assert(Mixer.gain('sfx') === 0, 'mute zeroes every bus'); Mixer.toggleMute();
G.buildings = {}; G.prestige.count = 0; G.combat.active = false; G.explore.active = false; G.flags.ended = false; G.awakening = null; G.ending = null;
let L = Music.layersFor(G); assert(L.drone && !L.bass && !L.melody && L.drums === 'none', 'prologue: drone only');
G.buildings = { manaConduit: 1, runicWorkbench: 1, scoutPost: 1 }; L = Music.layersFor(G);
assert(L.bass && L.arp && L.drums === 'sparse' && !L.melody, 'conduit+bench+scout: bass, arp, sparse drums');
G.buildings.ancientWorkshop = 1; G.prestige.count = 3; L = Music.layersFor(G);
assert(L.melody && L.melodyOctave && L.subBass && L.arpFifth && L.drums === 'full', 'workshop + prestige 3: full stack');
Music.mode = 'adaptive';
G.explore.active = true; G.explore.zoneId = 'shattered_spire'; let P = Music.planFor(G);
assert(P.voice === 'shimmer' && P.layers.drums === 'none', 'spire: shimmer voice, no drums');
G.explore.zoneId = 'cathedral_of_first_light'; P = Music.planFor(G); assert(P.voice === 'organ' && P.bpmMult === 0.5, 'cathedral: organ at half tempo');
G.explore.zoneId = 'deep_vault'; P = Music.planFor(G); assert(!P.layers.melody && P.layers.drums === 'pulse', 'vault: drone and pulse only');
G.explore.zoneId = 'sunken_district'; P = Music.planFor(G); assert(P.song.name === 'The Sunken Archive', 'district: the Sunken Archive');
G.explore.active = false; G.combat.active = true; G.combat.zoneId = 'overgrown_road'; G.combat.script = null; P = Music.planFor(G);
assert(!P.layers.melody && !P.layers.arp && P.layers.bass, 'combat ducks melody and arp, keeps bass');
G.combat.active = false; Music.mode = 1; P = Music.planFor(G); assert(P.song.name === 'The Sunken Archive' && P.layers.melody, 'fixed song mode ignores state'); Music.mode = 'adaptive';
G.flags.ended = true; P = Music.planFor(G); assert(P.layers.drone && P.layers.drums === 'none', 'after the ending: drone, no drums'); G.flags.ended = false;
let art = RENDER.liveArt(DATA.zones.sunken_district.ascii, 'sunken_district'); assert(art.length === DATA.zones.sunken_district.ascii.length, 'live art keeps its width');
assert(RENDER.roadProgress(50).indexOf('o') !== -1, 'road figure present');
G.awakening = { start: Date.now() - 3000, mode: 'blaze' }; assert(strip(RENDER.chordBar(G.awakening)).length === 30, 'chord bar 30 blocks at full level'); G.awakening = null;
let e0001 = getLoreEntry('memory_shard_first');
let typed = RENDER.typedSegments(e0001, 2, Date.now() - 100); assert(typed.indexOf('type-cursor') !== -1, 'recent segment is still typing');
typed = RENDER.typedSegments(e0001, 2, Date.now() - 60000); assert(typed.indexOf('type-cursor') === -1, 'old segment fully shown');
G.buildings = {}; G.relicFlashAt = Date.now(); assert(strip(RENDER.archivePanel({})).indexOf('◉') !== -1, 'relic flash renders'); G.relicFlashAt = 0;
G.nextRelicPulse = Date.now() - 1; G.gameLog = []; Engine.checkRelicPulse(Date.now()); assert(G.gameLog[0] && G.gameLog[0].msg.indexOf('relic pulses') !== -1 && G.nextRelicPulse > Date.now() + 50000, 'relic pulse logs and reschedules');

console.log('K. slow records, away panel, hero figure, night');
G.loreUnlocked=[]; G.loreAt={}; G.playTime=1000; G.explore.zoneRuns={sunken_district:20}; G.explore.visited=['sunken_district']; G.decoding={};
Engine.checkLoreUnlocks();
assert(G.loreUnlocked.indexOf('district_mira')!==-1 && G.loreUnlocked.indexOf('district_jorin')===-1, 'Mira unlocks; Jorin waits for time to pass');
G.playTime += 481; Engine.checkLoreUnlocks(); assert(G.loreUnlocked.indexOf('district_jorin')!==-1 && G.loreUnlocked.indexOf('district_the_sound')===-1, 'Jorin after 8 min; the sound waits');
G.playTime += 601; Engine.checkLoreUnlocks(); G.playTime += 901; Engine.checkLoreUnlocks();
assert(G.loreUnlocked.indexOf('district_last')!==-1, 'the last entry after the gaps');
G.awayReport = { seconds: 7200, mana: 900, scrap: 20, filledIn: 2400, decodedSegments: 2, decodedEntries: {'X': 2}, hasTerminal: true, shardsWaiting: 0, visitors: ['H., the salt merchant'], pulses: 2 };
let away = strip(RENDER.awayPanel(G.awayReport));
assert(away.indexOf('gone 2 hours.')!==-1 && away.indexOf('full after 40 minutes')!==-1 && away.indexOf('H., the salt merchant came up')!==-1 && away.indexOf('pulsed twice')!==-1, 'away panel lines: ' + away.split('\n')[1]);
G.awayReport = null;
G.hero.equipment = { weapon: 'ironStaff', armor: null, accessory: null };
let fig = strip(RENDER.heroFigure()); assert(fig.indexOf('|===')!==-1 && fig.indexOf('· · ·')!==-1, 'hero figure shows the staff and an empty slot');
assert(formatTimeProse(50)==='a minute' && formatTimeProse(11520)==='3 hours 12 minutes' && formatTimeProse(90000)==='1 day 1 hour', 'prose durations');
G.hero.equipment = { weapon: null, armor: null, accessory: null };
assert(isNight(23) && isNight(3) && !isNight(12), 'isNight by hour');

console.log('L. hymn, chairs, golem name, the record');
G.explore.visited=['cathedral_of_first_light','lattice_core']; G.explore.active=false; G.combat.active=false; G.combat.result=null; G.seeds={}; G.playTime=5000; G.prestige.count=0;
G.buildings={manaConduit:4}; Engine.checkBuildingCapEffects(); G.res.mana=10;
assert(Exploration.canAttendHymn(), 'hymn available at the Cathedral');
Exploration.attendHymn(); assert(G.explore.active && G.explore.mode==='hymn', 'hymn in progress');
Engine.checkExplore(G.explore.endTime + 1);
assert(!G.explore.active && G.res.mana===G.resCap.mana && G.seeds.hymnCount===1 && !Exploration.canAttendHymn(), 'hymn fills the capacitors and rests the choir');
G.loreUnlocked=[]; Engine.checkLoreUnlocks(); assert(G.loreUnlocked.indexOf('cathedral_hymn')!==-1, 'the hymn record');
Scene.play('core_chairs'); assert(G.scene && G.scene.id==='core_chairs', 'scene started');
Scene.tick(G.scene.start + 3500*6 + 10); assert(G.scene.shown===6, 'all six lines shown in time');
assert(strip(RENDER.screenScene()).indexOf('STAND UP')!==-1, 'stand up offered');
Scene.end(); assert(!G.scene && G.seeds.satInChairs, 'scene ended, chair sat in');
Engine.checkLoreUnlocks(); assert(G.loreUnlocked.indexOf('core_chairs')!==-1, 'the chair record');
G.golemName=''; G.buildings.golemForge=1; G.buildings.scoutPost=1; G.golemSeen={}; G.combat.cooldownUntil=0; G.hero.hp=50; G.stats.enemiesDefeated=10; G.seeds.wolfStare=true; G.seeds.tiredBandit=true; Math.random=()=>0;
Combat.startFight('overgrown_road');
assert(G.combat.log.some(l=>l.msg==='The golem steps up beside you.') && G.combat.log.some(l=>l.msg.indexOf('scans the treeline')!==-1), 'unnamed golem, road line once');
Combat.flee(); Combat.clearResult(); G.combat.cooldownUntil=0;
global.document.getElementById = function(id){ return id==='golem-name-input' ? { value: 'Ferro', blur(){} } : null; };
nameGolem(); assert(G.golemName==='Ferro', 'golem named');
global.document.getElementById = () => null;
Combat.startFight('overgrown_road');
assert(G.combat.log.some(l=>l.msg==='Ferro steps up beside you.') && !G.combat.log.some(l=>l.msg.indexOf('scans the treeline')!==-1), 'named golem, road line not repeated');
Combat.flee(); Combat.clearResult(); Math.random=realRandom;
let rec = buildRecord();
assert(rec.indexOf('ARCANUM MACHINA — A RECORD IN FULL')===0 && rec.indexOf('The Hymn')!==-1 && rec.indexOf('The Chair')!==-1 && rec.indexOf('Companion: Ferro')!==-1 && rec.indexOf('IV. THE AWAKENINGS')!==-1, 'record contains title, records and companion');

console.log('M. the sealed cabinet and the library');
G.cabinet = { noticed:false, steps:0, lastStepAt:0, opened:false }; G.flags.libraryVisible=false; G.seeds.cabinetOpened=false; G.libraryKnown=[]; G.libraryNew=[];
G.buildings = { manaConduit:2, memoryTerminal:1 }; Engine.checkBuildingCapEffects(); G.gameLog=[];
Engine.checkFlagUnlocks(); assert(G.cabinet.noticed && G.gameLog[0].msg.indexOf('sealed cabinet')!==-1, 'cabinet noticed once the Terminal exists');
G.res.mana = 10; pushCabinet(); assert(G.cabinet.steps===0, 'refuses without full capacitors');
G.res.mana = G.resCap.mana; pushCabinet(); assert(G.cabinet.steps===1 && G.res.mana===0, 'first day: drains the capacitors');
G.res.mana = G.resCap.mana; pushCabinet(); assert(G.cabinet.steps===1, 'refuses the same day');
const realDateNow = Date.now; let dayOffset = 0; Date.now = () => realDateNow() + dayOffset;
for (let d = 1; d <= 3; d++) { dayOffset = d * 21 * 3600 * 1000; G.res.mana = G.resCap.mana; pushCabinet(); }
assert(G.cabinet.opened && G.flags.libraryVisible && G.seeds.cabinetOpened && G.cabinet.steps===4, 'opens on the fourth day');
Date.now = realDateNow;
Engine.checkLoreUnlocks(); assert(G.loreUnlocked.indexOf('the_cabinet')!==-1, 'the cabinet record');
G.loreUnlocked = ['on_mana','on_scrap']; G.annotations = ['the_first_ward']; G.prestige.count = 0; G.flags.ended = false; G.explore.zoneRuns = {}; G.decoding = {};
let vols = libraryUnlocked().map(v=>v.id);
assert(vols.indexOf('prologue')!==-1 && vols.indexOf('ch01')!==-1 && vols.indexOf('ch02')!==-1 && vols.indexOf('ch03')!==-1 && vols.indexOf('ch04')===-1 && vols.indexOf('foreword')===-1, 'shelf: prologue + I–III, not IV, foreword sealed');
G.prestige.count = 2; G.explore.zoneRuns = { overgrown_road: 3 }; vols = libraryUnlocked().map(v=>v.id);
assert(vols.indexOf('ch06')!==-1 && vols.indexOf('ch11')!==-1 && vols.indexOf('ch12')!==-1 && vols.indexOf('ch13')===-1, 'shelf: road walked, two Awakenings');
G.flags.ended = true; vols = libraryUnlocked().map(v=>v.id); assert(vols.indexOf('foreword')!==-1 && vols.indexOf('record')!==-1 && vols.indexOf('epilogue')!==-1, 'after the ending: foreword, record, epilogue');
G.flags.ended = false;
let shelf = RENDER.screenLibrary();
assert(shelf.indexOf('spine-link')!==-1 && shelf.indexOf('spine-sealed')!==-1 && shelf.indexOf('spine-empty')!==-1 && shelf.indexOf('THE LIBRARY WING')!==-1, 'shelf renders links, sealed and empty slots');
let shelfLines = strip(shelf.split('<pre')[1].split('</pre>')[0].replace(/^[^>]*>/, '')).split('\n').filter(l=>l.indexOf('║')===0 || l.indexOf('╔')===0 || l.indexOf('╠')===0 || l.indexOf('╚')===0);
assert([...new Set(shelfLines.map(l=>l.length))].length===1, 'shelf lines equal width: ' + [...new Set(shelfLines.map(l=>l.length))].join(','));
G.gameLog=[]; Engine._libraryTick = 9; Engine.checkLibrary();
assert(G.libraryNew.length>0 && G.libraryKnown.length===G.libraryNew.length, 'new volumes noticed');
assert(G.gameLog.length===1 && G.gameLog[0].msg.indexOf('slots filled')!==-1, 'first fill is one line, not one per volume');
G.gameLog=[]; G.prestige.count=3; Engine._libraryTick=9; Engine.checkLibrary();
assert(G.gameLog.length===2 && G.gameLog.every(l=>l.msg.indexOf('A volume on the shelf')!==-1), 'later volumes announce themselves one by one (cycle 3 = chapter + glossary)');
let pw = strip(RENDER.archivePanel({})).split('\n').slice(1,10);
assert([...new Set(pw.map(l=>l.length))].length===1, 'archive panel keeps its width with the shelf row: ' + [...new Set(pw.map(l=>l.length))].join(','));
assert(strip(RENDER.archivePanel({})).indexOf('shelf')!==-1, 'shelf appears in the Archive panel');
assert(DATA.bookUrl.indexOf('github.io/arcanum-machina-book/')!==-1 && DATA.library.length===31, 'book url and 31 volumes');
let anchors = DATA.library.filter(v=>v.anchor).map(v=>v.anchor);
assert(anchors.length===30 && anchors.every(a=>/^#[a-z0-9-]+$/.test(a)) && new Set(anchors).size===30, 'every volume has a unique valid anchor');
assert(DATA.library.every(v=>String(v.num).length<=3), 'every spine numeral fits its slot: ' + DATA.library.filter(v=>String(v.num).length>3).map(v=>v.num).join(','));
assert(new Set(DATA.library.map(v=>v.num)).size===DATA.library.length, 'spine numerals are unique');
G.flags.ended=true; G.prestige.count=6; G.relics=Object.keys(DATA.relics); G.stats.enemiesDefeated=200;
DATA.zoneOrder.forEach(z=>{ G.explore.zoneRuns[z]=5; });
Object.keys(G.decoding).forEach(k=>{ G.decoding[k].complete=true; });
G.loreUnlocked = DATA.lore.map(l=>l.id);
G.annotations  = DATA.annotations.map(a=>a.id);
DATA.lore.filter(l=>l.decode).forEach(l=>{ G.decoding[l.id]={done:99,progress:0,complete:true}; });
let fullRows = strip(RENDER.screenLibrary().split('<pre')[1].split('</pre>')[0].replace(/^[^>]*>/, '')).split('\n').filter(l=>/^[╔║╠╚]/.test(l));
assert([...new Set(fullRows.map(l=>l.length))].length===1, 'shelf stays square with every volume unlocked: ' + [...new Set(fullRows.map(l=>l.length))].join(','));
assert(libraryUnlocked().length===DATA.library.length, 'every volume unlockable: ' + libraryUnlocked().length + '/' + DATA.library.length);
G.flags.ended=false;

console.log('N. narrow (phone) layouts');
assert(RENDER.narrow() === false, 'wide by default when there is no window width');
global.window.innerWidth = 400;
assert(RENDER.narrow() === true, 'narrow under 620px');
G.buildings = { manaConduit: 5, runicWorkbench: 1, scoutPost: 1, scrapDepot: 2, memoryTerminal: 1, leyTap: 2 };
G.awakening = null; G.flags.libraryVisible = true;
let np = strip(RENDER.archivePanel({})).split('\n');
let nFrame = np.filter(l => /^[╔║╠╚]/.test(l));
assert([...new Set(nFrame.map(l => l.length))].length === 1 && nFrame[0].length === 32, 'narrow panel is 32 wide and square: ' + [...new Set(nFrame.map(l => l.length))].join(','));
assert(np.every(l => l.length <= 34), 'no narrow panel line exceeds 34 columns: max ' + Math.max(...np.map(l => l.length)));
assert(np.join('\n').indexOf('relic') !== -1 && np.join('\n').indexOf('BENCH') !== -1, 'narrow panel still shows the relic and the bench');
G.explore.visited = ['overgrown_road', 'sunken_district'];
let nm = strip(RENDER.worldMapNarrow()).split('\n');
assert(nm.every(l => l.length <= 30) && nm.join('\n').indexOf('OVERGROWN ROAD') !== -1 && nm.join('\n').indexOf('THE ARCHIVE') !== -1, 'narrow map is a chain within 30 columns');
let nsRows = strip(RENDER.screenLibrary().split('<pre')[1].split('</pre>')[0].replace(/^[^>]*>/, '')).split('\n').filter(l => /^[╔║╠╚]/.test(l));
assert([...new Set(nsRows.map(l => l.length))].length === 1 && nsRows[0].length === 32, 'narrow shelf rows are square: ' + [...new Set(nsRows.map(l => l.length))].join(','));
delete global.window.innerWidth;
assert(RENDER.narrow() === false, 'back to wide');

console.log('I. content sanity');
assert(DATA.veritasTransmissions.every(t=>t.text.startsWith('PARTIAL')), 'no Caldris in transmissions');
let coh = DATA.veritasTransmissions.map(t=>parseInt(t.text.match(/Coherence: (\d+)/)[1])); assert(coh.every((c,i)=>i===0||c>coh[i-1]), 'coherence ascending: '+coh.join(','));
assert(DATA.lore.filter(l=>l.decode).length===8, 'decode-flagged entries: '+DATA.lore.filter(l=>l.decode).map(l=>l.id).join(','));
assert(DATA.prologue.length===4 && DATA.awakeningVariants[5] && DATA.ending.exchange.length===3, 'prologue/variants/ending data');
console.log(fails ? ('\n'+fails+' FAILURES') : '\nALL PASSED');
process.exit(fails ? 1 : 0);
