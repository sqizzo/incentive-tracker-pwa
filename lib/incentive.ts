// Logika insentif yang sama dengan RPC save_service_entry, untuk preview di form.
// Server tetap menghitung ulang; nilai di sini hanya tampilan.

import type { EntryItemKind, IncentiveMode, SalesCatalog, SalesUnit } from "./types"

export type DraftLine = {
  key: string
  kind: EntryItemKind
  plPriceId?: string
  categoryId?: string
  description: string
  /** null = belum diisi (mis. harga "Ask" atau jasa manual) */
  price: number | null
}

export type UnitIncentive = {
  /** fixed: semua baris PL unit ini memakai satu unit insentif; none: belum ada insentif; choose: perlu dipilih */
  mode: IncentiveMode
  deviceId: string | null
  /** pilihan unit insentif saat mode choose */
  candidates: string[]
}

export function unitIncentive(catalog: SalesCatalog, unit: SalesUnit): UnitIncentive {
  if (unit.type === "device") return { mode: "fixed", deviceId: unit.deviceId, candidates: [] }
  const unitIds = new Set(catalog.prices.filter((p) => p.unit_name === unit.name).map((p) => p.unit_id))
  const keys = catalog.plUnits.filter((u) => unitIds.has(u.id))
  if (keys.length === 1 && keys[0].incentive_mode !== "choose") {
    return {
      mode: keys[0].incentive_mode,
      deviceId: keys[0].incentive_mode === "fixed" ? keys[0].incentive_device_id : null,
      candidates: [],
    }
  }
  const fixed = [...new Set(keys.filter((k) => k.incentive_mode === "fixed" && k.incentive_device_id).map((k) => k.incentive_device_id!))]
  const candidates = fixed.length > 0 ? fixed : catalog.devices.map((d) => d.id)
  return { mode: "choose", deviceId: null, candidates }
}

function plContext(catalog: SalesCatalog, plPriceId: string | undefined) {
  const price = catalog.prices.find((p) => p.id === plPriceId)
  if (!price) return null
  const item = catalog.items.find((i) => i.id === price.item_id)
  const key = catalog.plUnits.find((u) => u.id === price.unit_id)
  return { price, item, key }
}

/** Unit insentif yang dipakai satu baris; null = tanpa insentif. */
export function lineDevice(catalog: SalesCatalog, line: DraftLine, entryDeviceId: string | null) {
  if (line.kind === "part") return null
  if (line.kind === "jasa") return entryDeviceId
  const ctx = plContext(catalog, line.plPriceId)
  if (!ctx?.key) return null
  if (ctx.key.incentive_mode === "fixed") return ctx.key.incentive_device_id
  if (ctx.key.incentive_mode === "choose") return entryDeviceId
  return null
}

export function lineCategoryId(catalog: SalesCatalog, line: DraftLine) {
  if (line.kind === "jasa") return line.categoryId ?? null
  if (line.kind === "pl") return plContext(catalog, line.plPriceId)?.item?.category_id ?? null
  return null
}

export function lineIncentive(catalog: SalesCatalog, line: DraftLine, entryDeviceId: string | null) {
  const device = lineDevice(catalog, line, entryDeviceId)
  const category = lineCategoryId(catalog, line)
  if (!device || !category) return 0
  return catalog.rates[device]?.[category] ?? 0
}

/** Apakah teknisi perlu memilih unit insentif untuk baris-baris ini? */
export function needsDeviceChoice(catalog: SalesCatalog, unitInc: UnitIncentive, lines: DraftLine[]) {
  if (unitInc.mode !== "choose") return false
  return lines.some((l) => {
    if (l.kind === "jasa") return true
    if (l.kind !== "pl") return false
    return plContext(catalog, l.plPriceId)?.key?.incentive_mode === "choose"
  })
}

/** Unit insentif yang dikirim ke server untuk entri ini. */
export function entryDevice(catalog: SalesCatalog, unitInc: UnitIncentive, lines: DraftLine[], chosen: string | null) {
  if (unitInc.mode !== "choose") return unitInc.deviceId
  if (chosen) return chosen
  // tidak perlu memilih: pakai unit insentif tetap dari baris PL pertama (untuk tampilan)
  for (const l of lines) {
    if (l.kind !== "pl") continue
    const d = lineDevice(catalog, l, null)
    if (d) return d
  }
  return null
}

export function totals(catalog: SalesCatalog, lines: DraftLine[], entryDeviceId: string | null) {
  let sales = 0
  let incentive = 0
  for (const l of lines) {
    sales += l.price ?? 0
    incentive += lineIncentive(catalog, l, entryDeviceId)
  }
  return { sales, incentive }
}
