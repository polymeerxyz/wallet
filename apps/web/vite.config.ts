import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { VitePWA } from "vite-plugin-pwa"
import svgr from "vite-plugin-svgr"

export default defineConfig(async () => ({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    svgr(),
    nodePolyfills({
      include: ["buffer"],
      exclude: [],
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["/icons/icon-192x192.png", "/icons/icon-512x512.png"],
      manifest: {
        short_name: "Polymeer Wallet",
        name: "Polymeer Wallet",
        id: "/",
        description: "Polymeer Wallet",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512x512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any maskable",
          },
        ],
        start_url: "/app",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#FFFFFF",
        background_color: "#FFFFFF",
        related_applications: [],
        prefer_related_applications: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 1421,
    strictPort: true,
  },
}))
