import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: "#F6F5F0",
        surface: "#FFFFFF",
        ink: "#1C2321",
        "ink-muted": "#5B6660",
        line: "#D9D5C9",
        archive: "#3F6259",
        "archive-soft": "#DCE6E2",
        stamp: "#AE3B2C",
      },
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        card: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
