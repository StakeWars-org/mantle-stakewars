"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { buffs } from '@/lib/buffs';
import useOnlineGameStore from '@/store/useOnlineGame';
import { usePathname } from 'next/navigation';
import { CHARACTERS } from '@/lib/characters';
import { ShoppingCart } from 'lucide-react';
import { 
  getChakraBalance, 
  getContractCharacterIdFromString,
  getVillageFromCharacterId,
  getBuffInfo,
  getBuffStatus,
  checkChakraApproval
} from '@/lib/contractUtils';
import { useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import { STAKEWARS_ABI } from '@/lib/abi';
import { STAKEWARS_CONTRACT_ADDRESS } from '@/lib/contractaddr';

// Map buff names to their corresponding image files
const getPowerUpImage = (powerUpName: string, index: number): string => {
  const imageMap: Record<string, string> = {
    // Power Level 1 - Effect 5
    "Kunai Precision": "kunai-precision.png",
    "Sand Shield": "sand-shield.png",
    "Water Shuriken": "water-shuriken.png",
    "Static Kunai": "static-kunai.png",
    // Power Level 2 - Effect 10
    "Basic Chakra Control": "basic-chakra-control.png",
    "Desert Step": "desert-step.png",
    "Mist Veil": "mist-veil.png",
    "Lightning Step": "lightning-step.png",
    // Power Level 3 - Effect 15
    "Leaf Whirlwind": "leaf-wirlwind.png",
    "Sand Blade Technique": "sandblade.png",
    "Aqua Blade Formation": "aqua-blade-formation.png",
    "Electric Palm Strike": "electric-palm-strike.png",
    // Power Level 4 - Effect 20
    "Shadow Clone Tactics": "shadow-clone-tactics.png",
    "Granule Barrage": "granule-barrage.png",
    "Water Wall Defense": "wall-defence.png",
    "Thunder Charge": "tunderchall.png",
    // Power Level 5 - Effect 25
    "Advanced Chakra Infusion": "chakra-infusion-adv.png",
    "Hardened Sand Armor": "hardened-sandamour.png",
    "Hydro Step Mastery": "hydro-step-mastry.png",
    "Storm Edge Technique": "storm-edge.png",
  };

  // Use mapped image if available
  if (imageMap[powerUpName]) {
    return `/custom-assets/power ups/${imageMap[powerUpName]}`;
  }
  
  // Fallback to default (shouldn't happen with complete mapping)
  return `/custom-assets/power ups/1000243810.png`;
};

// Map effect level to buffId (effect 5=1, 10=2, 15=3, 20=4, 25=5)
const EFFECT_TO_BUFF_ID: Record<number, number> = {
  5: 1,
  10: 2,
  15: 3,
  20: 4,
  25: 5,
};

export default function Marketplace() {
  const [chakraBalance, setChakraBalance] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [ownedCharacterIds, setOwnedCharacterIds] = useState<string[]>([]);
  const [purchasingCharacterId, setPurchasingCharacterId] = useState<string | null>(null);
  const [purchasingBuffId, setPurchasingBuffId] = useState<number | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<'approving' | 'purchasing' | null>(null);
  const [villageBuffs, setVillageBuffs] = useState<Array<{
    buffId: number;
    effect: number;
    price: number;
    remainingTurns: number;
    name: string;
    village: number;
  }>>([]);
  const [buffRemainingUses, setBuffRemainingUses] = useState<Record<string, number>>({});
  
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const { addBuffToPlayer, gameState, roomId } = useOnlineGameStore();
  const pathname = usePathname();

    // Get wallet address from Privy wallets
    const walletAddress = wallets[0]?.address || '';

    // Determine current player - check both in-progress games and games with characters set
    const currentPlayer = (() => {
      // First try to find player by wallet address in either player1 or player2
      const isPlayer1 = gameState?.player1?.id === walletAddress;
      const isPlayer2 = gameState?.player2?.id === walletAddress;

      if (isPlayer1) return 'player1';
      if (isPlayer2) return 'player2';
      return null;
    })();

    // Get current player's character
    const currentPlayerCharacter = currentPlayer 
      ? gameState?.[currentPlayer]?.character 
      : null;

    // Get contract character ID and village
    const contractCharacterId = currentPlayerCharacter
      ? getContractCharacterIdFromString(currentPlayerCharacter.id)
      : null;
    
    // Get contract character ID and village number (for contract calls)
    const playerVillage = contractCharacterId 
      ? getVillageFromCharacterId(contractCharacterId)
      : null;
    
    // Get village string directly from character object and normalize to match buffs format
    // Character.village is "Hidden Leaf", "Hidden Sand", etc.
    // Buffs use "hidden_leaf", "hidden_sand", etc.
    const playerVillageString = currentPlayerCharacter?.village
      ? currentPlayerCharacter.village.toLowerCase().replace(/\s+/g, '_')
      : null;

    const fetchResourcesBalance = async () => {
      if (!walletAddress) {
        setChakraBalance(null);
        return;
      }

      try {
        const balance = await getChakraBalance(walletAddress as `0x${string}`);
        setChakraBalance(balance);
      } catch (error) {
        console.error("Error fetching CHAKRA balance:", error);
        setChakraBalance(0);
      }
    }

    const fetchOwnedCharacters = async () => {
      if (!walletAddress) return;

      try {
        const response = await fetch(`/api/get-owned-characters?walletAddress=${walletAddress}`);
        if (response.ok) {
          const data = await response.json();
          setOwnedCharacterIds(data.characterIds || []);
        } else {
          console.error("Failed to fetch owned characters");
          setOwnedCharacterIds([]);
        }
      } catch (error) {
        console.error("Error fetching owned characters:", error);
        setOwnedCharacterIds([]);
      }
    }

    // Fetch village buffs from contract
    const fetchVillageBuffs = async () => {
      if (!playerVillage) return;

      try {
        // Fetch all 5 buffs for the village (buffId 1-5)
        const buffPromises = [];
        for (let buffId = 1; buffId <= 5; buffId++) {
          buffPromises.push(
            getBuffInfo(playerVillage, buffId).then(buff => ({
              buffId,
              ...buff,
              village: playerVillage,
            }))
          );
        }
        const buffs = await Promise.all(buffPromises);
        setVillageBuffs(buffs);
      } catch (error) {
        console.error("Error fetching village buffs:", error);
        setVillageBuffs([]);
      }
    };

    // Fetch remaining uses for all buffs
    const fetchBuffRemainingUses = async () => {
      if (!walletAddress || !contractCharacterId) return;

      try {
        const usesPromises = [];
        for (let buffId = 1; buffId <= 5; buffId++) {
          usesPromises.push(
            getBuffStatus(walletAddress as `0x${string}`, contractCharacterId, buffId).then(
              uses => ({ buffId, uses })
            )
          );
        }
        const results = await Promise.all(usesPromises);
        const usesMap: Record<string, number> = {};
        results.forEach(({ buffId, uses }) => {
          usesMap[`${contractCharacterId}-${buffId}`] = uses;
        });
        setBuffRemainingUses(usesMap);
      } catch (error) {
        console.error("Error fetching buff remaining uses:", error);
      }
    };

    const purchasePowerUp = async (buffId: number, village: number) => {
        if (!walletAddress || !contractCharacterId || !wallets[0]) {
          toast.error("Wallet not connected!");
          return;
        }

        setPurchasingBuffId(buffId);
        setPurchaseStep(null);

        try {
          // Check if contract is approved to spend CHAKRA tokens
          const isApproved = await checkChakraApproval(walletAddress as `0x${string}`);
          
          if (!isApproved) {
            // Step 1: Approve the contract to spend CHAKRA tokens
            setPurchaseStep('approving');
            toast.info("Step 1/2: Please approve the contract to spend CHAKRA tokens...");
            
            const approveData = encodeFunctionData({
              abi: STAKEWARS_ABI,
              functionName: "setApprovalForAll",
              args: [STAKEWARS_CONTRACT_ADDRESS as `0x${string}`, true],
            });

            const approveResult = await sendTransaction(
              {
                to: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
                data: approveData,
              },
              {
                address: wallets[0].address,
              }
            );

            toast.success(`Step 1/2 Complete: Approval transaction sent! Hash: ${approveResult.hash}`);
            
            // Wait a moment for the approval transaction to be processed
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Step 2: Purchase the buff
          setPurchaseStep('purchasing');
          toast.info("Step 2/2: Please confirm the purchase transaction...");
          
          const purchaseData = encodeFunctionData({
            abi: STAKEWARS_ABI,
            functionName: "purchaseBuff",
            args: [BigInt(contractCharacterId), BigInt(buffId)],
          });

          // Send purchase transaction using Privy
          const { hash } = await sendTransaction(
            {
              to: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
              data: purchaseData,
            },
            {
              address: wallets[0].address,
            }
          );

          toast.success(`Step 2/2 Complete: Purchase transaction sent! Hash: ${hash}`);
          
          // Wait for confirmation, then refresh
          setTimeout(async () => {
            await fetchBuffRemainingUses();
            await fetchResourcesBalance();
            await fetchVillageBuffs(); // Refresh village buffs to get latest data
            
            // Get buff info from contract or use fallback from local powerup data
            const buffInfo = villageBuffs.find(b => b.buffId === buffId);
            const powerupData = buffs.find(p => {
              return EFFECT_TO_BUFF_ID[p.effect] === buffId && p.village === playerVillageString;
            });
            
            // Powerups are now stored on-chain and will be automatically loaded
            // when the character is selected in a game.
            const finalBuffInfo = buffInfo || powerupData;
            
            // If user is in a current game, add the powerup to their active buffs immediately
            // Re-check game state at this point to ensure we have the latest values
            const currentGameState = useOnlineGameStore.getState().gameState;
            const currentRoomId = useOnlineGameStore.getState().roomId;
            const currentPathname = pathname;
            const isCurrentlyInGame = currentPathname === `/game-play/${currentRoomId}`;
            
            const currentPlayerInGame = (() => {
              const isPlayer1 = currentGameState?.player1?.id === walletAddress;
              const isPlayer2 = currentGameState?.player2?.id === walletAddress;
              if (isPlayer1) return 'player1';
              if (isPlayer2) return 'player2';
              return null;
            })();
            
            if (isCurrentlyInGame && currentPlayerInGame && currentRoomId && finalBuffInfo) {
              try {
                await addBuffToPlayer(
                  currentPlayerInGame,
                  finalBuffInfo.name,
                  finalBuffInfo.effect,
                  finalBuffInfo.remainingTurns
                );
              } catch (error) {
                console.error("Error adding buff to current game:", error);
                // Continue even if adding to current game fails - it's still stored on-chain
              }
            }
            
            toast.success(`Successfully purchased ${finalBuffInfo?.name || 'buff'}! Powerup is now available for all games with this character.`);
            
            // Reset purchase state and close dialog after successful purchase
            setPurchasingBuffId(null);
            setPurchaseStep(null);
            setIsOpen(false);
          }, 3000);
        } catch (error: any) {
          console.error("Error purchasing buff:", error);
          toast.error(`Failed to purchase buff: ${error?.message || error}`);
          setPurchasingBuffId(null);
          setPurchaseStep(null);
        }
    }

    const purchaseCharacter = async (characterId: string, characterName: string) => {
      if (!walletAddress) {
        toast.error("Wallet not connected!");
        return;
      }

      // Check if character is already owned
      if (ownedCharacterIds.includes(characterId)) {
        toast.error("You already own this character!");
        return;
      }

      setPurchasingCharacterId(characterId);

      try {
        toast.info("💸 Processing purchase...");
        
        // Purchase character through API (handles payment and minting on backend)
        const purchaseResponse = await fetch("/api/purchase-character", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: walletAddress,
            characterId: characterId,
            characterName: characterName,
          }),
        });

        if (!purchaseResponse.ok) {
          const errorData = await purchaseResponse.json();
          toast.error(errorData.error || "Purchase failed");
          return;
        }

        const purchaseData = await purchaseResponse.json();
        
        if (purchaseData.success) {
          toast.success(`🎉 ${characterName} is now yours!`);
          await fetchResourcesBalance(); // Refresh balance
          await fetchOwnedCharacters(); // Refresh owned characters
          setIsOpen(false);
        } else {
          toast.error(purchaseData.error || "Purchase failed");
        }

      } catch (error) {
        console.error("Purchase error:", error);
        toast.error(`Purchase failed: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setPurchasingCharacterId(null);
      }
    }


  const isInGameplay = pathname === `/game-play/${roomId}`;
  const CHARACTER_PRICE = 1000;

  // Debug logging for character detection
  console.log('[Marketplace Debug] Character Detection:', {
    gameStatus: gameState?.gameStatus,
    isInGameplay,
    walletAddress,
    currentPlayer,
    player1Id: gameState?.player1?.id,
    player2Id: gameState?.player2?.id,
    currentPlayerCharacter: currentPlayerCharacter ? {
      id: currentPlayerCharacter.id,
      nickname: currentPlayerCharacter.nickname,
      village: currentPlayerCharacter.village
    } : null,
    gameStateKeys: gameState ? Object.keys(gameState) : 'no gameState',
    roomId,
    pathname
  });

  return (
    <div className={`fixed ${isInGameplay ? 'bottom-[137px] left-5' : 'bottom-8 left-8'}`}>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          // Prevent closing dialog during purchase process
          if (!open && (purchasingBuffId !== null || purchaseStep !== null)) {
            return;
          }
          setIsOpen(open);
          if (open && walletAddress) {
            fetchResourcesBalance();
            fetchOwnedCharacters();
            if (isInGameplay && playerVillage) {
              fetchVillageBuffs();
              fetchBuffRemainingUses();
            }
          }
          // Reset purchase state when closing
          if (!open) {
            setPurchasingBuffId(null);
            setPurchaseStep(null);
          }
        }}
      >
        <DialogTrigger className="connect-button-bg size-[84px] px-5 rounded-full items-center justify-center cursor-pointer border-2 border-[#FFFFFF] hover:scale-110 transition-transform">
          {isInGameplay ? (
            <img src="/market.svg" alt="market" width={37} height={37} />
          ) : (
            <ShoppingCart className="w-9 h-9 text-white" />
          )}
        </DialogTrigger>
        <DialogContent className="bg-[#242424] min-w-[calc(100%-2rem)] overflow-auto h-full max-h-[90vh]">
          <DialogTitle className="text-lg text-[#9D9C9E]">
            {isInGameplay 
              ? "Acquire extra gear and power ups to better your battle chances"
              : "Purchase new characters to expand your collection"}
          </DialogTitle>

          <Tabs defaultValue={isInGameplay ? "power-ups" : "characters"} className="">
            <TabsList className="flex items-center justify-between w-full">
              <div className="flex gap-4">
                {/* Power-ups tab - Only show in gameplay */}
                {isInGameplay && (
                  <TabsTrigger
                    className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] pb-2.5"
                    value="power-ups"
                  >
                    Power-ups
                  </TabsTrigger>
                )}
                
                {/* Characters tab - Only show outside gameplay */}
                {!isInGameplay && (
                  <TabsTrigger
                    className="cursor-pointer data-[state=active]:!bg-transparent rounded-none data-[state=active]:border-b-4 data-[state=active]:border-b-[#BFE528] pb-2.5"
                    value="characters"
                  >
                    Purchase Characters
                  </TabsTrigger>
                )}
              </div>
              <div className="flex items-center gap-2">
                <img src="/chakra_coin.svg" alt="chakra" className="w-5 h-5" />
                <span className="text-sm md:text-base text-white font-semibold">
                  {chakraBalance !== null ? `${chakraBalance.toFixed(2)} CHK` : 'Loading...'}
                </span>
              </div>
            </TabsList>

            {/* Power-ups Tab Content */}
            {isInGameplay && (
              <TabsContent
                className="flex pt-10 gap-4 flex-wrap overflow-y-auto max-h-[60vh] justify-center"
                value="power-ups"
              >
                {/* Show all buffs, but only enable village-appropriate ones */}
                {buffs.map((powerup, index) => {
                  // Check if buff belongs to player's village
                  const isVillageBuff = playerVillageString === powerup.village;
                  
                  // Map effect level to buffId
                  const buffId = isVillageBuff ? (EFFECT_TO_BUFF_ID[powerup.effect] || 0) : 0;
                  
                  // Find matching contract buff by buffId (more reliable than name matching)
                  const contractBuff = isVillageBuff && buffId > 0
                    ? villageBuffs.find(b => b.buffId === buffId)
                    : undefined;
                  
                  // Always use contract price if available, otherwise use fallback for display only
                  // But for purchase check, we MUST have contract price
                  const contractPrice = contractBuff?.price ?? powerup.price;
                  const contractEffect = contractBuff?.effect ?? powerup.effect;
                  const contractRemainingTurns = contractBuff?.remainingTurns ?? powerup.remainingTurns;
                  
                  const remainingUses = contractCharacterId && buffId > 0 && isVillageBuff
                    ? buffRemainingUses[`${contractCharacterId}-${buffId}`] || 0
                    : 0;
                  
                  const isPurchasing = purchasingBuffId === buffId;
                  const isApproving = isPurchasing && purchaseStep === 'approving';
                  const isPurchasingStep = isPurchasing && purchaseStep === 'purchasing';
                  
                  // Check balance using the same method as navbar (getChakraBalance)
                  // Only allow purchase if we have contract price data and enough balance
                  const currentBalance = (chakraBalance as number) ?? 0;
                  const hasEnoughBalance = currentBalance >= contractPrice;
                  const hasContractPrice = contractBuff !== undefined && contractBuff.price !== undefined;
                  
                  // Break down all conditions for debugging
                  const conditions = {
                    isVillageBuff,
                    hasValidBuffId: buffId > 0,
                    hasContractPrice,
                    hasEnoughBalance,
                    isNotPurchasing: !isPurchasing,
                    hasContractCharacterId: contractCharacterId !== null,
                    hasPlayerVillage: playerVillage !== null,
                  };
                  
                  // Allow purchase if it's a village buff, we have contract data, and sufficient balance
                  const canPurchase = conditions.isVillageBuff && 
                    conditions.hasValidBuffId &&
                    conditions.hasContractPrice &&
                    conditions.hasEnoughBalance &&
                    conditions.isNotPurchasing &&
                    conditions.hasContractCharacterId &&
                    conditions.hasPlayerVillage;
                    
                  // Comprehensive debug logging for all powerups
                  console.log(`[Powerup Debug] ${powerup.name} (${powerup.village}):`, {
                    // Village check
                    playerVillageString,
                    powerupVillage: powerup.village,
                    isVillageBuff,
                    
                    // Buff ID
                    buffId,
                    effect: powerup.effect,
                    
                    // Contract data
                    contractBuffFound: contractBuff !== undefined,
                    contractPriceFromBuff: contractBuff?.price,
                    fallbackPrice: powerup.price,
                    displayPrice: contractPrice,
                    hasContractPrice,
                    
                    // Balance
                    currentBalance,
                    requiredPrice: contractPrice,
                    hasEnoughBalance,
                    balanceDifference: currentBalance - contractPrice,
                    
                    // Character/Player data
                    contractCharacterId,
                    playerVillage,
                    hasContractCharacterId: conditions.hasContractCharacterId,
                    hasPlayerVillage: conditions.hasPlayerVillage,
                    
                    // Purchase state
                    isPurchasing,
                    
                    // All conditions
                    conditions,
                    
                    // Final result
                    canPurchase,
                    reason: !canPurchase ? (
                      !conditions.isVillageBuff ? 'NOT IN PLAYER VILLAGE' :
                      !conditions.hasValidBuffId ? 'INVALID BUFF ID' :
                      !conditions.hasContractPrice ? 'NO CONTRACT PRICE DATA' :
                      !conditions.hasEnoughBalance ? `INSUFFICIENT BALANCE (need ${contractPrice.toFixed(2)}, have ${currentBalance.toFixed(2)})` :
                      !conditions.isNotPurchasing ? 'ALREADY PURCHASING' :
                      !conditions.hasContractCharacterId ? 'NO CONTRACT CHARACTER ID' :
                      !conditions.hasPlayerVillage ? 'NO PLAYER VILLAGE' :
                      'UNKNOWN REASON'
                    ) : 'CAN PURCHASE'
                  });

                  return (
                    <div
                      key={index}
                      className={`rounded-[10px] flex flex-col items-center justify-between p-5 bg-[#00000040] max-w-52 border-2 transition-all ${
                        isVillageBuff 
                          ? 'border-green-500/50' 
                          : 'border-gray-600/30 opacity-50'
                      }`}
                    >
                      <div>
                        <div className="bg-[#040404] rounded-[10px] flex justify-center items-center w-full h-[100px]">
                          <img
                            width={100}
                            height={100}
                            src={getPowerUpImage(powerup.name, index)}
                            alt={powerup.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <h2 className="font-bold text-sm text-white mb-2 mt-4">
                          {powerup.name}
                          {!isVillageBuff && (
                            <span className="text-xs text-gray-400 block mt-1">
                              (Not available for your village)
                            </span>
                          )}
                        </h2>
                        <p className="text-sm text-white mb-2">
                          Increases attack power by {contractEffect} for your next{" "}
                          {contractRemainingTurns} attack plays
                        </p>
                        {isVillageBuff && remainingUses > 0 && (
                          <p className="text-xs text-green-400 mb-2">
                            Remaining uses: {remainingUses}
                          </p>
                        )}
                      </div>

                      <Button
                        disabled={!canPurchase || isPurchasing}
                        onClick={() => isVillageBuff && buffId > 0 && playerVillage && purchasePowerUp(buffId, playerVillage)}
                        className="flex cursor-pointer w-full bg-[#2F2B24] hover:bg-[#3F3F2F] items-center border-[0.6px] rounded-lg border-[#FFFFFF] gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isApproving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Step 1/2: Approving...</span>
                          </>
                        ) : isPurchasingStep ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Step 2/2: Purchasing...</span>
                          </>
                        ) : isPurchasing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Processing...</span>
                          </>
                        ) : (
                          <>
                            <img
                              src="/chakra_coin.svg"
                              alt="chakra"
                              width={20}
                              height={20}
                            />
                            <span className="text-sm">
                              {contractPrice.toFixed(2)} CHK
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </TabsContent>
            )}

            {/* Characters Tab Content */}
            {!isInGameplay && (
              <TabsContent
                className="flex pt-10 gap-4 flex-wrap overflow-y-auto max-h-[60vh] justify-center"
                value="characters"
              >
                {CHARACTERS.map((character, index) => {
                  const isOwned = ownedCharacterIds.includes(character.id);
                  const isPurchasing = purchasingCharacterId === character.id;
                  const hasEnoughChakra = ((chakraBalance as number) ?? 0) >= CHARACTER_PRICE;
                  const canPurchase = !isOwned && purchasingCharacterId === null && hasEnoughChakra;
                  
                  return (
                    <div
                      key={index}
                      className={`rounded-[10px] flex flex-col items-center justify-between p-5 bg-[#00000040] max-w-60 border-2 transition-all relative ${
                        isOwned 
                          ? 'border-green-500/50 opacity-50' 
                          : !hasEnoughChakra
                            ? 'border-red-500/30 opacity-60'
                            : 'border-purple-500/30 hover:border-purple-500'
                      }`}
                    >
                      {/* Owned Badge */}
                      {isOwned && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                          OWNED
                        </div>
                      )}

                      {/* Insufficient Funds Badge */}
                      {!isOwned && !hasEnoughChakra && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                          INSUFFICIENT CHAKRA
                        </div>
                      )}

                      <div className={isOwned ? 'blur-sm' : ''}>
                        <div className="bg-[#040404] rounded-[10px] flex justify-center p-3 mb-3">
                          <img
                            src={`/custom-assets/characters/${character.id}.png`}
                            alt={character.nickname}
                            width={120}
                            height={120}
                            className="object-cover w-full"
                          />
                        </div>

                        <h2 className="font-bold text-base text-white mb-2">
                          {character.nickname}
                        </h2>
                        <div className="text-xs text-gray-300 mb-3 space-y-1">
                          <p><span className="font-bold text-purple-400">Village:</span> {character.village}</p>
                          <p><span className="font-bold text-purple-400">Specialty:</span> {character.specialty}</p>
                          <p><span className="font-bold text-purple-400">Health:</span> {character.baseHealth}</p>
                          <p><span className="font-bold text-purple-400">Abilities:</span> {character.abilities.length}</p>
                        </div>
                      </div>

                      <div className="w-full space-y-2">
                        <Button
                          disabled={!canPurchase}
                          onClick={() => purchaseCharacter(character.id, character.nickname)}
                          className="flex cursor-pointer w-full bg-purple-600 hover:bg-purple-700 items-center border-[0.6px] rounded-lg border-[#FFFFFF] gap-2 justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {isPurchasing ? (
                            <span className="text-sm flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </span>
                          ) : isOwned ? (
                            <span className="text-sm">Already Owned</span>
                          ) : (
                            <>
                              <img
                                src="/chakra_coin.svg"
                                alt="chakra"
                                width={20}
                                height={20}
                              />
                              {CHARACTER_PRICE} CHK
                            </>
                          )}
                        </Button>

                        {/* Insufficient Balance Warning */}
                        {!isOwned && !hasEnoughChakra && chakraBalance !== null && (
                          <div className="text-xs text-red-400 text-center">
                            Need {CHARACTER_PRICE - ((chakraBalance as number) || 0)} more CHK
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
