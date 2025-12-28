# AI Gameplay System - Stamina & Combat Mechanics Design

## Overview
This document outlines the proposed stamina system and combat mechanics changes for the AI gameplay mode. The system is designed to prevent ability spam while ensuring players always have viable options.

## Current System (Before Changes)

### Existing Features:
- ✅ Dice roll determines which ability (1-6) is used
- ✅ Fixed damage values for attacks (20, 25, 30, 35)
- ✅ Defense abilities stored in inventory (unlimited, can store duplicates)
- ✅ Buff system for power-ups
- ✅ Turn-based combat with dice roll for first player
- ✅ AI follows same mechanics as player

### Current Ability Structure:
- Each character has 6 abilities:
  - 4 Attack abilities (values: 20, 25, 30, 35)
  - 2 Defense abilities (dodge, block, reflect)

---

## Proposed Changes

### 1. Damage Ranges System

**Change:** Replace fixed damage with damage ranges

**Implementation:**
- Base attack values: 20, 25, 30, 35
- Damage ranges: ±5 from base value
  - Attack 20 → Range: **15-25**
  - Attack 25 → Range: **20-30**
  - Attack 30 → Range: **25-35**
  - Attack 35 → Range: **30-40**

**How it works:**
- When an attack is selected, a random value within the range is calculated
- This random damage is applied to the opponent
- Formula: `damage = baseValue + random(-5, +5)`

**Critical Hits:**
- If damage is **+3 to +5** above base value (including +3), it's a critical hit
- Critical hits reward **+20 stamina**
- Example: Base 20, damage 23-25 = critical hit

**Example:**
- Player selects "Fire Style: Fireball Jutsu" (base 20)
- Random roll: 20 + random(-5, +5) = 20 + 4 = **24 damage** (CRITICAL HIT!)
- Player receives +20 stamina

---

### 2. Ability Selection System

**Change:** Replace dice-based selection with player choice

**Current:** Dice roll (1-6) automatically selects ability
**New:** Player manually selects any ability from their character's 6 abilities

**Implementation:**
- Display all 6 abilities as selectable buttons/cards
- Player clicks to select an ability
- If defense: goes to inventory
- If attack: applies random damage within range

---

### 3. Stamina System

**Purpose:** Prevent spam of high-damage attacks while ensuring players always have options

### Stamina Mechanics:

#### Base Values:
- **Starting Stamina:** 100
- **Max Stamina:** 100
- **Regeneration per Turn:** +8 stamina

#### Stamina Costs:
- **Attack 20 (Weakest):** 15 stamina
- **Attack 25 (Low):** 20 stamina
- **Attack 30 (Medium):** 30 stamina
- **Attack 35 (Strongest):** 50 stamina
- **Defense Abilities:** 10 stamina (or free - to be decided)

#### Availability Rules:
**Players should always have enough stamina to use abilities**

- Abilities are only available if player has enough stamina
- +8 stamina regeneration per turn ensures players don't run out
- Critical hits provide bonus +20 stamina
- Defense abilities available if stamina ≥ 10

#### Stamina Display:
- Show current stamina bar/percentage
- Display stamina cost for each ability
- Gray out unavailable abilities
- Show regeneration amount per turn

---

### 4. Cooldown System (Anti-Spam)

**Purpose:** Prevent repeated use of highest damage attack

**Mechanics:**
- When **Attack 35** (highest damage) is used:
  - Ability enters cooldown for **2 turns**
  - Cannot be selected during cooldown
  - Cooldown counter decreases each turn
  - After 2 turns, ability becomes available again

**Implementation:**
- Track cooldown per ability (only for highest attack initially)
- Display cooldown timer on ability card
- Gray out ability during cooldown
- Show "Available in X turns" message

**Safety:**
- Cooldown system works alongside stamina
- Ensures at least 2 attacks remain available
- If highest attack on cooldown, next highest becomes primary option

---

### 5. Defense Inventory System

**Updated Rules:**
- Defense abilities go to inventory
- **Cannot have multiple of the same defense type**
- **Maximum 2 defenses total**
- Used when defending against attacks

---

## System Integration

### Turn Flow (New System):

1. **Player Turn:**
   - Display available abilities (filtered by stamina + cooldown)
   - Player selects ability
   - Check stamina cost
   - If defense: Add to inventory, deduct stamina
   - If attack: Calculate random damage, apply to opponent, deduct stamina
   - Check for critical hit (+5 to +10 above base) - if yes, reward +20 stamina
   - Apply cooldown if highest attack used
   - Decrease all cooldowns by 1
   - Switch to AI turn (no automatic stamina regeneration)

2. **AI Turn:**
   - AI evaluates available abilities (same rules as player)
   - AI selects best option based on:
     - Stamina available
     - Cooldown status
     - Current health
     - Opponent health
   - AI follows same stamina/cooldown rules
   - AI checks for critical hits (rewards +20 stamina)
   - No automatic stamina regeneration

### Ability Selection UI:

```
┌─────────────────────────────────────┐
│  Stamina: [████████░░] 80/100      │
│  +20 per turn                        │
├─────────────────────────────────────┤
│  Available Abilities:                │
│                                      │
│  [Attack 20] 15 stamina  [10-30]    │
│  [Attack 25] 20 stamina  [15-35]     │
│  [Attack 30] 30 stamina  [20-40]    │
│  [Attack 35] 50 stamina  [25-45] 🔒 │
│         (Cooldown: 1 turn)          │
│                                      │
│  [Defense: Dodge]  10 stamina       │
│  [Defense: Block]   10 stamina       │
└─────────────────────────────────────┘
```

---

## Important Notes

### Stamina Management:
1. ✅ +10 stamina regeneration per turn (prevents running out)
2. ✅ Critical hits provide bonus +20 stamina
3. ✅ Defense abilities cost 10 stamina
4. ✅ Players should always have enough stamina to use at least basic abilities

### Balance Considerations:
- High damage attacks cost more stamina
- Cooldown prevents spam of strongest attack
- Random damage adds unpredictability
- Player must manage stamina strategically

---

## Implementation Notes

### Files to Modify:
1. `src/store/useAIGame.ts` - Add stamina state, cooldown tracking
2. `src/lib/characters.ts` - Add damage range calculation helper
3. `src/app/ai-game/features/AIGameplay.tsx` - Update UI for ability selection
4. `src/app/ai-game/features/PlayerAbility.tsx` - New component for ability selection
5. `src/app/ai-game/features/AIDiceRoll.tsx` - Replace with ability selector

### New State Properties:
```typescript
interface AIGameState {
  player: {
    stamina: number;
    abilityCooldowns: {
      [abilityId: string]: number; // turns remaining
    };
    // ... existing properties
  };
  ai: {
    stamina: number;
    abilityCooldowns: {
      [abilityId: string]: number;
    };
    // ... existing properties
  };
}
```

### New Functions:
- `calculateDamageRange(baseValue: number): { min: number, max: number }`
- `getRandomDamageInRange(min: number, max: number): number`
- `getAvailableAbilities(character: Character, stamina: number, cooldowns: {}): Ability[]`
- `canUseAbility(ability: Ability, stamina: number, cooldown: number): boolean`
- `regenerateStamina(player: 'player' | 'ai'): void`
- `applyCooldown(abilityId: string, turns: number): void`
- `decreaseCooldowns(): void`

---

## Testing Scenarios

1. **Low Stamina Test:**
   - Player uses high-cost attacks
   - Verify only weak attacks available when stamina < 15
   - Verify stamina regeneration works

2. **Cooldown Test:**
   - Player uses Attack 35
   - Verify it's locked for 2 turns
   - Verify it becomes available after cooldown

3. **Always Available Test:**
   - Deplete stamina to minimum
   - Verify at least 2 attacks still available
   - Verify defense abilities always available

4. **AI Behavior Test:**
   - Verify AI follows same rules
   - Verify AI makes smart choices based on stamina
   - Verify AI respects cooldowns

---

## Future Enhancements (Optional)

1. **Stamina Potions:** Items that restore stamina
2. **Ability Upgrades:** Increase damage ranges or reduce costs
3. **Stamina Bonuses:** Character traits that affect stamina
4. **Cooldown Reduction:** Items that reduce cooldown time
5. **Stamina Display:** Visual stamina bar with animations

---

## Summary

This system creates a strategic combat experience where:
- ✅ Players must manage resources (stamina)
- ✅ High-damage attacks are limited (cooldown + cost)
- ✅ Players always have viable options
- ✅ Random damage adds excitement
- ✅ Defense remains accessible
- ✅ AI follows same rules for fairness

