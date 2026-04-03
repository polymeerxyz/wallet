import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import type { PluginOption } from "vite"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"

const host = process.env.TAURI_DEV_HOST

export default defineConfig(async () => ({
  plugins: [
    versioning(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    svgr(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}))

const versioning = (): PluginOption => {
  return {
    name: "update-tauri-conf",
    enforce: "pre",
    configResolved() {
      const packageJsonPath = fileURLToPath(new URL("./package.json", import.meta.url))
      const tauriConfPath = fileURLToPath(new URL("./src-tauri/tauri.conf.json", import.meta.url))
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"))
      const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf-8"))

      if (tauriConf.version !== packageJson.version) {
        tauriConf.version = packageJson.version
        writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2))
      }
    },
  }
}
