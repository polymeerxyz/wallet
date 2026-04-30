/// <reference lib="webworker" />
import { clientsClaim, skipWaiting } from "workbox-core"
import { addPlugins, cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"
import { NavigationRoute, registerRoute, setDefaultHandler } from "workbox-routing"
import { NetworkFirst, NetworkOnly } from "workbox-strategies"

import { registerCkbRpcProxy } from "./sw-ckb-rpc-proxy"

declare const self: ServiceWorkerGlobalScope & typeof globalThis

skipWaiting()
clientsClaim()

let coepCredentialless = true

self.addEventListener("message", (ev: MessageEvent) => {
  if (!ev.data) return

  if (ev.data.type === "deregister") {
    void self.registration.unregister().then(() =>
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => (client as WindowClient).navigate((client as WindowClient).url))
      })
    )
  } else if (ev.data.type === "coepCredentialless") {
    coepCredentialless = ev.data.value as boolean
  }
})

// Injects security headers required for SharedArrayBuffer (crossOriginIsolated)
function injectSecurityHeaders(response: Response): Response {
  if (response.status === 0 || response.type === "error") return response

  const headers = new Headers(response.headers)
  headers.set("Cross-Origin-Opener-Policy", "same-origin")
  headers.set("Cross-Origin-Resource-Policy", "cross-origin")
  headers.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp")

  try {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (e) {
    console.error("Failed to inject security headers:", e)
    return response
  }
}

const securityPlugin = {
  fetchDidSucceed: async ({ response }: { response: Response }): Promise<Response> => injectSecurityHeaders(response),
  cachedResponseWillBeUsed: async ({
    cachedResponse,
  }: {
    cachedResponse?: Response
  }): Promise<Response | null | undefined> => {
    return cachedResponse ? injectSecurityHeaders(cachedResponse) : cachedResponse
  },
}

// 1. Navigation requests
registerRoute(new NavigationRoute(new NetworkFirst({ plugins: [securityPlugin] })))

// 2. Analytics Tracking (extensible list of domains)
const TRACKING_DOMAINS = ["googletagmanager.com", "google-analytics.com"]

registerRoute(
  ({ url }) => TRACKING_DOMAINS.some((domain) => url.hostname.includes(domain)),
  new NetworkOnly({
    plugins: [
      securityPlugin,
      {
        handlerDidError: async () =>
          new Response("", {
            status: 200,
            headers: {
              "Content-Type": "text/javascript",
              "Cross-Origin-Resource-Policy": "cross-origin",
            },
          }),
      },
    ],
  })
)

// 3. Precache Vite-built assets
addPlugins([securityPlugin])
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// 4. CKB RPC proxy for Fiber WASM → CKB light client bridge
registerCkbRpcProxy()

// 5. Catch-all fallback
setDefaultHandler(new NetworkOnly({ plugins: [securityPlugin] }))
