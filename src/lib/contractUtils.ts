import { createPublicClient, http, defineChain } from "viem";
import { mantleTestnet as viemMantleTestnet } from "viem/chains";
import { STAKEWARS_ABI } from "./abi";
import { STAKEWARS_CONTRACT_ADDRESS } from "./contractaddr";
import { getCharacterIdFromContractId } from "./characterMapping";
import { Character, CHARACTERS } from "./characters";

// Use environment variable for Mantle Testnet RPC, with fallback to public RPC
const MANTLE_TESTNET_RPC = process.env.NEXT_PUBLIC_MANTLE_TESTNET_RPC || "https://mantle-testnet.publicnode.com";

// Create Mantle Testnet chain with custom RPC
// The sequencer expects chain ID 5003
const mantleTestnet = defineChain({
  id: 5003, // Chain ID expected by Mantle Testnet sequencer
  name: "Mantle Testnet",
  nativeCurrency: viemMantleTestnet.nativeCurrency,
  rpcUrls: {
    default: {
      http: [MANTLE_TESTNET_RPC],
    },
    public: {
      http: [MANTLE_TESTNET_RPC],
    },
  },
  blockExplorers: viemMantleTestnet.blockExplorers,
  testnet: true,
});

// Create public client for reading from contract
const publicClient = createPublicClient({
  chain: mantleTestnet,
  transport: http(MANTLE_TESTNET_RPC),
});

/**
 * Get characters owned by a user from the contract
 * @param userAddress - The wallet address of the user
 * @returns Array of Character objects owned by the user
 */
export async function getCharactersOwnedByUser(userAddress: `0x${string}`): Promise<Character[]> {
  try {
    // Call the contract function
    const characterIds = await publicClient.readContract({
      address: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
      abi: STAKEWARS_ABI,
      functionName: "getCharactersOwnedByUser",
      args: [userAddress],
    }) as bigint[];

    // Convert bigint array to number array and map to character ID strings
    const characterIdStrings = characterIds
      .map((id) => {
        const contractId = Number(id);
        return getCharacterIdFromContractId(contractId);
      })
      .filter((id): id is string => id !== null);

    // Match with CHARACTERS data
    const ownedCharacters = characterIdStrings
      .map((characterIdString) => {
        return CHARACTERS.find((char) => char.id === characterIdString);
      })
      .filter((char): char is Character => char !== undefined);

    return ownedCharacters;
  } catch (error) {
    console.error("Error fetching characters from contract:", error);
    throw error;
  }
}

/**
 * Get CHAKRA token ID constant from contract (should be 21)
 */
export async function getChakraTokenId(): Promise<number> {
  try {
    const chakraId = await publicClient.readContract({
      address: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
      abi: STAKEWARS_ABI,
      functionName: "CHAKRA",
    }) as bigint;
    
    return Number(chakraId);
  } catch (error) {
    console.error("Error fetching CHAKRA token ID:", error);
    // Return 21 as fallback since that's the constant value
    return 21;
  }
}

/**
 * Get CHAKRA balance for a user
 * @param userAddress - The wallet address of the user
 * @returns CHAKRA balance as a number (formatted with 18 decimals)
 */
export async function getChakraBalance(userAddress: `0x${string}`): Promise<number> {
  try {
    // Get CHAKRA token ID (should be 21)
    const chakraTokenId = await getChakraTokenId();
    
    // Get balance using balanceOf
    const balance = await publicClient.readContract({
      address: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
      abi: STAKEWARS_ABI,
      functionName: "balanceOf",
      args: [userAddress, BigInt(chakraTokenId)],
    }) as bigint;
    
    // Convert from wei to token units (18 decimals)
    const decimals = 18;
    const divisor = BigInt(10 ** decimals);
    const formattedBalance = Number(balance) / Number(divisor);
    
    return formattedBalance;
  } catch (error) {
    console.error("Error fetching CHAKRA balance:", error);
    throw error;
  }
}

/**
 * Get village ID from character ID (off-chain mapping)
 * Based on contract constants:
 * HIDDEN_LEAF = 1 (characters 1-5)
 * HIDDEN_SAND = 2 (characters 6-10)
 * HIDDEN_MIST = 3 (characters 11-15)
 * HIDDEN_CLOUD = 4 (characters 16-20)
 */
export function getVillageFromCharacterId(characterId: number): number {
  if (characterId >= 1 && characterId <= 5) return 1; // HIDDEN_LEAF
  if (characterId >= 6 && characterId <= 10) return 2; // HIDDEN_SAND
  if (characterId >= 11 && characterId <= 15) return 3; // HIDDEN_MIST
  if (characterId >= 16 && characterId <= 20) return 4; // HIDDEN_CLOUD
  return 0; // Invalid
}

/**
 * Get contract character ID from character ID string (e.g., "hidden_leaf-fire")
 */
export function getContractCharacterIdFromString(characterIdString: string): number | null {
  const character = CHARACTERS.find((char) => char.id === characterIdString);
  if (!character) return null;
  
  // Map character nickname to contract ID
  const nicknameToContractId: Record<string, number> = {
    "Kazan": 1, "Suien": 2, "Fūjin": 3, "Dōgan": 4, "Raizen": 5,
    "Shazan": 6, "Mizai": 7, "Kazeo": 8, "Renga": 9, "Raika": 10,
    "Enkiri": 11, "Kirisame": 12, "Shien": 13, "Doro": 14, "Raiko": 15,
    "Enrai": 16, "Suirai": 17, "Fūra": 18, "Ganshi": 19, "Shiden": 20,
  };
  
  return nicknameToContractId[character.nickname] || null;
}

/**
 * Get buff info from contract
 */
export async function getBuffInfo(village: number, buffId: number) {
  try {
    const buffInfo = await publicClient.readContract({
      address: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
      abi: STAKEWARS_ABI,
      functionName: "getBuffInfo",
      args: [BigInt(village), BigInt(buffId)],
    }) as [bigint, bigint, bigint, string];
    
    const decimals = 18;
    const priceInWei = buffInfo[1];
    const price = Number(priceInWei) / Number(BigInt(10 ** decimals));
    
    return {
      effect: Number(buffInfo[0]),
      price: price,
      remainingTurns: Number(buffInfo[2]),
      name: buffInfo[3],
    };
  } catch (error) {
    console.error("Error fetching buff info:", error);
    throw error;
  }
}

/**
 * Get buff status (remaining uses) for a user's character
 */
export async function getBuffStatus(
  userAddress: `0x${string}`,
  characterId: number,
  buffId: number
): Promise<number> {
  try {
    const remainingUses = await publicClient.readContract({
      address: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
      abi: STAKEWARS_ABI,
      functionName: "getBuffStatus",
      args: [userAddress, BigInt(characterId), BigInt(buffId)],
    }) as bigint;
    
    return Number(remainingUses);
  } catch (error) {
    console.error("Error fetching buff status:", error);
    return 0;
  }
}

/**
 * Check if the contract is approved to spend CHAKRA tokens for a user
 */
export async function checkChakraApproval(userAddress: `0x${string}`): Promise<boolean> {
  try {
    const isApproved = await publicClient.readContract({
      address: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
      abi: STAKEWARS_ABI,
      functionName: "isApprovedForAll",
      args: [userAddress, STAKEWARS_CONTRACT_ADDRESS as `0x${string}`],
    }) as boolean;
    
    return isApproved;
  } catch (error) {
    console.error("Error checking CHAKRA approval:", error);
    return false;
  }
}

/**
 * Get all active powerups for a character (powerups with remaining uses > 0)
 * @param userAddress - The wallet address of the user
 * @param characterId - The contract character ID (1-20)
 * @returns Array of active powerups with their details
 */
export async function getCharacterActivePowerups(
  userAddress: `0x${string}`,
  characterId: number
): Promise<Array<{ name: string; effect: number; remainingTurns: number; remainingUses: number; buffId: number }>> {
  try {
    // Get the character's village
    const village = getVillageFromCharacterId(characterId);
    if (!village) return [];

    // Check all 5 buffs for the village (buffId 1-5)
    const activePowerups: Array<{ name: string; effect: number; remainingTurns: number; remainingUses: number; buffId: number }> = [];
    
    for (let buffId = 1; buffId <= 5; buffId++) {
      try {
        // Get remaining uses for this buff
        const remainingUses = await getBuffStatus(userAddress, characterId, buffId);
        
        if (remainingUses > 0) {
          // Get buff info (name, effect, remainingTurns)
          const buffInfo = await getBuffInfo(village, buffId);
          
          activePowerups.push({
            name: buffInfo.name,
            effect: buffInfo.effect,
            remainingTurns: buffInfo.remainingTurns,
            remainingUses: remainingUses,
            buffId: buffId,
          });
        }
      } catch (error) {
        console.error(`Error fetching buff ${buffId} status:`, error);
        // Continue to next buff
      }
    }
    
    return activePowerups;
  } catch (error) {
    console.error("Error fetching character active powerups:", error);
    return [];
  }
}

