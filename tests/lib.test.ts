import { describe, expect, it } from "vitest"

import {
  addDays,
  addMonths,
  dayOfWeek,
  formatDateLong,
  greeting,
  isIsoDate,
  monthRange,
  startOfWeek,
  todayWIB,
  weekDays,
} from "@/lib/date"
import { formatCompact, formatRupiah, initials, parseRupiah, percent } from "@/lib/format"
import { dayStatus, periodStats } from "@/lib/target"
import type { DaySummary } from "@/lib/types"

describe("date (WIB)", () => {
  it("menghitung 'hari ini' di zona Asia/Jakarta (UTC+7)", () => {
    // 13 Okt 2026 17:30 UTC = 14 Okt 00:30 WIB
    expect(todayWIB(new Date("2026-10-13T17:30:00Z"))).toBe("2026-10-14")
    // 13 Okt 2026 16:59 UTC = 13 Okt 23:59 WIB
    expect(todayWIB(new Date("2026-10-13T16:59:00Z"))).toBe("2026-10-13")
  })

  it("greeting mengikuti jam WIB", () => {
    expect(greeting(new Date("2026-10-14T01:00:00Z"))).toBe("Selamat pagi") // 08.00 WIB
    expect(greeting(new Date("2026-10-14T06:00:00Z"))).toBe("Selamat siang") // 13.00 WIB
    expect(greeting(new Date("2026-10-14T13:00:00Z"))).toBe("Selamat malam") // 20.00 WIB
  })

  it("aritmetika tanggal melewati batas bulan/tahun", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01")
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31")
    expect(addMonths("2026-12", 1)).toBe("2027-01")
    expect(addMonths("2026-01", -1)).toBe("2025-12")
  })

  it("rentang bulan termasuk tahun kabisat", () => {
    expect(monthRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" })
    expect(monthRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-10-31" })
  })

  it("minggu dimulai hari Senin", () => {
    expect(dayOfWeek("2026-10-14")).toBe(3) // Rabu
    expect(startOfWeek("2026-10-14")).toBe("2026-10-12")
    expect(startOfWeek("2026-10-18")).toBe("2026-10-12") // Minggu ikut minggu sebelumnya
    expect(weekDays("2026-10-14")).toHaveLength(7)
    expect(weekDays("2026-10-14")[6]).toBe("2026-10-18")
  })

  it("validasi & format", () => {
    expect(isIsoDate("2026-10-14")).toBe(true)
    expect(isIsoDate("2026-13-01")).toBe(false)
    expect(isIsoDate("14/10/2026")).toBe(false)
    expect(formatDateLong("2026-10-14")).toBe("Rabu, 14 Oktober 2026")
  })
})

describe("format", () => {
  it("Rupiah format id-ID", () => {
    expect(formatRupiah(55000)).toBe("Rp 55.000")
    expect(formatRupiah(1100000)).toBe("Rp 1.100.000")
  })

  it("parse input Rupiah", () => {
    expect(parseRupiah("150.000")).toBe(150000)
    expect(parseRupiah("Rp 1.250.000")).toBe(1250000)
    expect(parseRupiah("")).toBeNull()
    expect(parseRupiah("abc")).toBeNull()
  })

  it("persen & ringkas", () => {
    expect(percent(55000, 150000)).toBe(37)
    expect(percent(100, 0)).toBeNull()
    expect(formatCompact(1950000)).toBe("1,95 jt")
    expect(formatCompact(55000)).toBe("55 rb")
    expect(initials("Budi Santoso")).toBe("BS")
    expect(initials("budi@mail.com")).toBe("BM")
  })
})

describe("target", () => {
  const today = "2026-10-14"
  const d = (day: string, sales: number, target: number, is_off = false): DaySummary => ({
    day,
    sales,
    incentive: Math.round(sales / 20),
    target,
    is_off,
    is_custom: false,
    unit_count: sales > 0 ? 1 : 0,
  })

  it("status per hari", () => {
    expect(dayStatus(d("2026-10-13", 200000, 150000), today)).toBe("tercapai")
    expect(dayStatus(d("2026-10-13", 50000, 150000), today)).toBe("belum")
    expect(dayStatus(d(today, 50000, 150000), today)).toBe("berjalan")
    expect(dayStatus(d("2026-10-15", 0, 150000), today)).toBe("mendatang")
    expect(dayStatus(d("2026-10-11", 90000, 0, true), today)).toBe("libur")
    expect(dayStatus(d("2026-10-01", 0, 0), today)).toBe("nonaktif")
  })

  it("statistik periode: target penjualan s.d. hari ini, insentif dijumlah tanpa target", () => {
    const s = periodStats(
      [
        d("2026-10-12", 200000, 150000),
        d("2026-10-13", 100000, 150000),
        d("2026-10-11", 50000, 0, true),
        d(today, 60000, 150000),
        d("2026-10-15", 0, 150000),
      ],
      today
    )
    expect(s.sales).toBe(410000)
    expect(s.incentive).toBe(20500)
    expect(s.target).toBe(600000)
    expect(s.targetToDate).toBe(450000)
    expect(s.salesToDate).toBe(410000)
    expect(s.workDays).toBe(4)
    expect(s.workDaysToDate).toBe(3)
    expect(s.daysAchieved).toBe(1)
    expect(s.avgSalesPerWorkDay).toBe(136667)
  })
})
