import { bytesFrom, stringify } from "@ckb-ccc/core"
import type {
  AbandonChannelParams,
  Channel,
  CkbJsonRpcTransaction,
  Fiber,
  GetInvoiceResult,
  GetPaymentCommandParams,
  GetPaymentCommandResult,
  InvoiceParams,
  InvoiceResult,
  ListPeerResult,
  NewInvoiceParams,
  OpenChannelWithExternalFundingParams,
  OpenChannelWithExternalFundingResult,
  ParseInvoiceResult,
  SendPaymentCommandParams,
} from "@nervosnetwork/fiber-js"

export type ChannelStatus = "good" | "warn" | "idle" | "error"

export type ChannelSummary = {
  id: string
  status: ChannelStatus
  statusLabel: string
  balance: number
  isReady: boolean
  rawStateName?: string
}

export type PayInvoiceInfo = {
  invoiceAddress: string
  paymentHash: string
  currency: string
  amountCkb: number | null
  expiry: string
  description: string
}

type RelayInfo = {
  address: string
  peerId: string
}

type CompatPeerInfo = {
  address?: string
  peer_id?: string
  pubkey?: string
}

const OPEN_CHANNEL_INIT_RETRY_ATTEMPTS = 80
const OPEN_CHANNEL_INIT_RETRY_INTERVAL_MS = 300
const SUBMIT_SIGNED_FUNDING_TX_RETRY_ATTEMPTS = 30
const SUBMIT_SIGNED_FUNDING_TX_RETRY_INTERVAL_MS = 500

const isHex32 = (value: string) => /^0x[0-9a-fA-F]{64}$/.test(value)

const parsePeerId = (address: string): string => address.trim().match(/\/p2p\/([^/]+)(?:\/|$)/)?.[1] ?? ""

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message
  }
  return String(error)
}

const isPeerInitPendingError = (error: unknown): boolean =>
  getErrorMessage(error).includes("waiting for peer to send Init message")

const isSubmitSignedFundingTxRetryableError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes("channelnotfound") ||
    message.includes("channel is closed") ||
    message.includes("peer not found") ||
    message.includes("messaging failed")
  )
}

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex
  if (clean.length % 2 !== 0) {
    throw new Error("Invalid hex length")
  }
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16)
  }
  return out
}

const bytesToHex = (bytes: Uint8Array): `0x${string}` => {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  return `0x${hex}`
}

const toRpcHexNumber = (value: string | number | bigint): `0x${string}` => {
  if (typeof value === "string") {
    return (value.startsWith("0x") ? value : `0x${BigInt(value).toString(16)}`) as `0x${string}`
  }
  return `0x${BigInt(value).toString(16)}`
}

const parseHexToBigInt = (value?: string): bigint | null => {
  if (!value) {
    return null
  }
  try {
    return BigInt(value)
  } catch {
    return null
  }
}

const hexShannonsToCkb = (value?: string): number | null => {
  const amount = parseHexToBigInt(value)
  return amount === null ? null : Number(amount) / 100_000_000
}

const readInvoiceAttr = (attrs: Array<Record<string, unknown>>, key: string): string => {
  const matched = attrs.find((attr) => key in attr)
  if (!matched) {
    return "--"
  }
  const value = matched[key]
  return typeof value === "string" ? value : String(value)
}

export const getChannelStatusTone = (stateName?: string): ChannelStatus => {
  switch (stateName?.toLowerCase()) {
    case "ready":
    case "channelready":
    case "established":
    case "running":
      return "good"
    case "syncing":
    case "awaiting_tx_signatures":
    case "awaitingchannelready":
    case "awaitingtxsignatures":
    case "collaboratingfundingtx":
    case "signingcommitment":
      return "warn"
    case "awaiting_peer":
    case "connecting":
    case "negotiatingfunding":
      return "idle"
    case "closed":
    case "shutting_down":
      return "error"
    default:
      return "idle"
  }
}

export const normalizeChannelStateName = (stateName?: string): string | undefined => stateName?.trim().toLowerCase()

export const isCreatedChannelReady = (stateName?: string): boolean => {
  const normalized = normalizeChannelStateName(stateName)
  return (
    normalized === "ready" || normalized === "channelready" || normalized === "established" || normalized === "running"
  )
}

export const isCreatedChannelCollaborating = (stateName?: string): boolean => {
  const normalized = normalizeChannelStateName(stateName)
  return (
    normalized === "negotiatingfunding" ||
    normalized === "collaboratingfundingtx" ||
    normalized === "signingcommitment" ||
    normalized === "awaitingtxsignatures" ||
    normalized === "awaitingchannelready"
  )
}

export const isCreatedChannelFailed = (stateName?: string): boolean => {
  const normalized = normalizeChannelStateName(stateName)
  if (!normalized) {
    return false
  }

  return (
    normalized === "closed" ||
    normalized === "shutting_down" ||
    normalized === "shutdown" ||
    normalized === "failed" ||
    normalized === "error" ||
    normalized.includes("fail") ||
    normalized.includes("error")
  )
}

export const toChannelSummary = (channel: Channel): ChannelSummary => {
  const rawStateName = (channel as { state?: { state_name?: string } }).state?.state_name
  const localBalance = BigInt(channel.local_balance || "0x0")
  return {
    id: channel.channel_id,
    status: getChannelStatusTone(rawStateName),
    statusLabel: rawStateName || "Unknown",
    balance: Number(localBalance) / 100_000_000,
    isReady: isCreatedChannelReady(rawStateName),
    rawStateName,
  }
}

export const buildPayInvoiceInfo = (targetValue: string, invoice: ParseInvoiceResult["invoice"]): PayInvoiceInfo => {
  const attrs = invoice.data.attrs as unknown as Array<Record<string, unknown>>
  return {
    invoiceAddress: targetValue,
    paymentHash: invoice.data.payment_hash,
    currency: invoice.currency,
    amountCkb: hexShannonsToCkb(invoice.amount),
    expiry: readInvoiceAttr(attrs, "ExpiryTime"),
    description: readInvoiceAttr(attrs, "Description"),
  }
}

export class FiberClient {
  private clientNetwork: "mainnet" | "testnet"
  private fc: Fiber

  constructor(network: "mainnet" | "testnet", fiberClient: Fiber) {
    this.clientNetwork = network
    this.fc = fiberClient
  }

  async start(config: string, secret: string): Promise<void> {
    await this.fc.start(config, bytesFrom(secret), undefined, undefined, "info", `/data/${this.clientNetwork}/fiber`)
  }

  async stop(): Promise<void> {
    await this.fc.stop()
  }

  parseRelayInfo(address: string): RelayInfo {
    const peerId = parsePeerId(address)
    if (!peerId) {
      throw new Error("Target node address must include /p2p/<peer-id>")
    }
    return {
      address: address.trim(),
      peerId,
    }
  }

  async connectPeer(info: RelayInfo): Promise<string> {
    const fiber = this.assertStarted()

    console.log("[fiber-wasm] connectPeer begin", info)
    await fiber.connectPeer({ address: info.address })
    console.log("[fiber-wasm] connectPeer rpc submitted", info)

    for (let i = 0; i < 20; i += 1) {
      const peers = await fiber.listPeers()
      const found = (peers.peers as CompatPeerInfo[]).find((peer) => {
        if (peer.peer_id) {
          return peer.peer_id === info.peerId
        }
        return peer.address === info.address
      })
      console.log("[fiber-wasm] connectPeer poll", {
        attempt: i + 1,
        targetPeerId: info.peerId,
        peerCount: peers.peers.length,
        found: Boolean(found),
      })
      if (found?.pubkey) {
        console.log("[fiber-wasm] connectPeer success", info)
        return found.pubkey
      }
      await sleep(400)
    }

    console.error("[fiber-wasm] connectPeer timeout", info)
    throw new Error("Peer connection timeout")
  }

  async listRawChannels(): Promise<Channel[]> {
    const result = await this.assertStarted().listChannels({})
    return result.channels
  }

  async listChannels(): Promise<ChannelSummary[]> {
    const fiberChannels = await this.listRawChannels()
    return fiberChannels.map(toChannelSummary)
  }

  async getChannelInfo(channelId: string): Promise<ChannelSummary | null> {
    const targetId = channelId.trim().toLowerCase()
    if (!targetId) {
      throw new Error("channelId is required")
    }

    const channels = await this.listChannels()
    return channels.find((channel) => channel.id.toLowerCase() === targetId) ?? null
  }

  async parseInvoice(invoice: string): Promise<ParseInvoiceResult> {
    const trimmed = invoice.trim()
    if (!trimmed) {
      throw new Error("invoice id is required")
    }

    return this.assertStarted().parseInvoice({
      invoice: trimmed,
    })
  }

  async lookupInvoice(invoice: string): Promise<PayInvoiceInfo> {
    const parsed = await this.parseInvoice(invoice)
    return buildPayInvoiceInfo(invoice.trim(), parsed.invoice)
  }

  async createInvoice(params: NewInvoiceParams): Promise<InvoiceResult> {
    return this.assertStarted().newInvoice(params)
  }

  async getInvoice(params: InvoiceParams): Promise<GetInvoiceResult> {
    return this.assertStarted().getInvoice(params)
  }

  async waitInvoicePaid(paymentHash: `0x${string}`, onTick?: (status: string) => void): Promise<GetInvoiceResult> {
    while (true) {
      const result = await this.getInvoice({ payment_hash: paymentHash })
      onTick?.(result.status)
      if (result.status === "Received" || result.status === "Paid") {
        return result
      }
      if (result.status === "Cancelled") {
        throw new Error("Invoice was cancelled")
      }
      await sleep(500)
    }
  }

  async sendPayment(params: SendPaymentCommandParams): Promise<GetPaymentCommandResult> {
    return this.assertStarted().sendPayment(params)
  }

  async getPaymentStatus(params: GetPaymentCommandParams): Promise<GetPaymentCommandResult> {
    return this.assertStarted().getPayment(params)
  }

  async openChannel(params: OpenChannelWithExternalFundingParams): Promise<OpenChannelWithExternalFundingResult> {
    const fiber = this.assertStarted()
    let result: OpenChannelWithExternalFundingResult | undefined

    for (let i = 0; i < OPEN_CHANNEL_INIT_RETRY_ATTEMPTS; i += 1) {
      try {
        result = await fiber.openChannelWithExternalFunding(params)
        break
      } catch (error) {
        if (!isPeerInitPendingError(error) || i === OPEN_CHANNEL_INIT_RETRY_ATTEMPTS - 1) {
          throw error
        }

        console.warn("[fiber-wasm] peer init not ready, retrying openChannelWithExternalFunding", {
          attempt: i + 1,
          maxAttempts: OPEN_CHANNEL_INIT_RETRY_ATTEMPTS,
          pubkey: params.pubkey,
        })
        await sleep(OPEN_CHANNEL_INIT_RETRY_INTERVAL_MS)
      }
    }

    if (!result) {
      throw new Error("openChannelWithExternalFunding returned no result")
    }

    console.log(`openChannelWithExternalFunding Res: ${stringify(result)}`)
    const normalized = result as {
      channel_id?: `0x${string}`
      temporary_channel_id?: `0x${string}`
      unsigned_funding_tx: CkbJsonRpcTransaction
    }
    const channelId = normalized.channel_id ?? normalized.temporary_channel_id
    if (!channelId) {
      throw new Error("Missing channel id in openChannelWithExternalFunding result")
    }

    return {
      channel_id: channelId,
      unsigned_funding_tx: normalized.unsigned_funding_tx,
    }
  }

  async waitChannelReady(
    channelId: string,
    onTick?: (channel: ChannelSummary | null) => Promise<void> | void
  ): Promise<ChannelSummary | null> {
    while (true) {
      const channel = await this.getChannelInfo(channelId)
      await onTick?.(channel)

      if (!channel) {
        return null
      }
      if (isCreatedChannelReady(channel.rawStateName) || isCreatedChannelFailed(channel.rawStateName)) {
        return channel
      }

      await sleep(500)
    }
  }

  async submitSignedFundingTx(channelId: string, signedTx: CkbJsonRpcTransaction) {
    return this.assertStarted().submitSignedFundingTx({
      channel_id: channelId as `0x${string}`,
      signed_funding_tx: signedTx,
    })
  }

  async submitSignedFundingTxWithRetry(channelId: string, signedTx: CkbJsonRpcTransaction) {
    const fiber = this.assertStarted()

    for (let i = 0; i < SUBMIT_SIGNED_FUNDING_TX_RETRY_ATTEMPTS; i += 1) {
      try {
        return await fiber.submitSignedFundingTx({
          channel_id: channelId as `0x${string}`,
          signed_funding_tx: signedTx,
        })
      } catch (error) {
        if (!isSubmitSignedFundingTxRetryableError(error) || i === SUBMIT_SIGNED_FUNDING_TX_RETRY_ATTEMPTS - 1) {
          throw error
        }

        console.warn("[fiber-wasm] submitSignedFundingTx not ready, retrying", {
          attempt: i + 1,
          maxAttempts: SUBMIT_SIGNED_FUNDING_TX_RETRY_ATTEMPTS,
          channelId,
          message: getErrorMessage(error),
        })
        await sleep(SUBMIT_SIGNED_FUNDING_TX_RETRY_INTERVAL_MS)
      }
    }
  }

  async listPeers(): Promise<ListPeerResult> {
    return this.assertStarted().listPeers()
  }

  async closeChannel(channelId: string, force?: boolean) {
    return this.assertStarted().shutdownChannel({
      channel_id: channelId as `0x${string}`,
      force,
    })
  }

  async abandonChannel(params: AbandonChannelParams): Promise<void> {
    return this.assertStarted().abandonChannel(params)
  }

  async cancelInvoice(params: InvoiceParams): Promise<GetInvoiceResult> {
    return this.assertStarted().cancelInvoice(params)
  }

  getFiberInstance(): Fiber | null {
    return this.fc
  }

  private assertStarted(): Fiber {
    if (!this.fc) {
      throw new Error("Fiber node not initialized. Please click Init Fiber Node first.")
    }
    return this.fc
  }
}
