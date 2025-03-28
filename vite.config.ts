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
        target: "https://rpc.testnet.humanity.org/",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/humanity/, ""),
      },
    },
  },
});
