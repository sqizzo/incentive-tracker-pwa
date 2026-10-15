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

export type Streak = {
  /** jumlah hari kerja berturut-turut yang target penjualannya tercapai */
  days: number
  /** target hari ini sudah tercapai (ikut dihitung di `days`) */
  todayDone: boolean
  /** streak mencapai batas data yang diambil, tampilkan sebagai "N+" */
  capped: boolean
}

/**
 * Hitung streak mundur dari `today`.
 * - Hari libur (is_off) dilewati, tidak memutus streak.
 * - Hari ini yang belum tercapai dilewati (masih berjalan).
 * - Hari kerja yang tidak tercapai, atau hari sebelum tanggal mulai tracking, menghentikan hitungan.
 * `days` boleh dalam urutan apa pun; idealnya mencakup rentang panjang sampai `today`.
 */
export function computeStreak(days: DaySummary[], today: string): Streak {
  const sorted = days.filter((d) => d.day <= today).sort((a, b) => b.day.localeCompare(a.day))
  let count = 0
  let todayDone = false
  let stopped = false
  for (const d of sorted) {
    if (d.is_off) continue
    if (d.target <= 0) {
      stopped = true // sebelum tanggal mulai tracking
      break
    }
    const achieved = d.sales >= d.target
    if (d.day === today) {
      if (achieved) {
        count++
        todayDone = true
      }
      continue
    }
    if (!achieved) {
      stopped = true
      break
    }
    count++
  }
  return { days: count, todayDone, capped: !stopped && count > 0 }
}
