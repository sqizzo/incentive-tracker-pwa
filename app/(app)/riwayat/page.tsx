import type { Metadata } from "next"
import { HistoryIcon } from "lucide-react"

import { Money, Panel, Screen } from "@/components/app/bits"
import { EntryCard } from "@/components/app/entry-card"
import { MonthSwitcher } from "@/components/app/month-switcher"
import { PageHeader } from "@/components/app/page-header"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { getEntriesInRange } from "@/lib/data"
import { formatDateLong, isMonthKey, monthKey, monthRange, todayWIB } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import type { Entry } from "@/lib/types"

export const metadata: Metadata = { title: "Riwayat" }

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams
  const today = todayWIB()
  const month = isMonthKey(m) ? m : monthKey(today)
  const { from, to } = monthRange(month)
  const entries = await getEntriesInRange(from, to)

  const groups: { date: string; items: Entry[]; sales: number; incentive: number }[] = []
  for (const e of entries) {
    const last = groups.at(-1)
    if (last?.date === e.service_date) {
      last.items.push(e)
      last.sales += e.total_sales
      last.incentive += e.total_incentive
    } else {
      groups.push({ date: e.service_date, items: [e], sales: e.total_sales, incentive: e.total_incentive })
    }
  }
  const sales = entries.reduce((s, e) => s + e.total_sales, 0)
  const incentive = entries.reduce((s, e) => s + e.total_incentive, 0)

  return (
    <Screen>
      <PageHeader title="Riwayat" />
      <MonthSwitcher month={month} basePath="/riwayat" />

      <Panel className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Total penjualan</p>
          <Money value={sales} className="text-2xl" />
          <p className="text-xs text-muted-foreground">
            Insentif <span className="font-semibold text-foreground">{formatRupiah(incentive)}</span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-heading text-lg font-semibold text-foreground">{entries.length}</span> unit
        </p>
      </Panel>

      {groups.length === 0 ? (
        <Panel>
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HistoryIcon />
              </EmptyMedia>
              <EmptyTitle>Belum ada servisan</EmptyTitle>
              <EmptyDescription>Tidak ada catatan servis di bulan ini.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </Panel>
      ) : (
        groups.map((g) => (
          <section key={g.date} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between px-1 pt-1">
              <h2 className="text-sm font-semibold">{g.date === today ? "Hari ini" : formatDateLong(g.date)}</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {g.items.length} unit · {formatRupiah(g.sales)}
              </span>
            </div>
            {g.items.map((e) => (
              <EntryCard key={e.id} entry={e} />
            ))}
          </section>
        ))
      )}
    </Screen>
  )
}
