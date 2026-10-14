import type { DaySummary } from "./types"

export type DayStatus = "tercapai" | "belum" | "berjalan" | "libur" | "mendatang" | "nonaktif"

/** Status target PENJUALAN satu hari relatif terhadap `today` (ISO, WIB). */
export function dayStatus(d: Pick<DaySummary, "day" | "target" | "sales" | "is_off">, today: string): DayStatus {
  if (d.is_off) return "libur"
  if (d.target <= 0) return "nonaktif" // sebelum tanggal mulai tracking
  if (d.sales >= d.target) return "tercapai"
  if (d.day > today) return "mendatang"
  if (d.day === today) return "berjalan"
  return "belum"
}

export type PeriodStats = {
  /** total penjualan */
  sales: number
  /** total insentif (tanpa target) */
  incentive: number
  target: number
  /** target untuk hari-hari s.d. today */
  targetToDate: number
  salesToDate: number
  units: number
  workDays: number
  workDaysToDate: number
  daysAchieved: number
  avgSalesPerWorkDay: number
}

export function periodStats(days: DaySummary[], today: string): PeriodStats {
  let sales = 0, incentive = 0, target = 0, targetToDate = 0, salesToDate = 0, units = 0
  let workDays = 0, workDaysToDate = 0, daysAchieved = 0
  for (const d of days) {
    sales += d.sales
    incentive += d.incentive
    target += d.target
    units += d.unit_count
    if (d.target > 0) workDays++
    if (d.day <= today) {
      targetToDate += d.target
      salesToDate += d.sales
      if (d.target > 0) workDaysToDate++
    }
    if (dayStatus(d, today) === "tercapai") daysAchieved++
  }
  return {
    sales,
    incentive,
    target,
    targetToDate,
    salesToDate,
    units,
    workDays,
    workDaysToDate,
    daysAchieved,
    avgSalesPerWorkDay: workDaysToDate > 0 ? Math.round(salesToDate / workDaysToDate) : 0,
  }
}
