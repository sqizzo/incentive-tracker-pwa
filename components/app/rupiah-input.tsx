"use client"

import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { formatNumber, parseRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Input nominal Rupiah dengan pemisah ribuan otomatis. `value` null = kosong. */
export function RupiahInput({
  value,
  onChange,
  id,
  placeholder = "0",
  className,
  "aria-label": ariaLabel,
}: {
  value: number | null
  onChange: (value: number | null) => void
  id?: string
  placeholder?: string
  className?: string
  "aria-label"?: string
}) {
  return (
    <InputGroup className={cn("h-10", className)}>
      <InputGroupAddon>
        <InputGroupText>Rp</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        aria-label={ariaLabel}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value === null ? "" : formatNumber(value)}
        onChange={(e) => onChange(parseRupiah(e.target.value))}
        className="tabular-nums"
      />
    </InputGroup>
  )
}
