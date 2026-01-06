'use client'

import React, { useState, useEffect } from 'react';
import { GameRoomDocument } from '@/store/useOnlineGame';

interface PvPCombatFeedbackProps {
  gameState?: GameRoomDocument['gameState'];
}

interface DamageNumber {
  id: string;
  value: number;
  x: number;
  y: number;
  isCritical: boolean;
  target: 'player1' | 'player2';
}

export default function PvPCombatFeedback({ gameState }: PvPCombatFeedbackProps) {
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [abilityUsed, setAbilityUsed] = useState<{ name: string; player: 'player1' | 'player2' } | null>(null);

  useEffect(() => {
    if (gameState?.lastAttack && gameState.lastAttack.ability) {
      const attack = gameState.lastAttack;
      const abilityValue = attack.ability?.value || 0;
      const damage = attack.actualDamage || abilityValue;
      const isCritical = damage > (abilityValue + 2); // Approximate critical detection
      
      // Add damage number
      const newDamage: DamageNumber = {
        id: Date.now().toString(),
        value: damage,
        x: attack.attackingPlayer === 'player1' ? 75 : 25, // Position based on attacker
        y: 50,
        isCritical,
        target: attack.attackingPlayer === 'player1' ? 'player2' : 'player1'
      };
      
      setDamageNumbers(prev => [...prev, newDamage]);
      
      // Show ability name
      if (attack.ability?.name) {
        setAbilityUsed({
          name: attack.ability.name,
          player: attack.attackingPlayer
        });
        
        // Clear ability name after 2 seconds
        setTimeout(() => {
          setAbilityUsed(null);
        }, 2000);
      }
      
      // Remove damage number after animation
      setTimeout(() => {
        setDamageNumbers(prev => prev.filter(d => d.id !== newDamage.id));
      }, 3000);
    }
  }, [gameState?.lastAttack]);

  return (
    <>
      {/* Damage Numbers Overlay */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {damageNumbers.map((damage) => (
          <div
            key={damage.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 animate-bounce ${
              damage.target === 'player2' ? 'left-[25%]' : 'left-[75%]'
            }`}
            style={{
              top: `${damage.y}%`,
              animation: 'damageFloat 3s ease-out forwards'
            }}
          >
            <div className={`text-4xl font-bold ${
              damage.isCritical 
                ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]' 
                : 'text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]'
            }`}>
              -{damage.value}
              {damage.isCritical && ' 🎯'}
            </div>
          </div>
        ))}
      </div>

      {/* Ability Name Display */}
      {abilityUsed && (
        <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 z-30 animate-pulse ${
          abilityUsed.player === 'player1' ? 'text-[#BFE528]' : 'text-red-400'
        }`}>
          <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-lg border-2 border-current">
            <div className="text-lg font-bold text-center">
              {abilityUsed.player} used: {abilityUsed.name}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes damageFloat {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0) scale(1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(-50px) scale(1.2);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(-100px) scale(0.8);
          }
        }
      `}} />
    </>
  );
}
