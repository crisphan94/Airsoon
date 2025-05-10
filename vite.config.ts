import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    port: 3000,
    proxy: {
      "/humanity": {
        target: "https://humanity-testnet.g.alchemy.com/public/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/humanity/, ""),
      },
      "/avalanche": {
        target: "https://avalanche-mainnet.infura.io/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/avalanche/, ""),
      },
    },
  },
});
