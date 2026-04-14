# Arcanum Machina — Dev Log

## Session 2026-04-13 — Autonomous improvements

### Changes made this session

#### 1. `js/combat.js` — Golem scales with hero level
- **Damage:** base 6 → `6 + floor(heroLevel / 2)`. At level 1: 6 dmg. At level 10: 11 dmg. At level 20: 16 dmg.
- **Max HP:** base 30 → `30 + heroLevel × 5`. At level 1: 35 HP. At level 10: 80 HP.
- Golem max HP is now set dynamically at fight start, not from the stale state default.

#### 2. `js/combat.js` — Victory momentum buff
- After winning a combat, 20% chance of granting +3 ATK for the next fight.
- Uses the existing `G.buffs.attackBonus` system naturally (stacks with consumable battleStimulant if both active).
- Combat log message: "Combat momentum! (+3 ATK carries forward)"

#### 3. `js/state.js` — Memory shard passive from Ancient Workshop
- `getMemoryPerSec()` now returns +0.002 shards/s if `ancientWorkshop >= 1`.
- Fills the mid-game gap between finding the first shard and building Memory Terminals.
- At 0.002/s → 1 shard every ~8 minutes passively, enough to slowly stockpile for Terminal purchases.

#### 4. `js/data.js` — Ancient Workshop description updated
- Desc updated from `'Unlocks machine repairs. +0.5 mana/s'` to `'Unlocks machine repairs. +0.5 mana/s · +0.002 shards/s'`

#### 5. `js/render.js` — Combat recovery countdown
- Fight button now shows `[RECOVERING 4s]` instead of `[RECOVERING...]` — actual countdown.

#### 6. `js/render.js` — "Time to afford" on buildings
- When a building is not affordable and all its resource costs have a known passive rate (mana, scrap, shards), shows estimated time below cost.
- Example: `~2m 30s` displayed in dim text under the cost.
- Only shows if time is under 1 hour and all missing resources have positive production.

#### 7. `js/render.js` — Golem companion card in Hero screen
- If golemForge is built, shows a "GOLEM COMPANION" panel in the Hero screen.
- Displays golem base HP (level-scaled), current HP status (from last combat), and a brief flavor note.

---

### Known issues still pending (future sessions)
- ~~Prestige levels 3–6 reference features not implemented (spells, NPCs, Architect Mode, golem repair)~~ — resolved 2026-04-14
- ~~No "time to afford" for resources with no passive production (arcaneCore, etherCell)~~ — resolved 2026-04-14
- Consumable item `scoutsCompass` applies buff before explore starts — this is correct but may confuse players

---

## Design Decisions — 2026-04-14 (autonomous session)

### Changes implemented this session

#### 1. `js/render.js` — Time-to-afford for arcaneCore and etherCell
- `timeToAfford()` now estimates output/s for arcaneCore and etherCell from active crafting slots.
- Checks `G.crafting.slot0` and `G.crafting.slot1`; if a slot is actively crafting one of these resources, computes `recipe.output.amount / timeLeftSeconds` and adds it to the rate map.
- This means buildings that cost arcaneCore or etherCell will now show an ETA if a craft is in progress.
- Only works for the current craft in-progress (no chain-craft estimation). Acceptable for v1.

#### 2. `js/state.js` — New buff fields + veritasHint
- Added `shieldActive: false` and `enemyStunned: false` to `G.buffs`.
- Added `G.veritasHint: { lastTime: 0, count: 0 }` to G root.
- `loadGame()` now merges saved `veritasHint` data and resets buffs with new fields included.
- `resetForPrestige()` resets all new fields.
- `saveGame()` now serializes `veritasHint`.

#### 3. `js/combat.js` — Spells system (prestige 3+)
- Added global `Spells` object with 3 spells: Mana Bolt, Arcane Shield, Ley Pulse.
- Added `Combat.repairGolem()` for prestige 5+ — restores golem to 40% max HP for 5 scrap + 1 etherCell.
- Shield/stun buffs reset on win, lose, and flee.
- **Spell balance (flag for Robert's review):**
  - Mana Bolt: 30 mana → 20–35 damage. Mid-range single strike. At 30 mana cost, meaningful but not spammable. Could be too weak vs. high-HP enemies if mana pool is large.
  - Arcane Shield: 50 mana → absorbs one enemy hit entirely (hero side). Golem still takes partial damage from the shielded hit.
  - Ley Pulse: 80 mana → negates entire enemy turn. At 80 mana, this is a premium defensive option. Could be overpowered vs. high-ATK enemies in deep vault.
  - These numbers are guesses. Robert should test and tune.

#### 4. `js/data.js` — NPC dialogue
- Added `DATA.ghostDialogue` — 12 entries from Caldris, a First Age Architect remnant consciousness. Voice: melancholic, intellectual, occasionally dry. Types: memory / wisdom / warning.
- Added `DATA.scholarDialogue` — 10 entries from an unnamed Church Scholar. Dramatic irony: she interprets technical Architect reality through sincere theological lens. Voice: warm, reverent, earnest.
- Dialogue cycles by game time (ghost: every 5 min / scholar: every 7 min). No randomization — deterministic cycling means players see all entries over time.

#### 5. `js/render.js` — Ghost + Scholar NPC sections in screenArchive
- Ghost section appears at prestige 2+ at the bottom of the Archive screen after crafting.
- Scholar section appears at prestige 3+ after the Ghost section.
- Ghost has a simple `[ ≋ ]` ASCII figure; Scholar has a simple humanoid figure with a dagger symbol.
- Ghost dialogue uses `text-memory` (blue) for memory type, `text-arcane` (purple) for wisdom, `text-red` for warning.
- Scholar dialogue uses `text-tech` (amber/teal).

#### 6. `js/data.js` + `js/engine.js` — VERITAS Hint System (prestige 4+)
- Added `DATA.veritasHints` — 12 entries. 5 have resource bonuses (mana or memoryShard).
- `Engine.checkVeritasHints()` fires every 3 real-time minutes of play, logs as `log-lore` class (purple).
- Bonuses range from 50–100 mana or 50–60 memory shards. **Flag for Robert's review** — could be too generous or too stingy depending on late-game economy.
- Hint timing of 3 min was chosen to feel meaningful without spamming. Could increase to 5 min if it feels too frequent.

#### 7. `js/combat.js` + `js/render.js` — Golem Repair (prestige 5+)
- `Combat.repairGolem()` restores golem to 40% max HP for 5 scrap + 1 etherCell.
- Repair button shows in combat-controls only when: prestige >= 5, combat active, golem HP = 0, golemForge built.
- **Cost flag for Robert's review** — 5 scrap + 1 etherCell is intentionally cheap to not make the golem feel useless once it falls. Could be raised if golem repair is too easy to spam.
- 40% HP restoration is a meaningful but not full heal.

### What was NOT implemented (needs Robert's input)
- **New zones:** "Cathedral of First Light" referenced in prestige 3 bonuses — needs enemies, lore, ASCII art, unlock conditions, relic pool.
- **Architect Mode (New Game+):** referenced in prestige 6 bonuses — no design yet.

---

## Session 2026-04-14 (continuation) — Prestige bonuses implementation

### Changes implemented this session

#### 1. `js/data.js` — golemType flag on early enemies
- Added `golemType: true` to `rusted_guardian` and `scrap_crawler` (ruined_outpost zone).
- These are the "broken golems" referenced in prestige 2 bonuses — early-zone mechanical enemies with no prior shard drop.

#### 2. `js/combat.js` — Broken golems drop Memory Shards (prestige 2+)
- In `winFight()`, after regular loot: if `enemy.golemType && prestige >= 2`, 18% chance to drop 1 Memory Shard.
- Combat log: "Salvaged a Memory Shard from the broken golem."
- The high-tier golem enemies (care_golem, vault_automaton, etc.) already drop shards in their regular loot table, so this only adds value for the prestige 2 early-zone experience.

#### 3. `js/exploration.js` — Memory Shards decode 2x faster (prestige 4+)
- In `startCraft()`, if `prestige >= 4` and `recipe.cost.memoryShard` exists, `craftTime` is halved before setting `endTime`.
- "Decoding" = understanding the Shard data well enough to accelerate any recipe that requires it. Semantically consistent with the lore.
- No UI change needed — the progress bar just fills faster.

#### 4. `js/data.js` + `js/engine.js` + `js/state.js` — VERITAS Partial Transmission (prestige 5+)
- Added `DATA.veritasTransmissions` — 8 longer, more coherent VERITAS messages at increasing coherence levels (34%→67%).
  - 5 of 8 carry bonuses: 300–500 mana or 8–12 Memory Shards. Larger than regular hints — befitting prestige 5 late game.
  - Narrative voice: VERITAS speaking more fully — confessions, explanations, expressions of something like emotion.
- Added `G.veritasTransmission: { lastTime: 0, count: 0 }` to state (with save/load/prestige-reset).
- `Engine.checkVeritasTransmission()`: fires every 10 real-time minutes at prestige 5+. Uses `log-lore` class (purple) like hints. Shows a distinct notification: "◆ VERITAS Partial Transmission received."
- Regular hint interval (3 min) is unchanged — transmissions are a separate, less frequent but more impactful channel.

### What still needs Robert's input
- **New zones:** "Cathedral of First Light" — needs enemies, lore, ASCII art, unlock conditions, relic pool.
- **Architect Mode (New Game+):** prestige 6 bonus — no design yet.
