"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http } from "viem";
import { mantle, mantleTestnet } from "viem/chains";
import { createConfig } from "wagmi";
import { type ReactNode, useState } from "react";

const wagmiConfig = createConfig({
  // Type assertion needed: viem chains are compatible but TypeScript types differ slightly
  chains: [mantle, mantleTestnet] as [typeof mantle, typeof mantleTestnet],
  transports: {
    [mantle.id]: http(),
    [mantleTestnet.id]: http(),
  },
});

interface PrivyProviderProps {
  children: ReactNode;
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyProviderBase
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        loginMethods: ["email", "wallet", "sms", "google", "twitter", "discord"],
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
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProviderBase>
  );
}


