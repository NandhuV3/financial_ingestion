import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const appRoot = new URL(".", import.meta.url).pathname;

export default defineConfig({
  root: appRoot,
  plugins: [react()],
  server: {
    port: 5173,
  },
});
