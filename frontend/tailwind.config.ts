import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#172033",
        border: "#E5E7EB",
        hes: {
          blue: "#2563EB",
          red: "#DC2626",
          bgStone: "#F8FAFC",
          bgCard: "#FFFFFF",
          textMain: "#172033",
          textMuted: "#64748B",
          border: "#E5E7EB",
          green: "#16A34A",
        },
        success: {
          DEFAULT: "#16A34A",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-ibm-plex-sans)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
        title: ["var(--font-space-grotesk)", "sans-serif"],
      },
      borderRadius: {
        none: "0",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        full: "9999px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
