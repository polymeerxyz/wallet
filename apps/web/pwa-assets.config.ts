import type { Preset } from "@vite-pwa/assets-generator/config"
import { defineConfig } from "@vite-pwa/assets-generator/config"

export const preset: Preset = {
  transparent: {
    sizes: [64, 192, 256, 384, 512],
    favicons: [
      [32, "favicon.png"],
      [32, "favicon.ico"],
      [16, "favicon-16.ico"],
      [48, "favicon-48.ico"],
    ],
  },

  maskable: {
    padding: 0,
    sizes: [512],
  },
  apple: {
    padding: 0,
    sizes: [57, 60, 72, 76, 114, 120, 152, 180],
  },
}

export default defineConfig({
  headLinkOptions: {
    preset: "2023",
  },
  preset,
  images: ["public/logo.svg"],
})
