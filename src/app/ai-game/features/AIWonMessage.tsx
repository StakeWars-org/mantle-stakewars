"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import useAIGameStore from '@/store/useAIGame';

const AIWonMessage: React.FC = () => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address || '';
  const router = useRouter();
  const { reset } = useAIGameStore();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const claimRewards = async () => {
    if (!walletAddress || !authenticated) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsClaiming(true);
    try {
      // Claim XP first
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
      } else {
        throw new Error("XP claim transaction failed");
      }

      // Then mint chakra
      const mintResponse = await fetch("/api/mint-resource", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          amount: 10,
        }),
      });

      if (!mintResponse.ok) {
        const errorData = await mintResponse.json();
        toast.error(errorData.error || "Failed to claim chakra");
        return;
      }

      const mintData = await mintResponse.json();
      
      if (mintData.transactionResult && mintData.transactionResult.status === "Success") {
        toast.success(`Successfully claimed 10 💎 Chakra! ${mintData.transactionResult.signature}`);
        setHasClaimed(true);
      } else {
        throw new Error("Chakra mint transaction failed");
      }
    } catch (error) {
      console.error("Claim rewards error:", error);
      toast.error(`Failed to claim rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleBackToLobby = () => {
    reset();
    router.push('/lobby');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#3F3F3F] rounded-[20px] p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Victory!</h2>
          <p className="text-gray-300 mb-4">
            You defeated the AI opponent!
          </p>
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button
            onClick={claimRewards}
            disabled={isClaiming || hasClaimed}
            className={`font-bold py-3 px-6 rounded-lg ${
              hasClaimed
                ? "bg-green-600 text-white cursor-not-allowed"
                : "bg-[#B91770] hover:bg-[#B91770]/80 text-white"
            }`}
          >
            {isClaiming ? "Claiming..." : hasClaimed ? "Claimed!" : "Claim 10 XP + 10 Chakra"}
          </Button>
          
          <Button
            onClick={handleBackToLobby}
            variant="outline"
            className="border-[#6B6969] text-white hover:bg-[#6B6969] font-bold py-3 px-6 rounded-lg"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIWonMessage;

