import { fileURLToPath } from "node:url"

import nodePolyfills from "@rolldown/plugin-node-polyfills"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import sitemap from "vite-plugin-sitemap"
import svgr from "vite-plugin-svgr"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  const VITE_GTM_ID = env.VITE_GTM_ID ?? ""

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
    worker: {
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
      "process.env.VITE_GTM_ID": JSON.stringify(VITE_GTM_ID),
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
      {
        name: "gtm-strategy",
        transformIndexHtml(html) {
          if (!VITE_GTM_ID) {
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
      sitemap({
        hostname: "https://app.polymeer.xyz",
        dynamicRoutes: ["/", "/connect", "/dao", "/transactions", "/send"],
      }),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "logo.svg", "apple-touch-icon-*.png", "pwa-*.png", "sitemap.xml", "robots.txt"],
        manifest: {
          short_name: "Polymeer",
          name: "Polymeer Wallet",
          id: "/",
          description: "Polymeer - Hardware Wallet for Nervos Network",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-256x256.png",
              sizes: "256x256",
              type: "image/png",
            },
            {
              src: "pwa-384x384.png",
              sizes: "384x384",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          shortcuts: [
            {
              name: "Transactions",
              url: "/transactions",
              icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
            },
            {
              name: "Send",
              short_name: "Send",
              url: "/send",
              icons: [{ src: "pwa-192x192.png", sizes: "192x192" }],
            },
          ],
          categories: ["finance", "utilities"],
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#E07B30",
          background_color: "#ffffff",
        },
        injectManifest: {
          maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
        },
        devOptions: {
          enabled: false,
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
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    },
    preview: {
      port: 1421,
      strictPort: true,
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin",
        "Cross-Origin-Embedder-Policy": "credentialless",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    },
  }
})
