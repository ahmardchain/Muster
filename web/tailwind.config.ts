import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#E8EEE3", // ledger green
        raised: "#F4F7F0",
        ink: "#13271D",
        "ink-soft": "#465A4E",
        rule: "#B4C3B0",
        stamp: "#B8301A",
        amber: "#8A5A00",
      },
      fontFamily: {
        display: ['"Big Shoulders Display Variable"', "Impact", "sans-serif"],
        sans: ['"Public Sans Variable"', "system-ui", "sans-serif"],
      },
      maxWidth: { page: "68rem", prose: "38rem" },
    },
  },
  plugins: [],
};
export default config;
