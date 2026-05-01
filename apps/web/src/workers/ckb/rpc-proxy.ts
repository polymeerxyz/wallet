import type { Client, TransactionLike } from "@ckb-ccc/core"

const BROADCAST_CHANNEL = "ckb-rpc-proxy"

type GetClientFn = (network: "mainnet" | "testnet") => Promise<Client>

interface ProxyRequest {
  type: "request"
  proxyId: string
  method: string
  params: unknown[]
}

async function publicNodeRequest(network: "mainnet" | "testnet", method: string, params: unknown[]): Promise<unknown> {
  const url = network === "mainnet" ? "https://mainnet.ckb.dev/" : "https://testnet.ckb.dev/"
  const raw = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: 0, jsonrpc: "2.0", method, params }),
  }).then((r) => r.json())
  return (raw as { result: unknown }).result ?? null
}

async function handleMethod(
  getClient: GetClientFn,
  method: string,
  params: unknown[],
  network: "mainnet" | "testnet"
): Promise<unknown> {
  if (method === "send_transaction") {
    const client = await getClient(network)
    return client.sendTransaction(params[0] as TransactionLike)
  }
  return publicNodeRequest(network, method, params)
}

export function setupRpcProxyChannel(getClient: GetClientFn, network: "mainnet" | "testnet"): () => void {
  const channel = new BroadcastChannel(BROADCAST_CHANNEL)

  channel.onmessage = async (ev: MessageEvent<ProxyRequest>) => {
    if (ev.data?.type !== "request") return
    const { proxyId, method, params } = ev.data

    try {
      const result = await handleMethod(getClient, method, params, network)
      channel.postMessage({ type: "response", proxyId, result })
    } catch (err: unknown) {
      channel.postMessage({
        type: "response",
        proxyId,
        error: {
          code: (err as { code?: number }).code ?? -32000,
          message: err instanceof Error ? err.message : String(err),
        },
      })
    }
  }

  return () => channel.close()
}
