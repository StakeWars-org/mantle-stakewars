// MVP Buffs
export const buffs = [
  // Power Level 1 - Effect 5
  { name: "Kunai Precision", effect: 5, remainingTurns: 3, price: 150, village: "hidden_leaf" },
  { name: "Sand Shield", effect: 5, remainingTurns: 3, price: 150, village: "hidden_sand" },
  { name: "Water Shuriken", effect: 5, remainingTurns: 3, price: 150, village: "hidden_mist" },
  { name: "Static Kunai", effect: 5, remainingTurns: 3, price: 150, village: "hidden_cloud" },

  // Power Level 2 - Effect 10
  { name: "Basic Chakra Control", effect: 10, remainingTurns: 3, price: 250, village: "hidden_leaf" },
  { name: "Desert Step", effect: 10, remainingTurns: 3, price: 250, village: "hidden_sand" },
  { name: "Mist Veil", effect: 10, remainingTurns: 3, price: 250, village: "hidden_mist" },
  { name: "Lightning Step", effect: 10, remainingTurns: 3, price: 250, village: "hidden_cloud" },

  // Power Level 3 - Effect 15
  { name: "Leaf Whirlwind", effect: 15, remainingTurns: 4, price: 400, village: "hidden_leaf" },
  { name: "Sand Blade Technique", effect: 15, remainingTurns: 4, price: 400, village: "hidden_sand" },
  { name: "Aqua Blade Formation", effect: 15, remainingTurns: 4, price: 400, village: "hidden_mist" },
  { name: "Electric Palm Strike", effect: 15, remainingTurns: 4, price: 400, village: "hidden_cloud" },

  // Power Level 4 - Effect 20
  { name: "Shadow Clone Tactics", effect: 20, remainingTurns: 4, price: 600, village: "hidden_leaf" },
  { name: "Granule Barrage", effect: 20, remainingTurns: 4, price: 600, village: "hidden_sand" },
  { name: "Water Wall Defense", effect: 20, remainingTurns: 4, price: 600, village: "hidden_mist" },
  { name: "Thunder Charge", effect: 20, remainingTurns: 4, price: 600, village: "hidden_cloud" },

  // Power Level 5 - Effect 2
  { name: "Advanced Chakra Infusion", effect: 25, remainingTurns: 5, price: 850, village: "hidden_leaf" },
  { name: "Hardened Sand Armor", effect: 25, remainingTurns: 5, price: 850, village: "hidden_sand" },
  { name: "Hydro Step Mastery", effect: 25, remainingTurns: 5, price: 850, village: "hidden_mist" },
  { name: "Storm Edge Technique", effect: 25, remainingTurns: 5, price: 850, village: "hidden_cloud" }
];

// Future Buffs
export const FutureBuffs = [
  // Tier 1 – Tempo & Efficiency (3 turns)

  {
    name: "Kunai Precision",
    effect: "Your first attack each turn costs 5 less stamina",
    remainingTurns: 3,
    price: 150,
    village: "hidden_leaf",
  },
  {
    name: "Sand Shield",
    effect: "The first incoming attack each turn deals 5 less damage",
    remainingTurns: 3,
    price: 150,
    village: "hidden_sand",
  },
  {
    name: "Water Shuriken",
    effect: "Your first attack each turn ignores defensive bonuses",
    remainingTurns: 3,
    price: 150,
    village: "hidden_mist",
  },
  {
    name: "Static Kunai",
    effect: "If you act first in a turn, gain +5 stamina",
    remainingTurns: 3,
    price: 150,
    village: "hidden_cloud",
  },
  // Tier 2 – Positioning & Information (3 turns)

  {
    name: "Basic Chakra Control",
    effect: "Once per turn, you may reduce one cooldown by 1",
    remainingTurns: 3,
    price: 250,
    village: "hidden_leaf",
  },
  {
    name: "Desert Step",
    effect: "The first attack against you each turn has a 50% chance to miss",
    remainingTurns: 3,
    price: 250,
    village: "hidden_sand",
  },
  {
    name: "Mist Veil",
    effect: "Opponent cannot see your stamina for the duration",
    remainingTurns: 3,
    price: 250,
    village: "hidden_mist",
  },
  {
    name: "Lightning Step",
    effect: "Once per turn, your next ability resolves before the opponent’s",
    remainingTurns: 3,
    price: 250,
    village: "hidden_cloud",
  },
  // Tier 3 – Conditional Advantage (4 turns)

  {
    name: "Leaf Whirlwind",
    effect: "If you successfully attack after defending, gain +10 stamina",
    remainingTurns: 4,
    price: 400,
    village: "hidden_leaf",
  },
  {
    name: "Sand Blade Technique",
    effect: "If an enemy attack misses or is blocked, your next attack costs 0 stamina",
    remainingTurns: 4,
    price: 400,
    village: "hidden_sand",
  },
  {
    name: "Aqua Blade Formation",
    effect: "If both players attack in the same turn, you take 10 less damage",
    remainingTurns: 4,
    price: 400,
    village: "hidden_mist",
  },
  {
    name: "Electric Palm Strike",
    effect: "If you attack first in a turn, reduce the enemy’s stamina regen by 5 next turn",
    remainingTurns: 4,
    price: 400,
    village: "hidden_cloud",
  },
  // Tier 4 – Strategic Control (4 turns)

  {
    name: "Shadow Clone Tactics",
    effect: "Once per match, you may cancel an opponent’s selected ability",
    remainingTurns: 4,
    price: 600,
    village: "hidden_leaf",
  },
  {
    name: "Granule Barrage",
    effect: "Opponent cooldowns increase by 1 for the next turn after they defend",
    remainingTurns: 4,
    price: 600,
    village: "hidden_sand",
  },
  {
    name: "Water Wall Defense",
    effect: "The first attack that would drop you below 30 HP is reduced to 0 damage",
    remainingTurns: 4,
    price: 600,
    village: "hidden_mist",
  },
  {
    name: "Thunder Charge",
    effect: "Once per match, take two actions in the same turn",
    remainingTurns: 4,
    price: 600,
    village: "hidden_cloud",
  },
  // Tier 5 – Match-Defining (One-Time Effects)

  {
    name: "Advanced Chakra Infusion",
    effect: "Once per match, instantly reset all your cooldowns",
    remainingTurns: 5,
    price: 850,
    village: "hidden_leaf",
  },
  {
    name: "Hardened Sand Armor",
    effect: "Once per match, nullify all damage taken in a single turn",
    remainingTurns: 5,
    price: 850,
    village: "hidden_sand",
  },
  {
    name: "Hydro Step Mastery",
    effect: "Once per match, reveal the opponent’s selected abilities for one turn",
    remainingTurns: 5,
    price: 850,
    village: "hidden_mist",
  },
  {
    name: "Storm Edge Technique",
    effect: "Once per match, steal 10 stamina from the opponent",
    remainingTurns: 5,
    price: 850,
    village: "hidden_cloud",
  },
];

