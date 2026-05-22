/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 10px 24px rgba(15, 23, 42, 0.08)",
        glow: "0 12px 28px rgba(37, 99, 235, 0.16)",
      },
      colors: {
        navy: "#0f172a",
        ocean: "#2563eb",
        aqua: "#059669",
        ink: "#111827",
        caution: "#c2410c",
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
