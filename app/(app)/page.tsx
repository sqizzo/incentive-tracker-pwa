import Link from "next/link"
import {
  CalendarCheckIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FlagIcon,
  SmartphoneIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react"

import { IconBubble, Money, Panel, Screen } from "@/components/app/bits"
import { EntryCard } from "@/components/app/entry-card"
import { KuromiDecor } from "@/components/app/kuromi-decor"
import { LinkPendingIcon, LinkPendingOverlay } from "@/components/app/link-pending"
import { ProgressRing } from "@/components/app/progress-ring"
import { TargetCelebration } from "@/components/app/target-celebration"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { getDailySummary, getEntriesInRange, getSettings, requireUser } from "@/lib/data"
import {
  DAYS_SHORT,
  addDays,
  dayNumber,
  dayOfWeek,
  formatDateLong,
  formatMonth,
  greeting,
  isIsoDate,
  monthKey,
  monthRange,
  todayWIB,
  weekDays,
} from "@/lib/date"
import { formatCompact, formatRupiah, initials, percent } from "@/lib/format"
import { dayStatus, periodStats } from "@/lib/target"
import { cn } from "@/lib/utils"

export default async function HomePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams
  const today = todayWIB()
  const selected = isIsoDate(d) ? d : today
  const week = weekDays(selected)
  const month = monthRange(monthKey(selected))

  // semua query independen: satu putaran paralel
  const [user, settings, monthDays, entries] = await Promise.all([
    requireUser(),
    getSettings(),
    getDailySummary(month.from < week[0] ? month.from : week[0], month.to > week[6] ? month.to : week[6]),
    getEntriesInRange(selected, selected),
  ])

  const byDay = new Map(monthDays.map((s) => [s.day, s]))
  const day = byDay.get(selected) ?? { day: selected, target: 0, is_off: false, is_custom: false, sales: 0, incentive: 0, unit_count: 0 }
  const status = dayStatus(day, today)
  const pct = percent(day.sales, day.target)
  const remaining = Math.max(0, day.target - day.sales)
  const monthStats = periodStats(
    monthDays.filter((s) => s.day >= month.from && s.day <= month.to),
    today
  )
  const name = settings.display_name || user.email.split("@")[0]
  const isToday = selected === today

  return (
    <Screen className="relative pt-4">
      <KuromiDecor variant="home" />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{greeting()},</p>
          <p className="truncate font-heading text-base font-semibold">{name}</p>
        </div>
        {!isToday && (
          <Button
            variant="outline"
            size="icon-lg"
            className="rounded-full"
            render={<Link href="/" aria-label="Kembali ke hari ini" />}
            nativeButton={false}
          >
            <CalendarCheckIcon />
          </Button>
        )}
      </header>

      {/* Hero */}
      <Panel className="relative z-10 flex items-center gap-4 bg-primary/10 ring-primary/15 dark:bg-primary/15">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUpIcon className="size-3.5" />
            {isToday ? "Penjualan hari ini" : `Penjualan · ${formatDateLong(selected)}`}
          </p>
          <Money value={day.sales} className="mt-1 block text-3xl" />
          <p className="mt-1 text-xs text-muted-foreground">
            {day.is_off ? "Hari libur" : day.target > 0 ? <>Target {formatRupiah(day.target)}</> : "Belum ada target"}
          </p>
          {status === "tercapai" ? (
            <Badge className="mt-2">Target tercapai</Badge>
          ) : day.target > 0 && !day.is_off ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              <FlagIcon className="size-3.5 text-primary" />
              Kurang {formatRupiah(remaining)}
            </p>
          ) : null}
        </div>
        <ProgressRing value={pct ?? 0} size={92}>
          <span className="font-heading text-xl font-bold tabular-nums">{pct === null ? "–" : `${pct}%`}</span>
          <span className="text-[10px] text-muted-foreground">target</span>
        </ProgressRing>
      </Panel>

      {isToday && status === "tercapai" && <TargetCelebration date={today} sales={day.sales} target={day.target} />}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <Panel className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">Insentif</p>
            <IconBubble tone="emerald">
              <WalletIcon />
            </IconBubble>
          </div>
          <Money value={day.incentive} className="text-2xl" />
        </Panel>
        <Panel className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">Unit diservis</p>
            <IconBubble tone="sky">
              <SmartphoneIcon />
            </IconBubble>
          </div>
          <p className="font-heading text-2xl font-semibold tabular-nums">
            {day.unit_count} <span className="text-xs font-medium text-muted-foreground">unit</span>
          </p>
        </Panel>
      </div>

      {/* Week strip */}
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold">{formatMonth(monthKey(selected))}</h2>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              render={<Link href={`/?d=${addDays(week[0], -7)}`} aria-label="Minggu sebelumnya" scroll={false} />}
              nativeButton={false}
            >
              <LinkPendingIcon icon="left" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              render={<Link href={`/?d=${addDays(week[0], 7)}`} aria-label="Minggu berikutnya" scroll={false} />}
              nativeButton={false}
            >
              <LinkPendingIcon icon="right" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {week.map((iso) => {
            const s = byDay.get(iso)
            const active = iso === selected
            const st = s ? dayStatus(s, today) : null
            return (
              <Link
                key={iso}
                href={iso === today ? "/" : `/?d=${iso}`}
                scroll={false}
                aria-current={active ? "date" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-full py-2 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                <span className={cn("text-[11px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                  {DAYS_SHORT[dayOfWeek(iso)]}
                </span>
                <span className={cn("font-heading text-sm font-semibold tabular-nums", iso === today && !active && "text-primary")}>
                  {String(dayNumber(iso)).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    !s?.unit_count && "invisible",
                    st === "tercapai" ? (active ? "bg-primary-foreground" : "bg-primary") : active ? "bg-primary-foreground/60" : "bg-muted-foreground/50"
                  )}
                />
                <LinkPendingOverlay />
              </Link>
            )
          })}
        </div>
      </Panel>

      {/* Month mini summary */}
      <Link href={`/rekap?m=${monthKey(selected)}`} className="rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Panel className="flex items-center gap-3 py-3">
          <IconBubble tone="violet">
            <ClipboardListIcon />
          </IconBubble>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">
              Bulan ini · {monthStats.daysAchieved} hari tercapai
            </p>
            <p className="truncate text-sm">
              <span className="font-semibold">{formatRupiah(monthStats.sales)}</span>
              <span className="text-muted-foreground"> / {formatCompact(monthStats.targetToDate)} s.d. hari ini</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Insentif <span className="font-medium text-foreground">{formatRupiah(monthStats.incentive)}</span>
            </p>
          </div>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </Panel>
      </Link>

      {/* Entries */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-heading text-base font-semibold">Servisan {isToday ? "hari ini" : "hari itu"}</h2>
          <span className="text-xs text-muted-foreground">{entries.length} unit</span>
        </div>
        {entries.length === 0 ? (
          <Panel>
            <Empty className="py-6">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SmartphoneIcon />
                </EmptyMedia>
                <EmptyTitle>Belum ada servisan</EmptyTitle>
                <EmptyDescription>Tekan tombol + di bawah untuk mencatat unit yang dikerjakan.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Panel>
        ) : (
          entries.map((e) => <EntryCard key={e.id} entry={e} />)
        )}
      </section>
    </Screen>
  )
}
