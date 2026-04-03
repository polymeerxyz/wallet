import {
  type Cell,
  type Client,
  type HexLike,
  KnownScript,
  type NumLike,
  Script,
} from "@ckb-ccc/core"

/**
 * Get a specific cell by its transaction hash and index.
 */
export async function getCell(
  client: Client,
  txHash: HexLike,
  index: NumLike
): Promise<Cell | null> {
  const cell = await client.getCell({ txHash, index })
  return cell ?? null
}

/**
 * Get all Nervos DAO cells for the provided lock scripts.
 */
export async function getDaoCells(client: Client, scripts: Script[]): Promise<Cell[]> {
  const daoScript = await Script.fromKnownScript(client, KnownScript.NervosDao, "0x")
  const cells: Cell[] = []

  for (const script of scripts) {
    for await (const cell of client.findCells(
      {
        script,
        scriptType: "lock",
        scriptSearchMode: "exact",
        filter: {
          script: daoScript,
        },
      },
      "asc"
    )) {
      cells.push(cell)
    }
  }

  return cells
}
