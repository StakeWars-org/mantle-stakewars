"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "./ui/button";
import WalletButton from "./WalletButton";

type ConnectButtonProps = {
  width: string;
};

export const compactHash = (hash: string | null | undefined) => {
  if (!hash || typeof hash !== "string" || hash.length < 12) return "";
  return `${hash.substring(0, 7)}...${hash.substring(hash.length - 5)}`;
};

export default function ConnectButton({ width }: ConnectButtonProps) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  // Get wallet address from Privy wallets
  const walletAddress = wallets[0]?.address || '';

  // Not authenticated - show connect button
  if (!authenticated) {
    return (
      <div className={`${width} flex`}>
        <Button
          type="button"
          onClick={login}
          disabled={!ready}
          className="text-white border border-white connect-button-bg min-h-[42px] font-semibold w-full rounded-[7px] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!ready ? 'Loading...' : 'Connect Wallet'}
        </Button>
      </div>
    );
  }

  // Authenticated but no wallet address yet (should be quick)
  if (!walletAddress) {
    return (
      <div className={`${width} flex`}>
        <Button
          className="text-white border border-white connect-button-bg min-h-[42px] font-semibold w-full rounded-[7px]"
          disabled
        >
          Loading wallet...
        </Button>
      </div>
    );
  }

  // Authenticated with wallet - show wallet button with dropdown
  return (
    <div className={`${width} flex`}>
      <WalletButton className="w-full" />
    </div>
  );
}
