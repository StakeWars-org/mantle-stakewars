"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, defineChain } from "viem";
import { mantle, mantleTestnet as viemMantleTestnet } from "viem/chains";
import { createConfig } from "wagmi";
import { type ReactNode, useState } from "react";

// Use environment variable for Mantle Testnet RPC, with fallback to public RPC
// Try multiple public endpoints: publicnode.com, blastapi.io, or original testnet RPC
const MANTLE_TESTNET_RPC = process.env.NEXT_PUBLIC_MANTLE_TESTNET_RPC || "https://mantle-testnet.publicnode.com";

// Create a custom Mantle Testnet chain with the working RPC URL
// The sequencer expects chain ID 5003, not 5001
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

const wagmiConfig = createConfig({
  // Set Mantle Testnet as the first chain (default chain)
  chains: [mantleTestnet, mantle] as [typeof mantleTestnet, typeof mantle],
  transports: {
    [mantleTestnet.id]: http(MANTLE_TESTNET_RPC),
    [mantle.id]: http(),
  },
});

interface PrivyProviderProps {
  children: ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProviderBase
      appId={process.env.PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet", "google", "twitter", "discord"],
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "https://your-logo-url.com/logo.png",
          walletChainType: "ethereum-only",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        // Use custom chain with working RPC URL
        defaultChain: mantleTestnet,
        supportedChains: [mantleTestnet, mantle],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProviderBase>
  );
}


