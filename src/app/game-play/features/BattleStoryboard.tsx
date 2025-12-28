'use client'

import React from 'react';
import useOnlineGameStore, { BattleLogEntry } from '@/store/useOnlineGame';
import { GameRoomDocument } from '@/store/useOnlineGame';

export default function BattleStoryboard({ gameState }: { gameState?: GameRoomDocument['gameState'] }) {
  const { exportBattleLog } = useOnlineGameStore();
  const battleLog = gameState?.battleLog || [];
  
  // Filter to only show attack-related events (attacks, defenses, skipped defenses)
  const attackEvents = battleLog.filter(entry => 
    entry.event.includes('attacked') || 
    entry.event.includes('defense') || 
    entry.event.includes('took') ||
    entry.event.includes('skipped')
  );
  
  // Get ONLY the last 3 attack events (most recent + 2 previous)
  // Slice gets last 3 from the end, reverse puts most recent first (at top)
  const recentEntries = attackEvents.length > 0 
    ? attackEvents.slice(-3).reverse()  // Last 3, reversed so newest is first
    : [];
  
  // Only the first entry (index 0) is the most recent and gets the green border
  // Index 1 and 2 are the previous 2 moves (no green border)
  
  const formatEvent = (entry: BattleLogEntry) => {
    const { event, details } = entry;
    
    // Format based on event type
    if (event.includes('attacked')) {
      return {
        icon: '⚔️',
        text: event,
        damage: details?.finalDamage || details?.baseDamage,
        critical: details?.isCritical ? '🎯 CRITICAL!' : ''
      };
    } else if (event.includes('defense')) {
      return {
        icon: '🛡️',
        text: event,
        damage: details?.damageToApply || details?.incomingDamage,
        reflected: details?.reflectedDamage
      };
    } else if (event.includes('skipped defense') || (event.includes('took') && event.includes('damage'))) {
      return {
        icon: '💥',
        text: event,
        damage: details?.incomingDamage
      };
    } else if (event.includes('took') && event.includes('damage')) {
      return {
        icon: '💥',
        text: event,
        damage: details?.incomingDamage
      };
    } else if (event.includes('turn')) {
      return {
        icon: '🔄',
        text: event,
        damage: null
      };
    } else if (event.includes('selected character')) {
      return {
        icon: '👤',
        text: event,
        damage: null
      };
    } else if (event.includes('Game ended')) {
      return {
        icon: '🏆',
        text: event,
        damage: null
      };
    }
    
    return {
      icon: '📝',
      text: event,
      damage: null
    };
  };
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-bold text-sm">Battle Storyboard</h3>
        {battleLog.length > 0 && (
          <button
            onClick={exportBattleLog}
            className="text-xs bg-[#B91770] hover:bg-[#B91770]/80 text-white px-3 py-1 rounded"
          >
            📥 Download Log
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {recentEntries.length === 0 ? (
          <div className="text-gray-400 text-xs text-center py-4">
            Battle will begin soon...
          </div>
        ) : (
          recentEntries.slice(0, 3).map((entry, index) => {
            const formatted = formatEvent(entry);
            // Only the first entry (index 0) is the most recent and gets the green border
            // Index 1 and 2 are the 2 previous moves (no green border)
            const isCurrent = index === 0;
            
            return (
              <div
                key={`${entry.timestamp}-${index}`}
                className={`
                  p-3 rounded-lg border
                  ${isCurrent 
                    ? 'bg-[#4A4A4A] border-[#BFE528] border-2' 
                    : 'bg-[#3A3A3A] border-[#5A5A5A] border'
                  }
                  transition-all
                `}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{formatted.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium">
                      {formatted.text}
                    </div>
                    {formatted.damage !== null && (
                      <div className="text-red-400 text-xs mt-1">
                        Damage: {formatted.damage}
                        {formatted.critical && (
                          <span className="ml-2 text-yellow-400">{formatted.critical}</span>
                        )}
                        {formatted.reflected && (
                          <span className="ml-2 text-orange-400">Reflected: {formatted.reflected}</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>P1 HP: {entry.player1?.health || 0}</span>
                      <span>P2 HP: {entry.player2?.health || 0}</span>
                    </div>
                    {isCurrent && (
                      <div className="text-[#BFE528] text-xs mt-1 font-bold">
                        ← Current
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {attackEvents.length > 3 && (
        <div className="text-xs text-gray-500 text-center mt-2">
          Showing last 3 attacks ({attackEvents.length} total attacks)
        </div>
      )}
    </div>
  );
}

