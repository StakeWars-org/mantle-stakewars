import React from 'react'
import { GameRoomDocument } from '@/store/useOnlineGame';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export default function PlayerAbility({ gameState, userId }: {
  gameState?: GameRoomDocument['gameState'],
  userId: string | null
}) {
  const isPlayer1 = gameState?.player1.id === userId;
  const isPlayer2 = gameState?.player2.id === userId;

  const currentPlayer = isPlayer1 
    ? gameState.player1 
    : isPlayer2 
      ? gameState.player2 
      : null;

  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';

  return (
    <div className='h-fit w-full justify-center items-center'>
      {currentPlayer?.character?.abilities.map((ability, index) => (
        <span
        key={index}
        className={`text-primary m-1 inline-flex items-center h-6 lg:h-8 px-[10px] w-fit text-[8px] lg:text-[10px] font-bold rounded-[5px] ${gameState?.diceRolls?.[walletAddress] === index + 1 && gameState.gameStatus === 'inProgress' && gameState.lastAttack !== undefined ? 'connect-button-bg' : 'bg-[#5A5A5A]' }`}
      >
        {index + 1}. {ability.name}{" "}
        {ability.type === "attack" ? `[-${ability.value}]` : ""}
      </span>
      ))}
    </div>
  )
}