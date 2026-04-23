declare module "bip32-path" {
  export type BIPPath = {
    toPathArray: () => Array<number>
  }

  export function fromString(string): BIPPath
  export function fromArray(path: number[]): BIP32Path
}
