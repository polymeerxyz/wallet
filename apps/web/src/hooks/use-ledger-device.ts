import type Transport from "@ledgerhq/hw-transport"
import TransportWebHID from "@ledgerhq/hw-transport-webhid"
import { LedgerCKB } from "@polymeer/lib"
import { toast } from "@polymeer/ui"
import { useCallback, useRef, useState } from "react"

let transportInstance: Transport | null = null
let ledgerInstance: LedgerCKB | null = null

export function useLedgerDevice() {
  const [device, setDevice] = useState<LedgerCKB | null>(ledgerInstance)
  const [loading, setLoading] = useState(false)
  const isConnecting = useRef(false)

  const connect = useCallback(async () => {
    if (isConnecting.current) return null
    if (ledgerInstance) {
      setDevice(ledgerInstance)
      return ledgerInstance
    }

    isConnecting.current = true
    setLoading(true)
    try {
      if (transportInstance) {
        try {
          await transportInstance.close()
        } catch {
          // ignore cleanup errors
        }
        transportInstance = null
      }

      const transport = await TransportWebHID.create()
      transportInstance = transport
      transport.on("disconnect", () => {
        transportInstance = null
        ledgerInstance = null
        setDevice(null)
      })

      const ledger = new LedgerCKB(transport)

      await ledger.getAppConfiguration()

      ledgerInstance = ledger
      setDevice(ledger)
      return ledger
    } catch (err: unknown) {
      const error = err as Error & { name?: string; statusCode?: number }
      console.error("Ledger connection failed:", error)

      if (error.statusCode === 0x6e00 || error.statusCode === 0x6e01) {
        toast.error("Please ensure the Nervos (CKB) app is open on your Ledger device.")
      } else if (error.name === "InvalidStateError" || error.message?.includes("busy")) {
        toast.error("Ledger device is busy or connection was interrupted. Please try again.")
      } else if (!error.message?.includes("cancelled")) {
        toast.error("Failed to connect to Ledger device. Please ensure it is plugged in.")
      }

      if (transportInstance) {
        await transportInstance.close().catch(() => {})
        transportInstance = null
      }
      return null
    } finally {
      setLoading(false)
      isConnecting.current = false
    }
  }, [])

  const disconnect = useCallback(async () => {
    if (transportInstance) {
      try {
        await transportInstance.close()
      } catch (e) {
        console.warn("Error closing transport during disconnect:", e)
      }
    }
    transportInstance = null
    ledgerInstance = null
    setDevice(null)
  }, [])

  return {
    device,
    loading,
    connect,
    disconnect,
    isConnected: !!device,
  }
}
