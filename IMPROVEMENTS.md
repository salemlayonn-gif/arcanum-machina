# Arcanum Machina — Review & Proposals

*Written 2026-09-10 after reading the full game source and the full book (`../arcanum-machina-book`).
Status pass the same day (v1.1.0): **✅ done · ◐ partial · ☐ open**. Details of what landed are in `DEVLOG.md`.*

Brief from Robert: keep the ASCII graphics; make the game unfold **slowly and ominously**; make the player
feel the **weight of the society**; make them **excited by how the game develops**; check for **bugs**.

---

## Status at a glance

| | Item | Status |
|---|---|---|
| §1 | Bugs A–N | ✅ all fixed (O left as a note) |
| P1 | The arrival (prologue) | ✅ |
| P2 | The Archive panel | ✅ |
| P3 | Fog-of-war map | ✅ |
| P4 | Shards decode slowly | ✅ |
| P5 | Lore order | ✅ |
| P6 | The Awakening as a sequence | ✅ |
| P7 | Faster spiral | ✅ |
| P8 | Nothing dies / Vault handshake / zone mechanics | ✅ |
| P9 | Society weight | ✅ |
| P10 | Show VERITAS before telling | ✅ |
| P11 | Voice pass | ✅ |
| P12 | Sound tie-ins | ✅ |
| P13 | Backdrops / zone art | ✅ |
| P14 | The ending | ✅ (Architect Mode deliberately not) |

**Nothing open.** The last three (P8c, P9d, P13) landed in v1.2.0 the same day.

---

## 0. The headline (fixed)

**The game used to end at roughly one third of its content, and it was not by design.**

Three resource caps — Arcane Cores (20), Memory Shards (15), Ether Cells (20) — were set once and never grew.
`Engine.checkBuildingCapEffects()` only recomputed mana and scrap. Verified by running the game logic in Node:
with 50 conduits and a million of every resource added, Cores stayed at 20. The Resonance Beacon
(150 Cores / 30 Shards / 50 Ether) and the Golem Forge (50 Cores) could never be built, which locked every
Awakening, the Deep Vault, the Cathedral, the Lattice Core, spells, the Ghost, the Scholar, VERITAS hints and
transmissions. A greedy economy simulation then showed a second wall: even fixed, the mana cap topped out at
~4,200 against a 5,000-mana Beacon.

**Fix (✅):** caps grow with buildings — Ancient Workshop +40 Cores; each Memory Terminal +6 Shards; Golem
Forge +120 Cores and +40 Ether. Ley Taps +300 mana cap (was +200); Beacon 4,000 mana (was 5,000); max cap
now ~6,150. `test/harness.js` asserts the Beacon is affordable at full caps.

---

## 1. Bugs

### A ✅ — resource caps never grow
See §0. Thematic option chosen (the Archive's *capacitors* grow with it); building descriptions show the cap gains.

### B ✅ — Caldris ghost lines pasted into `veritasTransmissions`
Removed; coherence sequence now ascends 34 → 38 → 41 → 47 → 52 → 58 → 61 → 67.

### C ✅ — off-by-one showing index 1 first
Hints and transmissions now use `list[count % len]` *then* `count++`.

### D ✅ — prestige bonus text promised things that don't exist
Bonus lists rewritten to what the code does (see P7 for the new mechanics behind them).

### E ✅ — offline progress was meaningless
Offline time now decodes shard segments on the Terminal ("The Terminal decoded 3 segments while you were
gone"), which is the real reason to come back. Mana cap also raised (§0). Engine tick clamp raised 5 s → 60 s so
a throttled background tab still earns its minute.

### F ✅ — map spoiled every zone
Fog-of-war (P3).

### G ✅ — hints fired on first tick after Awakening; "+50 shards" clamped
`veritasHint.lastTime` reset to `playTime` on Awakening; transfer log now reports the amount actually received.

### H ✅ — `alert()` in save export/import → `showNotification`.
### I ✅ — `heroName` unescaped → `heroNameSafe()` strips tags and specials at input and on load.
### J ✅ — shard bonuses only on exploration → `Combat.grantLoot` applies `shardFind` and the Lattice Fragment.
### K ✅ — Hero tab stale HP in combat → `getHeroHp()`.
### L ✅ — `twice_turned` needed 3 Awakenings → now 2; `resonant` now 3 (array order matches).
### M ✅ — number keys while typing → guarded on INPUT/TEXTAREA; `6`/`7` open Codex/Relics.
### N ✅ — cancel refund lost a single shard → `Math.ceil`.
### O — note: Memory Terminal output is not multiplied by prestige (mana/scrap are). Left as is; the bonus text no longer claims "all production".

---

## 2. Pacing & immersion — where the game and the book diverge

The book is the richer artifact and is treated as canon. Its rhythm: **arrive → respectful pause → the tools
teach you → the world outside is broken in *specific*, tragic ways → decode slowly → the truth arrives in a
fixed order of twists → each Awakening is faster and heavier → the conversation.** The game had all that
*content* with the *reflexes* of a generic idle game. The pass below changed the reflexes.

Things the book does that the game skipped — and where they now live:

- Three days of survey, the hillside, the dig, the pulse → **P1 prologue**
- The channel-light coming up in the walls → **P2 Archive panel**
- The workbench that argues back → craft log lines ("The bench goes quiet")
- The perimeter that declares itself → the merchant's note (P9c)
- Mira, Jorin, "none of us argue with the sound anymore" → **P9a testimonies**
- The Spire cut from the inside → `spire_cut` lore (P5)
- The Vault Automatons let you in → **P8b handshake**
- Unit 7 → `unit7_log` (P9b)
- VERITAS's interventions actually happening → **P10 seeds**
- Rebuilds faster → **P7**
- The sixth Awakening does not fully dissolve → **P14**

### Proposals

#### P1 ✅ The arrival
Four-beat prologue (survey / the hillside / the dig / the relic) in Salem's voice with ASCII per beat, a "skip to
the relic" link, then the name prompt. "Search the Ruins" is available from the first second; the first search
finds the arranged cache from Chapter Three (+6 scrap).

#### P2 ✅ The Archive needs a face
`RENDER.archivePanel()`: sockets light per conduit (`~`), bench and scout post appear as boxes, relic becomes
the Beacon column, lower level lists depot/workshop/terminal/forge, ley taps light as `◈`, the Ghost and Scholar
appear as figures. Modes: normal / blaze / cool / dimming / dark / ruin — driven by the Awakening.

#### P3 ✅ Fog-of-war the map
`RENDER.worldMap()`: locked zones are `▓▓▓` with no terrain decoration; unlocked-unvisited are `? ? ? ? ?`;
visited get their name. Cathedral branch hidden until reachable.

#### P4 ✅ Shards decode slowly
Eight `decode: true` entries (0001, the Silence, 0047, Lirien's log, the Final Log, the Antechamber, the Echo
Stone, the common room). Segments are the entry's paragraphs; ~75 s each, faster with more Terminals, halved at
prestige 4; **no Terminal, no progress** ("You do not yet have the ears for it"). Lore tab shows decoded
paragraphs, a `▓░` bar for the current segment, `[SEGMENT n — CORRUPTED]` for the rest. Offline time decodes.

#### P5 ✅ Fix the lore order
`the_silence` now needs the Deep Vault visited (+3 shards). New: `spire_cut` on visiting the Spire (the first
structural proof), `vault_access` on the first descent. Twist order now matches the book.

#### P6 ✅ The Awakening as a sequence
`Prestige.timeline()`: ~35 s. Beacon activates (chord from `Sounds.awakeningChord`), four seconds of every ley
line singing (panel blazes gold), quiet, sockets go out one by one, rooms go dark, ruin, two per-cycle lines
from `DATA.awakeningVariants`, "First conduit: ten minutes." Skippable after 4 s from the second cycle on.

#### P7 ✅ Make the spiral actually faster
Per Awakening: costs ×0.85, craft and scout times ×0.80, and N conduits already lit on waking (N = cycles, max
5). Beacon half price at prestige 5. The Awakening screen shows the multipliers.

#### P8 Combat tone
- **a ✅** Nothing dies: wolves back away, bandits break and run, machines halt / power down. "It is over."
  Momentum → "Your grip is surer than it was." Enemy intro → "Something moves on the road."
- **b ✅** Vault Automatons are `noncombat`: a five-line scripted handshake (head tilt, three notes, ACCESS
  GRANTED), no damage, shards recovered. Button reads [DESCEND].
- **c ✅** `Broadcast Authorization` spell vs Mana Wraiths, needs the Architect's Seal — the wraith withdraws.
  Care Golems and Protocol Drones are `calmable`: [MOVE SLOWLY] / [HOLD STILL] in combat plays a scripted
  pass (half the lesson, no loot, 8 s cooldown) and unlocks the *Performing Wellness* margin note. The Spire's
  admin terminal: with the Architect's Seal and five Spire explores, [CLEAR THE EMERGENCY FLAG] (30 Cores +
  10 Ether + 5 Shards) — Sentries then check the network and stand down instead of fighting; lore entry
  *The All-Clear* and the *The All-Clear* margin note (Defense +2).

#### P9 Society weight
- **a ✅** Four District records (Mira, Jorin, the sound, the last entry) over repeated District explores.
- **b ✅** Unit 7 patrol log after four Outpost explores.
- **c ✅** Three letters: the Academy's censure (day one), the merchant's note (the perimeter works on mules),
  the Church pamphlet.
- **d ✅** Visitors (`DATA.travellers`, `RENDER.currentVisitor`): once the Scout Post has read three roads,
  a living person comes up the valley road — H. the salt merchant, a pilgrim, a young man in Academy grey, two
  riders from the hamlet, a child after a goat, a cartographer, the elderly canon. Six-minute windows, two
  present then one quiet, so the road feels like a road. Gone after the ending (the valley is full of students).
- **e ✅** The eastern common room, decoded at the Lattice Core.

#### P10 ✅ Show VERITAS intervening before it is told
Cycle-one seeds: a wolf that looks at you and leaves (no fight, no loot), a bandit whose arm is slow (attack
halved), a Memory Shard in the Outpost's south wall where the runoff keeps it readable. All once-only, kept
through Awakenings, so the prestige-4 message names things that really happened.

#### P11 ✅ Voice pass
Notifications, log lines, button labels and combat lines rewritten in Salem's register; toasts cut to lore,
relics, finished equipment and the Awakening. Level-up is a log line. Building first-installs log a `built`
line plus the flavor quote.

#### P12 ✅ Sound and music
Awakening chord (A-minor stack, ~10 s), decode tick per segment, the Repeater's 3.7 s pulse while on the Relics
tab, *The Sunken Archive* auto-plays while exploring the District and restores after.

#### P13 ✅ Zone art and backdrops
Water line under the Care Golem and Protocol Drone in combat. Zone art: the Spire shows the clean cut with the
wraiths in the base section, the Outpost's walls spark (`*·`), the Vault shows its ring of terminals.

#### P14 ✅ The ending
Sixth Awakening: the light turns cool, the Terminal scrolls too fast to read (~9 s), clears, "Hello,
{heroName}. I have waited a very long time to say that." Three of the book's questions and answers, Salem's
question, a 4.7-second pause, the answer, four closing lines, then [THE MORNING]: `resetForPrestige(true)`
keeps up to five conduits, the workbench, the Scout Post, the Workshop and the Terminals. Status line: the valley
is full of students. Architect Mode intentionally not built.

---

## 4. Round two — animation, music, sound (v1.3.0, same day) — all ✅

Suggested and implemented in this order: 18 → 1 + 2 → 9 → 14 + 11 → the rest.

| # | Item | Where |
|---|---|---|
| 1 | The walls breathe (staggered CSS on lit sockets; ley-line wave) | `archivePanel` + `.pnl-lit` / `.pnl-ley` |
| 2 | The relic pulses. Once. (random 45–160 s, log line, sub thump) | `Engine.checkRelicPulse`, `Sounds.relicPulse` |
| 3 | Decoded segments type themselves in (40 chars/s) | `RENDER.typedSegments`, `d.lastDoneAt` |
| 4 | The title surfaces from noise, bottom row first | `main.js animateTitle` |
| 5 | Living zone art: water, sparks, wraiths, Care Golem eyes | `RENDER.liveArt` |
| 6 | A newly reachable zone flickers on the map for 6 s | `RENDER.worldMap` (`_zoneSeen`) |
| 7 | A figure walking the road; `☾` at night | `RENDER.roadProgress` |
| 8 | The chord, visible (`▁▂▃▅▇` bar during the blaze) | `RENDER.chordBar` |
| 9 | Adaptive layers — the Archive wakes, the music wakes | `Music.layersFor`, per-bar scheduler |
| 10 | Place-dependent scoring (District / Spire / Vault / Cathedral / Core) | `Music.planFor` |
| 11 | VERITAS has a motif (descending fifth; in full at "Hello") | `Sounds.veritasMotif` |
| 12 | Combat ducks melody and arp, keeps bass and drums | `Music.planFor` |
| 13 | After the ending the music becomes occasional | `Music.planFor` (`_phraseBars`) |
| 14 | The sound that means the conversation is over | `Sounds.conversationOver` |
| 15 | Building timbres; bench recognition on the first craft | `Sounds.build`, `Sounds.recognition` |
| 16 | Ambient beds per place, crossfaded, paused when hidden | `Ambient` |
| 17 | Dry combat foley + footsteps | `Sounds.zap/hit/clank/footsteps` |
| 18 | Mixer in CONFIG (Master / Music / Ambient / Effects / mute) | `Mixer`, `screenConfig` |
| 19 | `prefers-reduced-motion` respected (CSS and JS) | `reducedMotion()`, stylesheet |

---

## 5. Round three (v1.4.0)

Suggested after v1.3.0; Robert picked 1, 3, 5 and 7.

| # | Item | Status |
|---|---|---|
| 1 | Headless playthrough bot to measure pacing | ✅ `test/playthrough.js`; tuning applied (see DEVLOG) |
| 2 | Robert's ears and eyes on the audio mix and the Parchment theme | ☐ his |
| 3 | Equipment art on the hero figure | ✅ |
| 4 | The Cathedral hymn and the Lattice Core's chairs | ✅ v1.5.0 |
| 5 | "While you were away" notebook page | ✅ |
| 6 | Name the golem | ✅ v1.5.0 |
| 7 | Night in the valley (real clock) | ✅ |
| 8 | Architect Mode as the prequel (play Lirien, disassemble the Archive) | ☐ L |
| 9 | Export your run as "A Record in Full" | ✅ v1.5.0 |
| 10 | Read the book from inside the game after the ending | ☐ |
| 11 | PWA + GitHub Pages | ☐ |
| 12 | Mobile pass for the 48-column panel | ☐ |

**Pacing, measured (greedy continuous play, seed 12345):** 6 h 35 m to the ending; cycle 1 = 1 h 46 m (10 min
of it with nothing to do), then 1h19 / 1h11 / 1h24 / 35m / 17m. First conduit 4 m, Scout Post 10 m, Terminal
34 m, first shard decoded 51 m, Beacon 1 h 46 m. Knobs: `decodeSegmentSeconds()` base (150 s), zone
`exploreTime`/`exploreLoot`, the `loreAgo()` gaps on the District records, `prestigeLevels[].manaReq`.

---

## 3. What was done in which order

1. §1-A caps → economy sim → Ley Tap +300 / Beacon 4,000.
2. §1-B, C, D, G.
3. P3, P8a, P11.
4. P2 + P6.
5. P4 + P5.
6. P7.
7. P1, P8b, P8c (partial), P9, P10, P12, P13 (partial), P14.
8. Small bugs H–N; `test/harness.js`; `G.version` → 1.1.0.
