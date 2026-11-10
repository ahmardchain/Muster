import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/big-shoulders-display";
import "@fontsource-variable/public-sans";
import "./globals.css";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Muster: real users for Mezo apps",
  description: "Mezo apps post quests in MUSD. You use the app, the contract checks it on-chain, and you get paid.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#E8EEE3" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
