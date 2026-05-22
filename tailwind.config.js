/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 55px rgba(16, 92, 181, 0.13)",
        glow: "0 20px 45px rgba(12, 111, 243, 0.22)",
      },
      colors: {
        navy: "#071a78",
        ocean: "#0b6ff3",
        aqua: "#14d6a3",
        ink: "#0b2458",
        caution: "#ff7212",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
