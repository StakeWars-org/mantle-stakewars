/**
 * Formats a wallet address for display by showing the first and last characters
 * @param address - The wallet address to format (e.g., "0x1234567890abcdef1234567890abcdef12345678")
 * @param startChars - Number of characters to show at the start (default: 6)
 * @param endChars - Number of characters to show at the end (default: 4)
 * @returns Formatted address string (e.g., "0x1234...5678")
 */
export function formatAddress(
  address: string | null | undefined,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || typeof address !== "string") {
    return "";
  }

  // If address is shorter than the sum of start and end chars, return as is
  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

