import { create } from 'zustand';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  serverTimestamp,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Character, Ability } from '@/lib/characters';
import { toast } from 'react-toastify';
import { Timestamp } from 'firebase/firestore';
import { getCharacterActivePowerups, getContractCharacterIdFromString } from '@/lib/contractUtils';
import { 
  getRandomDamageInRange, 
  getStaminaCost, 
  getAvailableAbilities,
  STAMINA 
} from '@/lib/combatUtils';

export interface Buff {
  name: string;
  effect: number; 
  remainingTurns: number;
}

export interface BattleLogEntry {
  timestamp: string;
  turn: number;
  event: string;
  player1?: {
    health: number;
    stamina: number;
  };
  player2?: {
    health: number;
    stamina: number;
  };
  details?: any;
}

export type UpdateData = {
  [key: string]: number | string | null | object;
};

export interface GameRoomPlayer {
  characterId: string | null;
  role: 'creator' | 'challenger';
  diceRoll?: number;
  wallet?: string;
}

export interface GameRoomDocument {
  id: string;
  createdBy: string;
  status: 'waiting' | 'character-select' | 'inProgress' | 'finished';
  players: {
    [address: string]: GameRoomPlayer;
  };
  createdAt: Timestamp;
  gameState?: GameState;
  creatorTotalWins?: number;
  rewardsClaimed?: boolean;
  rewardsClaimedAt?: number;
  rewardsClaimedBy?: string;
  isWagerMatch?: boolean;
  isTournamentMatch?: boolean;
  wagerId?: string;
  tournamentId?: string;
  matchId?: string;
}

interface DefenseInventory {
  [defenseType: string]: number;
}

interface GameState {
  player1: {
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
  player2: {
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
  currentTurn: 'player1' | 'player2';
  gameStatus: 'waiting' | 'character-select' | 'inProgress' | 'finished';
  winner: 'player1' | 'player2' | null;
  lastAttack?: {
    ability: Ability;
    attackingPlayer: 'player1' | 'player2';
    actualDamage: number; // The actual random damage dealt
  };
  diceRolls?: {
    [key: string]: number;
  };
  battleLog?: BattleLogEntry[];
  turnCount?: number;
};

const initialGameState: GameState = {
  player1: {
    id: null,
    currentHealth: 0,
    stamina: STAMINA.STARTING,
    abilityCooldowns: {},
    defenseInventory: {} 
  },
  player2: {
    id: null,
    currentHealth: 0,
    stamina: STAMINA.STARTING,
    abilityCooldowns: {},
    defenseInventory: {}
  },
  currentTurn: 'player1',
  gameStatus: 'waiting',
  winner: null,
};

interface OnlineGameStore {
  roomId: string | null;
  setRoomId: (roomId: string, address: string) => void;
  reset: () => void,
  playerAddress: string | null;
  gameState: GameState;
  rollAndRecordDice: () => Promise<number>;
  checkDiceRollsAndSetTurn: () => void;
  selectCharacters: (roomId: string, character: Character, playerAddress: string) => Promise<void>;
  playerSelectAbility: (ability: Ability, playerAddress: string) => void;
  performAttack: (attackingPlayer: 'player1' | 'player2', ability: Ability, powerUp: boolean) => void;
  useDefense: (
    defendingPlayer: 'player1' | 'player2',
    defenseAbility: Ability,
    incomingDamage: number
  ) => Promise<boolean>;
  addDefenseToInventory: (player: 'player1' | 'player2', defenseType: string) => void;
  skipDefense: (
    defendingPlayer: 'player1' | 'player2', 
    incomingDamage: number, 
    ability: Ability
  ) => void;
  // getStakeDetails: (roomId: string) => Promise<StakeDetails | undefined>;
  addBuffToPlayer: (player: 'player1' | 'player2', name: string, effect: number, duration: number) => void;
  createOnlineGameRoom: (playerAddress: string) => Promise<string>;
  joinGameRoom: (roomId: string, playerAddress: string | null) => Promise<void>;
  findUserRooms: (playerAddress: string) => Promise<GameRoomDocument[] | null>;
  findOpenGameRoom: (playerAddress: string) => Promise<GameRoomDocument[] | null>;
  validatePlayerInRoom: (playerAddress: string, roomData: GameRoomDocument) => void;
  endGame: (winner: 'player1' | 'player2') => void;
  addBattleLogEntry: (event: string, details?: any) => Promise<void>;
  exportBattleLog: () => void;
  init: (roomId: string) => () => void;
}

const useOnlineGameStore = create<OnlineGameStore>((set, get) => ({
  roomId: null,
  setRoomId: (roomId: string, address: string) => {
    set({
      roomId: roomId,
      playerAddress: address,
    });
  },
  reset: () => set({ gameState: initialGameState, roomId: null }),
  playerAddress: null,
  gameState: initialGameState,

  rollAndRecordDice: async () => {
    const { roomId, playerAddress } = get();
    if (!roomId || !playerAddress) {
      throw new Error("No active game room");
    }

    const diceRoll = Math.floor(Math.random() * 6) + 1;
    const roomRef = doc(db, "gameRooms", roomId);

    updateDoc(roomRef, {
      [`players.${playerAddress}.diceRoll`]: diceRoll,
      [`gameState.diceRolls.${playerAddress}`]: diceRoll,
    });

    return diceRoll;
  },

  checkDiceRollsAndSetTurn: async () => {
    const { roomId } = get();
    if (!roomId) return;

    const roomRef = doc(db, "gameRooms", roomId);
    const roomSnapshot = await getDoc(roomRef);
    const roomData = roomSnapshot.data() as GameRoomDocument;

    if (!roomData) throw new Error("Room not found");

    const { players, gameState } = roomData;
    if (!players || !gameState?.diceRolls) {
      toast.error("Players or dice rolls are missing.");
      return;
    }

    const diceRolls = gameState.diceRolls;
    const playerIds = Object.keys(players);

    if (
      playerIds.length !== 2 ||
      playerIds.some((id) => diceRolls[id] === undefined)
    ) {
      toast.error("Not all players have rolled their dice.");
      return;
    }

    const creatorId = roomData.createdBy;
    const joinerId = playerIds.find((id) => id !== creatorId);

    if (!joinerId) {
      toast.error("Could not determine both players.");
      return;
    }

    const playerRoles = {
      player1: { id: creatorId, roll: gameState.diceRolls[creatorId] },
      player2: { id: joinerId, roll: gameState.diceRolls[joinerId] },
    };

    const firstPlayer =
      playerRoles.player1.roll > playerRoles.player2.roll
        ? "player1"
        : "player2";

    await updateDoc(roomRef, {
      "gameState.currentTurn": firstPlayer,
      "gameState.gameStatus": "inProgress",
      status: "inProgress",
    });

    // Add battle log entry for game start
    await get().addBattleLogEntry(
      `Game started! ${firstPlayer === 'player1' ? 'Player 1' : 'Player 2'} goes first (dice: ${playerRoles.player1.roll} vs ${playerRoles.player2.roll})`,
      {
        firstPlayer,
        player1Dice: playerRoles.player1.roll,
        player2Dice: playerRoles.player2.roll,
      }
    );
  },

  selectCharacters: async (
    roomId: string,
    character: Character,
    playerAddress: string
  ) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    if (!character) throw new Error("Invalid character ID");

    const roomRef = doc(db, "gameRooms", roomId);
    // const playerCharacter = CHARACTERS.find((char) => char.id === characterId);

    const gameRoomDoc = await getDoc(roomRef);

    if (!gameRoomDoc.exists()) throw new Error("Game room not found");

    const isPlayer1 = gameRoomDoc.data()?.createdBy === playerAddress;

    const existingCharacterId =
      gameRoomDoc.data()?.players?.[playerAddress]?.characterId;
    if (existingCharacterId) {
      throw new Error("Character already selected");
    }

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

    await updateDoc(roomRef, {
      [`players.${playerAddress}.characterId`]: character.id,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.character`]: character,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.currentHealth`]:
        character.baseHealth,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.id`]: playerAddress,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.stamina`]: STAMINA.STARTING,
      [`gameState.${isPlayer1 ? "player1" : "player2"}.abilityCooldowns`]: {},
      [`gameState.${isPlayer1 ? "player1" : "player2"}.activeBuffs`]: activeBuffs,
      [`gameState.gameStatus`]: "character-select",
      status: "character-select",
    });

    // Add battle log entry for character selection
    await get().addBattleLogEntry(
      `${isPlayer1 ? 'Player 1' : 'Player 2'} selected character: ${character.nickname}`,
      {
        player: isPlayer1 ? 'player1' : 'player2',
        character: character.nickname,
        health: character.baseHealth,
      }
    );
  },

  playerSelectAbility: async (ability: Ability, playerAddress: string) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");
    
    // Determine which player this is
    const isPlayer1 = gameState.player1.id === playerAddress;
    const isPlayer2 = gameState.player2.id === playerAddress;
    
    if (!isPlayer1 && !isPlayer2) {
      toast.error("You are not a player in this game!");
      return;
    }
    
    const currentPlayerKey = isPlayer1 ? 'player1' : 'player2';
    const currentPlayer = gameState[currentPlayerKey];
    
    // Check if it's this player's turn
    if (gameState.currentTurn !== currentPlayerKey || gameState.gameStatus !== 'inProgress') {
      toast.error("It's not your turn!");
      return;
    }
    
    // Check if ability is available (stamina and cooldown)
    const availableAbilities = getAvailableAbilities(
      currentPlayer.character?.abilities || [],
      currentPlayer.stamina || STAMINA.STARTING,
      currentPlayer.abilityCooldowns || {}
    );
    
    const isAvailable = availableAbilities.some(a => a.id === ability.id);
    if (!isAvailable) {
      const onCooldown = currentPlayer.abilityCooldowns?.[ability.id] && currentPlayer.abilityCooldowns[ability.id] > 0;
      if (onCooldown) {
        toast.error(`${ability.name} is on cooldown for ${currentPlayer.abilityCooldowns[ability.id]} more turn(s)!`);
      } else {
        const staminaCost = getStaminaCost(ability);
        toast.error(`Not enough stamina to use ${ability.name}! (Need ${staminaCost}, have ${currentPlayer.stamina || 0})`);
      }
      return;
    }
    
    // Handle defense abilities
    if (ability.type === 'defense') {
      if (ability.defenseType) {
        // Check if defense already exists
        const currentInventory = currentPlayer.defenseInventory || {};
        const alreadyHasDefense = currentInventory[ability.defenseType] > 0;
        
        if (alreadyHasDefense) {
          toast.error(`You already have ${ability.defenseType} defense! Cannot add duplicate.`);
          return;
        }
        
        // Check if max defenses reached
        const totalDefenses = Object.values(currentInventory).reduce((sum, count) => sum + (count as number), 0);
        if (totalDefenses >= 2) {
          toast.error("Maximum 2 defenses allowed in inventory!");
          return;
        }
        
        // Add defense to inventory (this handles stamina, regeneration, and turn switching)
        await get().addDefenseToInventory(currentPlayerKey, ability.defenseType);
        toast.success(`Added ${ability.defenseType} to your defense inventory!`);
        
        // Add battle log entry for defense selection
        await get().addBattleLogEntry(
          `${currentPlayerKey === 'player1' ? 'Player 1' : 'Player 2'} added ${ability.defenseType} defense to inventory`,
          {
            player: currentPlayerKey,
            defenseType: ability.defenseType,
            ability: ability.name,
          }
        );
      }
    } else {
      // Handle attack abilities
      const hasBuffs = currentPlayer.activeBuffs?.length;
      await get().performAttack(currentPlayerKey, ability, hasBuffs ? true : false);
      
      if (hasBuffs) {
        const totalExtraDamage = currentPlayer.activeBuffs!.reduce(
          (sum, buff) => sum + buff.effect, 0
        );
        toast.info(`⚡ Used buffs to add ${totalExtraDamage} extra damage!`);
      }
    }
  },

  addDefenseToInventory: async (player, defenseType) => {
    const { roomId, gameState } = get();

    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);
    const nextPlayer = player === "player1" ? "player2" : "player1";

    // Check if defense type already exists (no duplicates allowed)
    const defenseAlreadyExists = gameState[player]?.defenseInventory?.[defenseType] && gameState[player].defenseInventory[defenseType] > 0;
    if (defenseAlreadyExists) {
      toast.error(`You already have ${defenseType} in your inventory!`);
      return;
    }

    // Check if player has reached max defenses (max 2)
    const totalDefenses = Object.values(gameState[player]?.defenseInventory || {}).reduce((sum, count) => sum + count, 0);
    if (totalDefenses >= 2) {
      toast.error("Maximum 2 defenses allowed in inventory!");
      return;
    }

    const currentDefenseCount =
      gameState[player]?.defenseInventory?.[defenseType] || 0;

    // Find the defense ability from character's abilities to get stamina cost
    const character = gameState[player]?.character;
    const defenseAbility = character?.abilities.find(
      a => a.type === 'defense' && a.defenseType === defenseType
    );
    
    // Defense abilities cost 10 stamina (or use the ability's cost if found)
    const staminaCost = defenseAbility ? getStaminaCost(defenseAbility) : 10;
    const currentStamina = gameState[player]?.stamina || STAMINA.STARTING;
    
    // Check if player has enough stamina
    if (currentStamina < staminaCost) {
      toast.error(`Not enough stamina to use ${defenseType}!`);
      return;
    }
    
    const newStamina = Math.max(0, currentStamina - staminaCost);

    // Regenerate stamina (+15 per turn)
    const regeneratedStamina = Math.min(STAMINA.MAX, newStamina + STAMINA.REGENERATION_PER_TURN);

    // Decrease cooldowns
    const newCooldowns = { ...gameState[player]?.abilityCooldowns || {} };
    Object.keys(newCooldowns).forEach(abilityId => {
      if (newCooldowns[abilityId] > 0) {
        newCooldowns[abilityId]--;
        if (newCooldowns[abilityId] === 0) {
          delete newCooldowns[abilityId];
        }
      }
    });

    updateDoc(roomRef, {
      [`gameState.${player}.defenseInventory.${defenseType}`]:
        currentDefenseCount + 1,
      [`gameState.${player}.stamina`]: regeneratedStamina,
      [`gameState.${player}.abilityCooldowns`]: newCooldowns,
      "gameState.currentTurn": nextPlayer,
    });
  },

  addBuffToPlayer: async (
    player: "player1" | "player2",
    name: string,
    effect: number,
    duration: number
  ) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);
    const currentBuffs = gameState[player]?.activeBuffs || [];

    const newBuff: Buff = {
      name,
      effect,
      remainingTurns: duration,
    };

    await updateDoc(roomRef, {
      [`gameState.${player}.activeBuffs`]: [...currentBuffs, newBuff],
    });
  },

  skipDefense: async (defendingPlayer, incomingDamage, ability) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);

    const opponentPlayer =
      defendingPlayer === "player1" ? "player2" : "player1";

    const updatedHealth =
      gameState[defendingPlayer].currentHealth - incomingDamage;

    // Regenerate stamina (+15 per turn) and decrease cooldowns for both players
    const defendingStamina = Math.min(STAMINA.MAX, (gameState[defendingPlayer].stamina || STAMINA.STARTING) + STAMINA.REGENERATION_PER_TURN);
    const attackingStamina = Math.min(STAMINA.MAX, (gameState[opponentPlayer].stamina || STAMINA.STARTING) + STAMINA.REGENERATION_PER_TURN);
    
    const defendingCooldowns = { ...gameState[defendingPlayer]?.abilityCooldowns || {} };
    const attackingCooldowns = { ...gameState[opponentPlayer]?.abilityCooldowns || {} };
    
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

    const updateData: UpdateData = {
      [`gameState.${defendingPlayer}.currentHealth`]: updatedHealth,
      [`gameState.${defendingPlayer}.stamina`]: defendingStamina,
      [`gameState.${defendingPlayer}.abilityCooldowns`]: defendingCooldowns,
      [`gameState.${opponentPlayer}.stamina`]: attackingStamina,
      [`gameState.${opponentPlayer}.abilityCooldowns`]: attackingCooldowns,
      [`gameState.${defendingPlayer}.skippedDefense`]: {
        ability,
        damage: incomingDamage,
      },
      "gameState.lastAttack": { ability: null, attackingPlayer: null, actualDamage: 0 },
      "gameState.currentTurn": defendingPlayer,
    };

    if (updatedHealth <= 0) {
      updateData["gameState.gameStatus"] = "finished";
      updateData["status"] = "finished";
      updateData["gameState.winner"] = opponentPlayer;
    }

    await updateDoc(roomRef, updateData);

    // Add battle log entry for skipped defense
    await get().addBattleLogEntry(
      `${defendingPlayer === 'player1' ? 'Player 1' : 'Player 2'} took ${incomingDamage} damage (no defense available)`,
      {
        defendingPlayer,
        incomingDamage,
        hadDefenses: false,
      }
    );
  },

  useDefense: async (defendingPlayer, defenseAbility, incomingDamage) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    if (!defenseAbility?.defenseType) {
      toast.error("Invalid defense ability provided");
      return false;
    }

    const opponentPlayer =
      defendingPlayer === "player1" ? "player2" : "player1";
    const defenseType = defenseAbility.defenseType;

    if ((gameState[defendingPlayer].defenseInventory[defenseType] || 0) <= 0) {
      return false;
    }

    const roomRef = doc(db, "gameRooms", roomId);

    // Regenerate stamina (+15 per turn) and decrease cooldowns for both players
    const defendingStamina = Math.min(STAMINA.MAX, (gameState[defendingPlayer].stamina || STAMINA.STARTING) + STAMINA.REGENERATION_PER_TURN);
    const attackingStamina = Math.min(STAMINA.MAX, (gameState[opponentPlayer].stamina || STAMINA.STARTING) + STAMINA.REGENERATION_PER_TURN);
    
    const defendingCooldowns = { ...gameState[defendingPlayer]?.abilityCooldowns || {} };
    const attackingCooldowns = { ...gameState[opponentPlayer]?.abilityCooldowns || {} };
    
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

    const updateData: UpdateData = {
      [`gameState.${defendingPlayer}.defenseInventory.${defenseType}`]:
        (gameState[defendingPlayer].defenseInventory[defenseType] || 1) - 1,
      [`gameState.${defendingPlayer}.stamina`]: defendingStamina,
      [`gameState.${defendingPlayer}.abilityCooldowns`]: defendingCooldowns,
      [`gameState.${opponentPlayer}.stamina`]: attackingStamina,
      [`gameState.${opponentPlayer}.abilityCooldowns`]: attackingCooldowns,
      [`gameState.${defendingPlayer}.skippedDefense`]: null,
      "gameState.lastAttack": { ability: null, attackingPlayer: null, actualDamage: 0 },
    };

    let defendingPlayerNewHealth = gameState[defendingPlayer].currentHealth;
    let opponentPlayerNewHealth = gameState[opponentPlayer].currentHealth;

    switch (defenseType) {
      case "dodge":
        updateData["gameState.currentTurn"] = defendingPlayer;
        // No damage taken
        break;

      case "reflect":
        opponentPlayerNewHealth =
          gameState[opponentPlayer].currentHealth - incomingDamage;
        updateData[`gameState.${opponentPlayer}.currentHealth`] =
          opponentPlayerNewHealth;
        updateData["gameState.currentTurn"] = opponentPlayer;
        break;

      case "block":
        const blockedDamage = Math.max(0, incomingDamage - 25);
        defendingPlayerNewHealth =
          gameState[defendingPlayer].currentHealth - blockedDamage;
        updateData[`gameState.${defendingPlayer}.currentHealth`] =
          defendingPlayerNewHealth;
        updateData["gameState.currentTurn"] = opponentPlayer;
        break;

      default:
        toast.error("Unknown defense type");
        return false;
    }

    // Check for game over conditions
    if (opponentPlayerNewHealth <= 0) {
      updateData["gameState.gameStatus"] = "finished";
      updateData["status"] = "finished";
      updateData["gameState.winner"] = defendingPlayer;
    } else if (defendingPlayerNewHealth <= 0) {
      updateData["gameState.gameStatus"] = "finished";
      updateData["status"] = "finished";
      updateData["gameState.winner"] = opponentPlayer;
    }

    await updateDoc(roomRef, updateData);

    // Add battle log entry for defense
    let defenseText = '';
    if (defenseType === 'dodge') {
      defenseText = `${defendingPlayer === 'player1' ? 'Player 1' : 'Player 2'} dodged the attack with ${defenseAbility.name}`;
    } else if (defenseType === 'block') {
      const blockedDamage = Math.max(0, incomingDamage - 25);
      defenseText = `${defendingPlayer === 'player1' ? 'Player 1' : 'Player 2'} blocked the attack with ${defenseAbility.name} (took ${blockedDamage} damage instead of ${incomingDamage})`;
    } else if (defenseType === 'reflect') {
      defenseText = `${defendingPlayer === 'player1' ? 'Player 1' : 'Player 2'} reflected the attack with ${defenseAbility.name} (${opponentPlayer === 'player1' ? 'Player 1' : 'Player 2'} took ${incomingDamage} damage)`;
    }

    await get().addBattleLogEntry(defenseText, {
      defendingPlayer,
      defenseType,
      defenseAbility: defenseAbility.name,
      incomingDamage,
      damageToApply: defenseType === 'block' ? Math.max(0, incomingDamage - 25) : defenseType === 'reflect' ? incomingDamage : 0,
      reflectedDamage: defenseType === 'reflect' ? incomingDamage : undefined,
    });

    return true;
  },

  performAttack: async (attackingPlayer, ability, powerUp) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    // Prevent attacks if game is already finished
    if (gameState.gameStatus === "finished") {
      toast.error("Game is already finished");
      return;
    }

    // Check if ability is available (stamina and cooldown)
    const availableAbilities = getAvailableAbilities(
      gameState[attackingPlayer].character?.abilities || [],
      gameState[attackingPlayer].stamina || STAMINA.STARTING,
      gameState[attackingPlayer].abilityCooldowns || {}
    );

    if (!availableAbilities.find(a => a.id === ability.id)) {
      const onCooldown = gameState[attackingPlayer].abilityCooldowns?.[ability.id] && gameState[attackingPlayer].abilityCooldowns[ability.id] > 0;
      if (onCooldown) {
        toast.error(`${ability.name} is on cooldown for ${gameState[attackingPlayer].abilityCooldowns[ability.id]} more turn(s)!`);
        return;
      }
      const staminaCost = getStaminaCost(ability);
      if ((gameState[attackingPlayer].stamina || 0) < staminaCost) {
        toast.error(`Not enough stamina to use ${ability.name}!`);
        return;
      }
    }

    const opponentKey = attackingPlayer === "player1" ? "player2" : "player1";
    const roomRef = doc(db, "gameRooms", roomId);

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
    let newStamina = Math.max(0, (gameState[attackingPlayer].stamina || STAMINA.STARTING) - staminaCost);
    
    // Critical hit reward: +20 stamina
    if (isCritical) {
      newStamina = Math.min(STAMINA.MAX, newStamina + STAMINA.CRITICAL_HIT_REWARD);
      toast.success(`🎯 CRITICAL HIT! +${STAMINA.CRITICAL_HIT_REWARD} stamina!`);
    }
    
    // Decrease all existing cooldowns by 1 first
    const newCooldowns = { ...gameState[attackingPlayer].abilityCooldowns || {} };
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

    const updateData: UpdateData = {
      [`gameState.${attackingPlayer}.stamina`]: newStamina,
      [`gameState.${attackingPlayer}.abilityCooldowns`]: newCooldowns,
      "gameState.currentTurn": opponentKey,
      "gameState.lastAttack": {
        ability,
        attackingPlayer,
        actualDamage: damage,
      },
    };

    if (powerUp) {
      const updatedBuffs = (gameState[attackingPlayer].activeBuffs ?? [])
        .map((buff) => ({
          ...buff,
          remainingTurns: buff.remainingTurns - 1,
        }))
        .filter((buff) => buff.remainingTurns > 0);

      updateData[`gameState.${attackingPlayer}.activeBuffs`] = updatedBuffs;
    }

    await updateDoc(roomRef, updateData);

    // Add battle log entry for attack
    await get().addBattleLogEntry(
      `${attackingPlayer === 'player1' ? 'Player 1' : 'Player 2'} attacked with ${ability.name} for ${damage} damage${isCritical ? ' (CRITICAL HIT!)' : ''}`,
      {
        attackingPlayer,
        ability: ability.name,
        baseDamage: ability.value,
        finalDamage: damage,
        isCritical,
        staminaCost,
        staminaAfter: newStamina,
      }
    );
  },

  createOnlineGameRoom: async (playerAddress) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    const roomRef = doc(collection(db, "gameRooms"));
    const roomId = roomRef.id;

    await setDoc(roomRef, {
      id: roomId,
      createdBy: playerAddress,
      status: "waiting",
      players: {
        [playerAddress]: {
          characterId: null,
          role: "creator",
          diceRoll: null,
          wallet: playerAddress,
        },
      },
      createdAt: serverTimestamp(),
      gameState: {
        ...initialGameState,
        battleLog: [],
        turnCount: 0,
      },
    });

    set({
      roomId,
      playerAddress: playerAddress,
    });

    return roomId;
  },

  joinGameRoom: async (roomId, playerAddress) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    const roomRef = doc(db, "gameRooms", roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      throw new Error("Room does not exist");
    }

    const roomData = roomSnap.data() as GameRoomDocument;

    if (roomData?.gameState?.player1 && roomData?.gameState?.player1.id === playerAddress) {
      throw new Error("You're already in this game");
    }

    await updateDoc(roomRef, {
      [`players.${playerAddress}`]: {
        characterId: null,
        role: "challenger",
        wallet: playerAddress,
        diceRoll: null,
      },
      status: "character-select",
    });

    set({
      roomId,
      playerAddress: playerAddress,
    });
  },

  validatePlayerInRoom(playerAddress, roomData) {
    const creator = roomData.players?.[roomData.createdBy];
    const challenger = roomData.players?.[playerAddress];

    const roomId = roomData.id;

    if (
      creator &&
      playerAddress === creator.wallet &&
      creator.role === "creator"
    ) {
      set({
        roomId,
        playerAddress,
      });
      return true;
    }

    if (
      challenger &&
      playerAddress === challenger.wallet &&
      challenger.role === "challenger"
    ) {
      set({
        roomId,
        playerAddress,
      });
      return true;
    }

    throw new Error("You are not a participant in this room");
  },

  findOpenGameRoom: async (playerAddress: string) => {
    if (!playerAddress) throw new Error("User not found");

    const roomsRef = collection(db, "gameRooms");
    const querySnapshot = await getDocs(roomsRef);

    const allRooms = querySnapshot.docs.map((doc) => ({
      ...(doc.data() as GameRoomDocument),
      id: doc.id,
    }));

    const winCounts = allRooms.reduce((acc, room) => {
      if (room.status === "finished" && room.gameState?.winner) {
        const winnerAddress =
          room.gameState.winner === "player1"
            ? room.gameState.player1.id
            : room.gameState.player2.id;

        if (winnerAddress) {
          acc.set(winnerAddress, (acc.get(winnerAddress) || 0) + 1);
        }
      }
      return acc;
    }, new Map<string, number>());

    return allRooms
      .filter(
        (room) =>
          room.status === "character-select" && room.createdBy !== playerAddress
      )
      .map((room) => ({
        ...room,
        creatorTotalWins: winCounts.get(room.createdBy) || 0,
      }));
  },

  findUserRooms: async (playerAddress: string) => {
    if (!playerAddress) {
      throw new Error("User not found");
    }

    const roomsRef = collection(db, "gameRooms");

    const q = query(roomsRef, where("players." + playerAddress, "!=", null));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const rooms = querySnapshot.docs.map(
      (doc) => doc.data() as GameRoomDocument
    );

    return rooms;
  },

  endGame: async (winner: "player1" | "player2") => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);

    // Add final battle log entry
    await get().addBattleLogEntry(
      `Game ended! ${winner === 'player1' ? 'Player 1' : 'Player 2'} won!`,
      {
        winner,
        finalPlayer1Health: gameState.player1.currentHealth,
        finalPlayer2Health: gameState.player2.currentHealth,
      }
    );

    await updateDoc(roomRef, {
      "gameState.gameStatus": "finished",
      status: "finished",
      "gameState.winner": winner,
    });
  },

  addBattleLogEntry: async (event: string, details?: any) => {
    const { roomId, gameState } = get();
    if (!roomId) throw new Error("No active game room");

    const roomRef = doc(db, "gameRooms", roomId);
    const currentTurnCount = (gameState.turnCount || 0) + 1;

    const entry: BattleLogEntry = {
      timestamp: new Date().toISOString(),
      turn: currentTurnCount,
      event,
      player1: {
        health: gameState.player1.currentHealth,
        stamina: gameState.player1.stamina || STAMINA.STARTING,
      },
      player2: {
        health: gameState.player2.currentHealth,
        stamina: gameState.player2.stamina || STAMINA.STARTING,
      },
      details,
    };

    const currentBattleLog = gameState.battleLog || [];
    const updatedBattleLog = [...currentBattleLog, entry];

    await updateDoc(roomRef, {
      "gameState.battleLog": updatedBattleLog,
      "gameState.turnCount": currentTurnCount,
    });

    // Update local state
    set((state) => ({
      gameState: {
        ...state.gameState,
        battleLog: updatedBattleLog,
        turnCount: currentTurnCount,
      },
    }));
  },

  exportBattleLog: () => {
    const { gameState, roomId } = get();
    const battleLog = gameState.battleLog || [];

    if (battleLog.length === 0) {
      toast.info("No battle log to export");
      return;
    }

    const exportData = {
      roomId: roomId || "unknown",
      gameEnded: gameState.gameStatus === "finished",
      winner: gameState.winner,
      finalPlayer1Health: gameState.player1.currentHealth,
      finalPlayer2Health: gameState.player2.currentHealth,
      totalTurns: battleLog.length,
      battleLog: battleLog,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `battle-log-${roomId || "unknown"}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Battle log downloaded!");
  },

  init: (roomId) => {
    const roomRef = doc(db, "gameRooms", roomId);

    set((state) => ({
      ...state,
      roomId,
    }));

    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      const roomData = snapshot.data();

      set((state) => {
        if (state.roomId !== roomId) return state;

        return {
          gameState: {
            ...state.gameState,
            player1: {
              ...state.gameState.player1,
              ...roomData?.gameState?.player1,
              character: roomData?.gameState?.player1?.character,
              stamina: roomData?.gameState?.player1?.stamina ?? STAMINA.STARTING,
              abilityCooldowns: roomData?.gameState?.player1?.abilityCooldowns ?? {},
            },
            player2: {
              ...state.gameState.player2,
              ...roomData?.gameState?.player2,
              id:
                roomData?.gameState?.player2?.id || state.gameState.player2.id,
              character: roomData?.gameState?.player2?.character,
              stamina: roomData?.gameState?.player2?.stamina ?? STAMINA.STARTING,
              abilityCooldowns: roomData?.gameState?.player2?.abilityCooldowns ?? {},
            },
            currentTurn: roomData?.gameState?.currentTurn,
            gameStatus: roomData?.gameState?.gameStatus,
            lastAttack: roomData?.gameState?.lastAttack,
            diceRolls: roomData?.gameState?.diceRolls,
            winner: roomData?.gameState?.winner,
            stakeDetails: roomData?.gameState?.stakeDetails,
            battleLog: roomData?.gameState?.battleLog || [],
            turnCount: roomData?.gameState?.turnCount || 0,
          },
          roomId,
        };
      });
    });

    return unsubscribe;
  },
}));

export default useOnlineGameStore;