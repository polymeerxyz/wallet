import { registerRoute } from "workbox-routing"

export const CKB_RPC_PROXY_PATH = "/ckb-rpc-proxy"

const BROADCAST_CHANNEL = "ckb-rpc-proxy"
const TIMEOUT_MS = 15_000

interface ProxyResponse {
  type: "response"
  proxyId: string
  result?: unknown
  error?: { code: number; message: string }
}

interface JsonRpcCall {
  id: unknown
  method: string
  params?: unknown[]
}

// A single shared channel for all in-flight requests, keyed by proxyId.
let _channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel {
  if (!_channel) _channel = new BroadcastChannel(BROADCAST_CHANNEL)
  return _channel
}

function dispatchRpcRequest(method: string, params: unknown[]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const proxyId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const channel = getChannel()

    const timer = setTimeout(() => {
      channel.removeEventListener("message", handler)
      reject(new Error(`CKB RPC proxy timeout: ${method}`))
    }, TIMEOUT_MS)

    function handler(ev: MessageEvent<ProxyResponse>) {
      if (ev.data?.type !== "response" || ev.data.proxyId !== proxyId) return
      clearTimeout(timer)
      channel.removeEventListener("message", handler)
      if (ev.data.error) {
        reject(Object.assign(new Error(ev.data.error.message), { code: ev.data.error.code }))
      } else {
        resolve(ev.data.result)
      }
    }

    // Register listener BEFORE posting to avoid missing a fast response.
    channel.addEventListener("message", handler)
    channel.postMessage({ type: "request", proxyId, method, params })
  })
}

function jsonRpcResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export function registerCkbRpcProxy(): void {
  registerRoute(
    ({ url }) => url.pathname === CKB_RPC_PROXY_PATH,
    async ({ request }) => {
      let body: unknown
      try {
        body = await request.clone().json()
      } catch {
        return jsonRpcResponse({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400)
      }

      const isBatch = Array.isArray(body)
      const calls = (isBatch ? body : [body]) as JsonRpcCall[]

      const results = await Promise.all(
        calls.map(async (call) => {
          try {
            const result = await dispatchRpcRequest(call.method, call.params ?? [])
            return { jsonrpc: "2.0", id: call.id, result }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            const code = (err as { code?: number }).code ?? -32000
            return { jsonrpc: "2.0", id: call.id, error: { code, message } }
          }
        })
      )

      return jsonRpcResponse(isBatch ? results : results[0])
    },
    "POST"
  )
}
