'use client'

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { OpponentProgress } from '@/components/ui/opponent-progress';
import { compactHash } from "@/components/ConnectButton";
import PlayerAbility from "./PlayerAbility";
import { AIGameState, Buff } from './AIHealth';

interface BattleArenaProps {
  gameState: AIGameState;
  currentTurn: 'player' | 'ai';
}

export default function BattleArena({ gameState, currentTurn }: BattleArenaProps) {
  const player = gameState.player;
  const ai = gameState.ai;
  
  const playerHealthPercent = player?.currentHealth
    ? Math.max(0, Math.min(100, (player.currentHealth / (player.character?.baseHealth || 100)) * 100))
    : 0;
    
  const aiHealthPercent = ai?.currentHealth
    ? Math.max(0, Math.min(100, (ai.currentHealth / (ai.character?.baseHealth || 200)) * 100))
    : 0;

  const isPlayerTurn = currentTurn === 'player';
  const isAITurn = currentTurn === 'ai';

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
          
          {/* AI Side (Left) */}
          <div className={`relative transition-all duration-300 ${
            isAITurn 
              ? 'scale-105' 
              : 'scale-100'
          }`}>
            {/* Turn Indicator */}
            {isAITurn && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 animate-pulse">
                <div className="bg-red-500 text-white px-4 py-1 rounded-full text-xs font-bold border-2 border-red-300">
                  AI TURN
                </div>
              </div>
            )}
            
            <div className="bg-[#3F3F3F] rounded-[10px] p-4 border-2 border-red-500/30">
              {/* AI Character Image - Larger */}
              <div className="flex justify-center mb-4">
                <div className={`relative transition-all duration-300 ${
                  isAITurn ? 'ring-4 ring-red-500 ring-opacity-75' : ''
                }`}>
                  <div className="w-[120px] h-[180px] lg:w-[150px] lg:h-[220px] rounded-[10px] overflow-hidden border-4 border-black shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                    <img
                      className="w-full h-full object-cover"
                      src={`/custom-assets/characters/${ai?.character?.id}.png`}
                      alt={ai?.character?.nickname}
                    />
                  </div>
                </div>
              </div>
              
              {/* AI Info */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-[#BFE528] font-bold text-sm lg:text-base">
                    {ai?.character?.nickname || 'AI Character'}
                  </span>
                </div>
                
                {/* AI Health Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-xs">Health</span>
                    <span className="text-white text-xs font-bold">
                      {ai?.currentHealth || 0}/{ai?.character?.baseHealth || 200}
                    </span>
                  </div>
                  <div className="bg-[#494949] h-3 rounded-full overflow-hidden">
                    <OpponentProgress 
                      className="!h-full !rounded-full" 
                      value={aiHealthPercent} 
                    />
                  </div>
                </div>
                
                {/* AI Stamina */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-red-400 text-xs font-semibold">Stamina</span>
                    <span className="text-white text-xs">{ai?.stamina || 0}/100</span>
                  </div>
                  <div className="bg-[#494949] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        (ai?.stamina || 0) >= 50 
                          ? 'bg-green-500' 
                          : (ai?.stamina || 0) >= 30 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${((ai?.stamina || 0) / 100) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* AI Defense Inventory */}
                <div>
                  <span className="text-red-400 text-xs">AI Defenses:</span>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {Object.entries(ai?.defenseInventory || {}).map(([type, count]) => {
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
                
                {/* AI Buffs */}
                {ai?.activeBuffs && ai.activeBuffs.length > 0 && (
                  <div>
                    <span className="text-red-400 text-xs">Buffs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ai.activeBuffs.map((buff: Buff, index: number) => (
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

          {/* Player Side (Right) */}
          <div className={`relative transition-all duration-300 ${
            isPlayerTurn 
              ? 'scale-105' 
              : 'scale-100'
          }`}>
            {/* Turn Indicator */}
            {isPlayerTurn && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20 animate-pulse">
                <div className="bg-[#BFE528] text-black px-4 py-1 rounded-full text-xs font-bold border-2 border-[#BFE528]">
                  YOUR TURN
                </div>
              </div>
            )}
            
            <div className="bg-[#3F3F3F] rounded-[10px] p-4 border-2 border-[#BFE528]/30">
              {/* Player Character Image - Larger */}
              <div className="flex justify-center mb-4">
                <div className={`relative transition-all duration-300 ${
                  isPlayerTurn ? 'ring-4 ring-[#BFE528] ring-opacity-75' : ''
                }`}>
                  <div className="w-[120px] h-[180px] lg:w-[150px] lg:h-[220px] rounded-[10px] overflow-hidden border-4 border-black shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                    <img
                      className="w-full h-full object-cover"
                      src={`/custom-assets/characters/${player?.character?.id}.png`}
                      alt={player?.character?.nickname}
                    />
                  </div>
                </div>
              </div>
              
              {/* Player Info */}
              <div className="space-y-3">
                <div className="text-center">
                  <span className="text-[#BFE528] font-bold text-sm lg:text-base">
                    {player?.character?.nickname || 'Your Character'}
                  </span>
                  <div className="text-white text-xs mt-1">
                    {compactHash(player?.id || "") || "You"}
                  </div>
                </div>
                
                {/* Player Health Bar */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white text-xs">Health</span>
                    <span className="text-white text-xs font-bold">
                      {player?.currentHealth || 0}/{player?.character?.baseHealth || 100}
                    </span>
                  </div>
                  <div className="bg-[#494949] h-3 rounded-full overflow-hidden">
                    <Progress 
                      className="!h-full !rounded-full" 
                      value={playerHealthPercent} 
                    />
                  </div>
                </div>
                
                {/* Player Stamina */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#BFE528] text-xs font-semibold">Stamina</span>
                    <span className="text-white text-xs">{player?.stamina || 0}/100</span>
                  </div>
                  <div className="bg-[#494949] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        (player?.stamina || 0) >= 50 
                          ? 'bg-green-500' 
                          : (player?.stamina || 0) >= 30 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${((player?.stamina || 0) / 100) * 100}%` }}
                    />
                  </div>
                </div>
                
                {/* Player Abilities */}
                <div>
                  <PlayerAbility gameState={gameState} />
                </div>
                
                {/* Player Defense Inventory */}
                <div>
                  <span className="text-[#BFE528] text-xs">Your Defenses:</span>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    {Object.entries(player?.defenseInventory || {}).map(([type, count]) => {
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
                
                {/* Player Buffs */}
                {player?.activeBuffs && player.activeBuffs.length > 0 && (
                  <div>
                    <span className="text-[#BFE528] text-xs">Buffs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {player.activeBuffs.map((buff: Buff, index: number) => (
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
