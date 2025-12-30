import { create } from 'zustand';
import { Character, Ability, CHARACTERS } from '@/lib/characters';
import { toast } from 'react-toastify';
import { 
  getRandomDamageInRange, 
  getStaminaCost, 
  getAvailableAbilities,
  STAMINA 
} from '@/lib/combatUtils';
import { getCharacterActivePowerups, getContractCharacterIdFromString } from '@/lib/contractUtils';

export interface Buff {
  name: string;
  effect: number; 
  remainingTurns: number;
}

export interface BattleLogEntry {
  timestamp: string;
  turn: number;
  event: string;
  player?: {
    health: number;
    stamina: number;
  };
  ai?: {
    health: number;
    stamina: number;
  };
  details?: any;
}

interface DefenseInventory {
  [defenseType: string]: number;
}

interface AIGameState {
  player: {
    id: string | null;
    character?: Character;
    currentHealth: number;
    stamina: number;
    abilityCooldowns: { [abilityId: string]: number };
    defenseInventory: DefenseInventory;
    activeBuffs?: Buff[];
    skippedDefense?: {
      ability: Ability;
      damage: number;
    };
  };
  ai: {
    id: string | null;
    character?: Character;
    currentHealth: number;
    stamina: number;
    abilityCooldowns: { [abilityId: string]: number };
    defenseInventory: DefenseInventory;
    activeBuffs?: Buff[];
    skippedDefense?: {
      ability: Ability;
      damage: number;
    };
  };
  currentTurn: 'player' | 'ai';
  gameStatus: 'waiting' | 'character-select' | 'inProgress' | 'finished';
  winner: 'player' | 'ai' | null;
  lastAttack?: {
    ability: Ability;
    attackingPlayer: 'player' | 'ai';
    actualDamage: number; // The actual random damage dealt
  };
  diceRolls?: {
    [key: string]: number;
  };
  isAITurn: boolean;
}

const initialAIGameState: AIGameState = {
  player: {
    id: null,
    currentHealth: 0,
    stamina: STAMINA.STARTING,
    abilityCooldowns: {},
    defenseInventory: {} 
  },
  ai: {
    id: 'ai-opponent',
    currentHealth: 0,
      stamina: STAMINA.STARTING,
    abilityCooldowns: {},
    defenseInventory: {}
  },
  currentTurn: 'player',
  gameStatus: 'waiting',
  winner: null,
  isAITurn: false
};

interface AIGameStore {
  gameState: AIGameState;
  battleLog: BattleLogEntry[];
  turnCount: number;
  reset: () => void;
  selectPlayerCharacter: (character: Character, playerAddress: string) => Promise<void>;
  selectAICharacter: () => void;
  startGame: (playerAddress: string) => void;
  rollAndRecordDice: (playerType: 'player' | 'ai') => Promise<number>;
  checkDiceRollsAndSetTurn: () => void;
  setCurrentTurn: (turn: 'player' | 'ai') => void;
  playerSelectAbility: (ability: Ability) => void;
  performAttack: (attackingPlayer: 'player' | 'ai', ability: Ability, powerUp: boolean) => void;
  aiChooseDefense: (incomingDamage: number, ability: Ability) => void;
  useDefense: (
    defendingPlayer: 'player' | 'ai',
    defenseAbility: Ability,
    incomingDamage: number
  ) => Promise<boolean>;
  addDefenseToInventory: (player: 'player' | 'ai', defenseType: string) => void;
  skipDefense: (
    defendingPlayer: 'player' | 'ai', 
    incomingDamage: number, 
    ability: Ability
  ) => void;
  addBuffToPlayer: (player: 'player' | 'ai', name: string, effect: number, duration: number) => void;
  aiMakeMove: () => void;
  awardXP: (winner: 'player' | 'ai') => void;
  addBattleLogEntry: (event: string, details?: any) => void;
  exportBattleLog: () => void;
}

const useAIGameStore = create<AIGameStore>((set, get) => ({
  gameState: initialAIGameState,
  battleLog: [],
  turnCount: 0,
  
  reset: () => set({ gameState: initialAIGameState, battleLog: [], turnCount: 0 }),
  
  addBattleLogEntry: (event: string, details?: any) => {
    const { gameState, turnCount } = get();
    const entry: BattleLogEntry = {
      timestamp: new Date().toISOString(),
      turn: turnCount,
      event,
      player: {
        health: gameState.player.currentHealth,
        stamina: gameState.player.stamina
      },
      ai: {
        health: gameState.ai.currentHealth,
        stamina: gameState.ai.stamina
      },
      details
    };
    set((state) => ({
      battleLog: [...state.battleLog, entry]
    }));
  },
  
  exportBattleLog: () => {
    const { battleLog, gameState } = get();
    const logData = {
      gameInfo: {
        playerCharacter: gameState.player.character?.nickname || 'Unknown',
        aiCharacter: gameState.ai.character?.nickname || 'Unknown',
        winner: gameState.winner,
        finalPlayerHealth: gameState.player.currentHealth,
        finalAIHealth: gameState.ai.currentHealth,
        totalTurns: battleLog.length
      },
      battleLog: battleLog
    };
    
    const dataStr = JSON.stringify(logData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `battle-log-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  selectPlayerCharacter: async (character: Character, playerAddress: string) => {
    // Fetch active powerups for this character from the contract
    let activeBuffs: Buff[] = [];
    try {
      const contractCharacterId = getContractCharacterIdFromString(character.id);
      if (contractCharacterId) {
        const activePowerups = await getCharacterActivePowerups(
          playerAddress as `0x${string}`,
          contractCharacterId
        );
        
        // Convert to Buff format for gameState
        activeBuffs = activePowerups.map(powerup => ({
          name: powerup.name,
          effect: powerup.effect,
          remainingTurns: powerup.remainingTurns,
        }));
      }
    } catch (error) {
      console.error("Error fetching active powerups for character:", error);
      // Continue without powerups if there's an error
    }

    set((state) => ({
      gameState: {
        ...state.gameState,
        player: {
          ...state.gameState.player,
          id: playerAddress,
          character: character,
          currentHealth: character.baseHealth,
          stamina: STAMINA.STARTING,
          abilityCooldowns: {},
          activeBuffs: activeBuffs
        }
      }
    }));
    get().addBattleLogEntry(`Player selected character: ${character.nickname}`, { character: character.nickname, health: character.baseHealth });
  },

  selectAICharacter: () => {
    // Randomly select an AI character
    const randomCharacter = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    set((state) => ({
      gameState: {
        ...state.gameState,
        ai: {
          ...state.gameState.ai,
          id: 'ai-opponent', // AI doesn't need a real address
          character: randomCharacter,
          currentHealth: randomCharacter.baseHealth,
          stamina: STAMINA.STARTING,
          abilityCooldowns: {}
        }
      }
    }));
    get().addBattleLogEntry(`AI selected character: ${randomCharacter.nickname}`, { character: randomCharacter.nickname, health: randomCharacter.baseHealth });
  },

  startGame: (playerAddress: string) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        gameStatus: 'inProgress',
        player: {
          ...state.gameState.player,
          id: playerAddress
        }
      }
    }));
  },

  rollAndRecordDice: async (playerType: 'player' | 'ai') => {
    const diceRoll = Math.floor(Math.random() * 6) + 1;
    set((state) => ({
      gameState: {
        ...state.gameState,
        diceRolls: {
          ...state.gameState.diceRolls,
          [playerType]: diceRoll
        }
      }
    }));
    return diceRoll;
  },

  checkDiceRollsAndSetTurn: () => {
    const { gameState } = get();
    if (!gameState.diceRolls?.player || !gameState.diceRolls?.ai) return;

    const firstPlayer = gameState.diceRolls.player > gameState.diceRolls.ai ? 'player' : 'ai';
    set((state) => ({
      gameState: {
        ...state.gameState,
        currentTurn: firstPlayer,
        gameStatus: 'inProgress',
        isAITurn: firstPlayer === 'ai'
      }
    }));

    // If AI goes first, make its move
    if (firstPlayer === 'ai') {
      setTimeout(() => get().aiMakeMove(), 1500);
    }
  },

  setCurrentTurn: (turn: 'player' | 'ai') => {
    set((state) => {
      const newTurnCount = state.turnCount + (turn === 'player' ? 1 : 0);
      return {
        turnCount: newTurnCount,
        gameState: {
          ...state.gameState,
          currentTurn: turn,
          isAITurn: turn === 'ai'
        }
      };
    });
    const { gameState } = get();
    get().addBattleLogEntry(`Turn ${get().turnCount}: ${turn === 'player' ? 'Player' : 'AI'} turn started`);
  },


  playerSelectAbility: (ability: Ability) => {
    const { gameState } = get();
    
    // Check if it's player's turn
    if (gameState.currentTurn !== 'player' || gameState.gameStatus !== 'inProgress') {
      toast.error("It's not your turn!");
      return;
    }
    
    // Check if ability is available (stamina and cooldown)
    const availableAbilities = getAvailableAbilities(
      gameState.player.character?.abilities || [],
      gameState.player.stamina,
      gameState.player.abilityCooldowns
    );
    
    const isAvailable = availableAbilities.some(a => a.id === ability.id);
    if (!isAvailable) {
      const onCooldown = gameState.player.abilityCooldowns[ability.id] && gameState.player.abilityCooldowns[ability.id] > 0;
      if (onCooldown) {
        toast.error(`${ability.name} is on cooldown for ${gameState.player.abilityCooldowns[ability.id]} more turn(s)!`);
      } else {
        toast.error(`Not enough stamina to use ${ability.name}!`);
      }
      return;
    }
    
    // Handle defense abilities
    if (ability.type === 'defense') {
      if (ability.defenseType) {
        // Check if defense already exists before trying to add
        const currentInventory = gameState.player.defenseInventory;
        const alreadyHasDefense = currentInventory[ability.defenseType] > 0;
        
        if (alreadyHasDefense) {
          toast.error(`You already have ${ability.defenseType} defense! Cannot add duplicate.`);
          // Don't switch turn - just prevent the action
          return;
        }
        
        get().addDefenseToInventory('player', ability.defenseType);
        
        // Deduct stamina
        const staminaCost = getStaminaCost(ability);
        const newStamina = Math.max(0, gameState.player.stamina - staminaCost);
        
        // Regenerate stamina (+10 per turn) and switch turn
        const regeneratedStamina = Math.min(STAMINA.MAX, newStamina + STAMINA.REGENERATION_PER_TURN);
        get().setCurrentTurn('ai');
        
        set((state) => ({
          gameState: {
            ...state.gameState,
            player: {
              ...state.gameState.player,
              stamina: regeneratedStamina
            }
          }
        }));
        
        toast.success(`Added ${ability.defenseType} to your defense inventory!`);
        get().addBattleLogEntry(`Player used defense: ${ability.name}`, { 
          ability: ability.name, 
          defenseType: ability.defenseType,
          staminaCost: getStaminaCost(ability)
        });
      }
    } else {
      // Handle attack abilities
      const hasBuffs = gameState.player.activeBuffs?.length;
      get().performAttack('player', ability, hasBuffs ? true : false);
      
      if (hasBuffs) {
        const totalExtraDamage = gameState.player.activeBuffs!.reduce(
          (sum, buff) => sum + buff.effect, 0
        );
        toast.info(`⚡ Used buffs to add ${totalExtraDamage} extra damage!`);
      }
      
      // Stamina regeneration happens when turn switches (in useDefense/skipDefense)
    }
  },

  performAttack: (attackingPlayer: 'player' | 'ai', ability: Ability, powerUp: boolean) => {
    const { gameState } = get();
    const defendingPlayer = attackingPlayer === 'player' ? 'ai' : 'player';
    
    // Calculate random damage within range (±5 from base value) and check for critical hit
    const { damage: baseDamage, isCritical } = getRandomDamageInRange(ability.value);
    let damage = baseDamage;
    
    // Apply buffs if any
    if (powerUp && gameState[attackingPlayer].activeBuffs?.length) {
      const totalExtraDamage = gameState[attackingPlayer].activeBuffs.reduce(
        (sum, buff) => sum + buff.effect, 0
      );
      damage += totalExtraDamage;
    }

    // Deduct stamina cost
    const staminaCost = getStaminaCost(ability);
    let newStamina = Math.max(0, gameState[attackingPlayer].stamina - staminaCost);
    
    // Critical hit reward: +20 stamina
    if (isCritical) {
      newStamina = Math.min(STAMINA.MAX, newStamina + STAMINA.CRITICAL_HIT_REWARD);
      if (attackingPlayer === 'player') {
        toast.success(`🎯 CRITICAL HIT! +${STAMINA.CRITICAL_HIT_REWARD} stamina!`);
      } else {
        toast.info(`🎯 AI got a critical hit! +${STAMINA.CRITICAL_HIT_REWARD} stamina!`);
      }
    }
    
    // Decrease all existing cooldowns by 1 first
    const newCooldowns = { ...gameState[attackingPlayer].abilityCooldowns };
    Object.keys(newCooldowns).forEach(abilityId => {
      if (newCooldowns[abilityId] > 0) {
        newCooldowns[abilityId]--;
        if (newCooldowns[abilityId] === 0) {
          delete newCooldowns[abilityId];
        }
      }
    });
    
    // Apply cooldown for highest attack (value 35) after decreasing others
    if (ability.value === 35) {
      newCooldowns[ability.id] = STAMINA.COOLDOWN_TURNS;
    }

    // Check if defending player has defenses
    const defenseInventory = gameState[defendingPlayer].defenseInventory;
    const hasDefenses = Object.values(defenseInventory).some((count) => count > 0);

    // Update attacking player's stamina and cooldowns
    set((state) => ({
      gameState: {
        ...state.gameState,
        [attackingPlayer]: {
          ...state.gameState[attackingPlayer],
          stamina: newStamina,
          abilityCooldowns: newCooldowns
        },
        lastAttack: { 
          ability: { ...ability, value: damage }, 
          attackingPlayer,
          actualDamage: damage
        }
      }
    }));
    
    // Log the attack
    get().addBattleLogEntry(
      `${attackingPlayer === 'player' ? 'Player' : 'AI'} attacked with ${ability.name}`,
      {
        attacker: attackingPlayer,
        ability: ability.name,
        baseDamage: baseDamage,
        finalDamage: damage,
        isCritical,
        staminaCost,
        staminaAfter: newStamina,
        defendingPlayerHasDefenses: hasDefenses
      }
    );

    if (hasDefenses && defendingPlayer === 'player') {
      // Player needs to choose defense
      set((state) => ({
        gameState: {
          ...state.gameState,
          currentTurn: defendingPlayer
        }
      }));
    } else if (hasDefenses && defendingPlayer === 'ai') {
      get().aiChooseDefense(damage, ability);
    } else {
      console.log('No defenses available, calling skipDefense for:', defendingPlayer);
      get().skipDefense(defendingPlayer, damage, ability);
    }
  },

  aiChooseDefense: (incomingDamage: number, ability: Ability) => {
    const { gameState } = get();
    const defenseInventory = gameState.ai.defenseInventory;
    const aiHealth = gameState.ai.currentHealth;
    const playerHealth = gameState.player.currentHealth;
    const playerStamina = gameState.player.stamina;
    
    let chosenDefense: string | null = null;
    let defenseScore = 0;
    
    // ========== ANALYZE STATS ==========
    const aiHealthPercent = (aiHealth / (gameState.ai.character?.baseHealth || 200)) * 100;
    const playerHealthPercent = (playerHealth / (gameState.player.character?.baseHealth || 200)) * 100;
    const playerStaminaPercent = (playerStamina / STAMINA.MAX) * 100;
    const healthDifference = aiHealthPercent - playerHealthPercent;
    const totalDefenses = Object.values(defenseInventory).reduce((sum, count) => sum + count, 0);
    
    // ========== ALWAYS USE DEFENSE IF AVAILABLE ==========
    // AI should always protect itself - only skip if truly no defenses available
    
    if (defenseInventory.reflect && defenseInventory.reflect > 0) {
      let reflectScore = 0;
      
      // High damage attacks are perfect for reflect (damage gets reflected back)
      if (incomingDamage >= 30) reflectScore += 60; // Very high damage - reflect is excellent
      else if (incomingDamage >= 25) reflectScore += 40;
      else if (incomingDamage >= 20) reflectScore += 25;
      else if (incomingDamage >= 15) reflectScore += 15;
      
      // Analyze opponent stats: If player is low on health/stamina, reflect can finish them
      if (playerHealthPercent < 30) reflectScore += 30; // Can potentially kill with reflect
      if (playerStaminaPercent < 30) reflectScore += 20; // Player struggling - reflect pressure
      
      // If AI is high health and player is low health, reflect is great (can win)
      if (aiHealthPercent > 60 && playerHealthPercent < 40) reflectScore += 35;
      
      // If AI is low health and player is high health, reflect is risky but still worth it
      if (aiHealthPercent < 30 && playerHealthPercent > 70) reflectScore -= 10; // Slight penalty but still use it
      
      // If AI is winning significantly, reflect to maintain advantage
      if (healthDifference > 30) reflectScore += 20;
      
      if (reflectScore > defenseScore) {
        defenseScore = reflectScore;
        chosenDefense = 'reflect';
      }
    }
    
    if (defenseInventory.block && defenseInventory.block > 0) {
      let blockScore = 0;
      
      // Block is good for medium to high damage (reduces damage)
      if (incomingDamage >= 25) blockScore += 35;
      else if (incomingDamage >= 20) blockScore += 30;
      else if (incomingDamage >= 15) blockScore += 20;
      else blockScore += 10;
      
      // If AI is low health, block is safer than reflect (guaranteed damage reduction)
      if (aiHealthPercent < 40) blockScore += 25;
      if (aiHealthPercent < 25) blockScore += 15; // Very low health - block is safest
      
      // If AI has more health than player, block is good (preserve advantage)
      if (aiHealthPercent > playerHealthPercent) blockScore += 15;
      
      // If this is the last defense, block is safer
      if (totalDefenses <= 1) blockScore += 10;
      
      if (blockScore > defenseScore) {
        defenseScore = blockScore;
        chosenDefense = 'block';
      }
    }
    
    if (defenseInventory.dodge && defenseInventory.dodge > 0) {
      let dodgeScore = 0;
      
      // Dodge is best for any damage (completely avoids it)
      // Always good, but especially for high damage
      if (incomingDamage >= 30) dodgeScore += 50; // High damage - dodge is excellent
      else if (incomingDamage >= 25) dodgeScore += 40;
      else if (incomingDamage >= 20) dodgeScore += 30;
      else if (incomingDamage >= 15) dodgeScore += 25;
      else dodgeScore += 20;
      
      // If AI is very low health, dodge is safest (guaranteed no damage)
      if (aiHealthPercent < 30) dodgeScore += 30;
      if (aiHealthPercent < 20) dodgeScore += 20; // Critical health - dodge is best
      
      // If AI is winning (much more health), dodge to preserve advantage
      if (aiHealthPercent > playerHealthPercent + 20) dodgeScore += 20;
      
      // If this is the last defense, dodge is safest (guaranteed protection)
      if (totalDefenses <= 1) dodgeScore += 15;
      
      // Analyze opponent: If player is low on stamina, dodge to waste their attack
      if (playerStaminaPercent < 40) dodgeScore += 15;
      
      if (dodgeScore > defenseScore) {
        defenseScore = dodgeScore;
        chosenDefense = 'dodge';
      }
    }
    
    // ========== STRATEGIC DEFENSE SKIPPING ==========
    // AI can strategically skip defense if:
    // 1. The damage won't put AI in a difficult situation (won't drop below 30% health)
    // 2. AI will survive the damage comfortably
    // 3. Skipping gives AI a turn to make a strategic decision
    
    const hadDefenses = Object.values(defenseInventory).some((count) => count > 0);
    const healthAfterDamage = aiHealth - incomingDamage;
    const healthPercentAfterDamage = (healthAfterDamage / (gameState.ai.character?.baseHealth || 200)) * 100;
    const willBeInDifficultSituation = healthPercentAfterDamage < 30 || healthAfterDamage <= 0;
    
    // Strategic skip: If damage won't put AI in difficult situation, skip to get a turn
    if (hadDefenses && !willBeInDifficultSituation && healthPercentAfterDamage > 30) {
      // Additional conditions for strategic skip:
      // - AI has good health buffer (> 40% after damage)
      // - AI is winning or close in health
      // - Damage is relatively low compared to AI's health
      const damagePercentOfHealth = (incomingDamage / aiHealth) * 100;
      
      if (healthPercentAfterDamage > 40 && (healthDifference >= -10 || damagePercentOfHealth < 25)) {
        // Strategic skip: Take damage to get a turn and make a decision
        toast.info(`🤖 AI strategically skipped defense to get a turn!`);
        get().skipDefense('ai', incomingDamage, ability);
        return;
      }
    }

    if (chosenDefense) {
      const defenseAbility = gameState.ai.character?.abilities.find(
        a => a.type === 'defense' && a.defenseType === chosenDefense
      );
      
      if (defenseAbility) {
        toast.info(`🤖 AI chose to use ${chosenDefense} defense!`);
        get().useDefense('ai', defenseAbility, incomingDamage);
      }
    } else {
      // Check if AI had defenses but couldn't choose
      if (hadDefenses) {
        // Fallback: Use first available defense (unless we're strategically skipping)
        if (!willBeInDifficultSituation && healthPercentAfterDamage > 30) {
          // Still consider strategic skip
          const damagePercentOfHealth = (incomingDamage / aiHealth) * 100;
          if (healthPercentAfterDamage > 40 && (healthDifference >= -10 || damagePercentOfHealth < 25)) {
            toast.info(`🤖 AI strategically skipped defense to get a turn!`);
            get().skipDefense('ai', incomingDamage, ability);
            return;
          }
        }
        
        // Use best available defense
        if (defenseInventory.dodge && defenseInventory.dodge > 0) {
          chosenDefense = 'dodge';
        } else if (defenseInventory.block && defenseInventory.block > 0) {
          chosenDefense = 'block';
        } else if (defenseInventory.reflect && defenseInventory.reflect > 0) {
          chosenDefense = 'reflect';
        }
        
        if (chosenDefense) {
          const defenseAbility = gameState.ai.character?.abilities.find(
            a => a.type === 'defense' && a.defenseType === chosenDefense
          );
          if (defenseAbility) {
            toast.info(`🤖 AI chose to use ${chosenDefense} defense!`);
            get().useDefense('ai', defenseAbility, incomingDamage);
            return;
          }
        }
      }
      
      // No defenses available or strategic skip
      toast.info(`🤖 AI has no defenses available!`);
      get().skipDefense('ai', incomingDamage, ability);
    }
  },

  useDefense: async (defendingPlayer: 'player' | 'ai', defenseAbility: Ability, incomingDamage: number) => {
    const { gameState } = get();
    const defenseType = defenseAbility.defenseType;
    const attackingPlayer = defendingPlayer === 'player' ? 'ai' : 'player';
    
    // Reduce defense inventory
    const newDefenseInventory = { ...gameState[defendingPlayer].defenseInventory };
    if (defenseType && newDefenseInventory[defenseType]) {
      newDefenseInventory[defenseType]--;
    }

    let damageToApply = 0;
    let reflectedDamage = 0;

    switch (defenseType) {
      case 'dodge':
        damageToApply = 0;
        if (defendingPlayer === 'ai') {
          toast.info(`🤖 AI dodged the attack completely!`);
        }
        break;
      case 'block':
        damageToApply = Math.max(0, incomingDamage - 25);
        if (defendingPlayer === 'ai') {
          toast.info(`🛡️ AI blocked the attack! Damage reduced from ${incomingDamage} to ${damageToApply}`);
        }
        break;
      case 'reflect':
        damageToApply = 0;
        reflectedDamage = incomingDamage;
        if (defendingPlayer === 'ai') {
          toast.info(`🔄 AI reflected the attack! You take ${reflectedDamage} damage!`);
        }
        break;
      default:
        damageToApply = incomingDamage;
    }

    // Apply damage to defending player
    const newHealth = gameState[defendingPlayer].currentHealth - damageToApply;
    
    // Apply reflected damage to attacking player
    const attackingPlayerNewHealth = reflectedDamage > 0 
      ? gameState[attackingPlayer].currentHealth - reflectedDamage 
      : gameState[attackingPlayer].currentHealth;

    // Check for game end
    if (newHealth <= 0 || attackingPlayerNewHealth <= 0) {
      const winner = newHealth <= 0 ? attackingPlayer : defendingPlayer;
      
      // Determine turn based on defense type (same logic as above)
      let nextTurn: 'player' | 'ai';
      
      if (defenseType === 'dodge') {
        nextTurn = defendingPlayer;
      } else if (defenseType === 'reflect') {
        nextTurn = attackingPlayer;
      } else {
        nextTurn = attackingPlayer;
      }
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: Math.max(0, newHealth),
            defenseInventory: newDefenseInventory
          },
          lastAttack: undefined,
          currentTurn: nextTurn,
          gameStatus: 'finished',
          winner,
          ...(reflectedDamage > 0 && {
            [attackingPlayer]: {
              ...state.gameState[attackingPlayer],
              currentHealth: Math.max(0, attackingPlayerNewHealth)
            }
          })
        }
      }));

      // Award XP if player wins
      if (winner === 'player') {
        get().awardXP('player');
      }
      
      get().addBattleLogEntry(
        `Game ended! ${winner === 'player' ? 'Player' : 'AI'} won!`,
        {
          winner,
          finalPlayerHealth: Math.max(0, newHealth),
          finalAIHealth: Math.max(0, attackingPlayerNewHealth),
          defenseType,
          incomingDamage,
          damageToApply,
          reflectedDamage
        }
      );
    } else {
      // Determine turn based on defense type
      let nextTurn: 'player' | 'ai';
      
      if (defenseType === 'dodge') {
        // Dodge keeps the turn with the defending player
        nextTurn = defendingPlayer;
      } else if (defenseType === 'reflect') {
        // Reflect switches turn to the attacking player (who now takes damage)
        nextTurn = attackingPlayer;
      } else {
        // Block and other defenses switch turn to the attacking player
        nextTurn = attackingPlayer;
      }

      // Regenerate stamina (+10 per turn) and decrease cooldowns for both players
      const defendingStamina = Math.min(STAMINA.MAX, gameState[defendingPlayer].stamina + STAMINA.REGENERATION_PER_TURN);
      const attackingStamina = Math.min(STAMINA.MAX, gameState[attackingPlayer].stamina + STAMINA.REGENERATION_PER_TURN);
      
      const defendingCooldowns = { ...gameState[defendingPlayer].abilityCooldowns };
      const attackingCooldowns = { ...gameState[attackingPlayer].abilityCooldowns };
      
      // Decrease cooldowns
      Object.keys(defendingCooldowns).forEach(abilityId => {
        if (defendingCooldowns[abilityId] > 0) {
          defendingCooldowns[abilityId]--;
          if (defendingCooldowns[abilityId] === 0) {
            delete defendingCooldowns[abilityId];
          }
        }
      });
      
      Object.keys(attackingCooldowns).forEach(abilityId => {
        if (attackingCooldowns[abilityId] > 0) {
          attackingCooldowns[abilityId]--;
          if (attackingCooldowns[abilityId] === 0) {
            delete attackingCooldowns[abilityId];
          }
        }
      });

      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: newHealth,
            defenseInventory: newDefenseInventory,
            stamina: defendingStamina,
            abilityCooldowns: defendingCooldowns
          },
          [attackingPlayer]: {
            ...state.gameState[attackingPlayer],
            stamina: attackingStamina,
            abilityCooldowns: attackingCooldowns,
            ...(reflectedDamage > 0 && {
              currentHealth: attackingPlayerNewHealth
            })
          },
          lastAttack: undefined,
          currentTurn: nextTurn
        }
      }));
      
      get().addBattleLogEntry(
        `${defendingPlayer === 'player' ? 'Player' : 'AI'} used ${defenseType} defense`,
        {
          defender: defendingPlayer,
          defenseType,
          incomingDamage,
          damageToApply,
          reflectedDamage,
          healthAfter: newHealth
        }
      );
      
      // If it's now AI's turn, make its move
      if (nextTurn === 'ai') {
        // console.log('AI turn detected in useDefense, triggering AI move...');
        // console.log('Defense type was:', defenseType, 'AI should keep turn and attack again');
        setTimeout(() => get().aiMakeMove(), 1000);
      } else {
        // console.log('AI turn NOT detected in useDefense, nextTurn is:', nextTurn, 'defense type was:', defenseType);
      }
    }

    return true;
  },

  addDefenseToInventory: (player: 'player' | 'ai', defenseType: string) => {
    set((state) => {
      const currentInventory = state.gameState[player].defenseInventory;
      const currentCount = currentInventory[defenseType] || 0;
      const totalDefenses = Object.values(currentInventory).reduce((sum, count) => sum + (count as number), 0);
      
      // Cannot have multiple of the same type
      if (currentCount > 0) {
        if (player === 'player') {
          toast.error(`You already have ${defenseType} defense!`);
        }
        return state;
      }
      
      // Cannot have more than 2 defenses total
      if (totalDefenses >= 2) {
        if (player === 'player') {
          toast.error('You can only have 2 defenses maximum!');
        }
        return state;
      }
      
      return {
        gameState: {
          ...state.gameState,
          [player]: {
            ...state.gameState[player],
            defenseInventory: {
              ...currentInventory,
              [defenseType]: 1
            }
          }
        }
      };
    });
  },

  skipDefense: (defendingPlayer: 'player' | 'ai', incomingDamage: number, ability: Ability) => {
    const { gameState } = get();
    const attackingPlayer = defendingPlayer === 'player' ? 'ai' : 'player';
    
    const newHealth = gameState[defendingPlayer].currentHealth - incomingDamage;
    
    // Check if defending player had defenses available (meaning they chose to skip)
    const defenseInventory = gameState[defendingPlayer].defenseInventory;
    const hadDefenses = Object.values(defenseInventory).some((count) => count > 0);
    
    // Determine next turn: 
    // - If they had defenses but chose to skip, they keep their turn
    // - If they had no defenses (forced skip), turn goes to the defending player so they can attack back
    // - When player attacks AI with no defenses, AI should get turn to attack back
    let nextTurn: 'player' | 'ai';
    if (hadDefenses) {
      // They had defenses but chose to skip - they keep their turn
      nextTurn = defendingPlayer;
    } else {
      // They had no defenses - turn goes to the defending player so they can attack back
      nextTurn = defendingPlayer;
    }
    
    // console.log('skipDefense turn logic:', { 
    //   defendingPlayer, 
    //   attackingPlayer, 
    //   hadDefenses, 
    //   nextTurn,
    //   newHealth 
    // });
    
    // Check for game end
    if (newHealth <= 0) {
      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: Math.max(0, newHealth)
          },
          lastAttack: undefined,
          currentTurn: nextTurn,
          gameStatus: 'finished',
          winner: attackingPlayer
        }
      }));
      
      // Award XP if player wins
      if (attackingPlayer === 'player') {
        get().awardXP('player');
      }
      
      // Only say "skipped defense" if they had defenses but chose not to use them
      const eventMessage = hadDefenses 
        ? `${defendingPlayer === 'player' ? 'Player' : 'AI'} skipped defense and took ${incomingDamage} damage`
        : `${defendingPlayer === 'player' ? 'Player' : 'AI'} took ${incomingDamage} damage (no defense available)`;
      
      get().addBattleLogEntry(
        eventMessage,
        {
          defender: defendingPlayer,
          incomingDamage,
          healthAfter: Math.max(0, newHealth),
          hadDefenses: hadDefenses
        }
      );
      
      get().addBattleLogEntry(
        `Game ended! ${attackingPlayer === 'player' ? 'Player' : 'AI'} won!`,
        {
          winner: attackingPlayer,
          finalPlayerHealth: Math.max(0, newHealth),
          finalAIHealth: gameState[attackingPlayer].currentHealth,
          incomingDamage
        }
      );
    } else {
      // Regenerate stamina (+10 per turn) and decrease cooldowns for both players
      const defendingStamina = Math.min(STAMINA.MAX, gameState[defendingPlayer].stamina + STAMINA.REGENERATION_PER_TURN);
      const attackingStamina = Math.min(STAMINA.MAX, gameState[attackingPlayer].stamina + STAMINA.REGENERATION_PER_TURN);
      
      const defendingCooldowns = { ...gameState[defendingPlayer].abilityCooldowns };
      const attackingCooldowns = { ...gameState[attackingPlayer].abilityCooldowns };
      
      // Decrease cooldowns
      Object.keys(defendingCooldowns).forEach(abilityId => {
        if (defendingCooldowns[abilityId] > 0) {
          defendingCooldowns[abilityId]--;
          if (defendingCooldowns[abilityId] === 0) {
            delete defendingCooldowns[abilityId];
          }
        }
      });
      
      Object.keys(attackingCooldowns).forEach(abilityId => {
        if (attackingCooldowns[abilityId] > 0) {
          attackingCooldowns[abilityId]--;
          if (attackingCooldowns[abilityId] === 0) {
            delete attackingCooldowns[abilityId];
          }
        }
      });
      
      set((state) => ({
        gameState: {
          ...state.gameState,
          [defendingPlayer]: {
            ...state.gameState[defendingPlayer],
            currentHealth: newHealth,
            stamina: defendingStamina,
            abilityCooldowns: defendingCooldowns
          },
          [attackingPlayer]: {
            ...state.gameState[attackingPlayer],
            stamina: attackingStamina,
            abilityCooldowns: attackingCooldowns
          },
          lastAttack: undefined,
          currentTurn: nextTurn
        }
      }));
      
      // Only say "skipped defense" if they had defenses but chose not to use them
      const eventMessage = hadDefenses 
        ? `${defendingPlayer === 'player' ? 'Player' : 'AI'} skipped defense and took ${incomingDamage} damage`
        : `${defendingPlayer === 'player' ? 'Player' : 'AI'} took ${incomingDamage} damage (no defense available)`;
      
      get().addBattleLogEntry(
        eventMessage,
        {
          defender: defendingPlayer,
          incomingDamage,
          healthAfter: newHealth,
          hadDefenses: hadDefenses
        }
      );
      
      // If it's now AI's turn, make its move
      if (nextTurn === 'ai') {
        // console.log('AI turn detected in skipDefense, triggering AI move...');
        setTimeout(() => {
          console.log('About to call aiMakeMove from skipDefense...');
          get().aiMakeMove();
        }, 1000);
      } else {
        // console.log('AI turn NOT detected in skipDefense, nextTurn is:', nextTurn);
      }
    }
  },

  addBuffToPlayer: (player: 'player' | 'ai', name: string, effect: number, duration: number) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        [player]: {
          ...state.gameState[player],
          activeBuffs: [
            ...(state.gameState[player].activeBuffs || []),
            { name, effect, remainingTurns: duration }
          ]
        }
      }
    }));
  },

  aiMakeMove: () => {
    const { gameState } = get();
    console.log('aiMakeMove called:', { currentTurn: gameState.currentTurn, gameStatus: gameState.gameStatus });
    if (gameState.currentTurn !== 'ai' || gameState.gameStatus !== 'inProgress') {
      // console.log('AI move blocked - not AI turn or game not in progress');
      return;
    }

    const aiCharacter = gameState.ai.character;
    if (!aiCharacter) return;

    // Get available abilities based on stamina and cooldowns
    const availableAbilities = getAvailableAbilities(
      aiCharacter.abilities,
      gameState.ai.stamina,
      gameState.ai.abilityCooldowns
    );

    if (availableAbilities.length === 0) {
      // AI has no available abilities - skip turn and switch to player
      toast.warn('AI has no available abilities! Skipping turn.');
      set((state) => ({
        gameState: {
          ...state.gameState,
          currentTurn: 'player'
        }
      }));
      return;
    }

    // ENHANCED AI DECISION LOGIC - Super Smart AI with Stamina Management & Opponent Analysis
    const availableAttacks = availableAbilities.filter(a => a.type === 'attack');
    const availableDefenses = availableAbilities.filter(a => a.type === 'defense');
    
    let chosenAbility: Ability | null = null;
    
    // ========== ANALYZE AI STATS ==========
    const aiHealthPercent = (gameState.ai.currentHealth / aiCharacter.baseHealth) * 100;
    const aiStaminaPercent = (gameState.ai.stamina / STAMINA.MAX) * 100;
    const aiStamina = gameState.ai.stamina;
    const currentDefenseInventory = gameState.ai.defenseInventory;
    const totalDefenses = Object.values(currentDefenseInventory).reduce((sum, count) => sum + (count as number), 0);
    
    // ========== ANALYZE OPPONENT STATS ==========
    const playerCharacter = gameState.player.character;
    const playerHealthPercent = (gameState.player.currentHealth / (playerCharacter?.baseHealth || 200)) * 100;
    const playerStaminaPercent = (gameState.player.stamina / STAMINA.MAX) * 100;
    const playerStamina = gameState.player.stamina;
    const playerDefenses = Object.values(gameState.player.defenseInventory).reduce((sum, count) => sum + (count as number), 0);
    const healthDifference = aiHealthPercent - playerHealthPercent;
    const staminaDifference = aiStamina - playerStamina;
    
    // ========== STAMINA MANAGEMENT ==========
    // Reserve at least 10 stamina for a defense ability (defense costs 10)
    const DEFENSE_STAMINA_COST = 10;
    const reservedStaminaForDefense = DEFENSE_STAMINA_COST;
    const usableStaminaForAttacks = aiStamina - reservedStaminaForDefense;
    
    // Filter attacks that can be used while reserving stamina for defense
    const attacksWithReservedStamina = availableAttacks.filter(attack => {
      const attackCost = getStaminaCost(attack);
      return attackCost <= usableStaminaForAttacks;
    });
    
    // ========== STRATEGIC DECISION MAKING ==========
    
    // PRIORITY 1: CRITICAL - Always maintain at least 1 defense if possible
    // If AI has no defenses and can afford one, prioritize getting defense
    if (totalDefenses === 0 && availableDefenses.length > 0 && aiStamina >= DEFENSE_STAMINA_COST) {
      const defenseToAdd = availableDefenses.find(def => !currentDefenseInventory[def.defenseType || '']);
      if (defenseToAdd) {
        chosenAbility = defenseToAdd;
      }
    }
    // PRIORITY 2: CRITICAL - If stamina is very low (< 20), only use defense or very cheap attacks
    else if (aiStamina < 20 && availableDefenses.length > 0 && totalDefenses < 2) {
      const defenseToAdd = availableDefenses.find(def => !currentDefenseInventory[def.defenseType || '']);
      if (defenseToAdd) {
        chosenAbility = defenseToAdd;
      } else if (attacksWithReservedStamina.length > 0) {
        // Use cheapest attack that still leaves room for defense
        const sortedCheapAttacks = [...attacksWithReservedStamina].sort((a, b) => getStaminaCost(a) - getStaminaCost(b));
        chosenAbility = sortedCheapAttacks[0];
      }
    }
    // PRIORITY 3: WIN CONDITION - Player is very low health (< 25%) and can be finished
    else if (playerHealthPercent < 25 && availableAttacks.length > 0) {
      // Calculate if any attack can kill the player
      const playerCurrentHealth = gameState.player.currentHealth;
      const sortedAttacks = [...availableAttacks].sort((a, b) => b.value - a.value);
      
      // Check if highest attack can finish (considering max damage range: base + 5)
      for (const attack of sortedAttacks) {
        const maxPossibleDamage = attack.value + 5; // Max damage from range
        if (maxPossibleDamage >= playerCurrentHealth) {
          // This attack can potentially kill - use it if stamina allows
          if (getStaminaCost(attack) <= usableStaminaForAttacks || aiStamina >= getStaminaCost(attack)) {
            chosenAbility = attack;
            break;
          }
        }
      }
      
      // If no single attack can kill, use highest available
      if (!chosenAbility && attacksWithReservedStamina.length > 0) {
        chosenAbility = sortedAttacks.find(a => attacksWithReservedStamina.includes(a)) || sortedAttacks[0];
      } else if (!chosenAbility && availableAttacks.length > 0) {
        // Desperate move - use attack even if it depletes all stamina
        chosenAbility = sortedAttacks[0];
      }
    }
    // PRIORITY 4: DEFENSIVE - AI is low health (< 30%) - prioritize defense
    else if (aiHealthPercent < 30 && availableDefenses.length > 0 && totalDefenses < 2) {
      const defenseToAdd = availableDefenses.find(def => !currentDefenseInventory[def.defenseType || '']);
      if (defenseToAdd) {
        chosenAbility = defenseToAdd;
      }
    }
    // PRIORITY 5: OPPONENT ANALYSIS - Player has many defenses (2) - use LOW damage to break through
    // Strategy: Use cheap attacks to waste opponent's defenses, then use high damage when they're gone
    else if (playerDefenses >= 2 && attacksWithReservedStamina.length > 0) {
      // Use LOWEST damage attack to waste opponent's defenses economically
      const sortedAttacks = [...attacksWithReservedStamina].sort((a, b) => a.value - b.value);
      chosenAbility = sortedAttacks[0]; // Use cheapest/lowest damage attack
    }
    // PRIORITY 6: STAMINA MANAGEMENT - Low stamina (< 40) - use cheaper attacks and maintain defense
    else if (aiStamina < 40 && attacksWithReservedStamina.length > 0) {
      // Use cheaper attacks to conserve stamina while maintaining defense reserve
      const sortedAttacks = [...attacksWithReservedStamina].sort((a, b) => getStaminaCost(a) - getStaminaCost(b));
      chosenAbility = sortedAttacks[0];
    }
    // PRIORITY 7: AGGRESSIVE - AI is winning significantly (> 30% health advantage) and has good stamina
    else if (healthDifference > 30 && aiStaminaPercent > 60 && attacksWithReservedStamina.length > 0) {
      const sortedAttacks = [...attacksWithReservedStamina].sort((a, b) => b.value - a.value);
      chosenAbility = sortedAttacks[0];
    }
    // PRIORITY 8: OPPONENT ANALYSIS - Player is low on stamina - pressure them
    else if (playerStaminaPercent < 30 && attacksWithReservedStamina.length > 0) {
      // Player is low on stamina, they'll struggle to defend - use high damage
      const sortedAttacks = [...attacksWithReservedStamina].sort((a, b) => b.value - a.value);
      chosenAbility = sortedAttacks[0];
    }
    // PRIORITY 9: DEFENSIVE - Build defense inventory when health is moderate (30-70%) and defenses are low
    else if (aiHealthPercent >= 30 && aiHealthPercent <= 70 && totalDefenses < 2 && availableDefenses.length > 0) {
      // Only build defense if we have enough stamina buffer
      if (aiStamina >= 30) { // Ensure we have enough stamina after defense
        const defenseToAdd = availableDefenses.find(def => !currentDefenseInventory[def.defenseType || '']);
        if (defenseToAdd) {
          chosenAbility = defenseToAdd;
        }
      }
    }
    // PRIORITY 10: COOLDOWN MANAGEMENT - Highest attack on cooldown - use next best
    else if (attacksWithReservedStamina.length > 1) {
      const highestAttack = attacksWithReservedStamina.find(a => a.value === 35);
      const highestAttackOnCooldown = highestAttack && gameState.ai.abilityCooldowns[highestAttack.id] > 0;
      
      if (highestAttackOnCooldown) {
        const sortedAttacks = [...attacksWithReservedStamina].sort((a, b) => b.value - a.value);
        // Skip highest (on cooldown), use second highest
        chosenAbility = sortedAttacks.find(a => a.value !== 35) || sortedAttacks[0];
      } else {
        // No cooldown, use highest available
        const sortedAttacks = [...attacksWithReservedStamina].sort((a, b) => b.value - a.value);
        chosenAbility = sortedAttacks[0];
      }
    }
    // PRIORITY 11: DEFAULT - Use highest damage attack while maintaining defense reserve
    else if (attacksWithReservedStamina.length > 0) {
      const sortedAttacks = [...attacksWithReservedStamina].sort((a, b) => b.value - a.value);
      chosenAbility = sortedAttacks[0];
    }
    // PRIORITY 12: FALLBACK - If we can't maintain defense reserve, use best available attack
    else if (availableAttacks.length > 0) {
      // Desperate situation - use attack even if it means no stamina for defense
      const sortedAttacks = [...availableAttacks].sort((a, b) => b.value - a.value);
      chosenAbility = sortedAttacks[0];
    }
    // PRIORITY 13: LAST RESORT - Use defense if no attacks available or if we need to build defense
    else if (availableDefenses.length > 0) {
      // Try to add a new defense type if we don't have 2 yet
      if (totalDefenses < 2) {
        const defenseToAdd = availableDefenses.find(def => !currentDefenseInventory[def.defenseType || '']);
        if (defenseToAdd) {
          chosenAbility = defenseToAdd;
        } else {
          // Already have this defense type, but use it anyway if it's the only option
          chosenAbility = availableDefenses[0];
        }
      } else {
        // Already have 2 defenses, but if no attacks available, use defense anyway
        chosenAbility = availableDefenses[0];
      }
    }

    if (!chosenAbility) {
      console.error('AI decision logic failed - no ability chosen:', {
        availableAbilities: availableAbilities.length,
        availableAttacks: availableAttacks.length,
        availableDefenses: availableDefenses.length,
        attacksWithReservedStamina: attacksWithReservedStamina.length,
        aiStamina,
        aiHealthPercent,
        playerHealthPercent,
        totalDefenses,
        playerDefenses,
        aiStaminaPercent,
        playerStaminaPercent
      });
      toast.error('AI could not choose an ability!');
      return;
    }

    // Execute chosen ability
    if (chosenAbility.type === "defense") {
      if (chosenAbility.defenseType) {
        // Deduct stamina for defense
        const staminaCost = getStaminaCost(chosenAbility);
        const newStamina = Math.max(0, gameState.ai.stamina - staminaCost);
        
        get().addDefenseToInventory('ai', chosenAbility.defenseType);
        
        // Regenerate stamina (+10 per turn)
        const regeneratedStamina = Math.min(STAMINA.MAX, newStamina + STAMINA.REGENERATION_PER_TURN);
        
        set((state) => ({
          gameState: {
            ...state.gameState,
            ai: {
              ...state.gameState.ai,
              stamina: regeneratedStamina
            },
            currentTurn: 'player'
          }
        }));
        
        toast.info(`🛡️ AI added 1 ${chosenAbility.defenseType} to its inventory`);
      }
    } else {
      // AI attack logic
      const hasBuffs = gameState.ai.activeBuffs?.length;
      get().performAttack('ai', chosenAbility, hasBuffs ? true : false);
      
      if (hasBuffs) {
        const totalExtraDamage = gameState.ai.activeBuffs!.reduce(
          (sum, buff) => sum + buff.effect, 0
        );
        toast.info(`⚡ AI used buffs to add ${totalExtraDamage} extra damage!`);
      }
      
      // Stamina regeneration happens when turn switches (in useDefense/skipDefense)
    }
  },

  awardXP: async (winner: 'player' | 'ai') => {
    if (winner === 'player') {
      // Award XP to player via API
      const xpReward = 50; // Base XP for winning
      toast.success(`🎉 Victory! You earned ${xpReward} XP!`);
      
      try {
        // Award XP via API (handles Mantle network transactions on backend)
        // This involves:
        // 1. API call to update character's XP
        // 2. Recording the victory
        // 3. Potentially updating character traits/levels
        // Example integration (commented out - implement in API):
        // const response = await fetch('/api/award-xp', {
        //   method: 'POST',
        //   body: JSON.stringify({
        //     walletAddress: gameState.player.id,
        //     xpGained: xpReward,
        //     reason: 'AI Victory',
        //     authority: wallet.publicKey.toString()
        //   }
        // });
        // XP is awarded via API endpoint (handles Mantle network transactions on backend)
        
        console.log(`Player earned ${xpReward} XP for defeating AI`);
      } catch (error) {
        console.error('Failed to record XP on-chain:', error);
        // Still show success message even if on-chain recording fails
      }
    }
  }
}));

export default useAIGameStore;
