'use client'

import React from 'react';
import useAIGameStore, { BattleLogEntry } from '@/store/useAIGame';

export default function EnhancedBattleStoryboard() {
  const { battleLog, exportBattleLog, gameState } = useAIGameStore();
  
  // Filter to only show attack-related events
  const attackEvents = battleLog.filter(entry => 
    entry.event.includes('attacked') || 
    entry.event.includes('defense') || 
    entry.event.includes('took') ||
    entry.event.includes('skipped') ||
    entry.event.includes('Game ended')
  );
  
  // Get the last 5 events (most recent first)
  const recentEntries = attackEvents.length > 0 
    ? attackEvents.slice(-5).reverse()
    : [];
  
  const formatEvent = (entry: BattleLogEntry) => {
    const { event, details } = entry;
    
    if (event.includes('attacked')) {
      return {
        icon: '⚔️',
        text: event,
        damage: details?.finalDamage || details?.baseDamage || details?.actualDamage,
        critical: details?.isCritical ? '🎯 CRITICAL!' : '',
        color: 'text-red-400'
      };
    } else if (event.includes('dodged')) {
      return {
        icon: '💨',
        text: event,
        damage: null,
        critical: '',
        color: 'text-green-400'
      };
    } else if (event.includes('blocked')) {
      return {
        icon: '🛡️',
        text: event,
        damage: details?.damageToApply || null,
        critical: '',
        color: 'text-blue-400'
      };
    } else if (event.includes('reflected')) {
      return {
        icon: '↩️',
        text: event,
        damage: details?.reflectedDamage || null,
        critical: '',
        color: 'text-orange-400'
      };
    } else if (event.includes('skipped defense') || (event.includes('took') && event.includes('damage'))) {
      return {
        icon: '💥',
        text: event,
        damage: details?.incomingDamage,
        critical: '',
        color: 'text-red-500'
      };
    } else if (event.includes('Game ended')) {
      return {
        icon: '🏆',
        text: event,
        damage: null,
        critical: '',
        color: 'text-yellow-400'
      };
    }
    
    return {
      icon: '📝',
      text: event,
      damage: null,
      critical: '',
      color: 'text-gray-400'
    };
  };
  
  return (
    <div className="w-full bg-[#3F3F3F] rounded-[10px] p-4 border border-[#BFE528]/20">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[#BFE528] font-bold text-sm lg:text-base flex items-center gap-2">
          <span>📜</span> Battle Log
        </h3>
        {battleLog.length > 0 && (
          <button
            onClick={exportBattleLog}
            className="text-xs bg-[#B91770] hover:bg-[#B91770]/80 text-white px-3 py-1.5 rounded transition-colors"
          >
            📥 Export
          </button>
        )}
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {recentEntries.length === 0 ? (
          <div className="text-gray-400 text-xs text-center py-6">
            <div className="text-2xl mb-2">⚔️</div>
            <div>Battle will begin soon...</div>
          </div>
        ) : (
          recentEntries.map((entry, index) => {
            const formatted = formatEvent(entry);
            const isMostRecent = index === 0;
            
            return (
              <div
                key={`${entry.timestamp}-${index}`}
                className={`
                  p-3 rounded-lg border transition-all
                  ${isMostRecent 
                    ? 'bg-[#4A4A4A] border-[#BFE528] border-2 shadow-[0_0_10px_rgba(191,229,40,0.3)]' 
                    : 'bg-[#3A3A3A] border-[#5A5A5A] border opacity-75'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{formatted.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`${formatted.color} text-xs font-medium`}>
                      {formatted.text}
                    </div>
                    {formatted.damage !== null && (
                      <div className="text-red-400 text-xs mt-1 font-bold">
                        💥 {formatted.damage} damage
                        {formatted.critical && (
                          <span className="ml-2 text-yellow-400 animate-pulse">{formatted.critical}</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="text-[#BFE528]">●</span>
                        Player: {entry.player?.health || 0} HP
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-red-400">●</span>
                        AI: {entry.ai?.health || 0} HP
                      </span>
                    </div>
                    {isMostRecent && (
                      <div className="text-[#BFE528] text-xs mt-2 font-bold flex items-center gap-1">
                        <span className="animate-pulse">●</span>
                        Latest Action
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {attackEvents.length > 5 && (
        <div className="text-xs text-gray-500 text-center mt-3 pt-3 border-t border-gray-600">
          Showing last 5 actions ({attackEvents.length} total)
        </div>
      )}
    </div>
  );
}
