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
for (const f of ['data.js','state.js','engine.js','combat.js','exploration.js','prestige.js','render.js']) vm.runInThisContext(fs.readFileSync(dir+f,'utf8'), {filename:f});
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
let n = Engine.advanceDecoding(75*3+1, true);
assert(n===3 && G.decoding.memory_shard_first.done===3, 'three segments after 225s (got '+n+', done '+G.decoding.memory_shard_first.done+' of '+segs+')');
Engine.advanceDecoding(75*segs, true);
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

console.log('G. renderers');
G.buildings={manaConduit:4, runicWorkbench:1, scrapDepot:2}; G.awakening=null;
let panel = strip(RENDER.archivePanel({}));
assert((panel.match(/~/g)||[]).length===4 && panel.indexOf('BENCH')!==-1 && panel.indexOf('depot ×2')!==-1, 'panel reflects buildings');
let widths = [...new Set(panel.split('\n').slice(1,10).map(l=>l.length))];
assert(widths.length===1, 'panel frame lines equal width: '+widths.join(','));
G.buildings.scoutPost=1; G.explore.visited=[]; G.stats.enemiesDefeated=0;
let map = strip(RENDER.worldMap());
assert(map.indexOf('? ? ? ? ?')!==-1 && map.indexOf('OVERGROWN ROAD')===-1 && map.indexOf('LATTICE CORE')===-1, 'fog: road unknown, core hidden');
G.explore.visited=['overgrown_road']; map = strip(RENDER.worldMap());
assert(map.indexOf('OVERGROWN ROAD')!==-1, 'visited road named');
let mw=[...new Set(map.split('\n').map(l=>l.length))]; assert(mw.length===1, 'map lines equal width: '+mw.join(','));

console.log('H. save/load');
G.seeds={wolfStare:true}; G.decoding={memory_shard_first:{done:2,progress:0.5,complete:false}}; G.explore.zoneRuns={sunken_district:3}; G.heroName='<b>x</b>Sal';
saveGame(); G.seeds={}; G.decoding={}; G.explore.zoneRuns={};
assert(loadGame() && G.seeds.wolfStare && G.decoding.memory_shard_first.done===2 && G.explore.zoneRuns.sunken_district===3, 'persisted fields');
assert(G.heroName==='xSal', 'hero name sanitised: '+G.heroName);

console.log('I. content sanity');
assert(DATA.veritasTransmissions.every(t=>t.text.startsWith('PARTIAL')), 'no Caldris in transmissions');
let coh = DATA.veritasTransmissions.map(t=>parseInt(t.text.match(/Coherence: (\d+)/)[1])); assert(coh.every((c,i)=>i===0||c>coh[i-1]), 'coherence ascending: '+coh.join(','));
assert(DATA.lore.filter(l=>l.decode).length===8, 'decode-flagged entries: '+DATA.lore.filter(l=>l.decode).map(l=>l.id).join(','));
assert(DATA.prologue.length===4 && DATA.awakeningVariants[5] && DATA.ending.exchange.length===3, 'prologue/variants/ending data');
console.log(fails ? ('\n'+fails+' FAILURES') : '\nALL PASSED');
process.exit(fails ? 1 : 0);
