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
| P8 | Nothing dies / Vault handshake / zone mechanics | ✅ a · ✅ b · ◐ c |
| P9 | Society weight | ✅ a b c e · ☐ d |
| P10 | Show VERITAS before telling | ✅ |
| P11 | Voice pass | ✅ |
| P12 | Sound tie-ins | ✅ |
| P13 | Backdrops / zone art | ◐ |
| P14 | The ending | ✅ (Architect Mode deliberately not) |

**Still open:** P8c Care Golems "move slowly" approach and the Sentry all-clear terminal; P9d the Scholar (or a
traveller) before prestige 3; P13 the Spire cut / Outpost arc-gaps / Vault terminal ring in the zone art.

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
- **c ◐** `Broadcast Authorization` spell vs Mana Wraiths, needs the Architect's Seal — the wraith withdraws.
  ☐ Care Golems "move slowly" option. ☐ Sentry all-clear at a late admin terminal.

#### P9 Society weight
- **a ✅** Four District records (Mira, Jorin, the sound, the last entry) over repeated District explores.
- **b ✅** Unit 7 patrol log after four Outpost explores.
- **c ✅** Three letters: the Academy's censure (day one), the merchant's note (the perimeter works on mules),
  the Church pamphlet.
- **d ☐** The Scholar (or a traveller) before prestige 3.
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

#### P13 ◐ Zone art and backdrops
✅ Water line under the Care Golem and Protocol Drone in combat. ☐ Spire scar, Outpost arc-gaps, Vault terminal
ring in the zone art.

#### P14 ✅ The ending
Sixth Awakening: the light turns cool, the Terminal scrolls too fast to read (~9 s), clears, "Hello,
{heroName}. I have waited a very long time to say that." Three of the book's questions and answers, Salem's
question, a 4.7-second pause, the answer, four closing lines, then [THE MORNING]: `resetForPrestige(true)`
keeps up to five conduits, the workbench, the Scout Post, the Workshop and the Terminals. Status line: the valley
is full of students. Architect Mode intentionally not built.

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
