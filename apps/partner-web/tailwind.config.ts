import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        partner: {
          ink: "#1f2933",
          muted: "#667085",
          paper: "#fbfaf7",
          surface: "#ffffff",
          line: "#e7e3da",
          accent: "#3f6f5f",
          amber: "#b7791f",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
