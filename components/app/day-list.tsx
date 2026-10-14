"use client"

import { useState, useTransition } from "react"
import { ChevronRightIcon } from "lucide-react"
import { toast } from "sonner"

import { StatusPill } from "@/components/app/recap-chart"
import { RupiahInput } from "@/components/app/rupiah-input"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { setDayTarget } from "@/lib/actions/settings"
import { DAYS_SHORT, dayNumber, dayOfWeek, formatDateLong } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import { dayStatus } from "@/lib/target"
import type { DaySummary } from "@/lib/types"
import { cn } from "@/lib/utils"

type Mode = "default" | "custom" | "off"

/** Daftar per hari (tampilan tabel dari chart) + drawer atur target per hari. */
export function DayList({ days, today, defaultTarget }: { days: DaySummary[]; today: string; defaultTarget: number }) {
  const [editing, setEditing] = useState<DaySummary | null>(null)
  const [mode, setMode] = useState<Mode>("default")
  const [amount, setAmount] = useState<number | null>(null)
  const [pending, startTransition] = useTransition()

  function open(d: DaySummary) {
    setEditing(d)
    setMode(d.is_custom ? "custom" : d.is_off ? "off" : "default")
    setAmount(d.is_custom ? d.target : defaultTarget)
  }

  function save() {
    if (!editing) return
    startTransition(async () => {
      const res = await setDayTarget({ date: editing.day, mode, amount: mode === "custom" ? amount : null })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Target hari diperbarui")
      setEditing(null)
    })
  }

  return (
    <>
      <ul className="flex flex-col divide-y">
        {[...days].reverse().map((d) => {
          const status = dayStatus(d, today)
          return (
            <li key={d.day}>
              <button
                type="button"
                onClick={() => open(d)}
                className={cn(
                  "flex w-full items-center gap-3 py-2.5 text-left outline-none focus-visible:bg-muted",
                  d.day > today && "opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex w-10 shrink-0 flex-col items-center rounded-xl py-1",
                    d.day === today ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <span className="text-[10px] leading-none opacity-80">{DAYS_SHORT[dayOfWeek(d.day)]}</span>
                  <span className="font-heading text-sm font-semibold tabular-nums">{dayNumber(d.day)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold tabular-nums">{formatRupiah(d.sales)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {d.is_off
                      ? "Libur"
                      : d.target > 0
                        ? `Target ${formatRupiah(d.target)}${d.is_custom ? " (khusus)" : ""}`
                        : "Tanpa target"}
                    {d.unit_count > 0 && ` · ${d.unit_count} unit · insentif ${formatRupiah(d.incentive)}`}
                  </span>
                </span>
                <StatusPill status={status} />
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          )
        })}
      </ul>

      <Drawer open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DrawerContent className="mx-auto max-w-md">
          {editing && (
            <>
              <DrawerHeader>
                <DrawerTitle>Atur target penjualan</DrawerTitle>
                <DrawerDescription>{formatDateLong(editing.day)}</DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-4 p-4">
                <ToggleGroup
                  value={[mode]}
                  onValueChange={(v: string[]) => v[0] && setMode(v[0] as Mode)}
                  variant="outline"
                  className="grid w-full grid-cols-3"
                >
                  <ToggleGroupItem value="default">Default</ToggleGroupItem>
                  <ToggleGroupItem value="custom">Khusus</ToggleGroupItem>
                  <ToggleGroupItem value="off">Libur</ToggleGroupItem>
                </ToggleGroup>
                {mode === "default" && (
                  <p className="text-sm text-muted-foreground">
                    Mengikuti target default {formatRupiah(defaultTarget)} (atau libur rutin, jika tanggal ini termasuk).
                  </p>
                )}
                {mode === "custom" && <RupiahInput value={amount} onChange={setAmount} aria-label="Target khusus" />}
                {mode === "off" && <p className="text-sm text-muted-foreground">Tanggal ini tidak diberi target dan tidak dihitung sebagai hari kerja.</p>}
              </div>
              <DrawerFooter>
                <Button size="lg" className="h-11 rounded-full" onClick={save} disabled={pending}>
                  {pending && <Spinner />}
                  Simpan
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}
