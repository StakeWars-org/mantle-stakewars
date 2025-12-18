"use client";

import React, { useState, useEffect, Suspense } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { CHARACTERS, Character } from "@/lib/characters";
import CharacterCarousel from "./features/CharacterCarousel";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { MoonLoader } from "react-spinners";
import { Sword } from "lucide-react";

export default function Lobby() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';
  const router = useRouter();
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);

  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");

  function getCharacterId(attributes: Record<string, string>) {
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

  const fetchCharacters = async () => {
    if (!walletAddress) return;
    
    try {
      // Fetch owned characters via API
      const response = await fetch(`/api/get-owned-characters?walletAddress=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        const characterIds = data.characterIds || [];
        
        // Match with CHARACTERS data
        const matchedAbilities = characterIds
          .map((id: string) => {
            const foundCharacter = CHARACTERS.find((char) => char.id === id);
            return foundCharacter;
          })
          .filter(Boolean) as Character[];

        setCharacterAbilities(matchedAbilities);
      }
    } catch (error) {
      toast.error(`Error fetching characters ${error}`);
    }
  };

  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      fetchCharacters();
    }
  }, [ready, authenticated, walletAddress]);

  return (
    <div>
      <Suspense fallback={<div className="p-4"><MoonLoader size={30} /></div>}>
        {characterAbilities.length > 0 ? (
          <div className="space-y-10">
            {/* Quick Access Navigation */}
            <div className="flex flex-col items-center gap-4">
              {/* Primary Actions */}
              <div className="flex justify-center gap-4 flex-wrap">
                <Button 
                  onClick={() => router.push('/ai-game')}
                  className="bg-[#B91770] hover:bg-[#B91770]/80 text-white font-bold py-3 px-6 rounded-lg"
                >
                  🎮 VS AI Mode
                </Button>
                <Button 
                  onClick={() => router.push('/wager')}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  💰 Wager Matches
                </Button>
                <Button 
                  onClick={() => router.push('/tournaments')}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  🏆 Tournaments
                </Button>
                <Button 
                  onClick={() => router.push('/streaming')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  📺 Streaming
                </Button>
              </div>
              
              {/* Secondary Actions */}
              <div className="flex justify-center gap-3 flex-wrap">
                <Button 
                  onClick={() => router.push('/leaderboard')}
                  className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-2 px-5 rounded-lg text-sm"
                >
                  📊 Leaderboard
                </Button>
                <Button 
                  onClick={() => router.push('/transfer')}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2 px-5 rounded-lg text-sm"
                >
                  💸 Transfer CHAKRA
                </Button>
              </div>
            </div>
            
            <CharacterCarousel characters={characterAbilities} />
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center min-h-[60vh] px-4">
            <div className="max-w-2xl bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl p-8 text-center">
              {/* Icon */}
              <div className="mb-6">
                <div className="inline-block p-6 bg-purple-500/20 rounded-full">
                  <Sword className="w-16 h-16 text-purple-400" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-3">
                No Characters Yet
              </h2>
              
              {/* Description */}
              <p className="text-gray-300 text-lg mb-6">
                You need to mint your first character to start playing StakeWars!
              </p>

              {/* Features List */}
              <div className="bg-gray-900/50 rounded-xl p-6 mb-6 text-left">
                <p className="text-purple-400 font-semibold mb-3">With a character you can:</p>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Battle against AI opponents
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Challenge other players in PvP wager matches
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Join tournaments and win prizes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Earn CHAKRA tokens by winning battles
                  </li>
                </ul>
              </div>

              {/* Mint Button */}
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg transition-all hover:scale-105" 
                onClick={() => router.push('/mint-character')}
              >
                <Sword className="w-5 h-5 inline mr-2" />
                Mint Your First Character
              </Button>

              {/* Helper Text */}
              <p className="text-gray-400 text-sm mt-4">
                Minting is free! You only pay a small network fee.
              </p>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  );
}
