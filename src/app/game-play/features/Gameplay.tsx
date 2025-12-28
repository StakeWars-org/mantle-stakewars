'use client'

import React, { useState, useEffect } from 'react';
import useOnlineGameStore from '@/store/useOnlineGame';
import { Ability, CHARACTERS } from '@/lib/characters';
import DiceRollToDetermineFirstTurn from '@/components/FirstTurnDiceRoll';
import DefenseModal from '@/components/DefenceModal';
import BattleStoryboard from './BattleStoryboard';
import { toast } from 'react-toastify';
import PlayerHealth from "./PlayerHealth";
import OpponentPlayerHealth from './OpponentPlayerHealth';
import WonMessage from './WonMessage'
import LostMessage from './LostMessage'
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LastAttackDetails {
  ability: Ability | null;
  attackingPlayer: 'player1' | 'player2' | null | undefined;
}


export default function Gameplay({roomId} : {roomId: string}) {
  const {
    gameState,
    init,
    reset,
    setRoomId
  } = useOnlineGameStore();

  const [showSkipDefenseButton, setShowSkipDefenseButton] = useState(false);
  const [lastAttackDetails, setLastAttackDetails] = useState<LastAttackDetails>({ability: null, attackingPlayer: null});
  const [showDefenseModal, setShowDefenseModal] = useState(false);
  const [defendingPlayer, setDefendingPlayer] = useState('');
  const [showWinner, setShowWinner] = useState(false);
  const [showLoser, setShowLoser] = useState(false);

  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';

  const gameRoomId = roomId;

  useEffect(() => {
    if (!walletAddress) {
      // router.push('/wallet');
      toast.info('Please connect your wallet to play the game');
    }
    
    const unsubscribe = init(gameRoomId);
 
    return () => {
      unsubscribe();
      reset();
    };
  }, [gameRoomId, init, reset, walletAddress]);


  useEffect(() => {
    if (gameRoomId && walletAddress) {
      setRoomId(gameRoomId, walletAddress as `0x${string}`)
    }
  }, [gameRoomId, walletAddress]);

  useEffect(() =>{
    if ((gameState.winner === 'player1' || gameState.winner === 'player2') && gameState.gameStatus === 'finished') {
      toast.info(`${gameState.winner} has won the game`);
      if (walletAddress === gameState[gameState?.winner]?.id) {
        setShowWinner(true);
      } else {
        setShowLoser(true);
      }
      return;
    }
  }, [gameState.winner, gameState.gameStatus])

  useEffect(() => {
    if (gameState.gameStatus === 'inProgress') {
      const player1Health = gameState.player1?.currentHealth || 0;
      const player2Health = gameState.player2?.currentHealth || 0;
      
      if (player1Health <= 0 || player2Health <= 0) {
        const winner = player1Health <= 0 ? 'player2' : 'player1';
        useOnlineGameStore.getState().endGame(winner);
        return;
      }
    }

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
      toast(`⚔️ ${gameState.lastAttack.attackingPlayer} attacked with ${gameState.lastAttack.ability.name} for ${actualDamage} damage!`);
      
      const attackingPlayer = gameState.lastAttack.attackingPlayer;
      const defendingPlayer = attackingPlayer === 'player1' ? 'player2' : 'player1';

      if (walletAddress === gameState[defendingPlayer]?.id) {
        const defenseInventory = gameState[defendingPlayer]?.defenseInventory || {};
        const hasDefenses = Object.values(defenseInventory).some((count) => count > 0);
  
        if (hasDefenses) {
          setDefendingPlayer(defendingPlayer);
          setShowDefenseModal(true);
          setShowSkipDefenseButton(true);
        } else {
          useOnlineGameStore.getState().skipDefense(defendingPlayer, actualDamage, gameState.lastAttack.ability);
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
 
    const defendingPlayer = attackingPlayer === 'player1' ? 'player2' : 'player1';
    // Use actualDamage from lastAttack if available, otherwise fall back to ability.value
    const gameState = useOnlineGameStore.getState().gameState;
    const incomingDamage = gameState.lastAttack?.actualDamage || ability.value;
 
    if (defenseType === null) {
      useOnlineGameStore.getState().skipDefense(defendingPlayer, incomingDamage, ability);
    } else {
      const defendingCharacterId = useOnlineGameStore.getState().gameState?.[defendingPlayer]?.character?.id;
      const defendingCharacter = CHARACTERS.find(char => char.id === defendingCharacterId);

      const defenseAbility = defendingCharacter?.abilities.find(
        a => a.type === 'defense' && a.defenseType === defenseType
      );

      if (!defenseAbility) {
        toast.error(`Defense ability of type "${defenseType}" not found for ${defendingCharacterId}`);
        return;
      }
 
      const wasDefenseSuccessful = await useOnlineGameStore.getState().useDefense(
        defendingPlayer,
        defenseAbility,
        incomingDamage
      );
 
      if (wasDefenseSuccessful) {
        switch (defenseType) {
          case 'dodge':
            toast.info(`${defendingPlayer} dodged the attack with ${defenseAbility.name}`);
            break;
          case 'block':
            toast.info(`${defendingPlayer} blocked the attack with ${defenseAbility.name}`);
            break;
          case 'reflect':
            toast.info(`${defendingPlayer} reflected the attack with ${defenseAbility.name}`);
            break;
        }
      }
    }
 
    setShowDefenseModal(false);
    setLastAttackDetails({ ability: null, attackingPlayer: null });
};

  const copyRoomId = async () => {
    try {
      const link = `${window.location.origin}/lobby?gid=${roomId}`;
      await navigator.clipboard.writeText(link);
      toast.success('Game room ID copied to clipboard!');
    } catch (err) {
      toast.error(`Failed to copy Game room ID: ${err}`);
    }
  };

  return (
    <div className='w-[95%] lg:w-[707px] pb-4 relative mx-auto lg:px-0 mt-10'>
        <OpponentPlayerHealth gameState={gameState} />
        
        <div className="flex justify-center items-center mt-4 mb-2">
          <Button 
            onClick={copyRoomId}
            className="flex items-center gap-2 bg-[#313030] hover:bg-[#404040] transition-colors duration-200 px-4 py-2 rounded-lg border border-[#E3DEDE] cursor-pointer group"
          >
            <span className="text-white text-xs lg:text-sm font-medium">Room ID:</span>
            <span className="text-[#BFE528] text-xs lg:text-sm font-bold font-mono">
              {roomId.slice(-8)}
            </span>
            <Copy size={20} className='text-white' />
          </Button>
        </div>
      <div className="flex flex-col items-center my-[30px] bg-[#3F3F3F] rounded-[10px] p-6 pt-5">
        {gameState.gameStatus === 'character-select' && (
          <div className='space-y-[14px] flex flex-col justify-center items-center w-full bg-[#494949] rounded-[10px] py-[18px]'>
            <DiceRollToDetermineFirstTurn />
          </div>
        )}
        {gameState.gameStatus === 'inProgress' && (
          <BattleStoryboard gameState={gameState} />
        )}
      </div>
      <div className="flex flex-col justify-center items-center">
        <PlayerHealth  gameState={gameState} />
      </div>
      <div className={`absolute top-0 w-full ${showDefenseModal || showWinner || showLoser ? 'h-full' : ''}`}>
        {showWinner && <WonMessage roomId={roomId} />}
        {showLoser && <LostMessage roomId={roomId} />}
        {showDefenseModal && defendingPlayer === gameState.currentTurn && (
        <DefenseModal
          player={defendingPlayer as 'player1' | 'player2'}
          onDefenseSelect={handleDefenseSelection}
          showSkipButton={showSkipDefenseButton}
        />
      )}
      </div>
    </div>
  );
}
