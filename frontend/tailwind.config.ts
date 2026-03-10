import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        surface: {
          950: "#080c14",
          900: "#0d1220",
          800: "#141b2d",
          700: "#1c2540",
          600: "#243052",
          500: "#2e3d66",
        },
        border: {
          DEFAULT: "#243052",
          light: "#2e3d66",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-sm": "32px 32px",
      },
      boxShadow: {
        "accent-sm": "0 0 20px rgba(249,115,22,0.15)",
        "accent-md": "0 0 40px rgba(249,115,22,0.2)",
        card: "0 4px 24px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
} satisfies Config;
