"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useEffect, useState } from "react";
import ProfileTabs from "./ProfileTabs";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { compactHash } from "./ConnectButton";
import { toast } from "react-toastify";

interface UserProfileProps {
  showLabel?: boolean;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function UserProfile({ showLabel = false, isOpen: externalIsOpen, setIsOpen: externalSetIsOpen }: UserProfileProps) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [balance, setBalance] = useState<number | null>(null);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external state if provided, otherwise internal
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = externalSetIsOpen || setInternalIsOpen;

  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied!');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!walletAddress || !authenticated) {
        setBalance(null);
        setWins(0);
        setLosses(0);
        return;
      }

      try {
        // Fetch balance
        const balanceResponse = await fetch(`/api/get-balance?walletAddress=${walletAddress}`);
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalance(balanceData.balance || 0);
        }

        // Fetch user stats (wins/losses)
        const statsResponse = await fetch(`/api/get-user-stats?walletAddress=${walletAddress}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setWins(statsData.wins || 0);
          setLosses(statsData.losses || 0);
      }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    if (ready && authenticated) {
      fetchUserData();
    }
  }, [walletAddress, authenticated, ready]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
        modal={true}
      >
        {!showLabel && (
          // Desktop: Use DialogTrigger
          <DialogTrigger className="mt-1" onClick={(e) => e.stopPropagation()}>
            <Avatar className="size-[43px]">
              <AvatarImage src="/avater.png" alt="avater" />
              <AvatarFallback>AV</AvatarFallback>
            </Avatar>
          </DialogTrigger>
        )}
        <DialogContent className="overflow-auto h-[600px] bg-[#111318]" onClick={(e) => e.stopPropagation()}>
          <DialogTitle className="hidden">Search Game Room</DialogTitle>
          <div>
            <div className="flex gap-5 justify-center mb-12">
              <div>
                <div>
                  <div className="w-[94px] h-[94px] rounded-full">
                    <img src="/profile-avater.png" />
                  </div>
                </div>
              </div>

              <div className="text-white">
                <span className="inline-flex gap-[10px] items-center text-[15px] font-normal mt-2 mb-[14px]">
                  <span>
                    <img src="/wallet.png" alt="wallet" />
                  </span>
                  <span className="font-bold text-[18px]">
                    {walletAddress
                      ? compactHash(walletAddress)
                      : "Not Connected"}
                  </span>{" "}
                  <button 
                    onClick={copyAddress}
                    className="p-0 mt-px hover:opacity-80 transition-opacity"
                    title="Copy address"
                  >
                    <img src="/copy.png" alt="copy" width={20} height={20} />
                  </button>
                </span>
                <p className="mb-2">
                  <span className="text-[#A78ACE] font-bold">
                    Account balance:
                  </span>{" "}
                  {balance !== null ? `${balance.toFixed(4)} ETH` : "Loading..."}
                </p>
                <p>
                  <span className="text-[#A78ACE] font-bold">Wins:</span> {wins} | <span className="text-[#A78ACE] font-bold">Losses:</span> {losses}
                </p>
              </div>
            </div>

            <ProfileTabs setIsOpen={setIsOpen} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
