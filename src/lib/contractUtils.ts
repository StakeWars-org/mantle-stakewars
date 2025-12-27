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

