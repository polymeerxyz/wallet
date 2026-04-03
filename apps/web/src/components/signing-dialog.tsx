import { type Hex, hexFrom, Transaction, WitnessArgs } from "@ckb-ccc/core"
import { AlertCircleIcon, CheckmarkCircle02Icon, Settings03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Spinner, toast } from "@polymeer/ui"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect, useState } from "react"

import { useAddress } from "@/hooks/use-address"
import { useCkbWorker } from "@/hooks/use-ckb-worker"
import { useLedgerDevice } from "@/hooks/use-ledger-device"
import { formatAmount, getExplorerLink } from "@/lib/utils"
import { useSigningStore } from "@/stores/signing.store"
import { useWalletStore } from "@/stores/wallet.store"
import type { BuildResult } from "@/workers/ckb/types"

type SigningStatus = "building" | "review" | "signing" | "broadcasting" | "success" | "error"

export function SigningDialog() {
  const navigate = useNavigate()
  const { isOpen, config, close } = useSigningStore()
  const network = useWalletStore((s) => s.network)
  const worker = useCkbWorker()
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
    if (!builtTx || !builtTx.signPaths[0]) {
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

      const signatureRaw = await ledger.signTransaction(
        builtTx.signPaths[0],
        builtTx.tx,
        builtTx.witnesses,
        builtTx.contexts,
        builtTx.signPaths[0]
      )

      setStatus("broadcasting")

      const signature = (signatureRaw.startsWith("0x") ? signatureRaw : `0x${signatureRaw}`) as Hex
      const tx = Transaction.from(builtTx.tx)
      const witnessArgs = WitnessArgs.fromBytes(builtTx.witnesses[0])
      witnessArgs.lock = signature
      tx.witnesses[0] = hexFrom(witnessArgs.toBytes())

      const hash = await worker.sendTransaction(tx)
      setTxHash(hash)
      setStatus("success")
      toast.success("Transaction broadcasted!")
    } catch (err: unknown) {
      console.error("Signing failed:", err)
      setError(err instanceof Error ? err.message : "User denied or connection lost")
      setStatus("error")
    }
  }, [builtTx, device, worker, connect])

  const handleDone = useCallback(() => {
    close()
    navigate({ to: "/" })
  }, [close, navigate])

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
      <DialogContent className="bg-background max-w-[420px] overflow-hidden rounded-[2rem] border-none p-0 shadow-2xl">
        <DialogHeader className="px-8 pt-8 text-left">
          <DialogTitle className="text-2xl font-black tracking-tight">{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="p-8">
          {status === "building" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <Spinner className="text-primary h-10 w-10" />
              <p className="text-muted-foreground text-sm font-bold tracking-tight">Preparing your transaction...</p>
            </div>
          )}

          {status === "review" && builtTx && config && (
            <div className="animate-in fade-in space-y-6 duration-300">
              <div className="bg-muted/10 border-border/40 space-y-4 rounded-3xl border p-6">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">Type</span>
                  <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-[10px] font-black uppercase">
                    {config.type.replace("_", " ")}
                  </span>
                </div>

                {config.type === "transfer" && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">To</span>
                    <p className="text-foreground text-xs leading-relaxed font-bold break-all opacity-80">
                      {config.payload.recipient}
                    </p>
                  </div>
                )}

                <div className="border-border/20 flex items-center justify-between border-t pt-4">
                  <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">Amount</span>
                  <span className="text-foreground text-lg font-black">
                    {formatAmount(builtTx.tx.outputs?.[0]?.capacity ?? "0")}{" "}
                    <span className="text-xs opacity-50">CKB</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[10px] font-black tracking-widest uppercase">Fee</span>
                  <span className="text-muted-foreground text-[11px] font-bold">{formatAmount(builtTx.fee)} CKB</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {useWalletStore.getState().isReadOnly ? (
                  <div className="bg-rose-500/5 border-rose-500/10 space-y-3 rounded-2xl border p-6 text-center">
                    <div className="bg-rose-500/10 mx-auto flex h-10 w-10 items-center justify-center rounded-xl">
                      <HugeiconsIcon icon={AlertCircleIcon} className="text-rose-500" size={20} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-rose-500 text-sm font-bold tracking-tight">View-only Wallet</p>
                      <p className="text-muted-foreground text-[10px] font-medium leading-relaxed">
                        Hardware wallet is not connected. Use the device that holds the private keys to sign this
                        transaction.
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="h-14 w-full rounded-2xl text-base font-bold shadow-none active:scale-[0.98]"
                    onClick={handleSign}
                  >
                    Sign on Ledger
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="h-12 w-full rounded-2xl text-xs font-bold tracking-widest uppercase"
                  onClick={close}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {(status === "signing" || status === "broadcasting") && (
            <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-6 py-12 text-center duration-500">
              <div className="bg-primary/5 border-primary/20 relative flex h-20 w-20 items-center justify-center rounded-3xl border">
                <HugeiconsIcon icon={Settings03Icon} size={32} className="text-primary animate-spin opacity-80" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{status === "signing" ? "Check your Ledger" : "Broadcasting..."}</h3>
                <p className="text-muted-foreground px-6 text-xs leading-relaxed font-medium">
                  {status === "signing"
                    ? "Confirm the transaction details on your hardware device to proceed."
                    : "Sending your transaction to the Nervos network..."}
                </p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-6 py-12 text-center duration-500">
              <div className="bg-primary shadow-primary/20 flex h-20 w-20 items-center justify-center rounded-3xl shadow-xl">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={32} className="text-secondary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Transaction Sent!</h3>
                <p className="text-muted-foreground px-6 text-xs leading-relaxed font-medium">
                  Your transaction has been successfully broadcasted.
                </p>
              </div>
              <div className="w-full space-y-3 px-4">
                <Button className="h-12 w-full rounded-xl text-sm font-bold" onClick={handleDone}>
                  Done
                </Button>
                {txHash && (
                  <Button
                    variant="ghost"
                    className="h-10 w-full rounded-xl text-[10px] font-bold tracking-widest uppercase"
                    onClick={() => window.open(getExplorerLink(txHash, network), "_blank")}
                  >
                    View on Explorer
                  </Button>
                )}
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="animate-in zoom-in-95 flex flex-col items-center justify-center space-y-6 py-12 text-center duration-500">
              <div className="bg-destructive/10 border-destructive/20 flex h-20 w-20 items-center justify-center rounded-3xl border">
                <HugeiconsIcon icon={AlertCircleIcon} size={32} className="text-destructive font-bold" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Something went wrong</h3>
                <p className="text-destructive/80 px-6 text-xs leading-relaxed font-semibold">{error}</p>
              </div>
              <div className="w-full space-y-3 px-4">
                <Button className="h-12 w-full rounded-xl text-sm font-bold" onClick={handleBuild}>
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  className="h-10 w-full rounded-xl text-[10px] font-bold tracking-widest uppercase"
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
