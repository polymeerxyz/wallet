import { stringifyYAML } from "confbox"

function stripTypeidDeps(scripts: any[]): any[] {
  return scripts
    .map((s) => ({
      ...s,
      cell_deps: s.cell_deps.filter((d: any) => !d.type_id),
    }))
    .filter((s) => s.cell_deps.length > 0)
}

const createConfig = (
  network: string,
  bootnodes: string[],
  scripts: any[],
  udtWhitelist: any[],
  isLightClient = false
) => {
  const rpcUrl = network === "mainnet" ? "https://mainnet.ckb.dev/" : "https://testnet.ckb.dev/"
  if (isLightClient) {
    scripts = stripTypeidDeps(scripts)
    udtWhitelist = stripTypeidDeps(udtWhitelist)
  }
  const config = {
    fiber: {
      listening_addr: "/ip4/0.0.0.0/tcp/8228",
      bootnode_addrs: bootnodes,
      announce_listening_addr: false,
      announced_addrs: [],
      chain: network,
      scripts: scripts,
    },
    rpc: {
      listening_addr: "127.0.0.1:8227",
    },
    ckb: {
      rpc_url: rpcUrl,
      udt_whitelist: udtWhitelist,
    },
    services: ["fiber", "rpc", "ckb"],
  }

  return stringifyYAML(config)
}

export const getFiberNodeConfig = (network: "mainnet" | "testnet", isLightClient = false) => {
  if (network === "mainnet") {
    return createConfig(
      "mainnet",
      [
        "/dns4/garrosh.fiber.channel/tcp/443/wss/p2p/QmZ2gCTfEF6vKsiYFF2STPeA2rRLRim9nMtzfwiE7uMQ4v",
        "/dns4/sylvanas.fiber.channel/tcp/443/wss/p2p/QmcMLnWraRyxd7PFRgvn1QeYRQS2DGsP6fPFCQjtfMs5b2",
      ],
      [
        {
          name: "FundingLock",
          script: {
            code_hash: "0xe45b1f8f21bff23137035a3ab751d75b36a981deec3e7820194b9c042967f4f1",
            hash_type: "type",
            args: "0x",
          },
          cell_deps: [
            {
              type_id: {
                code_hash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
                hash_type: "type",
                args: "0x64818d82a372312fb007c480391e1b9759d21b2c7f7959b9c177d72cdc243394",
              },
            },
            {
              cell_dep: {
                out_point: {
                  tx_hash: "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6",
                  index: "0x0",
                },
                dep_type: "code",
              },
            },
          ],
        },
        {
          name: "CommitmentLock",
          script: {
            code_hash: "0x2d45c4d3ed3e942f1945386ee82a5d1b7e4bb16d7fe1ab015421174ab747406c",
            hash_type: "type",
            args: "0x",
          },
          cell_deps: [
            {
              type_id: {
                code_hash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
                hash_type: "type",
                args: "0xdb16e6dcb17f670e5fb7c556d81e522ec5edb069ad2fa3e898e7ccea6c26a39f",
              },
            },
            {
              cell_dep: {
                out_point: {
                  tx_hash: "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6",
                  index: "0x0",
                },
                dep_type: "code",
              },
            },
          ],
        },
      ],
      [
        {
          name: "USDI",
          script: {
            code_hash: "0xbfa35a9c38a676682b65ade8f02be164d48632281477e36f8dc2f41f79e56bfc",
            hash_type: "type",
            args: "0xd591ebdc69626647e056e13345fd830c8b876bb06aa07ba610479eb77153ea9f",
          },
          cell_deps: [
            {
              type_id: {
                code_hash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
                hash_type: "type",
                args: "0x9105ea69838511ca609518d27855c53fed1b5ffaff4cfb334f58b40627d211c4",
              },
            },
          ],
          auto_accept_amount: 10000000,
        },
      ],
      isLightClient
    )
  } else {
    return createConfig(
      "testnet",
      [
        "/dns4/fiber.nervosscan.com/tcp/443/wss/p2p/QmYGNtMg2MkoXdDgbVd4YfDNh3mATJ2K8EUBw4FCHTrHT4",
        "/dns4/fiber.funfungho.xyz/tcp/443/wss/p2p/QmNY3pSMng8Jm4DYpNvsW9j4fJKTFQVmyuZWQ74XfubZYQ",
        "/dns4/bottle.fiber.channel/tcp/443/wss/p2p/QmXen3eUHhywmutEzydCsW4hXBoeVmdET2FJvMX69XJ1Eo",
        "/dns4/bracer.fiber.channel/tcp/443/wss/p2p/QmbKyzq9qUmymW2Gi8Zq7kKVpPiNA1XUJ6uMvsUC4F3p89",
        "/dns4/thrall.fiber.channel/tcp/443/wss/p2p/Qmes1EBD4yNo9Ywkfe6eRw9tG1nVNGLDmMud1xJMsoYFKy",
        "/dns4/onyxia.fiber.channel/tcp/443/wss/p2p/QmdyQWjPtbK4NWWsvy8s69NGJaQULwgeQDT5ZpNDrTNaeV",
      ],
      [
        {
          name: "FundingLock",
          script: {
            code_hash: "0x6c67887fe201ee0c7853f1682c0b77c0e6214044c156c7558269390a8afa6d7c",
            hash_type: "type",
            args: "0x",
          },
          cell_deps: [
            {
              type_id: {
                code_hash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
                hash_type: "type",
                args: "0x3cb7c0304fe53f75bb5727e2484d0beae4bd99d979813c6fc97c3cca569f10f6",
              },
            },
            {
              cell_dep: {
                out_point: {
                  tx_hash: "0x12c569a258dd9c5bd99f632bb8314b1263b90921ba31496467580d6b79dd14a7",
                  index: "0x0",
                },
                dep_type: "code",
              },
            },
          ],
        },
        {
          name: "CommitmentLock",
          script: {
            code_hash: "0x740dee83f87c6f309824d8fd3fbdd3c8380ee6fc9acc90b1a748438afcdf81d8",
            hash_type: "type",
            args: "0x",
          },
          cell_deps: [
            {
              type_id: {
                code_hash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
                hash_type: "type",
                args: "0xf7e458887495cf70dd30d1543cad47dc1dfe9d874177bf19291e4db478d5751b",
              },
            },
            {
              cell_dep: {
                out_point: {
                  tx_hash: "0x12c569a258dd9c5bd99f632bb8314b1263b90921ba31496467580d6b79dd14a7",
                  index: "0x0",
                },
                dep_type: "code",
              },
            },
          ],
        },
      ],
      [
        {
          name: "RUSD",
          script: {
            code_hash: "0x1142755a044bf2ee358cba9f2da187ce928c91cd4dc8692ded0337efa677d21a",
            hash_type: "type",
            args: "0x878fcc6f1f08d48e87bb1c3b3d5083f23f8a39c5d5c764f253b55b998526439b",
          },
          cell_deps: [
            {
              type_id: {
                code_hash: "0x00000000000000000000000000000000000000000000000000545950455f4944",
                hash_type: "type",
                args: "0x97d30b723c0b2c66e9cb8d4d0df4ab5d7222cbb00d4a9a2055ce2e5d7f0d8b0f",
              },
            },
          ],
          auto_accept_amount: 1000000000,
        },
      ],
      isLightClient
    )
  }
}
