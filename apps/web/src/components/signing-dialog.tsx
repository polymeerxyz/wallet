import { type Hex, hexFrom, stringify, Transaction, WitnessArgs } from "@ckb-ccc/core"
import { AlertCircleIcon, CheckmarkCircle02Icon, PencilEdit01Icon, Settings03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle, Spinner, toast } from "@polymeer/ui"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"

import { useAddress } from "@/hooks/use-address"
import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { useFiberWorker } from "@/hooks/use-fiber-worker"
import { useLedgerDevice } from "@/hooks/use-ledger-device"
import { formatAmount, getExplorerLink } from "@/lib/utils"
import { useConfigStore } from "@/stores/config.store"
import { useSigningStore } from "@/stores/signing.store"
import { useWalletStore } from "@/stores/wallet.store"
import type { BuildResult } from "@/workers/ckb/types"

import { BalanceDisplay } from "./balance-display"

type SigningStatus = "building" | "review" | "signing" | "broadcasting" | "success" | "error"

export function SigningDialog() {
  const navigate = useNavigate()
  const { isOpen, config, close } = useSigningStore()
  const network = useConfigStore((s) => s.network)
  const worker = useCkbWorker()
  const fiberWorker = useFiberWorker()
  const { device, connect } = useLedgerDevice()
  const { scriptsWithPaths } = useAddress()

  const [status, setStatus] = useState<SigningStatus>("building")
  const [error, setError] = useState<string | null>(null)
  const [builtTx, setBuiltTx] = useState<BuildResult | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus("building")
    setError(null)
    setBuiltTx(null)
    setTxHash(null)
  }, [])

  const handleBuild = useCallback(async () => {
    if (!config || !scriptsWithPaths.length) return

    try {
      setStatus("building")
      let res
      switch (config.type) {
        case "transfer": {
          res = await worker.buildSendCkb(
            scriptsWithPaths,
            config.payload.recipient,
            config.payload.amount,
            config.payload.feeRate
          )
          break
        }
        case "dao_deposit": {
          res = await worker.buildDaoDeposit(scriptsWithPaths, config.payload.amount, config.payload.feeRate)
          break
        }
        case "dao_withdraw":
        case "dao_claim": {
          const cell = await worker.getCell(config.payload.txHash, config.payload.index)
          if (!cell) throw new Error("Could not find the selected cell. It might have been spent.")
          res = await worker.buildDaoAction(scriptsWithPaths, cell, config.payload.feeRate)
          break
        }
        case "fiber_open_channel": {
          res = await worker.buildFiberFunding(scriptsWithPaths, config.payload.tx)
          break
        }
      }
      setBuiltTx(res)
      setStatus("review")
    } catch (err: unknown) {
      console.error("Build failed:", err)
      setError(err instanceof Error ? err.message : "Failed to prepare transaction")
      setStatus("error")
    }
  }, [config, scriptsWithPaths, worker])

  const handleSign = useCallback(async () => {
    if (!builtTx || !builtTx.signPaths[0] || !config) {
      setError("No transaction to sign or missing signature path")
      setStatus("error")
      return
    }

    try {
      setStatus("signing")

      let ledger = device
      if (!ledger) {
        ledger = await connect()
      }
      if (!ledger) throw new Error("Ledger not connected. Check device and app.")
      const targetIndex = builtTx.targetWitnessIndex !== undefined ? builtTx.targetWitnessIndex : 0
      const groupWitnesses = [
        builtTx.witnesses[targetIndex],
        ...builtTx.witnesses.slice(builtTx.tx.inputs?.length ?? 0),
      ]

      const signatureRaw = await ledger.signTransaction(
        builtTx.signPaths[0],
        builtTx.tx,
        groupWitnesses,
        builtTx.contexts,
        builtTx.signPaths[0]
      )

      setStatus("broadcasting")

      const tx = Transaction.from(builtTx.tx)

      // Find the precise index to write the signature into. Use provided targetWitnessIndex or default to 0.

      const signature = (signatureRaw.startsWith("0x") ? signatureRaw : `0x${signatureRaw}`) as Hex
      const witnessArgs = WitnessArgs.fromBytes(tx.witnesses[targetIndex] || "0x")
      witnessArgs.lock = signature
      tx.witnesses[targetIndex] = hexFrom(witnessArgs.toBytes())

      if (config.type === "fiber_open_channel") {
        // Restore original witnesses before final serialization so the fiber node receives the complete transaction
        if (builtTx.originalWitnesses) {
          const finalWitnesses = [...builtTx.originalWitnesses] as Hex[]
          finalWitnesses[targetIndex] = tx.witnesses[targetIndex] as Hex
          tx.witnesses = finalWitnesses
        }

        const signedTxRpc = JSON.parse(stringify(tx))
        const res = await fiberWorker.submitSignedFundingTx({
          channel_id: config.payload.channelId as Hex,
          signed_funding_tx: signedTxRpc,
        })
        setTxHash(res.funding_tx_hash)
        toast.success("Funding transaction submitted!")
      } else {
        const hash = await worker.sendTransaction(tx)
        setTxHash(hash)
        toast.success("Transaction broadcasted!")
      }
      setStatus("success")
    } catch (err: unknown) {
      console.error("Signing failed:", err)
      setError(err instanceof Error ? err.message : "User denied or connection lost")
      setStatus("error")
    }
  }, [builtTx, config, device, fiberWorker, worker, connect])

  const handleDone = useCallback(() => {
    close()
    navigate({ to: config?.type === "fiber_open_channel" ? "/fiber" : "/" })
  }, [close, config, navigate])

  useEffect(() => {
    if (isOpen && config) {
      reset()
      handleBuild()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, config, reset])

  const getTitle = () => {
    if (!config) return "Sign Transaction"
    switch (config.type) {
      case "transfer":
        return "Confirm Transfer"
      case "dao_deposit":
        return "DAO Deposit"
      case "dao_withdraw":
        return "DAO Withdraw"
      case "dao_claim":
        return "DAO Claim"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="bg-background max-w-[90vw] overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[400px]">
        {/* Standardized Header with Icon */}
        <div className="bg-muted/5 border-border/10 flex flex-col items-center border-b p-6 text-center">
          <div className="bg-primary/10 mb-3 flex h-14 w-14 items-center justify-center rounded-2xl">
            <HugeiconsIcon icon={PencilEdit01Icon} className="text-primary" size={28} />
          </div>
          <DialogTitle className="text-lg font-bold">{getTitle()}</DialogTitle>
          <DialogDescription className="text-muted-foreground/70 text-tiny mt-0.5 font-semibold uppercase">
            Review and Sign Transaction
          </DialogDescription>
        </div>

        <div className="p-6 pt-0">
          {status === "building" && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="bg-primary/5 border-primary/20 relative flex h-16 w-16 items-center justify-center rounded-2xl border">
                <Spinner className="text-primary h-6 w-6" />
                <div className="bg-primary/10 absolute inset-0 animate-pulse rounded-2xl" />
              </div>
              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold">Building</h3>
                <p className="text-muted-foreground/60 text-tiny font-semibold uppercase">Preparing transaction...</p>
              </div>
            </div>
          )}

          {status === "review" && builtTx && config && (
            <div className="animate-in fade-in space-y-3 duration-300">
              <div className="bg-muted/5 border-border/40 space-y-3 rounded-2xl border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-tiny font-semibold uppercase">Intent</span>
                  <span className="bg-primary/10 text-primary text-tiny rounded-lg px-2 py-0.5 font-semibold uppercase">
                    {config.type.replace("_", " ")}
                  </span>
                </div>

                {config.type === "transfer" && (
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-tiny font-semibold uppercase">Recipient</span>
                    <div className="bg-background/50 border-border/20 rounded-xl border p-3">
                      <p className="text-foreground text-xs leading-relaxed font-bold break-all opacity-80">
                        {config.payload.recipient}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-tiny font-semibold uppercase">
                      {config.type === "fiber_open_channel" ? "Funding Amount" : "Amount"}
                    </span>
                    <BalanceDisplay
                      amount={
                        config.type === "fiber_open_channel"
                          ? BigInt(config.payload.amount)
                          : (builtTx.tx.outputs?.[0]?.capacity ?? BigInt(0))
                      }
                      size="sm"
                    />
                  </div>

                  <div className="border-border/10 flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground text-tiny font-semibold uppercase">Fee</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-foreground text-xs font-bold">{formatAmount(builtTx.fee)}</span>
                      <span className="text-muted-foreground text-tiny font-semibold">CKB</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {useWalletStore.getState().isReadOnly ? (
                  <div className="bg-warning/5 border-warning/20 space-y-4 rounded-2xl border p-5 text-center">
                    <div className="bg-warning/10 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl">
                      <HugeiconsIcon icon={AlertCircleIcon} className="text-warning" size={24} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-warning text-sm font-bold">View-only Wallet</p>
                      <p className="text-muted-foreground text-tiny leading-relaxed font-medium">
                        Hardware wallet is not connected. Connect your Ledger device to sign securely.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="h-12 w-full rounded-2xl text-base font-bold shadow-none active:scale-[0.98]"
                    onClick={handleSign}
                  >
                    Confirm on Ledger
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="text-muted-foreground/60 hover:text-foreground text-tiny h-10 w-full rounded-2xl font-semibold uppercase"
                  onClick={close}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {(status === "signing" || status === "broadcasting") && (
            <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-3 py-6 text-center duration-500">
              <div className="relative">
                <div className="bg-primary/5 border-primary/20 flex h-16 w-16 items-center justify-center rounded-2xl border">
                  <HugeiconsIcon icon={Settings03Icon} size={28} className="text-primary animate-spin opacity-80" />
                </div>
                <div className="bg-primary absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 animate-ping rounded-full opacity-75" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">{status === "signing" ? "Sign on Ledger" : "Broadcasting"}</h3>
                <p className="text-muted-foreground/60 px-6 text-[10px] font-semibold uppercase">
                  {status === "signing" ? "Check your device and confirm details" : "Sending to Nervos Network..."}
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-3 py-6 text-center duration-500">
              <div className="bg-success shadow-success/20 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} className="text-secondary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold">Sent Successfully</h3>
                <p className="text-muted-foreground px-4 text-[13px] font-medium opacity-80">
                  Transaction has been broadcasted.
                </p>
              </div>
              <div className="w-full space-y-3 px-2">
                <div className="bg-muted/5 border-border/40 space-y-2 rounded-2xl border p-4 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-tiny font-semibold uppercase">Hash</span>
                    <span className="text-foreground text-tiny font-semibold opacity-60">
                      {txHash?.slice(0, 8)}...{txHash?.slice(-8)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="h-12 w-full rounded-2xl text-base font-bold active:scale-[0.98]"
                    onClick={handleDone}
                  >
                    Done
                  </Button>
                  {txHash && (
                    <Button
                      variant="ghost"
                      className="text-muted-foreground/60 hover:text-foreground text-tiny h-12 w-full rounded-2xl font-semibold uppercase"
                      onClick={() => window.open(getExplorerLink(txHash, network), "_blank")}
                    >
                      View on Explorer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-4 py-8 text-center duration-500">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-500 shadow-2xl shadow-rose-500/10">
                <HugeiconsIcon icon={AlertCircleIcon} size={32} className="text-white" />
              </div>
              <div className="space-y-1 px-6">
                <h3 className="text-xl font-bold">Something Went Wrong</h3>
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <p className="text-xs font-semibold break-words text-rose-500">{error}</p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 px-2">
                <Button
                  className="h-14 w-full rounded-2xl text-base font-bold active:scale-[0.98]"
                  onClick={handleBuild}
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  className="text-muted-foreground/60 hover:text-foreground text-tiny h-12 w-full rounded-2xl font-semibold uppercase"
                  onClick={close}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
