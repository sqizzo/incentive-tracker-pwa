// "Sering dipakai": diturunkan dari riwayat servis user sendiri, tanpa pengaturan tambahan.

export type QuickPick = { unitName: string; plPriceId: string; uses: number; lastUsed: string }

export type QuickPicks = {
  /** kombinasi unit + item price list yang paling sering dipakai */
  combos: QuickPick[]
  /** unit yang terakhir diservis, terbaru dulu */
  recentUnits: string[]
}

export type RecentEntry = {
  device_name: string
  created_at: string
  service_entry_items: { kind: string; pl_price_id: string | null }[]
}

/** Bonus skor untuk kombinasi yang dipakai dalam beberapa hari terakhir. */
const RECENT_DAYS = 7

/**
 * Peringkat: jumlah pemakaian, +1 bila dipakai dalam 7 hari terakhir; seri → yang terbaru dulu.
 * `entries` boleh dalam urutan apa pun.
 */
export function computeQuickPicks(
  entries: RecentEntry[],
  now: Date = new Date(),
  limits: { combos?: number; units?: number } = {}
): QuickPicks {
  const comboLimit = limits.combos ?? 6
  const unitLimit = limits.units ?? 5
  const recentCutoff = new Date(now.getTime() - RECENT_DAYS * 86_400_000).toISOString()

  const map = new Map<string, QuickPick>()
  const unitLast = new Map<string, string>()
  for (const e of entries) {
    const prev = unitLast.get(e.device_name)
    if (!prev || e.created_at > prev) unitLast.set(e.device_name, e.created_at)
    for (const item of e.service_entry_items) {
      if (item.kind !== "pl" || !item.pl_price_id) continue
      const key = `${e.device_name}\u0000${item.pl_price_id}`
      const cur = map.get(key)
      if (cur) {
        cur.uses++
        if (e.created_at > cur.lastUsed) cur.lastUsed = e.created_at
      } else {
        map.set(key, { unitName: e.device_name, plPriceId: item.pl_price_id, uses: 1, lastUsed: e.created_at })
      }
    }
  }

  const score = (p: QuickPick) => p.uses + (p.lastUsed >= recentCutoff ? 1 : 0)
  const combos = [...map.values()]
    .sort((a, b) => score(b) - score(a) || b.lastUsed.localeCompare(a.lastUsed))
    .slice(0, comboLimit)
  const recentUnits = [...unitLast.entries()]
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, unitLimit)
    .map(([name]) => name)

  return { combos, recentUnits }
}
