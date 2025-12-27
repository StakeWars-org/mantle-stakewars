// Character ID mapping from contract constants to character nicknames
// Based on contract: FUJIN=3, DOGAN=4, RAIZEN=5, SHAZAN=6, MIZAI=7, KAEZO=8, 
// RENGA=9, RAIKA=10, ENKIRI=11, KIRISAME=12, SHIEN=13, DORO=14, 
// RAIKO=15, ENRAI=16, SUIRAI=17, FURA=18, GANSHI=19, SHIDEN=20
// Note: KAZAN and SUIEN are assumed to be 1 and 2 based on village assignments

export const CHARACTER_ID_MAP: Record<string, number> = {
  "Kazan": 1,   // KAZAN (Hidden Leaf - Fire)
  "Suien": 2,   // SUIEN (Hidden Leaf - Water)
  "Fūjin": 3,   // FUJIN (Hidden Leaf - Wind)
  "Dōgan": 4,   // DOGAN (Hidden Leaf - Earth)
  "Raizen": 5,  // RAIZEN (Hidden Leaf - Lightning)
  "Shazan": 6,  // SHAZAN (Hidden Sand - Fire)
  "Mizai": 7,   // MIZAI (Hidden Sand - Water)
  "Kazeo": 8,   // KAEZO (Hidden Sand - Wind)
  "Renga": 9,   // RENGA (Hidden Sand - Earth)
  "Raika": 10,  // RAIKA (Hidden Sand - Lightning)
  "Enkiri": 11, // ENKIRI (Hidden Mist - Fire)
  "Kirisame": 12, // KIRISAME (Hidden Mist - Water)
  "Shien": 13,  // SHIEN (Hidden Mist - Wind)
  "Doro": 14,   // DORO (Hidden Mist - Earth)
  "Raiko": 15,  // RAIKO (Hidden Mist - Lightning)
  "Enrai": 16,  // ENRAI (Hidden Cloud - Fire)
  "Suirai": 17, // SUIRAI (Hidden Cloud - Water)
  "Fūra": 18,   // FURA (Hidden Cloud - Wind)
  "Ganshi": 19, // GANSHI (Hidden Cloud - Earth)
  "Shiden": 20, // SHIDEN (Hidden Cloud - Lightning)
};

// Reverse mapping: contract ID to character ID string (matches CHARACTERS array order)
export const CONTRACT_ID_TO_CHARACTER_ID: Record<number, string> = {
  1: "hidden_leaf-fire",        // Kazan
  2: "hidden_leaf-water",       // Suien
  3: "hidden_leaf-wind",        // Fūjin
  4: "hidden_leaf-earth",       // Dōgan
  5: "hidden_leaf-lightning",   // Raizen
  6: "hidden_sand-fire",        // Shazan
  7: "hidden_sand-water",       // Mizai
  8: "hidden_sand-wind",        // Kazeo
  9: "hidden_sand-earth",       // Renga
  10: "hidden_sand-lightning",  // Raika
  11: "hidden_mist-fire",       // Enkiri
  12: "hidden_mist-water",      // Kirisame
  13: "hidden_mist-wind",       // Shien
  14: "hidden_mist-earth",      // Doro
  15: "hidden_mist-lightning",  // Raiko
  16: "hidden_cloud-fire",      // Enrai
  17: "hidden_cloud-water",     // Suirai
  18: "hidden_cloud-wind",      // Fūra
  19: "hidden_cloud-earth",     // Ganshi
  20: "hidden_cloud-lightning", // Shiden
};

/**
 * Get contract character ID from character nickname
 */
export function getContractCharacterId(nickname: string): number | null {
  return CHARACTER_ID_MAP[nickname] || null;
}

/**
 * Get character ID string from contract ID
 */
export function getCharacterIdFromContractId(contractId: number): string | null {
  return CONTRACT_ID_TO_CHARACTER_ID[contractId] || null;
}

