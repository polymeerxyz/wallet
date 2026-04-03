export type {
  AnnotatedCellInput,
  AnnotatedRawTransaction,
  AnnotatedTransaction,
} from "./schema"

export interface AppConfiguration {
  version: string
  hash: string
}

export interface WalletPublicKey {
  publicKey: string
  lockArg: string
  address: string
}

export interface ExtendPublicKey {
  publicKey: string
  chainCode: string
}
