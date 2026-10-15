import { Suspense } from "react"
import type { Metadata } from "next"
import { HistoryIcon, SearchXIcon } from "lucide-react"

import { Money, Panel, Screen } from "@/components/app/bits"
import { EntryCard } from "@/components/app/entry-card"
import { HistorySearch } from "@/components/app/history-search"
import { MonthSwitcher } from "@/components/app/month-switcher"
import { PageHeader } from "@/components/app/page-header"
import { HistoryBodySkeleton } from "@/components/app/skeletons"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { SEARCH_LIMIT, getEntriesInRange, searchEntries } from "@/lib/data"
import { formatDateLong, isMonthKey, monthKey, monthRange, todayWIB } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import type { Entry } from "@/lib/types"

export const metadata: Metadata = { title: "Riwayat" }

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ m?: string; q?: string }> }) {
  const { m, q } = await searchParams
  const today = todayWIB()
  const month = isMonthKey(m) ? m : monthKey(today)
  const query = (q ?? "").trim().slice(0, 100)

  return (
    <Screen>
      <PageHeader title="Riwayat" />
      <HistorySearch query={query} month={isMonthKey(m) ? m : undefined} />
      {query ? (
        // key tetap selama mencari: hasil lama tetap tampil (redup oleh spinner di kotak cari)
        // sampai hasil baru siap, tanpa berkedip ke skeleton di setiap ketikan
        <Suspense key="search" fallback={<HistoryBodySkeleton />}>
          <SearchResults query={query} today={today} />
        </Suspense>
      ) : (
        <>
          <MonthSwitcher month={month} basePath="/riwayat" />
          {/* key per bulan: saat ganti bulan, isi langsung berganti skeleton sementara header & navigasi tetap */}
          <Suspense key={month} fallback={<HistoryBodySkeleton />}>
            <HistoryBody month={month} today={today} />
          </Suspense>
        </>
      )}
    </Screen>
  )
}

async function HistoryBody({ month, today }: { month: string; today: string }) {
  const { from, to } = monthRange(month)
  const entries = await getEntriesInRange(from, to)
  const sales = entries.reduce((s, e) => s + e.total_sales, 0)
  const incentive = entries.reduce((s, e) => s + e.total_incentive, 0)

  return (
    <>
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

      {entries.length === 0 ? (
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
        <EntryGroups entries={entries} today={today} />
      )}
    </>
  )
}

async function SearchResults({ query, today }: { query: string; today: string }) {
  const entries = await searchEntries(query)
  const sales = entries.reduce((s, e) => s + e.total_sales, 0)

  if (entries.length === 0) {
    return (
      <Panel>
        <Empty className="py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Tidak ditemukan</EmptyTitle>
            <EmptyDescription>
              Tidak ada servis yang cocok dengan &ldquo;{query}&rdquo;. Coba kata lain, mis. no. nota, nama customer, atau
              model unit.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Panel>
    )
  }

  return (
    <>
      <p className="px-1 text-sm text-muted-foreground" role="status">
        <span className="font-semibold text-foreground">{entries.length}</span>
        {entries.length === SEARCH_LIMIT ? " hasil terbaru" : " hasil"} untuk &ldquo;{query}&rdquo; ·{" "}
        <span className="tabular-nums">{formatRupiah(sales)}</span>
      </p>
      <EntryGroups entries={entries} today={today} />
    </>
  )
}

/** Entri dikelompokkan per tanggal (entri sudah terurut terbaru dulu). */
function EntryGroups({ entries, today }: { entries: Entry[]; today: string }) {
  const groups: { date: string; items: Entry[]; sales: number }[] = []
  for (const e of entries) {
    const last = groups.at(-1)
    if (last?.date === e.service_date) {
      last.items.push(e)
      last.sales += e.total_sales
    } else {
      groups.push({ date: e.service_date, items: [e], sales: e.total_sales })
    }
  }
  return groups.map((g) => (
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
}
