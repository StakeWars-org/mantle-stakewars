'use client'

import React, { useState, useEffect } from 'react';
import useAIGameStore from '@/store/useAIGame';
import { Ability } from '@/lib/characters';
import AIDefenseModal from './AIDefenseModal';
import AIFirstTurnDiceRoll from './AIFirstTurnDiceRoll';
import { toast } from 'react-toastify';
import PlayerHealth from "./PlayerHealth";
import AIHealth from './AIHealth';
import AILostMessage from './AILostMessage';
import AIWonMessage from './AIWonMessage';
// import BattleStoryboard from './BattleStoryboard';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

interface LastAttackDetails {
  ability: Ability | null;
  attackingPlayer: 'player' | 'ai' | null | undefined;
}

export default function AIGameplay() {
  const {
    gameState,
    reset,
  } = useAIGameStore();

  const [showSkipDefenseButton, setShowSkipDefenseButton] = useState(false);
  const [lastAttackDetails, setLastAttackDetails] = useState<LastAttackDetails>({ability: null, attackingPlayer: null});
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [defendingPlayer, setDefendingPlayer] = useState('');
  const [showWinner, setShowWinner] = useState(false);
  const [showLoser, setShowLoser] = useState(false);

  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';

  useEffect(() => {
    if (ready && !authenticated) {
      toast.info('Please connect your wallet to play the game');
      router.push('/');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (gameState.winner === 'player' || gameState.winner === 'ai' && gameState.gameStatus === 'finished') {
      toast.info(`${gameState.winner === 'player' ? 'You' : 'AI'} has won the game`);
      if (gameState.winner === 'player') {
        setShowWinner(true);
      } else {
        setShowLoser(true);
      }
      return;
    }
  }, [gameState.winner, gameState.gameStatus])

  // Auto-trigger AI turn when it's AI's turn
  useEffect(() => {
    // console.log('Turn changed:', { currentTurn: gameState.currentTurn, gameStatus: gameState.gameStatus });
    if (gameState.currentTurn === 'ai' && gameState.gameStatus === 'inProgress') {
      // console.log('AI turn detected, triggering AI move...');
      // Small delay to show the turn change
      setTimeout(() => {
        useAIGameStore.getState().aiMakeMove();
      }, 1500);
    }
  }, [gameState.currentTurn, gameState.gameStatus]);

  useEffect(() => {
    if (
      gameState.gameStatus === 'inProgress' &&
       gameState.lastAttack !== null &&
      gameState.lastAttack?.ability?.type === 'attack' &&
      gameState.lastAttack?.attackingPlayer
    ) {

      setLastAttackDetails(gameState.lastAttack);
      setShowDefenseModal(false);
      setShowSkipDefenseButton(false);

      const actualDamage = gameState.lastAttack.actualDamage || gameState.lastAttack.ability.value;
      toast(`⚔️ ${gameState.lastAttack.attackingPlayer === 'player' ? 'You' : 'AI'} attacked with ${gameState.lastAttack.ability.name} for ${actualDamage} damage!`);
      
      const attackingPlayer = gameState.lastAttack.attackingPlayer;
      const defendingPlayer = attackingPlayer === 'player' ? 'ai' : 'player';

      if (defendingPlayer === 'player') {
        const defenseInventory = gameState[defendingPlayer]?.defenseInventory || {};
        const hasDefenses = Object.values(defenseInventory).some((count) => count > 0);
  
        if (hasDefenses) {
          setDefendingPlayer(defendingPlayer);
          setShowDefenseModal(true);
          setShowSkipDefenseButton(true);
        } else {
          const actualDamage = gameState.lastAttack.actualDamage || gameState.lastAttack.ability.value;
          useAIGameStore.getState().skipDefense(defendingPlayer, actualDamage, gameState.lastAttack.ability);
          toast.warn(`You took -${actualDamage} damage`)
        }
      }
    } else {
      setShowDefenseModal(false);
    }
  }, [gameState.lastAttack]);

  const handleDefenseSelection = async (defenseType: string | null) => {
    const { ability, attackingPlayer } = lastAttackDetails;
    if (!ability || !attackingPlayer) return;
 
    const defendingPlayer = attackingPlayer === 'player' ? 'ai' : 'player';
    const incomingDamage = ability.value;
 
    if (defenseType === null) {
      useAIGameStore.getState().skipDefense(defendingPlayer, incomingDamage, ability);
    } else {
      const defendingCharacterId = useAIGameStore.getState().gameState?.[defendingPlayer]?.character?.id;
      const defendingCharacter = useAIGameStore.getState().gameState?.[defendingPlayer]?.character;

      const defenseAbility = defendingCharacter?.abilities.find(
        a => a.type === 'defense' && a.defenseType === defenseType
      );

      if (!defenseAbility) {
        toast.error(`Defense ability of type "${defenseType}" not found for ${defendingCharacterId}`);
        return;
      }
 
      const wasDefenseSuccessful = await useAIGameStore.getState().useDefense(
        defendingPlayer,
        defenseAbility,
        incomingDamage
      );
 
      if (wasDefenseSuccessful) {
        switch (defenseType) {
          case 'dodge':
            toast.info(`You dodged the attack with ${defenseAbility.name}`);
            break;
          case 'block':
            toast.info(`You blocked the attack with ${defenseAbility.name}`);
            break;
          case 'reflect':
            toast.info(`You reflected the attack with ${defenseAbility.name}`);
            break;
        }
      }
    }
 
    setShowDefenseModal(false);
    setLastAttackDetails({ ability: null, attackingPlayer: null });
  };

  const handleBackToLobby = () => {
    reset();
    router.push('/lobby');
  };

  return (
    <div className='w-[95%] lg:w-[707px] relative mx-auto lg:px-0 mt-4'>
        <AIHealth gameState={gameState} />
      
      {/* First Turn Dice Roll - Only shows when game hasn't started */}
      {(gameState.gameStatus === 'waiting' || gameState.gameStatus === 'character-select') && (
        <div className="flex flex-col items-center my-[30px] bg-[#3F3F3F] rounded-[10px] p-6 pt-5">
          <AIFirstTurnDiceRoll />
        </div>
      )}

      {/* <div className="flex flex-col items-center my-[30px] bg-[#3F3F3F] rounded-[10px] p-6 pt-5">
        <BattleStoryboard />
      </div> */}
      
      <div className="flex flex-col justify-center items-center">
        <PlayerHealth gameState={gameState} />
      </div>
      
      <div className={`absolute top-0 w-full ${showDefenseModal || showWinner || showLoser ? 'h-full' : ''}`}>
        {showWinner && <AIWonMessage />}
        {showLoser && <AILostMessage onBackToLobby={handleBackToLobby} />}
        {showDefenseModal && defendingPlayer === gameState.currentTurn && (
          <AIDefenseModal
            player={defendingPlayer as 'player' | 'ai'}
            onDefenseSelect={handleDefenseSelection}
            showSkipButton={showSkipDefenseButton}
          />
        )}
      </div>
    </div>
  );
}
