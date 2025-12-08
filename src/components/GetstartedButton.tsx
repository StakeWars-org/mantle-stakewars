"use client";

import React from "react";
import { Button } from "./ui/button";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function GetstartedButton() {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();
  
  // Check if wallet is connected through Privy
  const walletConnected = authenticated && wallets.length > 0;
  
  const handleClick = () => {
    if (!walletConnected) {
      login();
    } else {
      router.push('/lobby');
    }
  };
  
  // Only disable if Privy is not ready
  const isDisabled = !ready;
  
  return (
    <div>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className={`text-white border border-white ${
          walletConnected ? "connect-button-bg" : "bg-[#28252D]"
        } min-h-[42px] w-50 rounded-[7px] font-semibold`}
      >
        {walletConnected ? "Get Started" : "Connect Wallet"}
      </Button>
    </div>
  );
}
