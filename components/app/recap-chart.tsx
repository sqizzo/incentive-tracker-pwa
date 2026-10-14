"use client"

import { useState } from "react"
import { CalendarClockIcon, CheckIcon, HourglassIcon, MoonIcon, XIcon, type LucideIcon } from "lucide-react"

import { DAYS_SHORT, dayNumber, dayOfWeek, formatDateLong } from "@/lib/date"
import { formatCompact, formatRupiah, percent } from "@/lib/format"
import { dayStatus } from "@/lib/target"
import type { DaySummary } from "@/lib/types"
import { cn } from "@/lib/utils"

const CHART_H = 176

/**
 * Bar harian: track bergaris = target hari itu, bar solid = penjualan.
 * Tap bar untuk melihat angka. Mode minggu menampilkan label % di setiap bar;
 * mode bulan hanya label tanggal berkala (angka lewat tap).
 */
export function RecapChart({ days, today, mode }: { days: DaySummary[]; today: string; mode: "week" | "month" }) {
  const initial = days.find((d) => d.day === today)?.day ?? days.at(-1)?.day ?? null
  const [active, setActive] = useState<string | null>(initial)
  const max = Math.max(1, ...days.map((d) => Math.max(d.sales, d.target)))
  const sel = days.find((d) => d.day === active) ?? null
  const week = mode === "week"

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn("grid items-end", week ? "gap-2.5" : "gap-[2px]")}
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`, height: CHART_H + (week ? 20 : 0) }}
        role="group"
        aria-label="Grafik penjualan harian"
      >
        {days.map((d) => {
          const pct = percent(d.sales, d.target)
          const isSel = d.day === active
          const isToday = d.day === today
          const trackH = (d.target / max) * CHART_H
          const barH = d.sales > 0 ? Math.max(4, (d.sales / max) * CHART_H) : 0
          return (
            <button
              key={d.day}
              type="button"
              onClick={() => setActive(d.day)}
              aria-pressed={isSel}
              aria-label={`${formatDateLong(d.day)}: penjualan ${formatRupiah(d.sales)} dari target ${formatRupiah(d.target)}`}
              className="group relative flex h-full flex-col items-center justify-end outline-none"
            >
              <span className="relative flex w-full flex-1 items-end justify-center" style={{ maxHeight: CHART_H }}>
                {/* target track */}
                {d.target > 0 && (
                  <span
                    className="absolute bottom-0 w-full rounded-t-[4px] bg-[repeating-linear-gradient(135deg,var(--color-muted-foreground)_0_1px,transparent_1px_5px)] opacity-25"
                    style={{ height: trackH }}
                  />
                )}
                {/* penjualan */}
                <span
                  className={cn(
                    "relative w-full rounded-t-[4px] transition-[height,background-color] duration-500",
                    isSel || isToday ? "bg-primary dark:bg-chart-2" : "bg-primary/45 group-hover:bg-primary/70 dark:bg-primary/75 dark:group-hover:bg-primary/90",
                    week && "mx-auto w-3/5"
                  )}
                  style={{ height: barH }}
                />
                {week && (
                  <span
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 text-[11px] whitespace-nowrap tabular-nums",
                      isSel ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                    style={{ bottom: Math.max(barH, trackH) + 4 }}
                  >
                    {d.is_off ? "Libur" : pct === null || d.day > today ? "" : `${pct}%`}
                  </span>
                )}
              </span>
              <span className={cn("absolute inset-x-[-1px] -bottom-1 h-0.5 rounded-full", isSel && "bg-foreground")} />
            </button>
          )
        })}
      </div>

      {/* x labels */}
      <div
        className={cn("grid text-center text-[11px] text-muted-foreground", week ? "gap-2.5" : "gap-[2px]")}
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {days.map((d, i) => {
          const n = dayNumber(d.day)
          const last = days.length - 1
          const show = week || n === 1 || i === last || (n % 5 === 0 && last - i >= 3)
          return (
            <span key={d.day} className={cn("tabular-nums", d.day === active && "font-semibold text-foreground")}>
              {week ? DAYS_SHORT[dayOfWeek(d.day)] : show ? n : ""}
            </span>
          )
        })}
      </div>

      {/* readout */}
      {sel && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3 py-2.5 text-sm">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{formatDateLong(sel.day)}</p>
            <p className="font-semibold tabular-nums">
              {formatRupiah(sel.sales)}
              <span className="font-normal text-muted-foreground">
                {sel.is_off ? " · libur" : sel.target > 0 ? ` / ${formatCompact(sel.target)}` : ""}
              </span>
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">Insentif {formatRupiah(sel.incentive)}</p>
          </div>
          <StatusPill status={dayStatus(sel, today)} />
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-primary" /> Penjualan
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px] bg-[repeating-linear-gradient(135deg,var(--color-muted-foreground)_0_1px,transparent_1px_3px)] opacity-60" />{" "}
          Target
        </span>
      </div>
    </div>
  )
}

export function StatusPill({ status }: { status: ReturnType<typeof dayStatus> }) {
  const map: Record<ReturnType<typeof dayStatus>, { label: string; cls: string; icon?: LucideIcon }> = {
    tercapai: { label: "Tercapai", icon: CheckIcon, cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" },
    belum: { label: "Tidak tercapai", icon: XIcon, cls: "bg-destructive/10 text-destructive" },
    berjalan: { label: "Berjalan", icon: HourglassIcon, cls: "bg-amber-500/12 text-amber-700 dark:text-amber-400" },
    libur: { label: "Libur", icon: MoonIcon, cls: "bg-muted text-muted-foreground" },
    mendatang: { label: "Mendatang", icon: CalendarClockIcon, cls: "bg-muted text-muted-foreground" },
    nonaktif: { label: "–", cls: "bg-muted text-muted-foreground" },
  }
  const s = map[status]
  const Icon = s.icon
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", s.cls)}>
      {Icon && <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />}
      {s.label}
    </span>
  )
}
