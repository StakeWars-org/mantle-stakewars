'use client'

import React, { useState, useEffect } from 'react';
import useOnlineGameStore from "@/store/useOnlineGame";
import { toast } from 'react-toastify';
import { Button } from "./ui/button";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const DiceRollToDetermineFirstTurn = () => {
    const { checkDiceRollsAndSetTurn, rollAndRecordDice, gameState, roomId } = useOnlineGameStore();

    const { ready, authenticated } = usePrivy();
    const { wallets } = useWallets();
    
    // Get wallet address from Privy
    const walletAddress = wallets[0]?.address || '';
    
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    const [opponentAddress, setOpponentAddress] = useState<string | null>(null);
  
    // Determine opponent address
    useEffect(() => {
      const fetchOpponentAddress = async () => {
        if (!roomId || !walletAddress) return;
        
        try {
          const roomRef = doc(db, "gameRooms", roomId);
          const roomSnapshot = await getDoc(roomRef);
          const roomData = roomSnapshot.data();
          
          if (roomData?.players) {
            const playerIds = Object.keys(roomData.players);
            const opponent = playerIds.find(id => id !== walletAddress);
            setOpponentAddress(opponent || null);
          }
        } catch (error) {
          console.error('Error fetching opponent address:', error);
        }
      };
      
      fetchOpponentAddress();
    }, [roomId, walletAddress]);
  
    const hasPlayerRolled = (() => {
      if (gameState?.diceRolls && authenticated && walletAddress) {
        return walletAddress in gameState.diceRolls;
      }
      return false;
    })();
    
    const hasOpponentRolled = (() => {
      if (gameState?.diceRolls && opponentAddress) {
        return opponentAddress in gameState.diceRolls;
      }
      return false;
    })();
    
    const playerRoll = gameState?.diceRolls?.[walletAddress];
    const opponentRoll = opponentAddress ? gameState?.diceRolls?.[opponentAddress] : undefined;
    
    const bothPlayersRolled = hasPlayerRolled && hasOpponentRolled;
  
    const handleRollDice = async () => {
      if (hasPlayerRolled || isButtonDisabled) {
        toast.info('You have already rolled the dice.');
        return;
      }
  
      setIsButtonDisabled(true);
      
      try {
        const rolledDiceNumber = await rollAndRecordDice();
        toast.info(`You rolled: ${rolledDiceNumber}`);
        
        // Check if both players have rolled after a short delay
        setTimeout(() => {
          checkDiceRollsAndSetTurn();
          setIsButtonDisabled(false);
        }, 1000);
      } catch (error) {
        if (error instanceof Error) {
          toast.error(`Error rolling dice: ${error.message}`);
        }
        setIsButtonDisabled(false);
      }
    };
    
    // Determine who goes first
    const getFirstPlayerMessage = () => {
      if (!playerRoll || !opponentRoll) return null;
      
      if (playerRoll > opponentRoll) {
        return "🎉 You go first!";
      } else if (opponentRoll > playerRoll) {
        return "👤 Opponent goes first!";
      } else {
        return "🤝 It's a tie! Re-rolling...";
      }
    };
  
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-white text-lg font-semibold mb-2">
          Roll Dice to Determine First Turn
        </div>
        
        <div className="flex flex-col items-center space-y-2">
          <div className="text-white text-sm">
            {hasPlayerRolled && playerRoll !== undefined 
              ? `You rolled: ${playerRoll}` 
              : 'You haven\'t rolled yet'}
          </div>
          <div className="text-white text-sm">
            {hasOpponentRolled && opponentRoll !== undefined
              ? `Opponent rolled: ${opponentRoll}`
              : 'Opponent hasn\'t rolled yet'}
          </div>
        </div>

        <Button
          onClick={handleRollDice}
          disabled={isButtonDisabled || hasPlayerRolled}
          className="bg-[#B91770] hover:bg-[#B91770]/80 text-white font-bold py-2 px-6 rounded-lg disabled:bg-[#B91770]/50"
        >
          {isButtonDisabled ? "Rolling..." : hasPlayerRolled ? "Rolled!" : "Roll Dice"}
        </Button>

        {bothPlayersRolled && playerRoll !== undefined && opponentRoll !== undefined && (
          <div className="flex flex-col items-center space-y-2">
            <div className="text-white text-lg font-bold">
              {getFirstPlayerMessage()}
            </div>
            <div className="text-white text-sm">
              You rolled {playerRoll}, Opponent rolled {opponentRoll}
            </div>
            <Button
              onClick={checkDiceRollsAndSetTurn}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
            >
              Start Game
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  export default DiceRollToDetermineFirstTurn;