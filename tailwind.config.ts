/**
 * Tailwind CSS Configuration for Lume Store
 * Liquid Glass Design System
 */

import { type Config } from "tailwindcss";
import { skeleton } from "@tailwindcss/oxide";

export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Liquid Glass Color Palette
        glass: {
          background: "rgba(255, 255, 255, 0.8)",
          foreground: "#171717",
        },
        glassDark: {
          background: "rgba(10, 10, 10, 0.8)",
          foreground: "#ededed",
        },
        // Primary brand colors
        primary: {
          DEFAULT: "#3b82f6",
          50: "#eff6ff",
          100: "#bfdbfe",
          200: "#93c5fd",
          300: #60a5fa,
          400: #3b82f6,
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          800: "#1e3a8a",
          900: "#1e40af",
        },
        // Status colors
        success: {
          DEFAULT: "#10b981",
          50: "#f0fdf4",
          100: "#d1e7dd",
          200: "#a7dcaf",
          300: "#84cc16",
          400: "#65a30d",
          500: "#34d399",
          600: "#10b981",
        },
        error: {
          DEFAULT: "#ef4444",
          50: "#fef2f2",
          100: "#fecaca",
          200: "#f87171",
          300: "#f472b6",
          400: "#ec4899",
          500: "#f87171",
          600: "#ef4444",
        },
        warning: {
          DEFAULT: "#f59e0b",
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#eab308",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      boxShadow: {
        glass: "0 4px 20px rgba(0, 0, 0, 0.05)",
        glassDark: "0 4px 20px rgba(0, 0, 0, 0.3)",
        primary: "0 4px 14px rgba(59, 130, 246, 0.15)",
      },
      transitionProperty: {
        width: "width",
        height: "height",
        opacity: "opacity",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;