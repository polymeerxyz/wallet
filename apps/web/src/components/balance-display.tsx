import { numFrom, type NumLike } from "@ckb-ccc/core"
import { cn } from "@polymeer/ui"

import { formatAmount } from "@/lib/utils"

interface BalanceDisplayProps {
  amount: NumLike
  unit?: string
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function BalanceDisplay({ amount, unit = "CKB", className, size = "md" }: BalanceDisplayProps) {
  const formatted = formatAmount(amount)

  const [integer, decimal] = formatted.split(".")
  const primaryDecimal = decimal?.slice(0, 2)
  const secondaryDecimal = decimal?.slice(2)

  const sizeClasses = {
    sm: {
      integer: "text-base sm:text-lg font-bold",
      decimal: "text-xs sm:text-sm font-medium",
      secondaryDecimal: "text-[9px] sm:text-[10px] opacity-70",
      unit: "text-[10px] sm:text-xs font-bold",
    },
    md: {
      integer: "text-xl sm:text-2xl font-bold",
      decimal: "text-base sm:text-lg font-medium",
      secondaryDecimal: "text-xs sm:text-sm opacity-70",
      unit: "text-xs sm:text-sm font-bold",
    },
    lg: {
      integer: "text-2xl sm:text-3xl md:text-4xl font-bold",
      decimal: "text-lg sm:text-xl md:text-2xl font-semibold",
      secondaryDecimal: "text-sm sm:text-base md:text-lg opacity-70",
      unit: "text-base sm:text-lg md:text-xl font-semibold",
    },
    xl: {
      integer: "text-3xl sm:text-4xl md:text-5xl font-bold",
      decimal: "text-xl sm:text-2xl md:text-3xl font-semibold",
      secondaryDecimal: "text-sm sm:text-lg md:text-xl opacity-70 font-medium",
      unit: "text-lg sm:text-xl md:text-2xl font-semibold",
    },
  }

  const currentSize = sizeClasses[size]

  return (
    <div
      className={cn(
        "scrollbar-none inline-flex max-w-full items-baseline gap-0.5 overflow-x-auto overflow-y-hidden whitespace-nowrap tabular-nums",
        className
      )}
    >
      <span className={cn("text-foreground shrink-0", currentSize.integer)}>{integer}</span>
      {decimal && (
        <span className={cn("text-muted-foreground/50 shrink-0", currentSize.decimal)}>
          .{primaryDecimal}
          {secondaryDecimal && <span className={cn("shrink-0", currentSize.secondaryDecimal)}>{secondaryDecimal}</span>}
        </span>
      )}
      {unit && <span className={cn("text-muted-foreground/40 ml-1 shrink-0 uppercase", currentSize.unit)}>{unit}</span>}
    </div>
  )
}
