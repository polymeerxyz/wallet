import { fileURLToPath } from "node:url"

import nodePolyfills from "@rolldown/plugin-node-polyfills"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import svgr from "vite-plugin-svgr"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    build: {
      rolldownOptions: {
        output: {
          minify: {
            compress: {
              dropConsole: true,
              dropDebugger: true,
            },
          },
        },
      },
    },
    define: {
      "process.env.VITE_GTM_ID": JSON.stringify(env.VITE_GTM_ID ?? ""),
    },
    plugins: [
      nodePolyfills(),
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
      svgr(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "favicon.svg",
          "apple-touch-icon-180x180.png",
          "icon-192x192.png",
          "icon-512x512.png",
        ],
        manifest: {
          short_name: "Polymeer",
          name: "Polymeer Wallet",
          id: "/",
          description: "Polymeer - Hardware Wallet for Nervos Network",
          icons: [
            {
              src: "icon-192x192.png",
              type: "image/png",
              sizes: "192x192",
              purpose: "any maskable",
            },
            {
              src: "icon-256x256.png",
              type: "image/png",
              sizes: "256x256",
              purpose: "any",
            },
            {
              src: "icon-384x384.png",
              type: "image/png",
              sizes: "384x384",
              purpose: "any",
            },
            {
              src: "icon-512x512.png",
              type: "image/png",
              sizes: "512x512",
              purpose: "any maskable",
            },
          ],
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#FFFFFF",
          background_color: "#FFFFFF",
        },
        devOptions: {
          enabled: true,
        },
      }),
      {
        name: "gtm-strategy",
        transformIndexHtml(html) {
          if (!env.VITE_GTM_ID) {
            return html
              .replace(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/g, "")
              .replace(
                /<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->/g,
                ""
              )
          }
          return html
        },
      },
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
  }
})
