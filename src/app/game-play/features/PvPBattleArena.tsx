'use client'

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { OpponentProgress } from '@/components/ui/opponent-progress';
import { compactHash } from "@/components/ConnectButton";
import PlayerAbility from "./PlayerAbility";
import { GameRoomDocument } from '@/store/useOnlineGame';
import { usePrivy, useWallets } from '@privy-io/react-auth';

interface PvPBattleArenaProps {
  gameState?: GameRoomDocument['gameState'];
  currentTurn: 'player1' | 'player2';
}

interface Buff {
  name: string;
  effect: number; 
  remainingTurns: number;
}

export default function PvPBattleArena({ gameState, currentTurn }: PvPBattleArenaProps) {
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address || '';
  
  const isPlayer1 = gameState?.player1.id === walletAddress;
  const isPlayer2 = gameState?.player2.id === walletAddress;
  
  // Determine which player is "you" and which is "opponent"
  const yourPlayer = isPlayer1 ? gameState?.player1 : isPlayer2 ? gameState?.player2 : null;
  const opponentPlayer = isPlayer1 ? gameState?.player2 : isPlayer2 ? gameState?.player1 : null;
  
  // Determine current turn from your perspective
  const isYourTurn = (isPlayer1 && currentTurn === 'player1') || (isPlayer2 && currentTurn === 'player2');
  const isOpponentTurn = (isPlayer1 && currentTurn === 'player2') || (isPlayer2 && currentTurn === 'player1');
  
  const yourHealthPercent = yourPlayer?.currentHealth
    ? Math.max(0, Math.min(100, (yourPlayer.currentHealth / (yourPlayer.character?.baseHealth || 100)) * 100))
    : 0;
    
  const opponentHealthPercent = opponentPlayer?.currentHealth
    ? Math.max(0, Math.min(100, (opponentPlayer.currentHealth / (opponentPlayer?.character?.baseHealth || 100)) * 100))
    : 0;

  return (
    <div className="relative w-full">
      {/* Arena Background with VS Divider */}
      <div className="bg-gradient-to-b from-[#2A2A2A] via-[#3F3F3F] to-[#2A2A2A] rounded-[15px] p-6 lg:p-8 border-2 border-[#BFE528]/30 shadow-[0_0_30px_rgba(191,229,40,0.1)]">
        
        {/* VS Divider in Center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#BFE528]/20 backdrop-blur-sm px-4 py-2 rounded-full border-2 border-[#BFE528]/50">
            <span className="text-[#BFE528] font-bold text-lg lg:text-2xl">VS</span>
          </div>
        </div>

        {/* Side-by-Side Battle Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 relative z-0">
          
          {/* Opponent Side (Left) */}
          <div className={`relative transition-all duration-300 ${
            isOpponentTurn 
              ? 'scale-105' 
              : 'scale-100'
          }`}>
            {/* Turn Indicator */}
            {isOpponentTurn && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 animate-pulse">
                <div className="bg-red-500 text-white px-4 py-1 rounded-full text-xs font-bold border-2 border-red-300">
                  OPPONENT TURN
                </div>
              </div>
            )}
            
            <div className="bg-[#3F3F3F] rounded-[10px] p-4 border-2 border-red-500/30">
              {/* Opponent Character Image - Larger */}
              <div className="flex justify-center mb-4">
                <div className={`relative transition-all duration-300 ${
                  isOpponentTurn ? 'ring-4 ring-red-500 ring-opacity-75' : ''
                }`}>
                  <div className="w-[120px] h-[180px] lg:w-[150px] lg:h-[220px] rounded-[10px] overflow-hidden border-4 border-black shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                    <img
                      className="w-full h-full object-cover"
                      src={`/custom-assets/characters/${opponentPlayer?.character?.id}.png`}
                      alt={opponentPlayer?.character?.nickname}
                    />
                  </div>
                </div>
              </div>
              
              {/* Opponent Info */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-[#BFE528] font-bold text-sm lg:text-base">
                    {opponentPlayer?.character?.nickname || 'Opponent'}
                  </span>
                  <div className="text-white text-xs mt-1">
                    {compactHash(opponentPlayer?.id || "") || "Opponent"}
                  </div>
                </div>
                
                {/* Opponent Health Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-xs">Health</span>
                    <span className="text-white text-xs font-bold">
                      {opponentPlayer?.currentHealth || 0}/{opponentPlayer?.character?.baseHealth || 100}
                    </span>
                  </div>
                  <div className="bg-[#494949] h-3 rounded-full overflow-hidden">
                    <OpponentProgress 
                      className="!h-full !rounded-full" 
                      value={opponentHealthPercent} 
                    />
                  </div>
                </div>
                
                {/* Opponent Stamina */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-red-400 text-xs font-semibold">Stamina</span>
                    <span className="text-white text-xs">{opponentPlayer?.stamina || 0}/100</span>
                  </div>
                  <div className="bg-[#494949] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        (opponentPlayer?.stamina || 0) >= 50 
                          ? 'bg-green-500' 
                          : (opponentPlayer?.stamina || 0) >= 30 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${((opponentPlayer?.stamina || 0) / 100) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Opponent Defense Inventory */}
                <div>
                  <span className="text-red-400 text-xs">Opponent Defenses:</span>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {Object.entries(opponentPlayer?.defenseInventory || {}).map(([type, count]) => {
                      const countNum = count as number;
                      return countNum > 0 && (
                        <div key={type} className="flex items-center space-x-1 bg-[#494949] px-2 py-1 rounded border border-red-500">
                          <img 
                            src={`/${type}.png`} 
                            alt={type} 
                            className="w-3 h-3"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-white text-xs font-bold">{countNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Opponent Buffs */}
                {opponentPlayer?.activeBuffs && opponentPlayer.activeBuffs.length > 0 && (
                  <div>
                    <span className="text-red-400 text-xs">Buffs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {opponentPlayer.activeBuffs.map((buff: Buff, index: number) => (
                        <div key={index} className="border border-red-400 py-0.5 px-2 text-white text-xs bg-red-500/20 rounded">
                          {buff.name}(+{buff.effect}): {buff.remainingTurns}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Your Side (Right) */}
          <div className={`relative transition-all duration-300 ${
            isYourTurn 
              ? 'scale-105' 
              : 'scale-100'
          }`}>
            {/* Turn Indicator */}
            {isYourTurn && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 animate-pulse">
                <div className="bg-[#BFE528] text-black px-4 py-1 rounded-full text-xs font-bold border-2 border-[#BFE528]">
                  YOUR TURN
                </div>
              </div>
            )}
            
            <div className="bg-[#3F3F3F] rounded-[10px] p-4 border-2 border-[#BFE528]/30">
              {/* Your Character Image - Larger */}
              <div className="flex justify-center mb-4">
                <div className={`relative transition-all duration-300 ${
                  isYourTurn ? 'ring-4 ring-[#BFE528] ring-opacity-75' : ''
                }`}>
                  <div className="w-[120px] h-[180px] lg:w-[150px] lg:h-[220px] rounded-[10px] overflow-hidden border-4 border-black shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                    <img
                      className="w-full h-full object-cover"
                      src={`/custom-assets/characters/${yourPlayer?.character?.id}.png`}
                      alt={yourPlayer?.character?.nickname}
                    />
                  </div>
                </div>
              </div>
              
              {/* Your Info */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-[#BFE528] font-bold text-sm lg:text-base">
                    {yourPlayer?.character?.nickname || 'Your Character'}
                  </span>
                  <div className="text-white text-xs mt-1">
                    {compactHash(yourPlayer?.id || "") || "You"}
                  </div>
                </div>
                
                {/* Your Health Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-xs">Health</span>
                    <span className="text-white text-xs font-bold">
                      {yourPlayer?.currentHealth || 0}/{yourPlayer?.character?.baseHealth || 100}
                    </span>
                  </div>
                  <div className="bg-[#494949] h-3 rounded-full overflow-hidden">
                    <Progress 
                      className="!h-full !rounded-full" 
                      value={yourHealthPercent} 
                    />
                  </div>
                </div>
                
                {/* Your Stamina */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#BFE528] text-xs font-semibold">Stamina</span>
                    <span className="text-white text-xs">{yourPlayer?.stamina || 0}/100</span>
                  </div>
                  <div className="bg-[#494949] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        (yourPlayer?.stamina || 0) >= 50 
                          ? 'bg-green-500' 
                          : (yourPlayer?.stamina || 0) >= 30 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${((yourPlayer?.stamina || 0) / 100) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Your Abilities */}
                <div>
                  <PlayerAbility gameState={gameState} userId={yourPlayer?.id as string} />
                </div>
                
                {/* Your Defense Inventory */}
                <div>
                  <span className="text-[#BFE528] text-xs">Your Defenses:</span>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {Object.entries(yourPlayer?.defenseInventory || {}).map(([type, count]) => {
                      const countNum = count as number;
                      return countNum > 0 && (
                        <div key={type} className="flex items-center space-x-1 bg-[#494949] px-2 py-1 rounded border border-[#BFE528]">
                          <img 
                            src={`/${type}.png`} 
                            alt={type} 
                            className="w-3 h-3 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-white text-xs font-bold">{countNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Your Buffs */}
                {yourPlayer?.activeBuffs && yourPlayer.activeBuffs.length > 0 && (
                  <div>
                    <span className="text-[#BFE528] text-xs">Buffs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {yourPlayer.activeBuffs.map((buff: Buff, index: number) => (
                        <div key={index} className="border border-[#BFE528] py-0.5 px-2 text-white text-xs bg-[#BFE528]/20 rounded">
                          {buff.name}(+{buff.effect}): {buff.remainingTurns}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
