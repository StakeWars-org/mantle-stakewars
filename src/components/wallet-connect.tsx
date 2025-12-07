"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useAccount, useBalance, useDisconnect } from "wagmi";
import { formatAddress } from "@/lib/format-address";

export function WalletConnect() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address: address,
  });

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center p-4">
        <button
          onClick={login}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  const wallet = wallets[0];
  const displayAddress = address || wallet?.address || "";

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm font-medium">Connected Wallet</div>
        <div className="text-xs text-gray-600 font-mono">
          {formatAddress(displayAddress)}
        </div>
        {balance && (
          <div className="text-sm text-gray-500">
            Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            disconnect();
            logout();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}

