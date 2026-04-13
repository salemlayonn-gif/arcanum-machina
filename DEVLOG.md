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
- Prestige levels 3–6 reference features not implemented (spells, NPCs, Architect Mode, golem repair)
- No "time to afford" for resources with no passive production (arcaneCore, etherCell)
- Consumable item `scoutsCompass` applies buff before explore starts — this is correct but may confuse players
