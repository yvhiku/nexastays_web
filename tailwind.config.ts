import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        nexa: {
          primary: "#E8507A",
          "primary-dark": "#C93A62",
          "primary-light": "#F4809A",
          "primary-soft": "#FDF0F3",
          accent: "#F9A86C",
          "accent-soft": "#FEF5EC",
          ink: "#1A1118",
          "ink-2": "#3D2B36",
          "ink-3": "#6B5460",
          "ink-4": "#9E8A93",
          line: "#EDE0E5",
          bg: "#FDFBFC",
          "bg-2": "#F8F2F5",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "22px",
        xl: "32px",
      },
      boxShadow: {
        "nexa-sm": "0 2px 8px rgba(232,80,122,0.08)",
        "nexa-md": "0 6px 24px rgba(232,80,122,0.12)",
        "nexa-lg": "0 16px 48px rgba(232,80,122,0.16)",
        "nexa-card": "0 4px 20px rgba(26,17,24,0.07)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
