"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http, useConnect, type Config } from "wagmi";
import { injected } from "@wagmi/core";
import { hardhat } from "wagmi/chains";
import { getConfig, mezoTestnet } from "@mezo-org/passport";
import { LOCAL_RPC } from "@/lib/contracts";

function makeConfig(): Config {
  if (LOCAL_RPC) {
    // Local Hardhat node, used only to test the app before deploying.
    return createConfig({
      chains: [hardhat],
      connectors: [injected()],
      transports: { [hardhat.id]: http(LOCAL_RPC) },
    });
  }
  return getConfig({
    appName: "Muster",
    appDescription: "Real users for Mezo apps, paid in MUSD, proven on-chain",
    mezoNetwork: "testnet",
    walletConnectProjectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "muster-no-walletconnect-id",
  });
}

/** Local test chain only: lets an automated browser test connect its wallet. */
function LocalTestHook() {
  const { connectAsync, connectors } = useConnect();
  useEffect(() => {
    (window as unknown as { __musterConnect?: () => Promise<unknown> }).__musterConnect = () => connectAsync({ connector: connectors[0] });
  }, [connectAsync, connectors]);
  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [config] = useState(makeConfig);
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={LOCAL_RPC ? hardhat : mezoTestnet}
          theme={lightTheme({ accentColor: "#13271D", accentColorForeground: "#E8EEE3", borderRadius: "small" })}
        >
          {LOCAL_RPC ? <LocalTestHook /> : null}
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
