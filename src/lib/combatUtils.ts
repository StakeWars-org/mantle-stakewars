import { Ability } from './characters';

/**
 * Calculate damage range for an attack ability
 * Range is ±5 from base value
 */
export function calculateDamageRange(baseValue: number): { min: number; max: number } {
  return {
    min: Math.max(1, baseValue - 5), // Ensure minimum damage is at least 1
    max: baseValue + 5
  };
}

/**
 * Get random damage within the range for an attack
 * Returns damage and whether it was a critical hit (+3 to +5 above base, including +3)
 */
export function getRandomDamageInRange(baseValue: number): { damage: number; isCritical: boolean } {
  const { min, max } = calculateDamageRange(baseValue);
  const damage = Math.floor(Math.random() * (max - min + 1)) + min;
  
  // Critical hit: damage is +3 to +5 above base value (including +3)
  const criticalMin = baseValue + 3;
  const criticalMax = baseValue + 5;
  const isCritical = damage >= criticalMin && damage <= criticalMax;
  
  return { damage, isCritical };
}

/**
 * Get stamina cost for an ability
 */
export function getStaminaCost(ability: Ability): number {
  if (ability.type === 'defense') {
    return 10; // Defense abilities cost 10 stamina
  }
  
  // Attack abilities cost based on damage value
  switch (ability.value) {
    case 20: return 15;
    case 25: return 20;
    case 30: return 30;
    case 35: return 50;
    default: return 20; // Default cost
  }
}

/**
 * Check if an ability can be used based on stamina
 */
export function canUseAbility(ability: Ability, currentStamina: number): boolean {
  const cost = getStaminaCost(ability);
  return currentStamina >= cost;
}

/**
 * Get available abilities based on stamina and cooldowns
 * Users can run out of stamina and have no attacks available
 */
export function getAvailableAbilities(
  abilities: Ability[],
  currentStamina: number,
  cooldowns: { [abilityId: string]: number }
): Ability[] {
  const attackAbilities = abilities.filter(a => a.type === 'attack');
  const defenseAbilities = abilities.filter(a => a.type === 'defense');
  
  // Filter attacks by stamina availability and cooldowns
  const availableAttacks = attackAbilities.filter(ability => {
    const onCooldown = cooldowns[ability.id] && cooldowns[ability.id] > 0;
    if (onCooldown) return false;
    return canUseAbility(ability, currentStamina);
  });
  
  // Filter defenses by stamina availability
  const availableDefenses = defenseAbilities.filter(ability => 
    canUseAbility(ability, currentStamina)
  );
  
  return [...availableAttacks, ...availableDefenses];
}

/**
 * Stamina constants
 */
export const STAMINA = {
  MAX: process.env.MAX ? parseInt(process.env.MAX, 10) : 100,
  STARTING: process.env.STARTING ? parseInt(process.env.STARTING, 10) : 100,
  REGENERATION_PER_TURN: process.env.REGENERATION_PER_TURN ? parseInt(process.env.REGENERATION_PER_TURN, 10) : 8, // Stamina regeneration per turn
  CRITICAL_HIT_REWARD: process.env.CRITICAL_HIT_REWARD ? parseInt(process.env.CRITICAL_HIT_REWARD, 10) : 20, // Stamina reward for critical hits
  COOLDOWN_TURNS: process.env.COOLDOWN_TURNS ? parseInt(process.env.COOLDOWN_TURNS, 10) : 2 // Cooldown for highest attack
};

