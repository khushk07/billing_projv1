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
        summit: {
          50: "#f6f7f4",
          100: "#e8ebe3",
          200: "#d1d8c7",
          300: "#b3bfa3",
          400: "#94a37f",
          500: "#768864",
          600: "#5c6d4e",
          700: "#4a5740",
          800: "#3d4736",
          900: "#343c2f",
          950: "#1a1f17",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
