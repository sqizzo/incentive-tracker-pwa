import { describe, expect, it } from "vitest"

import { type DraftLine, entryDevice, lineIncentive, needsDeviceChoice, totals, unitIncentive } from "@/lib/incentive"
import type { SalesCatalog } from "@/lib/types"

// katalog mini (angka fiktif): iPhone 13 Pro (fixed), MacBook (Intel fixed + baris campuran), iPhone 17 (none), Android (tanpa PL)
const catalog: SalesCatalog = {
  devices: [
    { id: "d13", name: "iPhone 13 Pro", jenis: "iPhone", model: null, series: null, sort_order: 1, is_active: true },
    { id: "dmbi", name: "Macbook <M1", jenis: "Macbook", model: null, series: null, sort_order: 2, is_active: true },
    { id: "dmbm", name: "Macbook >M1", jenis: "Macbook", model: null, series: null, sort_order: 3, is_active: true },
    { id: "dand", name: "Android All Serie", jenis: "Android", model: null, series: null, sort_order: 4, is_active: true },
  ],
  categories: [
    { id: "crp", name: "Replacement Parts", sort_order: 1, is_active: true },
    { id: "csw", name: "Software", sort_order: 2, is_active: true },
    { id: "cfs", name: "Face ID Soldering", sort_order: 3, is_active: true },
  ],
  rates: {
    d13: { crp: 12000, csw: 4000, cfs: 60000 },
    dmbi: { crp: 40000, csw: 15000 },
    dmbm: { crp: 65000, csw: 15000 },
    dand: { crp: 18000, csw: 4000 },
  },
  items: [
    { id: "ilcd", kelompok: "iPhone", name: "LCD", category_id: "crp", sort_order: 1 },
    { id: "imbbat", kelompok: "MacBook", name: "Baterai", category_id: "crp", sort_order: 2 },
    { id: "ihous", kelompok: "iPhone", name: "Housing", category_id: "crp", sort_order: 3 },
  ],
  plUnits: [
    { id: "u13", unit_key: "iPhone 13 Pro", kelompok: "iPhone", incentive_mode: "fixed", incentive_device_id: "d13", note: null },
    { id: "umbi", unit_key: "MacBook A1706", kelompok: "MacBook", incentive_mode: "fixed", incentive_device_id: "dmbi", note: null },
    { id: "umbx", unit_key: "MacBook A2159 / A2338", kelompok: "MacBook", incentive_mode: "choose", incentive_device_id: null, note: null },
    { id: "u17", unit_key: "iPhone 17", kelompok: "iPhone", incentive_mode: "none", incentive_device_id: null, note: null },
  ],
  prices: [
    { id: "p13", unit_name: "iPhone 13 Pro", item_id: "ilcd", unit_id: "u13", variant: "OLED", warranty: "12 bln", price: 1800000, sort_order: 1, is_active: true },
    { id: "pmbi", unit_name: "MacBook", item_id: "imbbat", unit_id: "umbi", variant: "A1706", warranty: "6 bln", price: 1000000, sort_order: 2, is_active: true },
    { id: "pmbx", unit_name: "MacBook", item_id: "imbbat", unit_id: "umbx", variant: "A2159 / A2338", warranty: "6 bln", price: 1100000, sort_order: 3, is_active: true },
    { id: "p17", unit_name: "iPhone 17", item_id: "ihous", unit_id: "u17", variant: null, warranty: null, price: 1900000, sort_order: 4, is_active: true },
  ],
  units: [
    { type: "pl", name: "iPhone 13 Pro", kelompok: "iPhone" },
    { type: "pl", name: "MacBook", kelompok: "MacBook" },
    { type: "pl", name: "iPhone 17", kelompok: "iPhone" },
    { type: "device", name: "Android All Serie", kelompok: "Android", deviceId: "dand" },
  ],
}

const pl = (plPriceId: string, price: number | null): DraftLine => ({ key: plPriceId, kind: "pl", plPriceId, description: "", price })
const jasa = (categoryId: string, price: number | null): DraftLine => ({ key: categoryId, kind: "jasa", categoryId, description: "", price })
const part = (price: number): DraftLine => ({ key: "part", kind: "part", description: "Tempered glass", price })

describe("insentif dari price list", () => {
  it("iPhone (fixed): PL + jasa + part", () => {
    const u = unitIncentive(catalog, catalog.units[0])
    expect(u).toMatchObject({ mode: "fixed", deviceId: "d13" })
    const lines = [pl("p13", 2000000), jasa("cfs", 300000), part(50000)]
    expect(needsDeviceChoice(catalog, u, lines)).toBe(false)
    const dev = entryDevice(catalog, u, lines, null)
    expect(totals(catalog, lines, dev)).toEqual({ sales: 2350000, incentive: 72000 })
  })

  it("MacBook: baris fixed tidak perlu pilih, baris campuran wajib pilih", () => {
    const u = unitIncentive(catalog, catalog.units[1])
    expect(u.mode).toBe("choose")
    expect(u.candidates.sort()).toEqual(["dmbi"])
    expect(needsDeviceChoice(catalog, u, [pl("pmbi", 1000000)])).toBe(false)
    expect(entryDevice(catalog, u, [pl("pmbi", 1000000)], null)).toBe("dmbi")
    const mixed = [pl("pmbi", 1000000), pl("pmbx", 1100000)]
    expect(needsDeviceChoice(catalog, u, mixed)).toBe(true)
    expect(lineIncentive(catalog, mixed[1], "dmbm")).toBe(65000)
    expect(totals(catalog, mixed, "dmbm").incentive).toBe(40000 + 65000)
    expect(totals(catalog, mixed, null).incentive).toBe(40000)
  })

  it("iPhone 17 (none): penjualan tercatat, insentif 0", () => {
    const u = unitIncentive(catalog, catalog.units[2])
    expect(u).toMatchObject({ mode: "none", deviceId: null })
    expect(totals(catalog, [pl("p17", 2000000), jasa("csw", 100000)], null)).toEqual({ sales: 2100000, incentive: 0 })
  })

  it("unit tanpa price list (Android): hanya jasa & part", () => {
    const u = unitIncentive(catalog, catalog.units[3])
    expect(u).toMatchObject({ mode: "fixed", deviceId: "dand" })
    expect(totals(catalog, [jasa("crp", 350000), part(25000)], "dand")).toEqual({ sales: 375000, incentive: 18000 })
  })

  it("harga kosong (Ask) tidak dihitung ke penjualan", () => {
    expect(totals(catalog, [pl("p13", null)], "d13")).toEqual({ sales: 0, incentive: 12000 })
  })
})
