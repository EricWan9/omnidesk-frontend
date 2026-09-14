import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: "https://localhost:32771",
        changeOrigin: true,
        secure: false,
      },
      "/hubs": {
        target: "https://localhost:32771",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});