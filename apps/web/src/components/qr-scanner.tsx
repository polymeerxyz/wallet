import { Html5QrcodeScanner } from "html5-qrcode"
import { useEffect } from "react"

interface QRCodeScannerProps {
  onScanSuccess: (decodedText: string) => void
}

export function QRCodeScanner({ onScanSuccess }: QRCodeScannerProps) {
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null

    const timeoutId = setTimeout(() => {
      const el = document.getElementById("qr-reader")
      if (el) {
        scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false)
        scanner.render(onScanSuccess, (err) => {
          console.warn(err)
        })
      }
    }, 10)

    return () => {
      clearTimeout(timeoutId)
      if (scanner) {
        scanner.clear().catch(console.error)
      }
    }
  }, [onScanSuccess])

  return <div id="qr-reader" className="border-border bg-muted/20 w-full overflow-hidden rounded-2xl border" />
}
