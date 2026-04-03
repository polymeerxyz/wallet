import type { TransactionLike } from "@ckb-ccc/core"

export const transaction: TransactionLike = {
  version: "0x0",
  cellDeps: [
    {
      outPoint: {
        txHash: "0xa563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541",
        index: "0x2",
      },
      depType: "code",
    },
    {
      outPoint: {
        txHash: "0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708",
        index: "0x0",
      },
      depType: "depGroup",
    },
  ],
  headerDeps: [],
  inputs: [
    {
      since: "0x0000000000000000",
      previousOutput: {
        txHash: "0xb1b547956a0dfb7ea618231563b3acd23607586e939f88e5a6db5f392b2e78d5",
        index: "0x1",
      },
    },
    {
      since: "0x0000000000000000",
      previousOutput: {
        txHash: "0x258e82bab2af21fd8899fc872742f4acea831f5e4c232297816b9bf4a19597a9",
        index: "0x0",
      },
    },
  ],
  outputs: [
    {
      capacity: "0x00e8764817000000",
      lock: {
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0xe5260d839a786ac2a909181df9a423f1efbe863d",
      },
      type: undefined,
    },
    {
      capacity: "0xe91c708e17000000",
      lock: {
        codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0xe5260d839a786ac2a909181df9a423f1efbe863d",
      },
      type: undefined,
    },
  ],
  outputsData: ["0x", "0x"],
  witnesses: ["0x", "0x"],
}

export const contexts: TransactionLike[] = [
  {
    version: "0x0",
    cellDeps: [
      {
        outPoint: {
          txHash: "0xa563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541",
          index: "0x2",
        },
        depType: "code",
      },
      {
        outPoint: {
          txHash: "0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708",
          index: "0x0",
        },
        depType: "depGroup",
      },
    ],
    headerDeps: ["0x327f1fc62c53530c6c27018f1e8cee27c35c0370c3b4d3376daf8fe110e7d8cb"],
    inputs: [
      {
        since: "0x0000000000000000",
        previousOutput: {
          txHash: "0xc399495011b912999dbc72cf54982924e328ae170654ef76c8aba190ca376307",
          index: "0x0",
        },
      },
      {
        since: "0x0000000000000000",
        previousOutput: {
          txHash: "0xc317d0b0b2a513ab1206e6d454c1960de7d7b4b80d0748a3e1f9cb197b74b8a5",
          index: "0x1",
        },
      },
    ],
    outputs: [
      {
        capacity: "0x00e8764817000000",
        lock: {
          codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hashType: "type",
          args: "0xe5260d839a786ac2a909181df9a423f1efbe863d",
        },
        type: {
          codeHash: "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
          hashType: "type",
          args: "0x",
        },
      },
      {
        capacity: "0x64e5b27317000000",
        lock: {
          codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hashType: "type",
          args: "0xe5260d839a786ac2a909181df9a423f1efbe863d",
        },
        type: undefined,
      },
    ],
    outputsData: ["0x5207000000000000", "0x"],
    witnesses: ["0x", "0x"],
  },
  {
    version: "0x0",
    cellDeps: [
      {
        outPoint: {
          txHash: "0xa563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541",
          index: "0x2",
        },
        depType: "code",
      },
      {
        outPoint: {
          txHash: "0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708",
          index: "0x0",
        },
        depType: "depGroup",
      },
    ],
    headerDeps: [
      "0x327f1fc62c53530c6c27018f1e8cee27c35c0370c3b4d3376daf8fe110e7d8cb",
      "0x4930ba433e606a53f4f283f02dddeb6d51b0dc3e463629b14a27995de9c71eca",
    ],
    inputs: [
      {
        since: "0xba08000000010020",
        previousOutput: {
          txHash: "0xb1b547956a0dfb7ea618231563b3acd23607586e939f88e5a6db5f392b2e78d5",
          index: "0x0",
        },
      },
    ],
    outputs: [
      {
        capacity: "0xc561436317000000",
        lock: {
          codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hashType: "type",
          args: "0xe5260d839a786ac2a909181df9a423f1efbe863d",
        },
        type: undefined,
      },
    ],
    outputsData: ["0x"],
    witnesses: ["0x", "0x"],
  },
]

export const witnesses = [
  "55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "",
]

export const signPath = "44'/309'/1/0"
export const changePath = "44'/309'/1/0"
