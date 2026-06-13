/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        indigo: {
          950: "#0F1E36",
          900: "#162A48",
          800: "#1E3A5F",
          700: "#274C77",
          600: "#355F94",
        },
        gold: {
          50: "#FBF7ED",
          100: "#F5ECCD",
          200: "#E9D89A",
          300: "#DEC267",
          400: "#D4B13E",
          500: "#C9A962",
          600: "#B89145",
          700: "#997534",
        },
        ivory: "#FAFAF7",
        cream: "#F5F2EC",
        parchment: "#F0EDE4",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'Cambria', 'serif'],
        sans: ['"Noto Sans SC"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: "0 1px 3px rgba(30, 58, 95, 0.06), 0 1px 2px rgba(30, 58, 95, 0.04)",
        "card-hover": "0 8px 24px rgba(30, 58, 95, 0.10), 0 2px 6px rgba(30, 58, 95, 0.06)",
        gold: "0 0 0 1px rgba(201, 169, 98, 0.3), 0 2px 8px rgba(201, 169, 98, 0.15)",
        glow: "0 0 16px rgba(30, 58, 95, 0.25)",
      },
      backgroundImage: {
        "paper-texture": "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A962' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        "gradient-indigo": "linear-gradient(135deg, #1E3A5F 0%, #274C77 100%)",
        "gradient-gold": "linear-gradient(135deg, #C9A962 0%, #DEC267 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in-up": "fadeInUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in": "slideIn 0.25s ease-out",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
