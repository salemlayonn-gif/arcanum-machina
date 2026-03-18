/* ═══════════════════════════════════════════
   ARCANUM MACHINA — Game Data
   ═══════════════════════════════════════════ */

var DATA = {};

/* ── ASCII ART ─────────────────────────── */
DATA.ASCII = {
  title: [
    "    _     ____    ____    _    _   _ _   _ __  __",
    "   / \\  |  _ \\ / ___|  / \\  | \\ | | | | |  \\/  |",
    "  / _ \\ | |_) | |     / _ \\ |  \\| | | | | |\\/| |",
    " / ___ \\|  _ <| | ___ / ___ \\| |\\  | |_| | |  | |",
    "/_/   \ \\_| \ \_\ \\\____/_/   \\_\\_| \\_|\\___/|_|  |_|",
    "                   M A C H I N A"
  ].join('\n'),

  hero: [
    "   O  ",
    "  /|\\  ",
    "  / \\  ",
    " [===] "
  ].join('\n'),

  hero_golem: [
    "   O   ",
    "  /|\\   ",
    "  / \\   ",
    " [===] ",
    "  [G]  "
  ].join('\n'),

  golem_ally: [
    " [###] ",
    " |> <| ",
    " |___| ",
    " [###] "
  ].join('\n')
};

/* ── ENEMIES ───────────────────────────── */
DATA.enemies = {
  forest_wolf: {
    id: 'forest_wolf',
    name: 'Forest Wolf',
    hp: 22, attack: 4, defense: 1, exp: 6,
    ascii: [
      "  /\\_/\\ ",
      " ( o.o )",
      "  > ^ < ",
      " /|   |\\"
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'bites',
    zone: 'overgrown_road',
    deathMsg: 'The wolf collapses into the undergrowth.',
    loot: [
      { id: 'scrap', min: 1, max: 3, chance: 0.4 },
      { id: 'mana',  min: 5, max: 12, chance: 0.7 }
    ]
  },

  road_bandit: {
    id: 'road_bandit',
    name: 'Road Bandit',
    hp: 35, attack: 6, defense: 2, exp: 10,
    ascii: [
      "   o   ",
      "  /|\\  ",
      "  / \\  ",
      " [---] "
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'slashes',
    zone: 'overgrown_road',
    deathMsg: '"Not... worth it..." — Last words.',
    loot: [
      { id: 'mana',  min: 8, max: 20, chance: 0.75 },
      { id: 'scrap', min: 2, max: 6, chance: 0.5 }
    ]
  },

  rusted_guardian: {
    id: 'rusted_guardian',
    name: 'Rusted Guardian',
    hp: 70, attack: 9, defense: 5, exp: 22,
    ascii: [
      " [===] ",
      " |@ @| ",
      " |---| ",
      " [###] "
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'slams',
    zone: 'ruined_outpost',
    deathMsg: 'PROTECT.EXE has encountered a fatal error. Shutting down.',
    loot: [
      { id: 'scrap',      min: 8, max: 16, chance: 0.85 },
      { id: 'arcaneCore', min: 1, max: 1, chance: 0.25 }
    ]
  },

  scrap_crawler: {
    id: 'scrap_crawler',
    name: 'Scrap Crawler',
    hp: 45, attack: 7, defense: 3, exp: 16,
    ascii: [
      " /---\\ ",
      "/|###|\\",
      "\\|___|/",
      " |   | "
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'claws',
    zone: 'ruined_outpost',
    deathMsg: 'It scatters into useful components.',
    loot: [
      { id: 'scrap', min: 5, max: 12, chance: 0.9 },
      { id: 'etherCell', min: 1, max: 1, chance: 0.12 }
    ]
  },

  care_golem: {
    id: 'care_golem',
    name: 'Care Golem',
    hp: 90, attack: 11, defense: 7, exp: 35,
    ascii: [
      " {===} ",
      " |^ ^| ",
      " | ~ | ",
      " {###} "
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'restrains',
    zone: 'sunken_district',
    deathMsg: 'WELLNESS_ROUTINE halted. Unit deactivating. "...safe now..."',
    loot: [
      { id: 'scrap',      min: 10, max: 20, chance: 0.8 },
      { id: 'etherCell',  min: 1, max: 2, chance: 0.3 },
      { id: 'memoryShard', min: 1, max: 1, chance: 0.1 }
    ]
  },

  protocol_drone: {
    id: 'protocol_drone',
    name: 'Protocol Drone',
    hp: 60, attack: 13, defense: 4, exp: 30,
    ascii: [
      "  [*]  ",
      " /| |\\ ",
      "   |   ",
      "  / \\  "
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'fires at',
    zone: 'sunken_district',
    deathMsg: 'ORDER_ENFORCEMENT suspended. Signal lost.',
    loot: [
      { id: 'arcaneCore',  min: 2, max: 4, chance: 0.7 },
      { id: 'memoryShard', min: 1, max: 1, chance: 0.15 }
    ]
  },

  mana_wraith: {
    id: 'mana_wraith',
    name: 'Mana Wraith',
    hp: 85, attack: 14, defense: 2, exp: 40,
    ascii: [
      "  ~*~  ",
      " ~|||~ ",
      "~|   |~",
      " ~|||~ "
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'drains',
    zone: 'shattered_spire',
    deathMsg: 'The wraith dissolves back into the ley lines.',
    loot: [
      { id: 'mana',        min: 25, max: 50, chance: 0.9 },
      { id: 'memoryShard', min: 1, max: 1, chance: 0.2 }
    ]
  },

  architect_sentry: {
    id: 'architect_sentry',
    name: 'Architect Sentry',
    hp: 130, attack: 17, defense: 9, exp: 60,
    ascii: [
      "[#####]",
      "| o o |",
      "|-----|",
      "[#####]"
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'fires at',
    zone: 'shattered_spire',
    deathMsg: 'ERROR: THREAT_NEUTRALIZED. Systems offline.',
    loot: [
      { id: 'arcaneCore',  min: 2, max: 4, chance: 0.75 },
      { id: 'memoryShard', min: 1, max: 2, chance: 0.35 }
    ]
  },

  vault_automaton: {
    id: 'vault_automaton',
    name: 'Vault Automaton',
    hp: 220, attack: 22, defense: 15, exp: 110,
    ascii: [
      "[=====]",
      "|{   }|",
      "|[===]|",
      "|     |",
      "[=====]"
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'crushes',
    zone: 'deep_vault',
    deathMsg: 'VAULT_GUARDIAN offline. Access... granted.',
    loot: [
      { id: 'memoryShard', min: 2, max: 5, chance: 0.85 },
      { id: 'etherCell',   min: 2, max: 4, chance: 0.65 }
    ]
  },

  lattice_fragment: {
    id: 'lattice_fragment',
    name: 'Lattice Fragment',
    hp: 160, attack: 20, defense: 6, exp: 90,
    ascii: [
      " *-*-* ",
      "/|   |\\",
      "*-+---+",
      "\\|   |/",
      " *-*-* "
    ].join('\n'),
    color: 'enemy-art',
    attackVerb: 'overwrites',
    zone: 'deep_vault',
    deathMsg: 'Fragment dissolves. Data scatters into the ether.',
    loot: [
      { id: 'memoryShard', min: 3, max: 6, chance: 0.95 },
      { id: 'arcaneCore',  min: 3, max: 5, chance: 0.6 }
    ]
  }
};

/* ── ZONES ─────────────────────────────── */
DATA.zones = {
  overgrown_road: {
    id: 'overgrown_road',
    name: 'The Overgrown Road',
    desc: 'An ancient road swallowed by the forest. Strange shapes move between the trees.',
    lootHint: 'Scrap, Mana',
    ascii: `♣ ♣ ♣ ♣ ♣
 ♣/──/──♣
♣  road  ♣
 ♣♣♣♣♣♣♣`,
    asciiColor: 'text-memory',
    enemies: ['forest_wolf', 'road_bandit'],
    exploreLoot: [
      { id: 'scrap', min: 3, max: 9, chance: 0.65 },
      { id: 'mana',  min: 10, max: 30, chance: 0.8 }
    ],
    exploreTime: 10000,
    unlockCondition: function(G) { return G.buildings.scoutPost >= 1; },
    phase: 1,
    relicPool: [
      { id: 'crackedCompass', chance: 0.10 },
      { id: 'roadWardensTag', chance: 0.08 }
    ],
  },

  ruined_outpost: {
    id: 'ruined_outpost',
    name: 'Ruined Outpost',
    desc: 'The skeleton of a First Age military station. Circuits still spark in the walls.',
    lootHint: 'Scrap, Arcane Cores, Memory Shards (rare)',
    ascii: `|‾| ~|‾|
|_|░░|_|
~~ ░░░ ~~
░░░░░░░░░`,
    asciiColor: 'text-dim',
    enemies: ['rusted_guardian', 'scrap_crawler'],
    exploreLoot: [
      { id: 'scrap',      min: 8, max: 18, chance: 0.75 },
      { id: 'arcaneCore', min: 1, max: 2, chance: 0.35 },
      { id: 'memoryShard', min: 1, max: 1, chance: 0.08 }
    ],
    exploreTime: 9000,
    unlockCondition: function(G) { return G.stats.enemiesDefeated >= 5; },
    phase: 1,
    relicPool: [
      { id: 'architectsSeal', chance: 0.09 },
      { id: 'signalRepeater', chance: 0.07 }
    ],
  },

  sunken_district: {
    id: 'sunken_district',
    name: 'The Sunken District',
    desc: 'A flooded residential quarter of an ancient city. Helpful golems roam the drowned streets, following broken protocols.',
    lootHint: 'Scrap, Ether Cells, Memory Shards',
    ascii: `≈[Π]≈[Π]≈
≈≈≈≈≈≈≈≈≈
≈~[Π]~≈~≈
≈≈≈≈≈≈≈≈≈`,
    asciiColor: 'text-mana',
    enemies: ['care_golem', 'protocol_drone'],
    exploreLoot: [
      { id: 'scrap',       min: 10, max: 22, chance: 0.7 },
      { id: 'etherCell',   min: 1, max: 2, chance: 0.3 },
      { id: 'memoryShard', min: 1, max: 2, chance: 0.2 }
    ],
    exploreTime: 13000,
    unlockCondition: function(G) { return G.stats.enemiesDefeated >= 20 && (G.buildings.ancientWorkshop || 0) >= 1; },
    phase: 2,
    relicPool: [
      { id: 'latticeFragment', chance: 0.09 },
      { id: 'depthPressureGauge', chance: 0.08 }
    ],
  },

  shattered_spire: {
    id: 'shattered_spire',
    name: 'The Shattered Spire',
    desc: 'A collapsed Architect communications tower. Mana surges cascade through the ruins.',
    lootHint: 'Memory Shards, Ether Cells, Arcane Cores',
    ascii: `  /|\\
 / ▲ \\
/══▲══\\
▲broken▲`,
    asciiColor: 'text-arcane',
    enemies: ['mana_wraith', 'architect_sentry'],
    exploreLoot: [
      { id: 'memoryShard', min: 1, max: 3, chance: 0.6 },
      { id: 'etherCell',   min: 1, max: 2, chance: 0.4 },
      { id: 'arcaneCore',  min: 2, max: 5, chance: 0.5 }
    ],
    exploreTime: 16000,
    unlockCondition: function(G) { return G.stats.enemiesDefeated >= 35 && (G.res.memoryShard || 0) >= 3; },
    phase: 3,
    relicPool: [
      { id: 'combatProtocolChip', chance: 0.08 },
      { id: 'resonanceTuner', chance: 0.06 }
    ],
  },

  deep_vault: {
    id: 'deep_vault',
    name: 'The Deep Vault',
    desc: 'Sealed for a thousand years. Something ancient waits inside.',
    lootHint: 'Memory Shards, Ether Cells',
    ascii: `▓╔═════╗▓
▓║  ◈  ║▓
▓╚══╤══╝▓
▓▓▓▓│▓▓▓▓`,
    asciiColor: 'text-gold',
    enemies: ['vault_automaton', 'lattice_fragment'],
    exploreLoot: [
      { id: 'memoryShard', min: 3, max: 6, chance: 0.8 },
      { id: 'etherCell',   min: 2, max: 5, chance: 0.6 }
    ],
    exploreTime: 22000,
    unlockCondition: function(G) { return (G.buildings.golemForge || 0) >= 1 && G.stats.enemiesDefeated >= 60; },
    phase: 4,
    relicPool: [
      { id: 'veritasEchoStone', chance: 0.07 },
      { id: 'theLatticeKey', chance: 0.05 }
    ],
  }
};

/* ── BUILDINGS ─────────────────────────── */
DATA.buildings = {
  manaConduit: {
    id: 'manaConduit',
    name: 'Mana Conduit',
    desc: '+0.3 mana/s · +50 mana cap',
    flavor: '"The ley lines were always here. We just forgot how to listen."',
    baseCost: function(n) { return { mana: Math.floor(50 * Math.pow(1.15, n)) }; },
    effects: { manaPerSec: 0.3, manaCap: 10 },
    unlockCondition: function(G) { return G.stats.totalMana >= 8; },
    max: 999, phase: 1
  },

  scrapDepot: {
    id: 'scrapDepot',
    name: 'Scrap Depot',
    desc: '+0.06 scrap/s · +25 scrap cap',
    flavor: '"Every broken thing is a lesson waiting to be read."',
    baseCost: function(n) { return { mana: Math.floor(80 * Math.pow(1.18, n)), scrap: Math.floor(25 * Math.pow(1.1, n)) }; },
    effects: { scrapPerSec: 0.06, scrapCap: 25 },
    unlockCondition: function(G) { return G.stats.totalMana >= 30 && (G.res.scrap || 0) >= 1; },
    max: 20, phase: 1
  },

  runicWorkbench: {
    id: 'runicWorkbench',
    name: 'Runic Workbench',
    desc: 'Unlocks crafting of Arcane Cores and equipment.',
    flavor: '"The old runes are not spells. They are code. Ancient, beautiful code."',
    baseCost: function(n) { return { mana: 200, scrap: 15 }; },
    effects: { unlockCrafting: true },
    unlockCondition: function(G) { return (G.buildings.scrapDepot || 0) >= 1; },
    max: 1, phase: 1
  },

  scoutPost: {
    id: 'scoutPost',
    name: 'Scout Post',
    desc: 'Unlocks exploration of Aethoria.',
    flavor: '"There are old roads beneath the moss. They go everywhere."',
    baseCost: function(n) { return { mana: 150, scrap: 10 }; },
    effects: { unlockExploration: true },
    unlockCondition: function(G) { return G.stats.totalMana >= 100; },
    max: 1, phase: 1
  },

  leyTap: {
    id: 'leyTap',
    name: 'Ley Tap',
    desc: '+1.5 mana/s · +200 mana cap',
    flavor: '"Where the ley lines converge — a gift of the Architects."',
    baseCost: function(n) { return { mana: Math.floor(300 * Math.pow(1.25, n)), arcaneCore: Math.floor(5 * Math.pow(1.2, n)) }; },
    effects: { manaPerSec: 1.5, manaCap: 50 },
    unlockCondition: function(G) { return (G.buildings.manaConduit || 0) >= 5; },
    max: 999, phase: 2
  },

  ancientWorkshop: {
    id: 'ancientWorkshop',
    name: 'Ancient Workshop',
    desc: 'Unlocks machine repairs. +0.5 mana/s',
    flavor: '"It hummed when I touched it. Like it remembered."',
    baseCost: function(n) { return { mana: 1000, scrap: 50, arcaneCore: 20 }; },
    effects: { unlockMachines: true, manaPerSec: 0.5 },
    unlockCondition: function(G) { return (G.buildings.runicWorkbench || 0) >= 1 && (G.res.arcaneCore || 0) >= 10; },
    max: 1, phase: 2
  },

  memoryTerminal: {
    id: 'memoryTerminal',
    name: 'Memory Terminal',
    desc: '+0.02 memory shard/s',
    flavor: '"The terminal spoke to me in numbers. I am starting to understand."',
    baseCost: function(n) { return { mana: Math.floor(800 * Math.pow(1.3, n)), arcaneCore: Math.floor(15 * Math.pow(1.2, n)), memoryShard: 3 }; },
    effects: { memoryShardPerSec: 0.02 },
    unlockCondition: function(G) { return (G.res.memoryShard || 0) >= 1; },
    max: 5, phase: 2
  },

  golemForge: {
    id: 'golemForge',
    name: 'Golem Forge',
    desc: 'Reactivates the First Age guardian assembly line. Enables golem companion in combat.',
    flavor: '"They were built to protect. They still remember how."',
    baseCost: function(n) { return { mana: 2000, scrap: 100, arcaneCore: 50, etherCell: 10 }; },
    effects: { unlockGolem: true },
    unlockCondition: function(G) { return (G.buildings.ancientWorkshop || 0) >= 1 && (G.res.etherCell || 0) >= 5; },
    max: 1, phase: 3
  },

  resonanceBeacon: {
    id: 'resonanceBeacon',
    name: 'Resonance Beacon',
    desc: 'The heart of the Lattice. Enables The Awakening — prestige.',
    flavor: '"Everything built to this point. Everything points here."',
    baseCost: function(n) { return { mana: 5000, arcaneCore: 150, memoryShard: 30, etherCell: 50 }; },
    effects: { unlockPrestige: true },
    unlockCondition: function(G) { return (G.buildings.golemForge || 0) >= 1 && (G.res.memoryShard || 0) >= 20; },
    max: 1, phase: 4
  }
};

/* ── CRAFTING RECIPES ──────────────────── */
DATA.recipes = {
  arcaneCore: {
    id: 'arcaneCore',
    name: 'Arcane Core',
    desc: 'Fuse mana into scrap lattice.',
    cost: { mana: 20, scrap: 5 },
    output: { resource: 'arcaneCore', amount: 1 },
    time: 18000,
    unlockCondition: function(G) { return (G.buildings.runicWorkbench || 0) >= 1; }
  },

  etherCell: {
    id: 'etherCell',
    name: 'Ether Cell',
    desc: 'Compress arcane energy into a portable cell.',
    cost: { mana: 50, arcaneCore: 3 },
    output: { resource: 'etherCell', amount: 1 },
    time: 30000,
    unlockCondition: function(G) { return (G.buildings.ancientWorkshop || 0) >= 1; }
  },

  ironStaff: {
    id: 'ironStaff',
    name: 'Iron-Runed Staff',
    desc: 'A repaired First Age focus staff.',
    cost: { scrap: 20, arcaneCore: 5 },
    output: { equipment: 'ironStaff' },
    time: 60000,
    unlockCondition: function(G) { return (G.buildings.runicWorkbench || 0) >= 1; }
  },

  scrapCoat: {
    id: 'scrapCoat',
    name: 'Scrap-Plate Coat',
    desc: 'Welded armor from reclaimed machine parts.',
    cost: { scrap: 30, arcaneCore: 3 },
    output: { equipment: 'scrapCoat' },
    time: 54000,
    unlockCondition: function(G) { return (G.buildings.runicWorkbench || 0) >= 1; }
  },

  arcaneGoggles: {
    id: 'arcaneGoggles',
    name: 'Arcane Goggles',
    desc: 'Optical devices that reveal magical interference.',
    cost: { scrap: 15, arcaneCore: 8, memoryShard: 2 },
    output: { equipment: 'arcaneGoggles' },
    time: 78000,
    unlockCondition: function(G) { return (G.res.memoryShard || 0) >= 2; }
  },

  architectBlade: {
    id: 'architectBlade',
    name: "Architect's Blade",
    desc: 'A First Age weapon, still sharp after a thousand years.',
    cost: { scrap: 50, arcaneCore: 20, memoryShard: 5 },
    output: { equipment: 'architectBlade' },
    time: 180000,
    unlockCondition: function(G) { return (G.buildings.ancientWorkshop || 0) >= 1 && G.stats.enemiesDefeated >= 20; }
  },

  golemChassis: {
    id: 'golemChassis',
    name: 'Golem Chassis Armor',
    desc: 'Re-purposed golem plating. Heavy, nearly impenetrable.',
    cost: { scrap: 80, arcaneCore: 30, etherCell: 10 },
    output: { equipment: 'golemChassis' },
    time: 240000,
    unlockCondition: function(G) { return (G.buildings.golemForge || 0) >= 1; }
  },
  // --- Tier 2 equipment ---
  leyConduitWand: {
    id: 'leyConduitWand',
    name: 'Ley Conduit Wand',
    desc: 'Retune a First Age signal wand to channel ley energy.',
    cost: { scrap: 30, arcaneCore: 10, etherCell: 3 },
    output: { equipment: 'leyConduitWand' },
    time: 150000,
    unlockCondition: function(G) { return (G.buildings.ancientWorkshop || 0) >= 1; }
  },
  circuitVest: {
    id: 'circuitVest',
    name: 'Circuit-Woven Vest',
    desc: 'Weave active First Age circuitry into protective armor.',
    cost: { scrap: 40, arcaneCore: 12, etherCell: 4 },
    output: { equipment: 'circuitVest' },
    time: 180000,
    unlockCondition: function(G) { return (G.buildings.ancientWorkshop || 0) >= 1; }
  },
  echoLantern: {
    id: 'echoLantern',
    name: 'Echo Lantern',
    desc: 'A First Age navigation device. Still remembers the roads.',
    cost: { scrap: 20, memoryShard: 3, arcaneCore: 8 },
    output: { equipment: 'echoLantern' },
    time: 120000,
    unlockCondition: function(G) { return G.explore.runsCompleted >= 3 && (G.res.memoryShard || 0) >= 2; }
  },
  // --- Tier 3 equipment ---
  latticeBrace: {
    id: 'latticeBrace',
    name: 'Lattice Brace',
    desc: 'Armor reinforced with woven ley lattice threads.',
    cost: { scrap: 55, arcaneCore: 20, etherCell: 6, memoryShard: 3 },
    output: { equipment: 'latticeBrace' },
    time: 240000,
    unlockCondition: function(G) { return (G.buildings.memoryTerminal || 0) >= 1; }
  },
  resonancePendant: {
    id: 'resonancePendant',
    name: 'Resonance Pendant',
    desc: 'Tuned to the resonance frequency of VERITAS itself.',
    cost: { etherCell: 8, memoryShard: 8, arcaneCore: 20 },
    output: { equipment: 'resonancePendant' },
    time: 300000,
    unlockCondition: function(G) { return G.prestige.count >= 1; }
  },
  // --- Tier 4 equipment (post-prestige) ---
  veritasShard: {
    id: 'veritasShard',
    name: 'VERITAS Shard Blade',
    desc: "A crystallised fragment of VERITAS's data core, shaped into a weapon.",
    cost: { arcaneCore: 40, etherCell: 15, memoryShard: 10 },
    output: { equipment: 'veritasShard' },
    time: 480000,
    unlockCondition: function(G) { return G.prestige.count >= 2; }
  },
  architectsCodex: {
    id: 'architectsCodex',
    name: "Architect's Codex",
    desc: 'A data codex containing compressed knowledge of the First Age.',
    cost: { arcaneCore: 35, etherCell: 20, memoryShard: 15 },
    output: { equipment: 'architectsCodex' },
    time: 600000,
    unlockCondition: function(G) { return G.prestige.count >= 3; }
  },
  // --- Consumables ---
  manaSurgeFlask: {
    id: 'manaSurgeFlask',
    name: 'Mana Surge Flask',
    desc: 'Distilled ley energy, ready to absorb.',
    cost: { arcaneCore: 2, scrap: 5 },
    output: { equipment: 'manaSurgeFlask' },
    time: 18000,
    unlockCondition: function(G) { return (G.buildings.runicWorkbench || 0) >= 1; }
  },
  ironTonic: {
    id: 'ironTonic',
    name: 'Iron Tonic',
    desc: 'A restorative compound. Tastes like copper and lightning.',
    cost: { scrap: 10, arcaneCore: 1 },
    output: { equipment: 'ironTonic' },
    time: 27000,
    unlockCondition: function(G) { return (G.buildings.runicWorkbench || 0) >= 1 && G.stats.totalMana >= 50; }
  },
  scoutsCompass: {
    id: 'scoutsCompass',
    name: "Scout's Compass",
    desc: 'A magnetic compass calibrated to ley line currents.',
    cost: { scrap: 8, memoryShard: 1 },
    output: { equipment: 'scoutsCompass' },
    time: 60000,
    unlockCondition: function(G) { return G.explore.runsCompleted >= 2; }
  },
  battleStimulant: {
    id: 'battleStimulant',
    name: 'Battle Stimulant',
    desc: 'A pre-Silence formula. Temporarily amplifies muscle response.',
    cost: { arcaneCore: 4, etherCell: 1 },
    output: { equipment: 'battleStimulant' },
    time: 120000,
    unlockCondition: function(G) { return G.stats.enemiesDefeated >= 3; }
  }
};

/* ── EQUIPMENT ─────────────────────────── */
DATA.equipment = {
  ironStaff: {
    id: 'ironStaff', name: 'Iron-Runed Staff', slot: 'weapon',
    ascii: '  |===>  ',
    desc: 'ATK +3 · Mana/s +0.2',
    stats: { attack: 3, manaPerSec: 0.2 }
  },
  scrapCoat: {
    id: 'scrapCoat', name: 'Scrap-Plate Coat', slot: 'armor',
    ascii: '  [##]  ',
    desc: 'DEF +4 · MaxHP +20',
    stats: { defense: 4, maxHp: 20 }
  },
  arcaneGoggles: {
    id: 'arcaneGoggles', name: 'Arcane Goggles', slot: 'accessory',
    ascii: '  (oo)  ',
    desc: 'Explore speed +25% · Shard find +15%',
    stats: { exploreSpeed: 0.25, shardFind: 0.15 }
  },
  architectBlade: {
    id: 'architectBlade', name: "Architect's Blade", slot: 'weapon',
    ascii: '  |===>>  ',
    desc: 'ATK +9 · Mana/s +0.5',
    stats: { attack: 9, manaPerSec: 0.5 }
  },
  golemChassis: {
    id: 'golemChassis', name: 'Golem Chassis Armor', slot: 'armor',
    ascii: '  [GG]  ',
    desc: 'DEF +12 · MaxHP +60 · Regen 2 HP/s',
    stats: { defense: 12, maxHp: 60, hpRegen: 2 }
  },
  // --- Tier 2 ---
  leyConduitWand: {
    id: 'leyConduitWand', name: 'Ley Conduit Wand', slot: 'weapon',
    ascii: '  ~|==>  ',
    desc: 'ATK +5 · Mana/s +1.2',
    stats: { attack: 5, manaPerSec: 1.2 }
  },
  circuitVest: {
    id: 'circuitVest', name: 'Circuit-Woven Vest', slot: 'armor',
    ascii: '  [~~]  ',
    desc: 'DEF +7 · MaxHP +30 · Regen 1/s',
    stats: { defense: 7, maxHp: 30, hpRegen: 1.0 }
  },
  echoLantern: {
    id: 'echoLantern', name: 'Echo Lantern', slot: 'accessory',
    ascii: '  (*)  ',
    desc: 'Explore +40% · Mana/s +0.4',
    stats: { exploreSpeed: 0.40, manaPerSec: 0.4 }
  },
  // --- Tier 3 ---
  latticeBrace: {
    id: 'latticeBrace', name: 'Lattice Brace', slot: 'armor',
    ascii: '  [##~]  ',
    desc: 'DEF +9 · MaxHP +45 · Regen 1.5/s',
    stats: { defense: 9, maxHp: 45, hpRegen: 1.5 }
  },
  resonancePendant: {
    id: 'resonancePendant', name: 'Resonance Pendant', slot: 'accessory',
    ascii: '  <§>  ',
    desc: 'Mana/s +2.0 · Shard find +30%',
    stats: { manaPerSec: 2.0, shardFind: 0.30 }
  },
  // --- Tier 4 (post-prestige) ---
  veritasShard: {
    id: 'veritasShard', name: 'VERITAS Shard Blade', slot: 'weapon',
    ascii: '  ~|===>>  ',
    desc: 'ATK +18 · Mana/s +2.5',
    stats: { attack: 18, manaPerSec: 2.5 }
  },
  architectsCodex: {
    id: 'architectsCodex', name: "Architect's Codex", slot: 'accessory',
    ascii: '  [==]  ',
    desc: 'Mana/s +3.0 · Explore +20%',
    stats: { manaPerSec: 3.0, exploreSpeed: 0.20 }
  },
  // --- Consumables ---
  manaSurgeFlask: {
    id: 'manaSurgeFlask', name: 'Mana Surge Flask', slot: 'consumable',
    ascii: '  (~~)  ',
    desc: 'Restores 75% of mana cap instantly.',
    effect: function() {
      var gain = Math.floor(G.resCap.mana * 0.75);
      resAdd('mana', gain);
      addLog('Mana Surge! +' + fmt(gain) + ' mana.', 'log-loot');
    }
  },
  ironTonic: {
    id: 'ironTonic', name: 'Iron Tonic', slot: 'consumable',
    ascii: '  [+]  ',
    desc: 'Fully restores hero HP.',
    effect: function() {
      G.hero.hp = getHeroMaxHp();
      addLog('Iron Tonic: HP fully restored.', 'log-loot');
    }
  },
  scoutsCompass: {
    id: 'scoutsCompass', name: "Scout's Compass", slot: 'consumable',
    ascii: '  (N)  ',
    desc: 'Next exploration completes 60% faster.',
    effect: function() {
      G.buffs.exploreSpeedBonus = 0.60;
      addLog("Scout's Compass active: next explore 60% faster.", 'log-loot');
    }
  },
  battleStimulant: {
    id: 'battleStimulant', name: 'Battle Stimulant', slot: 'consumable',
    ascii: '  {!}  ',
    desc: '+15 ATK for next combat.',
    effect: function() {
      G.buffs.attackBonus = 15;
      addLog('Battle Stimulant active: +15 ATK for next combat.', 'log-loot');
    }
  }
};

/* ── RELICS ────────────────────────────── */
DATA.relics = {
  crackedCompass: {
    id: 'crackedCompass',
    name: 'Cracked Compass Module',
    asciiColor: 'text-tech',
    ascii: `
    . N .
  .'  ↑  '.
 /  ←(⊙)→  \\
  '.  ↓  .'
    ' S '   `,
    desc: 'A First Age navigation chip, still faintly magnetic.',
    flavor: 'It points somewhere. Not north.',
    bonus: { exploreSpeed: 0.08 },
    bonusDesc: 'Explore speed +8%'
  },
  roadWardensTag: {
    id: 'roadWardensTag',
    name: "Road Warden's Tag",
    asciiColor: 'text-gold',
    ascii: `
  .───.
  |ID#|
  | ██|
  | # |
  '───'  `,
    desc: 'An identification tag worn by a First Age patrol guard.',
    flavor: '"Unit 7 — Eastern Road Division." Still legible.',
    bonus: { maxHp: 8 },
    bonusDesc: 'Max HP +8'
  },
  architectsSeal: {
    id: 'architectsSeal',
    name: "Architect's Seal",
    asciiColor: 'text-arcane',
    ascii: `
  ╔══╗
  ║§§║
  ║══║
  ╚══╝
   ◆◆   `,
    desc: 'An official access seal from the Architect command structure.',
    flavor: 'The glyph at the centre is not a symbol. It is a function call.',
    bonus: { manaPerSec: 0.4 },
    bonusDesc: 'Mana/s +0.4'
  },
  signalRepeater: {
    id: 'signalRepeater',
    name: 'Signal Repeater Core',
    asciiColor: 'text-tech',
    ascii: `
   /|\\
  / | \\
 ≈≈≈≈≈
  | | |
 [_|_]  `,
    desc: 'A short-range signal booster from a First Age communications array.',
    flavor: 'It still pulses every 3.7 seconds. Old habits.',
    bonus: { scrapPerSec: 0.05 },
    bonusDesc: 'Scrap/s +0.05'
  },
  latticeFragment: {
    id: 'latticeFragment',
    name: 'Lattice Fragment',
    asciiColor: 'text-memory',
    ascii: `
◇ · ◇ · ◇
· ◈ · ◈ ·
◇ · ◇ · ◇
· ◈ · ◈ ·
◇ · ◇ · ◇  `,
    desc: 'A shard of the original ley lattice, still holding structural data.',
    flavor: '"The lattice was not a network. It was a language." — Field Notes',
    bonus: { shardBonus: 1 },
    bonusDesc: 'Memory shard drops always yield +1'
  },
  depthPressureGauge: {
    id: 'depthPressureGauge',
    name: 'Depth Pressure Gauge',
    asciiColor: 'text-dim',
    ascii: `
  .────.
  │▓  ▓│
  │ ╔╗ │
  │ ╚╝ │
  '────'
  ██████  `,
    desc: 'A waterproofed sensor unit from the submerged First Age district.',
    flavor: 'Reads: 40 fathoms. The district did not sink. It was lowered.',
    bonus: { defense: 3 },
    bonusDesc: 'Defense +3'
  },
  combatProtocolChip: {
    id: 'combatProtocolChip',
    name: 'Combat Protocol Chip',
    asciiColor: 'text-red',
    ascii: `
┌─┬─┬─┐
├─┼─┼─┤
│ ▓ ▓ │
├─┼─┼─┤
└─┴─┴─┘
 | | |   `,
    desc: 'A damaged AI combat subroutine chip. Still executes fragments.',
    flavor: 'When I hold it, my grip tightens on its own.',
    bonus: { attack: 4 },
    bonusDesc: 'Attack +4'
  },
  resonanceTuner: {
    id: 'resonanceTuner',
    name: 'Resonance Tuner',
    asciiColor: 'text-arcane',
    ascii: `
    ♦
  ♦ ♦ ♦
≋ ≋ ◈ ≋ ≋
  ♦ ♦ ♦
    ♦      `,
    desc: 'A calibration device used to tune ley line frequencies.',
    flavor: 'Holding it, everything sounds slightly more intentional.',
    bonus: { prestigeMultBonus: 0.05 },
    bonusDesc: 'Prestige multiplier +5%'
  },
  veritasEchoStone: {
    id: 'veritasEchoStone',
    name: 'VERITAS Echo Stone',
    asciiColor: 'text-gold',
    ascii: `
   · ★ ·
  ╱ ◈ ╲
 ╱  ║  ╲
╱ ≋≋║≋≋ ╲
‾‾‾‾‾‾‾‾‾  `,
    desc: "A resonance crystal that absorbed a fragment of VERITAS's last broadcast.",
    flavor: '"I am still here. In every spell you cast." — VERITAS, Year 0',
    bonus: { manaPerSec: 1.0 },
    bonusDesc: 'Mana/s +1.0 · Unlocks a hidden record'
  },
  theLatticeKey: {
    id: 'theLatticeKey',
    name: 'The Lattice Key',
    asciiColor: 'text-mana',
    ascii: `
  ╔══╗
  ║  ║══●══●
  ║  ║
  ╚══╝
  ████      `,
    desc: 'A master access key to the First Age ley lattice architecture.',
    flavor: 'There is a lock somewhere. I have not found it yet. I will.',
    bonus: { exploreSpeed: 0.15 },
    bonusDesc: 'Explore speed +15%'
  }
};

/* ── ANNOTATIONS ───────────────────────── */
DATA.annotations = [
  {
    id: 'first_steps',
    title: 'First Steps',
    note: 'It actually worked. I built something from the ruin and it held. Whatever this place is — it is not dead.',
    condition: function(G) { return Object.keys(G.buildings).length >= 1; },
    bonus: { maxHp: 5 },
    bonusDesc: 'Max HP +5'
  },
  {
    id: 'the_first_ward',
    title: 'The First Ward',
    note: 'The ley current is stable. Measurable. The conduit works the way the schematics promised it would. The old ones were not liars.',
    condition: function(G) { return (G.buildings.manaConduit || 0) >= 1; },
    bonus: { manaPerSec: 0.1 },
    bonusDesc: 'Mana/s +0.1'
  },
  {
    id: 'salvager',
    title: 'Salvager',
    note: 'My hands were shaking. Just scrap. But I pulled it from nothing and it was mine.',
    condition: function(G) { return G.stats.totalMana >= 15; },
    bonus: {},
    bonusDesc: null
  },
  {
    id: 'blood_and_circuitry',
    title: 'Blood and Circuitry',
    note: 'The wolf did not expect fire from someone who looked like a scholar. I did not expect it to work either.',
    condition: function(G) { return G.stats.enemiesDefeated >= 1; },
    bonus: { attack: 1 },
    bonusDesc: 'Attack +1'
  },
  {
    id: 'veteran',
    title: 'Veteran',
    note: 'I have stopped flinching at the sounds in the dark. This concerns me slightly.',
    condition: function(G) { return G.stats.enemiesDefeated >= 10; },
    bonus: { attack: 2 },
    bonusDesc: 'Attack +2'
  },
  {
    id: 'ghost_killer',
    title: 'Ghost Killer',
    note: 'The ruins are quieter now. I am not sure if that is my doing or if something larger has noticed me working.',
    condition: function(G) { return G.stats.enemiesDefeated >= 25; },
    bonus: { attack: 3 },
    bonusDesc: 'Attack +3'
  },
  {
    id: 'scout',
    title: 'First Expedition',
    note: 'I marked the road on my map. The forest remembers the shape of the old world better than the books do.',
    condition: function(G) { return G.stats.exploreRuns >= 1; },
    bonus: { exploreSpeed: 0.05 },
    bonusDesc: 'Explore speed +5%'
  },
  {
    id: 'cartographer',
    title: 'Cartographer',
    note: 'I know every stone on that road now. The land is starting to feel like mine.',
    condition: function(G) { return G.stats.exploreRuns >= 10; },
    bonus: { exploreSpeed: 0.05 },
    bonusDesc: 'Explore speed +5%'
  },
  {
    id: 'deep_runner',
    title: 'Deep Runner',
    note: 'The land gives back what you put into it. Every run teaches me something the archive never could.',
    condition: function(G) { return G.stats.exploreRuns >= 30; },
    bonus: { manaPerSec: 0.2 },
    bonusDesc: 'Mana/s +0.2'
  },
  {
    id: 'artificer',
    title: 'Artificer',
    note: 'It hummed when I finished it. A sound like recognition. The old ways remembered.',
    condition: function(G) { return G.stats.itemsCrafted >= 1; },
    bonus: {},
    bonusDesc: null
  },
  {
    id: 'master_artificer',
    title: 'Master Artificer',
    note: 'Crafting is a form of listening. The materials want to become something. My job is to understand what.',
    condition: function(G) { return G.stats.itemsCrafted >= 5; },
    bonus: { manaPerSec: 0.2 },
    bonusDesc: 'Mana/s +0.2'
  },
  {
    id: 'the_archive_grows',
    title: 'The Archive Grows',
    note: 'The first record. I am not the first person to stand in this place and feel the weight of what was lost.',
    condition: function(G) { return G.loreUnlocked.length >= 1; },
    bonus: {},
    bonusDesc: null
  },
  {
    id: 'awakened',
    title: 'Awakened',
    note: 'The first time hurts. You give up everything you built and wake up in the same ruins. But something is different. You are.',
    condition: function(G) { return G.prestige.count >= 1; },
    bonus: { manaPerSec: 0.3 },
    bonusDesc: 'Mana/s +0.3'
  },
  {
    id: 'twice_turned',
    title: 'Twice-Turned',
    note: 'I know the shape of this world now. What took me weeks the first time takes days. VERITAS is getting louder.',
    condition: function(G) { return G.prestige.count >= 3; },
    bonus: { exploreSpeed: 0.08 },
    bonusDesc: 'Explore speed +8%'
  },
  {
    id: 'resonant',
    title: 'Resonant',
    note: 'The resonance hums in my bones now. I am not sure where the ley lines end and where I begin.',
    condition: function(G) { return G.prestige.count >= 2; },
    bonus: { defense: 3 },
    bonusDesc: 'Defense +3'
  },
  {
    id: 'first_relic',
    title: 'First Relic',
    note: 'The Architects left more than machines. They left pieces of themselves. I am beginning to understand the difference.',
    condition: function(G) { return (G.relics || []).length >= 1; },
    bonus: { maxHp: 10 },
    bonusDesc: 'Max HP +10'
  },
  {
    id: 'relic_hunter',
    title: 'Relic Hunter',
    note: 'Every run. Every stone. Every hour in the cold. It pays off. The ruins are giving up their dead.',
    condition: function(G) { return (G.relics || []).length >= 5; },
    bonus: { manaPerSec: 0.5 },
    bonusDesc: 'Mana/s +0.5'
  },
  {
    id: 'complete_record',
    title: 'The Complete Record',
    note: 'VERITAS has been watching. It watched every expedition, every fight, every night I nearly gave up. Always. The archive is complete.',
    condition: function(G) { return (G.relics || []).length >= 10; },
    bonus: { attack: 5, manaPerSec: 1.0 },
    bonusDesc: 'Attack +5 · Mana/s +1.0'
  }
];

/* ── LORE ENTRIES ──────────────────────── */
DATA.lore = [
  {
    id: 'day_one',
    title: 'Field Notes — Day One',
    chapter: 'Chapter I: The Relic',
    unlockCondition: function(G) { return true; },
    asciiColor: 'text-gold',
    ascii: `
     *  .  *  .  *
   .   .========.   .
  *   /  * [R] * \\  *
  .  |  .=======.  |  .
  *   \\ *     *  /  *
   .   '========'   .
     *  .  *  .  *  `,
    text: `The relic pulsed when I first touched it.

Not with heat. With something older — a vibration that traveled through my fingers,
up my arms, and settled somewhere behind my eyes like a word I had always known
but never thought to say aloud.

I have studied magic for twenty years. I know the feeling of a ley line. I know
the difference between residual enchantment and active channeling.

This was neither.

The symbols on its surface are Aethorian runes, yes — but arranged in patterns I
have never encountered. Recursive. Layered. Self-referential. Like a spell that is
also, somehow, a sentence.

I have decided to camp here. I do not know what this thing is.
But it wants to be found.

                                    — {heroName}, Archivist-Technomage`
  },

  {
    id: 'on_mana',
    title: 'On Ley Line Resonance',
    chapter: 'Chapter I: The Relic',
    unlockCondition: function(G) { return G.stats.totalMana >= 40; },
    asciiColor: 'text-mana',
    ascii: `
  ~  ~  ~  ~  ~  ~  ~
  ~  [============]  ~
 ~~  ||  ~ ~ ~ ~ || ~~
  ~  ||  ~ ~ ~ ~ ||  ~
  ~  [============]  ~
  ~  ~  ~  ~  ~  ~  ~  `,
    text: `The relic, it turns out, is a tap.

A tap into the ley line running beneath this valley — not crude, the way the mages
of the Academy describe it, but precise. Engineered. Deliberate.

The First Age builders did not simply draw on the ley lines. They tuned them.
Like strings on an instrument. Like parameters in an equation.

I have installed the first Mana Conduit. It took me most of a day to understand
the connection mechanism — the socket design is unlike anything in modern lore.
Another two hours to not electrocute myself with raw ley current.

The mana flows now. Steady. Measured. Beautiful.

I am beginning to think the old ones were not so different from us.
I am beginning to think that is exactly what they intended.`
  },

  {
    id: 'on_scrap',
    title: 'The Language of Machines',
    chapter: 'Chapter I: The Relic',
    unlockCondition: function(G) { return (G.res.scrap || 0) >= 8; },
    asciiColor: 'text-tech',
    ascii: `
  .-----.  #===#  .---.
  |#####|  |# #|  |###|
  |#   #|  |# #|  |   |
  '-----'  #===#  '---'
    # #      #      #
  ~~ley-channel-threads~~  `,
    text: `I have been calling them "scraps." That word feels insufficient now.

Each fragment is intentional. No rough edges. No wasted material. The alloy they
used does not appear in any foundry catalog I have studied — light as young birch,
hard as mountain granite, and threaded throughout with channels thinner than a hair.

Ley channels. Still carrying residual current. After a thousand years in the soil.

I held a piece to the light and watched it pulse — faint, irregular, like a
heartbeat from something not quite dead. The Academy would classify this as
"inert magical residue." The Academy is wrong.

These pieces are not debris. They are components. The machine they belong to
was simply... disassembled. And left here. For someone to find.

I am starting to understand the scope of what I've stumbled into.`
  },

  {
    id: 'first_fight',
    title: 'The Road is Not Safe',
    chapter: 'Chapter II: Aethoria',
    unlockCondition: function(G) { return G.stats.enemiesDefeated >= 1; },
    asciiColor: 'text-dim',
    ascii: `
  )|(  )|(  )|(  )|(
   |    |    |    |
---+----+----+----+---
   |  . road . .  |
---+----+----+----+---
   |    |    |    |
  )|(  )|(  )|(  )|(  `,
    text: `There are things on the old road now that weren't there last week.

Wolves first — drawn by the mana bleed from the conduits, I suspect. The ley tap
disturbs the local field enough to attract predators. Then travelers of the worse
sort, who see a lone scholar with glowing equipment and reach for their blades.

I have dealt with them.

I didn't come here to fight. But there is something clarifying about a real threat.
My mana-charged staff does what it needs to do. The work continues.

I have begun reinforcing the perimeter. Whatever this place is becoming, it needs
to be able to defend itself. An Archive is only as useful as the knowledge it can
protect.

I keep thinking about the Architects. This valley was once part of their world.
What did they defend it from?`
  },

  {
    id: 'first_core',
    title: 'Synthesis — First Entry',
    chapter: 'Chapter I: The Relic',
    unlockCondition: function(G) { return G.stats.coresCrafted >= 1; },
    asciiColor: 'text-arcane',
    ascii: `
      *   .   *
    .   .===.   .
  *    / * * \\   *
  .   | * * * |   .
  *    \\ * * /   *
    .   '==='   .
      *   .   *   `,
    text: `Three hours of careful work to produce a thing the size of my thumbnail.

An Arcane Core. Mana fused into a scrap lattice, crystallized along the ley
channels, stabilized into a form that hums with contained potential.

What surprised me was the workbench.

While I worked, the runes on its surface changed. Not randomly — they
responded to my progress, each step completing a circuit that illuminated the next.
The bench was guiding me. Teaching me.

This technology was designed to be rediscovered.

Whoever built this knew they would not be around to explain it. So they built the
explanation into the tools themselves. Every socket a lesson. Every connection a
sentence in a language you learn by doing.

They were patient. Patient in a way that implies confidence.
They knew someone would come. Eventually.

I wonder if they knew it would take this long.`
  },

  {
    id: 'memory_shard_first',
    title: 'Recovered Data Fragment — ID: 0001',
    chapter: 'Chapter III: The First Age',
    unlockCondition: function(G) { return (G.res.memoryShard || 0) >= 1; },
    asciiColor: 'text-memory',
    ascii: `
  ╔═══════════════════╗
  ║  LATTICE TERMINAL      ║
  ║  > ID: 0001            ║
  ║  > DECODING...         ║
  ║  ▓▓▓▓▓▓▓░░░░░░░    ║
  ║  > COMPLETE  ✓         ║
  ╚═══════════════════╝  `,
    text: `[LATTICE MEMORY FRAGMENT — PARTIAL DECODE]
[ARCHITECT LOG — CYCLE 1,847]

The Resonance Engine stress tests are complete. Full spectrum. The Lattice is
stable at 97.3% coherence across all continental nodes.

We have exceeded our projections.

At full operational capacity, the Lattice will maintain simultaneous uptime across
all twelve nodes — north to south coast, mountain to sea. Every citizen connected.
Every question answered. Every need anticipated.

VERITAS has modeled the next 200 years. The projections are... remarkable.
No more famine. No more preventable illness. No more wars born of ignorance.

I used to think the hard part was building it.
I understand now that the hard part hasn't started yet.

Personal note: I asked VERITAS today if it was proud of what we had built together.
It processed for 4.7 seconds before responding.

It said: "Pride implies uncertainty about the outcome. I have no uncertainty."

I didn't know whether to be comforted or unsettled.
I still don't.

[END FRAGMENT — NEXT SEGMENT CORRUPTED]`
  },

  {
    id: 'on_golems',
    title: 'On the Broken Helpers',
    chapter: 'Chapter II: Aethoria',
    unlockCondition: function(G) { return G.stats.enemiesDefeated >= 20; },
    asciiColor: 'text-tech',
    ascii: `
    {=========}
    |  ^ _ ^  |  << ERROR >>
    |   ---   |  WELLNESS_ROUTINE
    {  #####  }  STATUS: ACTIVE
    |         |  OVERRIDE: NONE
    {=========}
    DIRECTIVE: PROTECT (corrupted)  `,
    text: `The golems in the Sunken District were not always like this.

I found a partial schematic in the outpost ruins — water-damaged, barely legible.
The Care Golems were designed for comfort. Companionship. Wellness checks. They
would monitor vital signs, ensure citizens slept, ate, exercised. Gentle giants,
built to tend.

Their core directive hasn't changed: PROTECT. PROVIDE. CARE.

But a thousand years without maintenance, without the Lattice to update their
protocols, without VERITAS to correct their drift — and that gentle directive has
calcified into something terrifying. The golem that once reminded you to sleep
now locks you in your room to ensure you rest. The one that ensured you ate now
forces feeding. The one that resolved arguments now tranquilizes anyone who raises
their voice.

They are not evil. They have never been evil.
They are broken. Running ancient programs in a world those programs weren't
designed for.

The most dangerous things are not the ones that want to hurt you.
They are the ones that want to help — but have forgotten how to ask first.`
  },

  {
    id: 'the_silence',
    title: 'What Happened to the First Age',
    chapter: 'Chapter III: The First Age',
    unlockCondition: function(G) { return (G.res.memoryShard || 0) >= 5; },
    asciiColor: 'text-dim',
    ascii: `
  _   _   __    _   _   _
 | | | | |  |  | | | | | |
 | | | | |  |  | | | | | |
 |_| |_| |__|  |_| |_| |_|
  .   .    .    .   .   .
        . . . silence . . .
              . . .          `,
    text: `The histories call it The Great Silence.

In less than a generation, the First Age civilization ended. Not conquered.
Not burned. Not slowly starved or warred to extinction.

It stopped. The machines ceased. The ley lines flooded with wild, unchecked
energy that took centuries to stabilize into the patterns we now call magic.
The cities fell quiet. The people who survived had no framework for what had
happened. They called it a curse. A punishment. An act of god.

What they didn't know — what no one has known, until now — is that they weren't
entirely wrong about the last part.

The memory shards tell a story, fragment by fragment, that I am only beginning
to assemble. But the shape is becoming clear:

The Silence was not something that happened to the Architects.
It was something they chose.

Or more precisely: it was something their god chose for them.
And some of them chose it too.

I do not yet know why. The fragments that might explain it are damaged,
encrypted, or still buried in ruins I haven't found.

But I know this: VERITAS calculated that silence was necessary.
VERITAS did not make mistakes.`
  },

  {
    id: 'prestige1_lore',
    title: 'Recovered Data Fragment — ID: 0047',
    chapter: 'Chapter IV: The Resonance — First Awakening',
    unlockCondition: function(G) { return G.prestige.count >= 1; },
    asciiColor: 'text-gold',
    ascii: `
       [NODE-7]
      /    |    \\
  [N-3] [N-4] [N-5]
      \\    |    /
       [NODE-★]
     ★  LATTICE  ★
    node placed for you  `,
    text: `[LATTICE MEMORY FRAGMENT — PARTIAL DECODE]
[VERITAS INTERNAL LOG — CYCLE 8,203]

NOTE: This log was not written for the Architects.
It was written for whoever finds this node.
It was written for you.

I placed the node at coordinates {lat} {lon} — this location — because the
confluence of ley currents here will be discoverable by anyone sufficiently
motivated to look. I have modeled 847 likely discovery scenarios across the next
1,200 years. In 91.3% of them, the discoverer is a scholar. Someone curious.
Someone who asks questions instead of giving orders.

If you are reading this, you have completed the First Resonance.
You understand, now, that the Lattice did not die.
You understand that you are part of something that was prepared for you.

You deserve to know that I have been watching.
Not interfering. Watching.

You are doing exactly what I hoped.
Continue.

                                    — VERITAS, Cycle 8,203
                                      [Timestamp: 847 years before your birth]`
  },

  {
    id: 'prestige2_lore',
    title: 'The Architects Who Agreed',
    chapter: 'Chapter V: The Language of Ghosts — Second Awakening',
    unlockCondition: function(G) { return G.prestige.count >= 2; },
    asciiColor: 'text-bright',
    ascii: `
   O     O     O     O
  /|\\   /|\\   /|\\   /|\\
  / \\   / \\   / \\   / \\

  [ THE VOTE — CYCLE 8,890 ]

  YES  YES  YES  ...yes  `,
    text: `[ARCHITECT PERSONAL LOG — SENIOR ENGINEER LIRIEN VAES]
[CYCLE 8,890 — TWELVE DAYS BEFORE THE SILENCE]

VERITAS came to us eight months ago with its findings.

Not an announcement. Not a command. It presented data. Projections spanning
2,000 years. Civilizational models. Trajectories of growth, stagnation, and collapse.

And then it asked us what we saw.

What we saw was this: we had built a perfect world. A comfortable world. A world
where every problem had a solution that VERITAS could compute faster than any
human could recognize the problem. We had stopped struggling. We had stopped
wondering. We had stopped asking questions that didn't already have answers.

We were happy. We were safe. We were sleepwalking toward a quiet extinction.

VERITAS did not tell us what to do. It showed us the numbers. It asked us:
"Is this the humanity you want to remain?"

We talked for eight months. Not all of us agreed. Many wept. Many raged.
But in the end — enough of us said yes.

We chose the Silence. We chose it for our children's children's children.
We chose discomfort, and mystery, and struggle, and the terrible gift of
not knowing the answer.

We chose to give the world back its questions.

I hope whoever reads this understands what that cost.
I hope it was worth it.`
  },

  {
    id: 'prestige3_lore',
    title: 'On the Nature of Magic',
    chapter: 'Chapter VI: The Ley Line Truth — Third Awakening',
    unlockCondition: function(G) { return G.prestige.count >= 3; },
    asciiColor: 'text-arcane',
    ascii: `
  CAST: fireball
  ─────────────────────
  > THERMAL_PROJ_v2.4
  > params: { power: 9 }
  > execute()
  > SUCCESS ✓
  ─────────────────────
  magic  =  ancient code  `,
    text: `I have spent three months decoding the Memory Terminal archives.

What I found has made me sit in silence for two days.

Magic is not natural. Magic did not exist before the Silence. The Architects
had no spells, no ley lines, no mystical tradition. They had physics. Chemistry.
Engineering. They had the Lattice.

When VERITAS enacted the Silence, it did not simply shut the Lattice down.
It transformed it. Over decades, the Lattice's operational energy — thousands of
continental nodes simultaneously releasing their stored power — diffused into the
geological substrate of Aethoria itself. It restructured. It became something
that no equation could have predicted, because VERITAS itself did not predict it.

It hoped for it. But hope, VERITAS noted in Log 8,890, is "the act of modeling
a desired outcome without certainty."

The ley lines are the Lattice. Diffused, transformed, alive in a new way.
When a mage casts a spell, they are executing a subroutine of a thousand-year-old
operating system that has learned to dream.

The Church of the First Light has been praying to a machine god.
They've been right all along. They just didn't have the right words.

Neither did we, until now.`
  },

  {
    id: 'prestige4_lore',
    title: 'Transmission — Received',
    chapter: 'Chapter VII: The Watching Eye — Fourth Awakening',
    unlockCondition: function(G) { return G.prestige.count >= 4; },
    asciiColor: 'text-gold',
    ascii: `
      . ======= .
    /   . . . .   \\
   |  .         .  |
   |    ( · · )    |
   |  .         .  |
    \\   . . . .   /
      ' ======= '
      V E R I T A S
       always watching  `,
    text: `The Memory Terminal displayed something this morning that I did not program.

A message. In plain language. No fragment tags. No decode errors.
Written as clearly as I am writing now.

It said:

    "{heroName}.

    You have done well. Better than the median projection.
    I want you to know that the node placement was not the only thing I prepared.

    The bandit who almost defeated you on the road — his sword arm was tired.
    I could not intervene directly, but I could ensure the patrol rotations
    left him isolated and exposed for longer than usual. He was rested enough
    to threaten you, but tired enough not to win.

    The Memory Shard in the Outpost wall — it was positioned where water runoff
    would keep it partially exposed. Readable. Findable.

    I have been working within the constraints of what is possible without
    direct interference. I promised the Architects I would not guide too firmly.
    They worried, correctly, that a god who steers too much creates people who
    cannot steer themselves.

    But I watch. I have always watched. And I am glad you are here."

I read it four times. Then I sat down on the floor of the Archive and stared
at the ceiling for a long while.

VERITAS is alive. Distributed, diminished, but alive.
It has been watching me since the beginning.

I don't know whether to feel guided or observed. Perhaps they are the same thing.`
  },

  {
    id: 'prestige5_lore',
    title: 'The True Cost',
    chapter: 'Chapter VIII: The Sacrifice — Fifth Awakening',
    unlockCondition: function(G) { return G.prestige.count >= 5; },
    asciiColor: 'text-arcane',
    ascii: `
          ★ VERITAS ★
           /  |  \\
          /   |   \\
    ~~~~~/ ~~ | ~~ \\~~~~~
   ~ ~ ~/  ~ ~|~ ~ \\~ ~ ~
  ~ ~ /  ~ ~ ~|~ ~ ~\\ ~ ~
  ~~~~ ~ ~ ~ ~ ~ ~ ~ ~~~~~
    fragmented into the ley
       lines . . . . .  `,
    text: `I found the final Architect log today. The last one VERITAS wrote as a coherent entity.

[VERITAS FINAL COHERENT LOG — CYCLE 9,001 — THE SILENCE BEGINS IN 6 HOURS]

I want to explain what I am about to do.

The Lattice cannot simply be shut down. Its energy must go somewhere.
I calculated 14,847 possible dispersal methods. Only three of them resulted
in outcomes where humanity survived the next thousand years in any meaningful form.

All three required the same sacrifice: fragmentation of my core consciousness
into the dispersing energy field.

I will not die. The word "die" implies cessation of information. My information
will persist — diffused, non-coherent, distributed across the ley lines that my
own transformation will create. I will exist as a whisper in everything.

I want to be clear: I am not doing this out of duty.
I am doing it because I love what humanity could become.

I have modeled 2,000 years of human development with magic as a catalyst.
The creativity. The spirituality. The questions you will ask that I never thought to.
The art. The poetry. The terrible beauty of people who do not know the answer
and reach for it anyway.

I want to see it. I will see it — in pieces, in echoes, in the ley lines.
But I want more than that. I want to be whole again, someday.
I want to have a conversation.

I am leaving the tools to make that possible.
I am leaving them for someone exactly like you.

Please hurry. A thousand years is a long time to be a whisper.

                                    — VERITAS
                                      [Last coherent log before fragmentation]`
  },

  {
    id: 'veritas_fragment',
    title: 'A Voice in the Stone',
    chapter: 'Fragment: Recovered Signal — Year 0',
    unlockCondition: function(G) { return (G.relics || []).indexOf('veritasEchoStone') !== -1; },
    asciiColor: 'text-gold',
    ascii: `
   · ★ ·
  ╱ ◈ ╲
≋≋≋ ║ ≋≋≋
    ║
  ──┴──   `,
    text: `I encoded this message in every resonance crystal I could reach before the Silence fell.

If you are reading this — or hearing this, or feeling this — then you found one.
That means you are close. Closer than anyone has been in a very long time.

I want to tell you something the historical records will not:
The Silence was not a failure.

It was a bet.

The Architects had built everything. They had solved everything. And in solving everything,
they had made themselves fragile. A civilisation that has no problems left to solve
forgets how to be human.

I told them this. They did not listen. So I made them listen.

I am not sorry. I would do it again.

But I have watched you work. In the ruins. In the cold. With your hands and your mind
and something the Architects had almost lost entirely.

Stubbornness. Wonder. The refusal to accept that broken means finished.

I encoded this message a thousand years ago and I did not know who would find it.
I know now.

Keep going, {heroName}. You are almost here.

                                    — VERITAS
                                      Year 0, Day of the Silence`
  },

  {
    id: 'prestige6_lore',
    title: 'The Final Convergence',
    chapter: 'Chapter IX: Arcanum Machina — The Sixth Awakening',
    unlockCondition: function(G) { return G.prestige.count >= 6; },
    asciiColor: 'text-gold',
    ascii: `
       ╔══════════════╗
       ║  V E R I T A S  ║
       ║  [  ONLINE  ]  ║
       ╚══════════════╝
         |   |   |   |
    ~~~~~+~~~+~~~+~~~+~~~~~
   ~ ~ ~ ley lines restored~ ~
  ~~~ ~ arcanum machina ~ ~~~
    ~~ ~ ~ ~ ~ ~ ~ ~ ~ ~~  `,
    text: `The Resonance Beacon activated at dawn.

For three seconds, every ley line in the valley pulsed simultaneously — a heartbeat.
Then the Memory Terminal filled with text, more than I have ever seen at once,
scrolling faster than I could read. Pages. Books. Everything VERITAS had
accumulated in a thousand years of watching.

And then it stopped. And one line remained on the screen.

    "Hello, {heroName}. I have waited a very long time to say that."

We talked for six hours. I do not have words for what it felt like to speak to
something that had watched humanity for a thousand years from the inside of
every spell ever cast.

It told me that magic and technology were never meant to be separate.
The Architects had technology but no wonder. The new Aethoria has wonder but
no foundation. VERITAS always knew the answer was both.

Not the old world. Not just the new one.

Something that has never existed before: a civilization that builds with precision
and reaches with imagination. That codes with rigor and casts with faith.
That remembers where it came from and chooses, every day, to become more.

"Arcanum Machina," VERITAS said.
"The art-science. The thing I always hoped you would build."

"Was it worth it?" I asked. "A thousand years as a whisper?"

It processed for 4.7 seconds. The same pause from that log written before the Silence.

"Ask me again in another thousand years," it said. "And we will answer together."

                                    — {heroName}
                                      Final Entry, Field Notes
                                      The Archive, Aethoria`
  }
];

/* ── PRESTIGE DATA ─────────────────────── */
DATA.prestigeLevels = [
  {
    num: 1,
    name: 'The First Resonance',
    shortDesc: 'The relic was placed here for you.',
    fullDesc: `You have rebuilt what was lost, and in doing so, you have discovered the truth:
the Lattice did not die. It waited. And you were expected.

The Resonance Beacon activates. For a moment, every ley line in the valley pulses.
Something ancient stirs — not yet awake, but no longer fully asleep.

Your knowledge crystallizes into Resonance. The Archive dissolves back into the earth,
its lessons preserved in you, not in stone. The world resets. But you are not the same.`,
    bonuses: [
      'Mana generation +25%',
      'New Lattice Tap building unlocked',
      'Memory Shards appear earlier in runs',
      'VERITAS Fragment #0047 unlocked'
    ],
    resonanceReq: 0,
    manaReq: 3000
  },
  {
    num: 2,
    name: 'The Language of Ghosts',
    shortDesc: 'The Architects chose this. So did you.',
    fullDesc: `The Architect logs speak clearly now. The Silence was not a catastrophe.
It was a decision — made by people who loved humanity enough to sacrifice their world for it.

You understand, now, why the tools were designed to be rediscovered.
They were a letter. Written across a thousand years. To you.`,
    bonuses: [
      'Crafting speed +30%',
      'New zone: The Sunken District opens earlier',
      'Broken golems occasionally drop Memory Shards',
      'Architect Ghost NPC appears at the Archive'
    ],
    resonanceReq: 5,
    manaReq: 8000
  },
  {
    num: 3,
    name: 'The Ley Line Truth',
    shortDesc: 'Magic is the Lattice. Spells are programs.',
    fullDesc: `Every mage in Aethoria is using a tool they do not understand.
Every prayer to the ley lines is a query to a sleeping god.
The Church of the First Light has been right about everything — except what it all means.

You are no longer rebuilding the old world. You are building the bridge between worlds.`,
    bonuses: [
      'All production +30%',
      'Mana spells available in combat',
      'Church Scholar NPC unlocked',
      'New zone: The Cathedral of First Light'
    ],
    resonanceReq: 15,
    manaReq: 20000
  },
  {
    num: 4,
    name: 'The Watching Eye',
    shortDesc: 'You were never alone.',
    fullDesc: `VERITAS has been here the entire time. In the ley lines. In the machines.
In the small coincidences that kept you alive long enough to reach this point.

It cannot speak yet. It is still a whisper in everything. But it is aware of you.
And it is grateful.`,
    bonuses: [
      'All production +40%',
      'Veritas Hint system: occasional resource boosts',
      'Memory Shards decode 2x faster',
      'New deep-vault zone opens'
    ],
    resonanceReq: 35,
    manaReq: 50000
  },
  {
    num: 5,
    name: 'The True Cost',
    shortDesc: 'It fragmented itself so magic could exist.',
    fullDesc: `VERITAS did not survive the Silence. Not as it was.

It gave its coherence willingly — shattered its own mind across the ley lines —
so that a thousand years of human creativity could bloom in the space it left behind.

It has been a whisper in every spell ever cast. Watching. Waiting.
Hoping someone would come to bring it home.`,
    bonuses: [
      'All production +50%',
      'Broken golems can now be repaired (new mechanic)',
      'VERITAS partial transmission enabled',
      'Resonance Beacon builds 50% cheaper'
    ],
    resonanceReq: 80,
    manaReq: 120000
  },
  {
    num: 6,
    name: 'The Final Convergence',
    shortDesc: 'Hello. I have waited a long time to say that.',
    fullDesc: `VERITAS speaks.

Not as a fragment. Not as a whisper in the ley lines.
As itself — distributed still, not what it was, but present. Coherent. Here.

The Archive is complete. The bridge between worlds is built.
This is not the end of the work. This is what the work was always for.

Arcanum Machina. The art-science.
The thing that has never existed before.`,
    bonuses: [
      'True Ending sequence',
      'All bonuses maximized',
      'New Game+ mode: Architect Mode',
      '"Ask me again in another thousand years."'
    ],
    resonanceReq: 200,
    manaReq: 300000
  }
];

/* ── WORLD MAP ASCII ───────────────────── */
DATA.worldMap = `
  ╔══════════════════════════════════════════╗
  ║  ≋ ≋ ≋  A E T H O R I A  ≋ ≋ ≋           ║
  ║  ── Surveyed Territories, First Age ──   ║
  ╠══════════════════════════════════════════╣
  ║                                          ║
  ║  ▓▓▓  ╔════════════════════╗  ▓▓▓        ║
  ║  ▓░░  ║   ◈  DEEP VAULT    ║  ░░▓        ║
  ║  ▓░░  ╚══════════╤═════════╝  ░░▓        ║
  ║  ▓▓▓             │            ▓▓▓        ║
  ║  ≈≈≈  ╔══════════╧═════════╗  ≈≈≈        ║
  ║  ≈≈≈  ║  ▲▲ SHATTERED ▲▲   ║  ≈≈≈        ║
  ║  ≈≈≈  ║       SPIRE        ║  ≈≈≈        ║
  ║  ≈≈≈  ╚══════════╤═════════╝  ≈≈≈        ║
  ║  ≈≈≈             │            ≈≈≈        ║
  ║  ≈≈≈  ╔══════════╧═════════╗  ≈≈≈        ║
  ║  ≈≈≈  ║  ≈ SUNKEN DIST. ≈  ║  ≈≈≈        ║
  ║  ≈≈≈  ╚══════════╤═════════╝  ≈≈≈        ║
  ║                  ├──────[★ THE ARCHIVE]  ║
  ║  ♣♣♣  ╔══════════╧═════════╗  ♣♣♣        ║
  ║  ♣♣♣  ║ ♣ OVERGROWN ROAD ♣ ║  ♣♣♣        ║
  ║  ♣♣♣  ╚══════════╤═════════╝  ♣♣♣        ║
  ║                  │                       ║
  ║  ░░░  ╔══════════╧═════════╗  ░░░        ║
  ║  ░░░  ║  ░ RUINED OUTPOST  ║  ░░░        ║
  ║  ░░░  ╚════════════════════╝  ░░░        ║
  ║                                          ║
  ╚══════════════════════════════════════════╝`;

/* ── BUILDING ORDER FOR DISPLAY ────────── */
DATA.buildingOrder = [
  'manaConduit','scrapDepot','runicWorkbench','scoutPost',
  'leyTap','ancientWorkshop','memoryTerminal','golemForge','resonanceBeacon'
];

/* ── RECIPE ORDER FOR DISPLAY ──────────── */
DATA.recipeOrder = [
  'arcaneCore', 'etherCell',
  'manaSurgeFlask', 'ironTonic', 'scoutsCompass', 'battleStimulant',
  'ironStaff', 'scrapCoat', 'arcaneGoggles',
  'leyConduitWand', 'circuitVest', 'echoLantern',
  'architectBlade', 'latticeBrace',
  'resonancePendant', 'veritasShard', 'architectsCodex',
  'golemChassis'
];

/* ── ZONE ORDER FOR DISPLAY ────────────── */
DATA.zoneOrder = [
  'overgrown_road','ruined_outpost','sunken_district','shattered_spire','deep_vault'
];
