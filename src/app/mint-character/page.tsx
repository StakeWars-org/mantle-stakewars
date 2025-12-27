"use client";

import CircleCarousel from "@/components/CircleCarousel";
import ImageSlider from "@/components/ImageSlider";
import { usePrivy, useWallets, useSendTransaction } from "@privy-io/react-auth";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Character, CHARACTERS } from "@/lib/characters";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { encodeFunctionData } from "viem";
import { STAKEWARS_ABI } from "@/lib/abi";
import { STAKEWARS_CONTRACT_ADDRESS } from "@/lib/contractaddr";
import { getContractCharacterId, getCharacterIdFromContractId } from "@/lib/characterMapping";
import { getCharactersOwnedByUser } from "@/lib/contractUtils";

export default function MintCharacter() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  
  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';

  const [isMinting, setIsMinting] = useState(false);
  const [characterLengthBeforeMint, setCharacterLengthBeforeMint] = useState<
    number | null
  >();
  const [characterLengthAfterMint, setCharacterLengthAfterMint] = useState<
    number | null
  >();
  const [newCharacter, setNewCharacter] = useState<Character | null>(null);
  const [characterAbility, setCharacterAbility] = useState<Character | null>(
    null
  );
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [newCharacterModelAddress, setNewCharacterModelAddress] = useState<
    string | null
  >(null);
  const [chakraBalance, setChakraBalance] = useState<number | null>(null);
  const [characterAbilities, setCharacterAbilities] = useState<Character[]>([]);
  const [mintSuccessful, setMintSuccessful] = useState(false);
  const router = useRouter();

  function getCharacterId(attributes: Record<string, string>) {
    const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, "_");
    return `${normalize(attributes.Village)}-${normalize(attributes.Chakra)}`;
  }

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const characters = await getCharactersOwnedByUser(walletAddress as `0x${string}`);
        setCharacterLengthBeforeMint(characters.length);
      } catch (error) {
        console.error("Error fetching characters:", error);
        setCharacterLengthBeforeMint(0);
      }
    };

    if (ready && authenticated && walletAddress) {
      fetchCharacters();
      fetchResourcesBalance();
      fetchUserCharacters();
    } else {
      setCharacterLengthBeforeMint(null);
      setCharacterLengthAfterMint(null);
      setNewCharacter(null);
      setCharacterAbility(null);
      setCharacterId(null);
      setNewCharacterModelAddress(null);
      setChakraBalance(null);
      setCharacterAbilities([]);
      setMintSuccessful(false);
    }
  }, [ready, authenticated, walletAddress]);

  useEffect(() => {
    if (characterId) {
      try {
        const matched = CHARACTERS.find((char) => char.id === characterId);
        if (matched) {
          setCharacterAbility(matched);
        }
      } catch (error) {
        toast.error(`Error matching character ability ${error}`);
      }
    }
  }, [characterId]);




  const fetchUserCharacters = async () => {
    if (!walletAddress) return;
    try {
      // Fetch owned characters directly from contract
      const ownedCharacters = await getCharactersOwnedByUser(walletAddress as `0x${string}`);
      setCharacterAbilities(ownedCharacters);
    } catch (error) {
      console.error("Error fetching characters:", error);
      toast.error(`Error fetching characters: ${error instanceof Error ? error.message : "Unknown error"}`);
      setCharacterAbilities([]);
    }
  };

  const mintCharacter = async () => {
    if (!walletAddress) {
      toast.error("Wallet not connected!");
      return;
    }

    if (!wallets[0]) {
      toast.error("No wallet available!");
      return;
    }

    setIsMinting(true);

    try {
      // Randomly select a character ID from 1-20 
      const randomContractId = Math.floor(Math.random() * 20) + 1; // 1-20
      
      // Get the character ID string from contract ID
      const characterIdString = getCharacterIdFromContractId(randomContractId);
      
      if (!characterIdString) {
        toast.error("Invalid character ID");
        setIsMinting(false);
        return;
      }

      // Find the character object
      const selectedCharacter = CHARACTERS.find((char) => char.id === characterIdString);
      
      if (!selectedCharacter) {
        toast.error("Character not found");
        setIsMinting(false);
        return;
      }

      // Store the selected character info for later display
      setCharacterId(characterIdString);
      setCharacterAbility(selectedCharacter);

      // Encode the function data
      const data = encodeFunctionData({
        abi: STAKEWARS_ABI,
        functionName: "mintCharacter",
        args: [walletAddress as `0x${string}`, BigInt(randomContractId)],
      });

      // Send transaction using Privy
      const { hash } = await sendTransaction(
        {
          to: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
          data: data,
        },
        {
          address: wallets[0].address, // Specify the wallet to use
        }
      );

      toast.success(`Transaction sent! Hash: ${hash}`);
      
      // Wait a bit for transaction to be confirmed, then refresh
      setTimeout(async () => {
        await fetchUserCharacters();
        const characters = await getCharactersOwnedByUser(walletAddress as `0x${string}`);
        setCharacterLengthAfterMint(characters.length);
        if (characters.length > 0) {
          const lastCharacter = characters[characters.length - 1];
          setNewCharacter(lastCharacter);
        }
        toast.success("Character minted successfully!");
        setMintSuccessful(true);
        setIsMinting(false);
      }, 3000); // Wait 3 seconds for confirmation

    } catch (error: any) {
      console.error("Error initiating mint:", error);
      toast.error(`Something went wrong during minting: ${error?.message || error}`);
      setIsMinting(false);
    }
  };

  const fetchResourcesBalance = async () => {
    if (!walletAddress) {
      toast.error("Please connect wallet to view resources balance.");
      return;
    }

    try {
      const response = await fetch(`/api/get-balance?walletAddress=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        setChakraBalance(data.balance || 0);
      } else {
        setChakraBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setChakraBalance(0);
    }
  };




  return (
    <div>
      <div className="flex flex-col items-center mt-5">
        <img
          src="/stake-wars-logo.png"
          alt="stake wars logo"
          className="size-[206px] hidden sm:block"
        />
        <h1 className="font-bold text-2xl -mt-4 mb-1">Mint your Character</h1>
        
        {/* Chakra Balance Display - Only show if user has CHAKRA */}
        {authenticated && chakraBalance !== null && chakraBalance > 0 && (
          <div className="flex items-center gap-2 mt-4 bg-[#313030] px-4 py-2 rounded-lg border border-[#E3DEDE]">
            <img src="/chakra_coin.svg" alt="chakra" width={20} height={20} />
            <span className="text-white font-bold">Balance: {chakraBalance} CHK</span>
          </div>
        )}
      </div>

      {(mintSuccessful || ((characterLengthAfterMint ?? 0) > (characterLengthBeforeMint ?? 0))) &&
      (newCharacter || characterAbility) ? (
        <div className="flex flex-col gap-5 justify-center items-center mt-[65px] pb-10">
          <div className="bg-[#313030] px-8 flex items-center rounded-xl border-[#E3DEDE] border-[0.75px] w-[540px] h-[250px]">
            <div className="w-[135px] h-50 bg-[#1a1a1a] border-4 border-black rounded-md flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {characterAbility && (
                  <motion.div
                    key={characterAbility.id}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full h-full"
                  >
                    <img
                      src={`/custom-assets/characters/${characterAbility.id}.png`}
                      alt={characterAbility.id}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-full ml-5">
              <h1 className="font-extrabold text-[21px] text-white mb-6.5 mt-7.5">
                {characterAbility?.nickname}
              </h1>
              <p className="text-xs mb-3">
                <span className="font-extrabold">Village : </span>{" "}
                {characterAbility?.village}
              </p>
              <p className="text-xs">
                <span className="font-extrabold">Specialty : </span>{" "}
                {characterAbility?.specialty}
              </p>
            </div>
          </div>
          <Button
            className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-20"
            onClick={() => router.push("/lobby")}
          >
            Go to lobby
          </Button>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center mt-[65px]">
          {/* Existing Characters Section - Show if user already has a character */}
          {authenticated && characterAbilities.length > 0 ? (
            <div className="mb-8 w-full max-w-6xl px-4">
              {/* Warning Message */}
              <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-xl p-6 mb-6 text-center">
                <h2 className="text-2xl font-bold text-yellow-400 mb-3">
                  ⚠️ {characterAbilities.length === 1 ? 'Character Already Minted' : 'Characters Already Owned'}
                </h2>
                <p className="text-gray-300 text-lg mb-2">
                  {characterAbilities.length === 1 
                    ? 'You already have a character! Free minting is only available for new players.'
                    : `You own ${characterAbilities.length} characters! To get more characters, visit the Marketplace.`
                  }
                </p>
                <p className="text-gray-400 text-sm">
                  New players get one free character. Additional characters can be purchased in the Marketplace.
                </p>
              </div>

              {/* Display All Characters */}
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Your Character{characterAbilities.length > 1 ? 's' : ''}
              </h2>
              
              {/* Character Grid */}
              <div className={`grid gap-6 ${
                characterAbilities.length === 1 
                  ? 'grid-cols-1 max-w-md mx-auto' 
                  : characterAbilities.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {characterAbilities.map((character, index) => (
                  <div 
                    key={character.id} 
                    className="bg-[#313030] p-6 rounded-xl border-2 border-purple-500/50 hover:border-purple-400/70 transition-all hover:shadow-lg hover:shadow-purple-500/20"
                  >
                    {/* Character Header with Number Badge */}
                    {characterAbilities.length > 1 && (
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-purple-400 text-xs font-bold">CHARACTER #{index + 1}</span>
                        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          {character.village.split(' ')[1]}
                        </span>
                      </div>
                    )}
                    
                    {/* Character Image and Info */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-24 h-24 bg-[#1a1a1a] border-4 border-black rounded-md flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={`/custom-assets/characters/${character.id}.png`}
                          alt={character.nickname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-xl truncate">{character.nickname}</h3>
                        <p className="text-sm text-purple-400 truncate">{character.village}</p>
                        <p className="text-sm text-gray-300 truncate">{character.specialty}</p>
                      </div>
                    </div>
                    
                    {/* Character Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm text-gray-300 bg-gray-900/50 p-4 rounded-lg">
                      <p><span className="font-bold text-white">Health:</span> {character.baseHealth}</p>
                      <p><span className="font-bold text-white">Abilities:</span> {character.abilities.length}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-8">
                <Button 
                  onClick={() => router.push('/lobby')} 
                  className="connect-button-bg cursor-pointer w-[200px] h-12 text-lg"
                >
                  Go to Lobby
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* New Players - Show Mint Interface */}
              <div className="mb-4">
                <div className="bg-green-900/30 border-2 border-green-500/50 rounded-xl p-4 text-center max-w-md">
                  <p className="text-green-400 font-semibold text-sm">
                    ✨ Welcome! You can mint your first character below.
                  </p>
                </div>
              </div>

              <div className="bg-[#313030] px-8 flex items-center justify-between rounded-xl border-[#E3DEDE] border-[0.75px] w-[540px] h-[250px]">
                <ImageSlider />
                <CircleCarousel />
              </div>
              <Button
                className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-20"
                disabled={isMinting}
                onClick={() => mintCharacter()}
              >
                {isMinting ? "Minting..." : "Mint Character"}
              </Button>
              <Button 
                onClick={() => router.push('/lobby')} 
                className="connect-button-bg cursor-pointer w-[175px] h-10.5 mt-3 mb-10"
              >
                Lobby
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
