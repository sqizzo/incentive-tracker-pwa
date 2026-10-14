import { describe, expect, it } from "vitest"

import { computeQuickPicks, type RecentEntry } from "@/lib/quick-picks"

const now = new Date("2026-10-14T12:00:00Z")
const e = (unit: string, at: string, ...items: (string | null)[]): RecentEntry => ({
  device_name: unit,
  created_at: at,
  service_entry_items: items.map((id) => ({ kind: id ? "pl" : "part", pl_price_id: id })),
})

describe("quick picks", () => {
  it("mengurutkan kombinasi unit + item berdasarkan frekuensi, dengan bonus untuk yang baru dipakai", () => {
    const { combos } = computeQuickPicks(
      [
        e("iPhone 13 Pro", "2026-09-01T10:00:00Z", "lcd13"),
        e("iPhone 13 Pro", "2026-09-02T10:00:00Z", "lcd13"),
        e("iPhone 11", "2026-10-13T10:00:00Z", "bat11"), // 1x tapi baru → skor 2
        e("iPhone 12", "2026-09-05T10:00:00Z", "ic12"), // 1x lama → skor 1
      ],
      now
    )
    expect(combos.map((c) => c.plPriceId)).toEqual(["bat11", "lcd13", "ic12"])
    expect(combos.find((c) => c.plPriceId === "lcd13")?.uses).toBe(2)
  })

  it("item yang sama di unit berbeda dihitung terpisah; part lepas & jasa diabaikan", () => {
    const { combos } = computeQuickPicks(
      [e("Unit A", "2026-10-01T00:00:00Z", "x", null), e("Unit B", "2026-10-02T00:00:00Z", "x")],
      now
    )
    expect(combos.map((c) => `${c.unitName}:${c.plPriceId}`).sort()).toEqual(["Unit A:x", "Unit B:x"])
  })

  it("unit terakhir dipakai: unik, terbaru dulu, dibatasi", () => {
    const { recentUnits } = computeQuickPicks(
      [
        e("A", "2026-10-01T00:00:00Z"),
        e("B", "2026-10-03T00:00:00Z"),
        e("A", "2026-10-05T00:00:00Z"),
        e("C", "2026-10-02T00:00:00Z"),
      ],
      now,
      { units: 2 }
    )
    expect(recentUnits).toEqual(["A", "B"])
  })

  it("dibatasi maksimal 6 kombinasi secara default", () => {
    const entries = Array.from({ length: 10 }, (_, i) => e("U", `2026-10-0${(i % 9) + 1}T00:00:00Z`, `p${i}`))
    expect(computeQuickPicks(entries, now).combos).toHaveLength(6)
  })
})
