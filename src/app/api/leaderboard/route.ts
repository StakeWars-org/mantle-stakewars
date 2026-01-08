import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getPlayerWinsAndLosses } from '@/lib/contractUtils';

interface GameRoomDocument {
  id: string;
  status: 'waiting' | 'character-select' | 'inProgress' | 'finished';
  gameState?: {
    winner?: 'player1' | 'player2';
    player1?: {
      id: string | null;
    };
    player2?: {
      id: string | null;
    };
  };
}

interface LeaderboardEntry {
  address: string;
  walletAddress: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  rank: number;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🏆 Starting leaderboard fetch...');
    
    // Fetch all finished game rooms from Firestore
    const roomsRef = collection(db, 'gameRooms');
    const finishedRoomsQuery = query(roomsRef, where('status', '==', 'finished'));
    const querySnapshot = await getDocs(finishedRoomsQuery);
    
    console.log(`📊 Found ${querySnapshot.size} finished game rooms`);
    
    // Count winners - map address to win count
    const winnerCounts = new Map<string, number>();
    
    querySnapshot.docs.forEach((doc) => {
      const room = doc.data() as GameRoomDocument;
      
      if (room.gameState?.winner && (room.gameState.winner === 'player1' || room.gameState.winner === 'player2')) {
        const winnerId = room.gameState.winner === 'player1' 
          ? room.gameState.player1?.id 
          : room.gameState.player2?.id;
        
        if (winnerId && winnerId.trim() !== '') {
          const currentCount = winnerCounts.get(winnerId) || 0;
          winnerCounts.set(winnerId, currentCount + 1);
        }
      }
    });
    
    console.log(`🎯 Found ${winnerCounts.size} unique winners`);
    
    // Get top 20 addresses by win count
    const topAddresses = Array.from(winnerCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by win count descending
      .slice(0, 20)
      .map(([address]) => address as `0x${string}`);
    
    console.log(`📈 Top 20 addresses:`, topAddresses);
    
    // Fetch wins/losses from contract in parallel for performance
    const contractDataPromises = topAddresses.map(async (address) => {
      try {
        const stats = await getPlayerWinsAndLosses(address);
        return {
          address,
          wins: stats.wins,
          losses: stats.losses,
        };
      } catch (error) {
        console.error(`Error fetching stats for ${address}:`, error);
        return {
          address,
          wins: 0,
          losses: 0,
        };
      }
    });
    
    // Wait for all contract calls to complete
    const contractData = await Promise.all(contractDataPromises);
    
    console.log(`✅ Fetched contract data for ${contractData.length} addresses`);
    
    // Build leaderboard entries
    const leaderboard: LeaderboardEntry[] = contractData
      .filter((data) => data.wins > 0 || data.losses > 0) // Only include players with games
      .map((data) => {
        const totalGames = data.wins + data.losses;
        const winRate = totalGames > 0 ? Math.round((data.wins / totalGames) * 100) : 0;
        
        return {
          address: data.address,
          walletAddress: data.address,
          wins: data.wins,
          losses: data.losses,
          totalGames,
          winRate,
          rank: 0, // Will be set after sorting
        };
      })
      .sort((a, b) => {
        // Sort by wins first, then win rate
        if (b.wins !== a.wins) {
          return b.wins - a.wins;
        }
        return b.winRate - a.winRate;
      })
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    
    console.log(`🎉 Leaderboard built with ${leaderboard.length} entries`);
    
    return NextResponse.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
      totalProfiles: leaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        leaderboard: [],
        count: 0,
        totalProfiles: 0,
      },
      { status: 500 }
    );
  }
}
