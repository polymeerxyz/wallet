import { stringify } from "@ckb-ccc/core"

type Serialized<T> = T extends bigint
  ? string
  : T extends readonly [infer A, infer B, infer C]
    ? [Serialized<A>, Serialized<B>, Serialized<C>]
    : T extends readonly [infer A, infer B]
      ? [Serialized<A>, Serialized<B>]
      : T extends (infer U)[]
        ? Serialized<U>[]
        : T extends object
          ? { [K in keyof T]: Serialized<T[K]> }
          : T

export function toSerializable<T>(obj: T): Serialized<T> {
  return JSON.parse(stringify(obj))
}
