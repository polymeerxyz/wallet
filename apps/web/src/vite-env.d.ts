/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

export {}

declare global {
  import { type Buffer } from "buffer"
  interface Window {
    Buffer: Buffer
  }
}
