import { describe, expect, it } from "vitest"

import { computeStreak } from "@/lib/target"
import type { DaySummary } from "@/lib/types"

const today = "2026-10-15"
const day = (d: string, sales: number, target = 1_000_000, is_off = false): DaySummary => ({
  day: d,
  sales,
  target: is_off ? 0 : target,
  is_off,
  is_custom: false,
  incentive: 0,
  unit_count: 0,
})
const HIT = 1_500_000
const MISS = 200_000

describe("streak target", () => {
  it("menghitung hari tercapai berturut-turut, termasuk hari ini bila sudah tercapai", () => {
    const s = computeStreak(
      [day("2026-10-12", MISS), day("2026-10-13", HIT), day("2026-10-14", HIT), day(today, HIT)],
      today
    )
    expect(s).toEqual({ days: 3, todayDone: true, capped: false })
  })

  it("hari ini yang belum tercapai tidak memutus streak", () => {
    const s = computeStreak([day("2026-10-13", MISS), day("2026-10-14", HIT), day(today, MISS)], today)
    expect(s).toEqual({ days: 1, todayDone: false, capped: false })
  })

  it("hari libur dilewati, tidak memutus streak", () => {
    const s = computeStreak(
      [day("2026-10-10", MISS), day("2026-10-11", HIT), day("2026-10-12", 0, 0, true), day("2026-10-13", HIT), day("2026-10-14", HIT)],
      today
    )
    expect(s.days).toBe(3)
  })

  it("hari kerja yang gagal memutus streak", () => {
    const s = computeStreak([day("2026-10-13", HIT), day("2026-10-14", MISS), day(today, HIT)], today)
    expect(s).toEqual({ days: 1, todayDone: true, capped: false })
  })

  it("berhenti di tanggal mulai tracking (target 0, bukan libur)", () => {
    const s = computeStreak([day("2026-10-12", 0, 0), day("2026-10-13", HIT), day("2026-10-14", HIT)], today)
    expect(s).toEqual({ days: 2, todayDone: false, capped: false })
  })

  it("hari setelah hari ini diabaikan; data habis tanpa pemutus → capped", () => {
    const s = computeStreak([day("2026-10-13", HIT), day("2026-10-14", HIT), day("2026-10-16", MISS)], today)
    expect(s).toEqual({ days: 2, todayDone: false, capped: true })
  })

  it("tanpa hari tercapai → 0", () => {
    expect(computeStreak([day("2026-10-14", MISS), day(today, MISS)], today).days).toBe(0)
  })
})
