/// <reference types="vite/client" />

export {}

declare module "*.svg?react" {
  import type React from "react"
  const SVG: React.FC<React.SVGProps<SVGSVGElement>>
  export default SVG
}

declare global {
  import { type Buffer } from "buffer"
  interface Window {
    Buffer: Buffer
  }
}
