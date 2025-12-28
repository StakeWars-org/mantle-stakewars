"use client";

import React from 'react'
import { GameRoomDocument } from '@/store/useOnlineGame';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Ability } from '@/lib/characters';
import useOnlineGameStore from '@/store/useOnlineGame';
import { getStaminaCost, calculateDamageRange, getAvailableAbilities } from '@/lib/combatUtils';

export default function PlayerAbility({ gameState, userId }: {
  gameState?: GameRoomDocument['gameState'],
  userId: string | null
}) {
  const isPlayer1 = gameState?.player1.id === userId;
  const isPlayer2 = gameState?.player2.id === userId;

  const currentPlayer = isPlayer1 
    ? gameState?.player1 
    : isPlayer2 
      ? gameState?.player2 
      : null;

  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { playerSelectAbility } = useOnlineGameStore();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';

  // Get available abilities based on stamina and cooldowns
  const availableAbilities = getAvailableAbilities(
    currentPlayer?.character?.abilities || [],
    currentPlayer?.stamina || 0,
    currentPlayer?.abilityCooldowns || {}
  );

  const isPlayerTurn = gameState?.currentTurn === (isPlayer1 ? 'player1' : 'player2') && gameState?.gameStatus === 'inProgress';

  const handleAbilityClick = (ability: Ability) => {
    if (!isPlayerTurn || !walletAddress) return;
    
    // Prevent clicking if defense is already in inventory
    if (ability.type === 'defense' && ability.defenseType) {
      const defenseAlreadyInInventory = currentPlayer?.defenseInventory?.[ability.defenseType] > 0;
      if (defenseAlreadyInInventory) {
        return; // Don't proceed if defense already exists
      }
    }
    
    playerSelectAbility(ability, walletAddress);
  };

  // Check if player has any available abilities
  const hasAvailableAbilities = availableAbilities.length > 0;

  return (
    <div className='h-fit w-full justify-center items-center'>
      {!hasAvailableAbilities && isPlayerTurn && (
        <div className="text-red-400 text-xs text-center mb-2 p-2 bg-red-900/20 rounded border border-red-500/50">
          ⚠️ No abilities available! You need more stamina or wait for cooldowns.
        </div>
      )}
      <div className='flex flex-wrap gap-2'>
      {currentPlayer?.character?.abilities.map((ability: Ability, index: number) => {
        const isAvailable = availableAbilities.some(a => a.id === ability.id);
        const onCooldown = currentPlayer?.abilityCooldowns?.[ability.id] && currentPlayer.abilityCooldowns[ability.id] > 0;
        const staminaCost = getStaminaCost(ability);
        const hasEnoughStamina = (currentPlayer?.stamina || 0) >= staminaCost;
        
        // Check if defense ability is already in inventory
        const defenseAlreadyInInventory = ability.type === 'defense' && 
          ability.defenseType && 
          (currentPlayer?.defenseInventory?.[ability.defenseType] || 0) > 0;
        
        // Also check if player already has 2 defenses (max limit)
        const totalDefenses = Object.values(currentPlayer?.defenseInventory || {}).reduce(
          (sum, count) => sum + (count as number), 0
        );
        const maxDefensesReached = ability.type === 'defense' && totalDefenses >= 2;
        
        const canUse = isPlayerTurn && isAvailable && hasEnoughStamina && !onCooldown && !defenseAlreadyInInventory && !maxDefensesReached;
        
        // Calculate damage range for attacks
        const damageRange = ability.type === 'attack' ? calculateDamageRange(ability.value) : null;

        return (
          <button
            key={ability.id}
            onClick={() => handleAbilityClick(ability)}
            disabled={!canUse}
            className={`
              text-primary m-1 inline-flex items-center h-6 lg:h-8 px-[10px] w-fit text-[8px] lg:text-[10px] font-bold rounded-[5px] 
              transition-all
              ${canUse 
                ? 'bg-[#5A5A5A] hover:bg-[#6A6A6A] cursor-pointer border border-transparent hover:border-[#BFE528]' 
                : 'bg-[#3A3A3A] opacity-50 cursor-not-allowed'
              }
              ${onCooldown ? 'border-2 border-orange-500' : ''}
            `}
            title={
              !isPlayerTurn 
                ? "Not your turn"
                : defenseAlreadyInInventory
                  ? `You already have ${ability.defenseType} defense in your inventory!`
                : maxDefensesReached
                  ? `You already have 2 defenses maximum!`
                : onCooldown 
                  ? `On cooldown for ${currentPlayer.abilityCooldowns[ability.id]} more turn(s)`
                  : !hasEnoughStamina
                    ? `Not enough stamina (need ${staminaCost}, have ${currentPlayer?.stamina || 0})`
                    : ability.type === 'attack'
                      ? `${ability.name}: ${damageRange?.min}-${damageRange?.max} damage (Cost: ${staminaCost} stamina)`
                      : `${ability.name}: Adds to defense inventory (Cost: ${staminaCost} stamina)`
            }
          >
            {index + 1}. {ability.name}{" "}
            {ability.type === "attack" && damageRange 
              ? `[${damageRange.min}-${damageRange.max}]` 
              : ability.type === "attack"
                ? `[-${ability.value}]`
                : ""
            }
            {onCooldown && (
              <span className="ml-1 text-orange-400">🔒{currentPlayer.abilityCooldowns[ability.id]}</span>
            )}
            {!onCooldown && (
              <span className="ml-1 text-xs text-gray-400">⚡{staminaCost}</span>
            )}
          </button>
        );
      })}
      </div>
    </div>
  )
}
