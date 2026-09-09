import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
        coral: {
          50: "#FFF7ED",
          100: "#FFEDD5",
          200: "#FED7AA",
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
          700: "#C2410C",
        },
        rose: {
          500: "#F43F5E",
          600: "#E11D48",
          700: "#BE185D",
        },
        navy: {
          950: "#050B17",
          900: "#0B1426",
          850: "#0F1E38",
          800: "#1E293B",
          700: "#334155",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-light": "radial-gradient(at 0% 0%, rgba(249, 115, 22, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(225, 29, 72, 0.06) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(79, 70, 229, 0.06) 0px, transparent 50%)",
        "mesh-hero": "radial-gradient(circle at 50% 10%, rgba(249, 115, 22, 0.12), rgba(225, 29, 72, 0.06) 35%, transparent 70%)",
        "brand-gradient": "linear-gradient(135deg, #F97316 0%, #E11D48 50%, #4F46E5 100%)",
      },
      boxShadow: {
        "glow-coral": "0 10px 40px -10px rgba(249, 115, 22, 0.25)",
        "glow-brand": "0 10px 40px -10px rgba(225, 29, 72, 0.25)",
        "card-subtle": "0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)",
        "card-hover": "0 20px 40px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.08)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 5s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "marquee": "marquee 28s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        }
      }
    },
  },
  plugins: [],
};
export default config;
