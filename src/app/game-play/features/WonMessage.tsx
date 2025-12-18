"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase";

interface WonMessageProps {
  roomId: string;
}

export default function WonMessage({ roomId }: WonMessageProps) {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [isWagerMatch, setIsWagerMatch] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(0);
  const [wagerId, setWagerId] = useState<string | null>(null);
  const [wagerSettled, setWagerSettled] = useState(false);
  const [isTournamentMatch, setIsTournamentMatch] = useState(false);
  const [tournamentId, setTournamentId] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [tournamentCompleted, setTournamentCompleted] = useState(false);
  const [tournamentPrize, setTournamentPrize] = useState<number>(0);
  const [tournamentPosition, setTournamentPosition] = useState<string>("");
  const [prizeClaimed, setPrizeClaimed] = useState(false);
  const [claimingPrize, setClaimingPrize] = useState(false);

  // Check if this is a wager match or tournament match
  useEffect(() => {
    const checkMatchType = async () => {
      try {
        const gameRoomRef = doc(db, "gameRooms", roomId);
        const gameRoomSnap = await getDoc(gameRoomRef);
        
        if (gameRoomSnap.exists()) {
          const gameData = gameRoomSnap.data();
          
          // Check if rewards already claimed
          if (gameData.rewardsClaimed) {
            setHasClaimed(true);
            console.log("✅ Rewards already claimed for this game");
          }
          
          // Check for wager match
          if (gameData.isWagerMatch && gameData.wagerId) {
            setIsWagerMatch(true);
            setWagerAmount(gameData.wagerAmount || 0);
            setWagerId(gameData.wagerId);
          }
          
          // Check for tournament match and auto-complete it
          if (gameData.isTournamentMatch && gameData.tournamentId && gameData.matchId) {
            setIsTournamentMatch(true);
            setTournamentId(gameData.tournamentId);
            setMatchId(gameData.matchId);
            
            // Auto-complete tournament match immediately so prize button shows
            if (walletAddress) {
              await completeTournamentMatchAuto(
                gameData.tournamentId, 
                gameData.matchId, 
                walletAddress
              );
            }
          }
        }
      } catch (error) {
        console.error("Error checking match type:", error);
      }
    };

    checkMatchType();
  }, [roomId, walletAddress]);

  // Auto-complete tournament match on load (separate from claim flow)
  const completeTournamentMatchAuto = async (
    tournamentIdParam: string, 
    matchIdParam: string, 
    winnerIdParam: string
  ): Promise<void> => {
    if (tournamentCompleted) return; // Already completed
    
    try {
      console.log("🏆 Auto-completing tournament match...", { tournamentIdParam, matchIdParam, roomId });
      
      const response = await fetch('/api/tournaments/matches/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId: tournamentIdParam,
          matchId: matchIdParam,
          winnerId: winnerIdParam,
          roomId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to complete tournament match");
      }

      setTournamentCompleted(true);
      
      if (data.tournamentComplete) {
        // Fetch tournament data to get prize info
        const tournamentResponse = await fetch(`/api/tournaments/${tournamentIdParam}`);
        const tournamentData = await tournamentResponse.json();
        
        if (tournamentData.success && tournamentData.tournament.prizeDistribution) {
          const myPrize = tournamentData.tournament.prizeDistribution.find(
            (p: { address: string; amount: number; position: string; claimed?: boolean }) => 
              p.address === winnerIdParam
          );
          
          if (myPrize) {
            setTournamentPrize(myPrize.amount);
            setTournamentPosition(myPrize.position);
            setPrizeClaimed(myPrize.claimed || false);
            
            if (!myPrize.claimed) {
              toast.success(`🏆 Tournament completed! You finished ${myPrize.position} and won ${myPrize.amount} CKRA! Scroll down to claim.`, {
                autoClose: 7000,
              });
            }
          }
        }
      } else {
        toast.success("✅ Match won! You've advanced to the next round!");
      }
    } catch (error) {
      console.error("Failed to complete tournament match:", error);
      // Don't show error to user on auto-complete, just log it
    }
  };

  async function settleWager() {
    if (!wagerId || !walletAddress || wagerSettled) return;
    
    try {
      // Check wager status first
      const checkResponse = await fetch(`/api/wager/list?player=${walletAddress}`);
      const checkData = await checkResponse.json();
      
      if (checkData.success) {
        const wager = checkData.wagerGames.find((w: { id: string; status: string }) => w.id === wagerId);
        if (wager && wager.status === 'completed') {
          console.log("Wager already settled, skipping...");
          setWagerSettled(true);
          return;
        }
      }
      
      const response = await fetch('/api/wager/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wagerId,
          winnerId: walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // If already completed, just mark as settled
        if (data.error?.includes('not in progress')) {
          setWagerSettled(true);
          return;
        }
        throw new Error(data.error || "Failed to settle wager");
      }

      setWagerSettled(true);
      toast.success(`🎉 Wager settled! You won ${wagerAmount * 2} CKRA!`);
    } catch (error) {
      console.error("Failed to settle wager:", error);
      toast.error(`Failed to settle wager: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw - allow stats update to continue
    }
  }

  async function completeTournamentMatch() {
    if (!tournamentId || !matchId || !walletAddress) return;
    
    try {
      console.log("🏆 Completing tournament match...", { tournamentId, matchId, roomId });
      
      const response = await fetch('/api/tournaments/matches/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          matchId,
          winnerId: walletAddress,
          roomId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to complete tournament match");
      }

      setTournamentCompleted(true);
      
      if (data.tournamentComplete) {
        // Fetch tournament data to get prize info
        const tournamentResponse = await fetch(`/api/tournaments/${tournamentId}`);
        const tournamentData = await tournamentResponse.json();
        
        if (tournamentData.success && tournamentData.tournament.prizeDistribution) {
          const myPrize = tournamentData.tournament.prizeDistribution.find(
            (p: { address: string; amount: number; position: string }) => 
              p.address === walletAddress
          );
          
          if (myPrize) {
            setTournamentPrize(myPrize.amount);
            setTournamentPosition(myPrize.position);
            setPrizeClaimed(myPrize.claimed || false);
            
            if (!myPrize.claimed) {
              toast.success(`🏆 Tournament completed! You finished ${myPrize.position} and won ${myPrize.amount} CKRA! Click to claim.`, {
                autoClose: 7000,
              });
            } else {
              toast.success(`🏆 Tournament completed! You finished ${myPrize.position}!`);
            }
          } else {
            toast.success("🏆 Tournament completed! You're the champion!");
          }
        } else {
          toast.success("🏆 Tournament completed! You're the champion!");
        }
      } else {
        toast.success("✅ Match won! You've advanced to the next round!");
      }
    } catch (error) {
      console.error("Failed to complete tournament match:", error);
      toast.error(`Failed to complete tournament match: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw - allow stats update to continue
    }
  }

  async function claimTournamentPrize() {
    if (!tournamentId || !walletAddress || prizeClaimed) return;
    
    setClaimingPrize(true);
    try {
      console.log("💰 Claiming tournament prize...");
      
      const response = await fetch('/api/tournaments/claim-prize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          playerAddress: walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to claim prize");
      }

      setPrizeClaimed(true);
      toast.success(`💰 Prize claimed! ${data.prize.amount} CKRA transferred to your wallet!`, {
        autoClose: 5000,
      });
      
      console.log("✅ Prize claimed successfully:", data);
    } catch (error) {
      console.error("Failed to claim prize:", error);
      toast.error(`Failed to claim prize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setClaimingPrize(false);
    }
  }

  async function claimXP() {
      try {
         if (!walletAddress) {
           alert("Wallet not connected");
           return;
         }

         // If this is a wager match, settle it first (only if not already settled)
         if (isWagerMatch && wagerId && !wagerSettled) {
           console.log("🎰 Settling wager before claiming rewards...");
           await settleWager();
           console.log("✅ Wager settled (or already settled)");
         }

         // Tournament match should already be completed from auto-complete
         // If somehow not completed yet, complete it now
         if (isTournamentMatch && tournamentId && matchId && !tournamentCompleted) {
           console.log("🏆 Tournament match not auto-completed, completing now...");
           await completeTournamentMatch();
           console.log("✅ Tournament match completed");
         }

         setIsClaiming(true);
         
         if (!walletAddress) {
           toast.error("Wallet not connected");
           return;
         }

         console.log("📊 Updating win stats...");
         // Update profile with win stat BEFORE claiming rewards
         const updateStatsResponse = await fetch("/api/update-profile-stats", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             walletAddress: walletAddress,
             result: "win",
           }),
         });

         console.log("Stats update response status:", updateStatsResponse.status);

         if (!updateStatsResponse.ok) {
           const errorData = await updateStatsResponse.json();
           console.error("❌ Failed to update stats:", errorData);
           toast.error(`Failed to update win stats: ${errorData.error || 'Unknown error'}`);
           return;
         }

        const statsData = await updateStatsResponse.json();
        console.log("Stats data received:", statsData);
        
        if (statsData.success) {
          toast.success(`Win recorded! Total wins: ${statsData.stats.wins}`);
          console.log("✅ Win stats updated successfully");
        } else {
          toast.error("Failed to record win");
          console.error("❌ Stats update failed:", statsData);
          return;
        }
         
         const claimResponse = await fetch("/api/claim-xp", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             walletAddress: walletAddress,
             xpAmount: 10,
           }),
         });

         if (!claimResponse.ok) {
           const errorData = await claimResponse.json();
           toast.error(errorData.error || "Failed to claim XP");
           return;
         }

         const claimData = await claimResponse.json();
         
         if (claimData.transactionResult && claimData.transactionResult.status === "Success") {
           toast.success(`Successfully claimed 10 XP! ${claimData.transactionResult.signature}`);
           setHasClaimed(true);
         } else {
           throw new Error("XP claim transaction failed");
         }

         const mintResponse = await fetch("/api/mint-resource", {
           method: "POST",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify({
             walletAddress: walletAddress,
             amount: 50,
           }),
         });

         if (!mintResponse.ok) {
           const errorData = await mintResponse.json();
           toast.error(errorData.error || "Failed to mint resources");
           return;
         }

         const mintData = await mintResponse.json();
         
         if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
           toast.success(`Successfully claimed 50 Chakra! ${mintData.transactionResult.signature}`);
         } else {
           throw new Error("Chakra mint transaction failed");
         }

           // Mark rewards as claimed in the game room
           const { updateDoc, doc } = await import("firebase/firestore");
           const { db } = await import("@/config/firebase");
           const gameRoomRef = doc(db, "gameRooms", roomId);
           await updateDoc(gameRoomRef, {
             rewardsClaimed: true,
             rewardsClaimedAt: Date.now(),
             rewardsClaimedBy: walletAddress,
           });
           
           // Update local state so button is disabled
           setHasClaimed(true);

           router.push("/lobby");
      } catch (error) {
        console.error("❌ Error in claimXP flow:", error);
        console.error("Error details:", error instanceof Error ? error.message : error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        toast.error(`Error Claiming Rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      } finally {
        setIsClaiming(false);
      } 
    }

  return (
    <div className="bg-[#191919]/60 h-full top-0 left-0">
        <div className="flex flex-col justify-center items-center h-full">
          <div className='flex justify-end w-[60%] -mt-20'>
        </div>
          <img
            src="/winner-background.png"
            alt="winner-bg"
            width={306}
            height={306}
          />
          <div className="flex flex-col justify-center items-center gap-4 -mt-48">
            <div className="flex flex-col justify-center items-center">
              <span className="text-white font-extrabold text-[22px] text-center">
                You Won!!
              </span>
              {isWagerMatch && (
                <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-lg px-4 py-2 mt-2">
                  <span className="text-yellow-400 font-bold text-lg">
                    🏆 Prize: {wagerAmount * 2} CKRA
                  </span>
                </div>
              )}
              {isTournamentMatch && (
                <div className="bg-purple-400/20 border-2 border-purple-400 rounded-lg px-4 py-2 mt-2">
                  <span className="text-purple-400 font-bold text-lg">
                    🏆 Tournament Match Won!
                  </span>
                  {tournamentPrize > 0 && (
                    <div className="text-yellow-400 font-bold text-sm mt-1">
                      {tournamentPosition} Place Prize: {tournamentPrize} CKRA
                      {prizeClaimed && " ✅"}
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button onClick={() => router.push('/')} className="border-none cursor-pointer bg-white text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]">
              <img
                src="/rematch.png"
                alt="winner-bg"
                width={24}
                height={24}
              />{" "}
              Rematch
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="border-none bg-white cursor-pointer text-[#381B5D] font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
            >
              <img src="/exit.png" alt="winner-bg" width={24} height={24} />{" "}
              Exit Game
            </Button>
            {tournamentPrize > 0 && !prizeClaimed && (
              <Button
                onClick={() => claimTournamentPrize()}
                disabled={claimingPrize}
                className="border-none bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white cursor-pointer font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
              >
                {claimingPrize ? "Claiming..." : `💰 Claim ${tournamentPrize} CKRA`}
              </Button>
            )}
            <Button
              onClick={() => claimXP()}
              disabled={isClaiming || hasClaimed}
              className="border-none connect-button-bg text-white bg-[#B91770] hover:bg-[#B91770]/80 cursor-pointer font-bold text-[12px] w-[190px] h-[38px] rounded-[4px]"
            >
              {isClaiming ? "Claiming..." : hasClaimed ? "Claimed!" : "Claim 10 XP + 50 Chakra"}
            </Button>
          </div>
        </div>
    </div>
  );
}
