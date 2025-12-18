"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Droplet, Loader2 } from 'lucide-react';

const MANTLE_RPC_URL = process.env.MANTLE_RPC_URL || "https://rpc.mantle.xyz";
const AIRDROP_AMOUNT = 0.1; // 0.1 MNT per request
const MAX_BALANCE_FOR_FAUCET = 0.5; // Only users with <= 0.5 MNT can use faucet

export default function FaucetPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  // Get wallet address from Privy
  const walletAddress = wallets[0]?.address || '';

  // Fetch Mantle balance via API
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      const response = await fetch(`/api/get-balance?walletAddress=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        // Balance is in ETH/MNT (18 decimals)
        setBalance(data.balance || 0);
      } else {
        setBalance(0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setBalance(0);
    }
  }, [walletAddress]);

  // Fetch balance on mount and wallet change
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      fetchBalance();
    }
  }, [ready, authenticated, walletAddress, fetchBalance]);

  const handleAirdrop = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Check if balance is too high
    if (balance !== null && balance > MAX_BALANCE_FOR_FAUCET) {
      toast.error(`You already have ${balance.toFixed(4)} MNT. Faucet is only for wallets with ${MAX_BALANCE_FOR_FAUCET} MNT or less.`);
      return;
    }

    setLoading(true);

    try {
      toast.info('💧 Requesting Mantle tokens airdrop...');

      const response = await fetch('/api/faucet/airdrop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Airdrop failed');
      }

      console.log('✅ Airdrop successful:', data);

      toast.success(`🎉 Received ${data.amount} Mantle tokens!`);
      
      // Show transaction link
      if (data.txHash) {
        toast.info(
          <div>
            <a 
              href={`https://explorer.mantle.xyz/tx/${data.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Explorer
            </a>
          </div>,
          { autoClose: 10000 }
        );
      }

      // Refresh balance
      setTimeout(() => fetchBalance(), 2000);

    } catch (error) {
      console.error('Airdrop failed:', error);
      toast.error(error instanceof Error ? error.message : 'Airdrop failed');
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !authenticated || !walletAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-8">
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-8 text-center max-w-md">
          <Droplet className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Wallet Not Connected
          </h2>
          <p className="text-gray-300 mb-6">
            Please connect your wallet to use the faucet
          </p>
          <Button
            onClick={() => router.push("/lobby")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg"
          >
            Back to Lobby
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              💧 Mantle Faucet
            </h1>
            <p className="text-gray-300">
              Get free Mantle tokens for transaction fees
            </p>
          </div>
          <Button
            onClick={() => router.push("/lobby")}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Back to Lobby
          </Button>
        </div>

        {/* Balance Display */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-sm border-2 border-blue-500/50 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Your Wallet</p>
              <p className="text-white font-mono text-sm">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Mantle Balance</p>
              <p className="text-white text-2xl font-bold">
                {balance !== null ? `${balance.toFixed(4)} MNT` : 'Loading...'}
              </p>
            </div>
          </div>
          <Button
            onClick={fetchBalance}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            🔄 Refresh Balance
          </Button>
        </div>

        {/* Faucet Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border-2 border-gray-700 rounded-xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex size-28 justify-center items-center p-4 bg-blue-500/20 rounded-full mb-4">
              <Droplet className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Request Mantle Tokens</h2>
            <p className="text-gray-300">
              Get {AIRDROP_AMOUNT} MNT to pay for transaction fees
            </p>
          </div>

           {/* Airdrop Button */}
           <Button
             onClick={handleAirdrop}
             disabled={loading || (balance !== null && balance > MAX_BALANCE_FOR_FAUCET)}
             className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-6 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
           >
             {loading ? (
               <>
                 <Loader2 className="w-6 h-6 animate-spin" />
                 Requesting Airdrop...
               </>
             ) : (balance !== null && balance > MAX_BALANCE_FOR_FAUCET) ? (
               <>
                 ✋ Balance Too High ({balance.toFixed(4)} MNT)
               </>
             ) : (
               <>
                 <Droplet className="w-6 h-6" />
                 Get {AIRDROP_AMOUNT} Mantle Tokens
               </>
             )}
           </Button>

           {/* Balance Too High Warning */}
           {balance !== null && balance > MAX_BALANCE_FOR_FAUCET && (
             <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
               <p className="text-red-300 text-sm text-center">
                 ⚠️ Faucet is only available for wallets with {MAX_BALANCE_FOR_FAUCET} MNT or less.
                 <br />
                 Your balance: {balance.toFixed(4)} MNT
               </p>
             </div>
           )}

           {/* Eligible Info */}
           {balance !== null && balance <= MAX_BALANCE_FOR_FAUCET && (
             <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
               <p className="text-green-300 text-sm text-center">
                 ✅ You&apos;re eligible! Click above to get {AIRDROP_AMOUNT} MNT
               </p>
             </div>
           )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-blue-400 mb-3">ℹ️ What is Mantle?</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>Mantle tokens (MNT)</strong> are used to pay for transaction fees in the game</li>
            <li>• You need it to mint characters, transfer CHAKRA, and interact with the blockchain</li>
            <li>• It&apos;s separate from CHAKRA (the in-game currency)</li>
            <li>• The faucet provides free MNT for testing on Mantle network</li>
            <li>• <strong>Eligibility:</strong> Only wallets with {MAX_BALANCE_FOR_FAUCET} MNT or less can use the faucet</li>
            <li>• <strong>Amount:</strong> Get {AIRDROP_AMOUNT} MNT per request (no cooldown!)</li>
          </ul>
        </div>

        {/* Usage Tips */}
        <div className="mt-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-yellow-400 mb-3">💡 When You Need SOL</h2>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• <strong>Minting Characters:</strong> Small MNT fee for transaction</li>
            <li>• <strong>Transferring CHAKRA:</strong> Network fee paid by sender</li>
            <li>• <strong>Joining Tournaments:</strong> Transaction fees for entry</li>
            <li>• <strong>Creating User Profile:</strong> One-time setup fee</li>
            <li>• Keep at least 0.001 MNT in your wallet for smooth gameplay</li>
          </ul>
        </div>

        {/* How It Works */}
        <div className="mt-6 bg-gray-800/50 border-2 border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-3">🔧 How It Works</h2>
          <div className="space-y-3 text-gray-300 text-sm">
            <p>
              The faucet uses Mantle network RPC to send tokens directly to your wallet:
            </p>
            <div className="bg-gray-900 p-3 rounded font-mono text-xs">
              Sending {AIRDROP_AMOUNT} MNT to {walletAddress.slice(0, 20)}...
              <br />
              Network: Mantle
            </div>
            <p className="text-gray-400 text-xs">
              Tokens are sent via API call to the Mantle network for your convenience!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

