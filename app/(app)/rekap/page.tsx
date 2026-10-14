import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, CalendarCheckIcon, GaugeIcon, SmartphoneIcon, WalletIcon } from "lucide-react"

import { IconBubble, Money, Panel, Screen } from "@/components/app/bits"
import { DayList } from "@/components/app/day-list"
import { PageHeader } from "@/components/app/page-header"
import { RecapChart } from "@/components/app/recap-chart"
import { Button } from "@/components/ui/button"
import { getCategorySummary, getDailySummary, getItemSummary, getSettings } from "@/lib/data"
import {
  MONTHS_SHORT,
  addDays,
  addMonths,
  formatDateShort,
  formatMonth,
  isIsoDate,
  isMonthKey,
  monthKey,
  monthRange,
  startOfWeek,
  todayWIB,
} from "@/lib/date"
import { formatCompact, formatRupiah, percent } from "@/lib/format"
import { periodStats } from "@/lib/target"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Rekap" }

type Search = { v?: string; m?: string; d?: string }

export default async function RecapPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const today = todayWIB()
  const mode = sp.v === "week" ? "week" : "month"

  let from: string, to: string, label: string, prevHref: string, nextHref: string
  if (mode === "week") {
    const start = startOfWeek(isIsoDate(sp.d) ? sp.d : today)
    from = start
    to = addDays(start, 6)
    label = `${formatDateShort(from)} – ${formatDateShort(to)}`
    prevHref = `/rekap?v=week&d=${addDays(start, -7)}`
    nextHref = `/rekap?v=week&d=${addDays(start, 7)}`
  } else {
    const month = isMonthKey(sp.m) ? sp.m : monthKey(today)
    ;({ from, to } = monthRange(month))
    label = formatMonth(month)
    prevHref = `/rekap?m=${addMonths(month, -1)}`
    nextHref = `/rekap?m=${addMonths(month, 1)}`
  }

  const [settings, days, items, categories] = await Promise.all([
    getSettings(),
    getDailySummary(from, to),
    getItemSummary(from, to),
    getCategorySummary(from, to),
  ])
  const stats = periodStats(days, today)
  const pctToDate = percent(stats.salesToDate, stats.targetToDate)
  const weekAnchor = from <= today && today <= to ? today : from

  return (
    <Screen>
      <PageHeader title="Rekap" />

      {/* Mode + period */}
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-medium" role="tablist">
          {(
            [
              { key: "week", label: "Minggu", href: `/rekap?v=week&d=${weekAnchor}` },
              { key: "month", label: "Bulan", href: `/rekap?m=${monthKey(from)}` },
            ] as const
          ).map((t) => (
            <Link
              key={t.key}
              href={t.href}
              role="tab"
              aria-selected={mode === t.key}
              scroll={false}
              className={cn(
                "rounded-full py-1.5 text-center transition-colors",
                mode === t.key ? "bg-background shadow-xs" : "text-muted-foreground"
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            render={<Link href={prevHref} aria-label="Periode sebelumnya" scroll={false} />}
            nativeButton={false}
          >
            <ChevronLeftIcon />
          </Button>
          <p className="font-heading text-base font-semibold">{label}</p>
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            render={<Link href={nextHref} aria-label="Periode berikutnya" scroll={false} />}
            nativeButton={false}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>

      {/* Hero + chart */}
      <Panel className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">Penjualan</p>
          <Money value={stats.sales} className="text-4xl leading-none" />
          <p className="text-xs text-muted-foreground">
            Target <span className="font-semibold text-foreground tabular-nums">{formatRupiah(stats.target)}</span>
          </p>
        </div>
        <RecapChart days={days} today={today} mode={mode} />
      </Panel>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<CalendarCheckIcon />}
          tone="emerald"
          label="Hari tercapai"
          value={
            <>
              {stats.daysAchieved}
              <span className="text-xs font-medium text-muted-foreground"> / {stats.workDaysToDate} hari</span>
            </>
          }
        />
        <StatCard
          icon={<GaugeIcon />}
          tone="orange"
          label="Capaian s.d. hari ini"
          value={
            <>
              {pctToDate === null ? "–" : pctToDate}
              <span className="text-xs font-medium text-muted-foreground">{pctToDate === null ? "" : " %"}</span>
            </>
          }
          hint={stats.targetToDate > 0 ? `${formatRupiah(stats.salesToDate - stats.targetToDate)}` : undefined}
          hintTone={stats.salesToDate >= stats.targetToDate ? "good" : "bad"}
        />
        <StatCard
          icon={<WalletIcon />}
          tone="violet"
          label="Total insentif"
          value={<Money value={stats.incentive} />}
          hint="Tanpa target"
        />
        <StatCard
          icon={<SmartphoneIcon />}
          tone="sky"
          label="Unit diservis"
          value={
            <>
              {stats.units}
              <span className="text-xs font-medium text-muted-foreground"> unit</span>
            </>
          }
          hint={stats.avgSalesPerWorkDay > 0 ? `Rata-rata ${formatCompact(stats.avgSalesPerWorkDay)}/hari kerja` : undefined}
        />
      </div>

      {/* Breakdown */}
      {items.length > 0 && (
        <Breakdown
          title="Penjualan per item"
          rows={items.map((i) => ({ label: i.item_name, count: i.item_count, value: i.sales }))}
        />
      )}
      {categories.length > 0 && (
        <Breakdown
          title="Insentif per kategori"
          rows={categories.map((c) => ({ label: c.category_name, count: c.item_count, value: c.total }))}
        />
      )}

      {/* Day list */}
      <Panel className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-base font-semibold">Per hari</h2>
          <span className="text-xs text-muted-foreground">Tap untuk atur target penjualan / libur</span>
        </div>
        <DayList days={days} today={today} defaultTarget={settings.default_target} />
      </Panel>

      <p className="px-1 pb-2 text-center text-xs text-muted-foreground">
        Rekap {mode === "week" ? "minggu" : `bulan ${MONTHS_SHORT[Number(from.slice(5, 7)) - 1]}`} · {stats.workDays} hari kerja
      </p>
    </Screen>
  )
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <Panel className="flex flex-col gap-3">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">
                {r.label} <span className="text-xs text-muted-foreground">×{r.count}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatRupiah(r.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function StatCard({
  icon,
  tone,
  label,
  value,
  hint,
  hintTone,
}: {
  icon: React.ReactNode
  tone: "emerald" | "orange" | "violet" | "sky"
  label: string
  value: React.ReactNode
  hint?: string
  hintTone?: "good" | "bad"
}) {
  return (
    <Panel className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <IconBubble tone={tone} className="size-8">
          {icon}
        </IconBubble>
        <p className="text-xs leading-tight font-medium">{label}</p>
      </div>
      <div>
        <p className="font-heading text-2xl font-semibold tabular-nums">{value}</p>
        {hint && (
          <p
            className={cn(
              "mt-0.5 truncate text-xs",
              hintTone === "good" && "text-emerald-600 dark:text-emerald-400",
              hintTone === "bad" && "text-destructive",
              !hintTone && "text-muted-foreground"
            )}
          >
            {hintTone === "good" && "+"}
            {hint}
          </p>
        )}
      </div>
    </Panel>
  )
}
