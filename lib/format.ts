const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})
const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 })

/** 55000 -> "Rp 55.000" */
export function formatRupiah(value: number) {
  return rupiah.format(value).replace(/ /g, " ")
}

/** 55000 -> "55.000" */
export function formatNumber(value: number) {
  return number.format(value)
}

/** Ringkas: 1950000 -> "1,95 jt", 55000 -> "55 rb" */
export function formatCompact(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} jt`
  }
  if (Math.abs(value) >= 1_000) {
    return `${Math.round(value / 1_000)} rb`
  }
  return String(value)
}

/** "55.000" / "Rp 55.000" / "55000" -> 55000; teks kosong -> null */
export function parseRupiah(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "")
  if (!digits) return null
  return Number.parseInt(digits, 10)
}

export function percent(value: number, target: number) {
  if (target <= 0) return null
  return Math.round((value / target) * 100)
}

export function initials(name: string) {
  const parts = name.trim().split(/[\s@._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?"
}
