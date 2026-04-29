import type {
  AbandonChannelParams,
  ConnectPeerParams,
  GetInvoiceResult,
  GetPaymentCommandResult,
  InvoiceParams,
  InvoiceResult,
  ListChannelsParams,
  ListChannelsResult,
  ListPeerResult,
  NewInvoiceParams,
  OpenChannelWithExternalFundingParams,
  OpenChannelWithExternalFundingResult,
  SendPaymentCommandParams,
  ShutdownChannelParams,
  SubmitSignedFundingTxParams,
  SubmitSignedFundingTxResult,
} from "@nervosnetwork/fiber-js"

export type WorkerMethod =
  | "UPDATE_CONFIG"
  | "CONNECT_PEER"
  | "LIST_PEERS"
  | "OPEN_CHANNEL_WITH_EXTERNAL_FUNDING"
  | "SUBMIT_SIGNED_FUNDING_TX"
  | "CLOSE_CHANNEL"
  | "ABANDON_CHANNEL"
  | "CREATE_INVOICE"
  | "LIST_CHANNELS"
  | "GET_INVOICE"
  | "CANCEL_INVOICE"
  | "SEND_PAYMENT"

export interface ConfigPayload {
  network: "mainnet" | "testnet"
  clientMode: "light" | "full"
  fiberSecretKeyHex: string
}

export interface WorkerTypeMap {
  UPDATE_CONFIG: { payload: ConfigPayload; result: Record<string, never> }
  CONNECT_PEER: { payload: ConnectPeerParams; result: string }
  LIST_PEERS: { payload: Record<string, never>; result: ListPeerResult }
  OPEN_CHANNEL_WITH_EXTERNAL_FUNDING: {
    payload: OpenChannelWithExternalFundingParams
    result: OpenChannelWithExternalFundingResult
  }
  SUBMIT_SIGNED_FUNDING_TX: {
    payload: SubmitSignedFundingTxParams
    result: SubmitSignedFundingTxResult
  }
  CLOSE_CHANNEL: { payload: ShutdownChannelParams; result: void }
  ABANDON_CHANNEL: { payload: AbandonChannelParams; result: void }
  CREATE_INVOICE: { payload: NewInvoiceParams; result: InvoiceResult }
  LIST_CHANNELS: { payload: ListChannelsParams; result: ListChannelsResult }
  GET_INVOICE: { payload: InvoiceParams; result: GetInvoiceResult }
  CANCEL_INVOICE: { payload: InvoiceParams; result: GetInvoiceResult }
  SEND_PAYMENT: { payload: SendPaymentCommandParams; result: GetPaymentCommandResult }
}

export type WorkerRequest = {
  [M in WorkerMethod]: {
    id: number
    method: M
    payload: WorkerTypeMap[M]["payload"]
  }
}[WorkerMethod]

export type WorkerResponse = {
  [M in WorkerMethod]: {
    id: number
    result?: WorkerTypeMap[M]["result"]
    error?: string
  }
}[WorkerMethod]
