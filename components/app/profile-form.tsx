"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Panel } from "@/components/app/bits"
import { PageHeader } from "@/components/app/page-header"
import { RupiahInput } from "@/components/app/rupiah-input"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { saveProfile } from "@/lib/actions/settings"
import { formatCompact } from "@/lib/format"
import { DAYS_SHORT } from "@/lib/date"
import type { UserSettings } from "@/lib/types"
import { cn } from "@/lib/utils"

/** Urutan tampilan Sen..Min, nilai = getUTCDay() */
const WEEK = [1, 2, 3, 4, 5, 6, 0]

export function ProfileForm({ settings }: { settings: UserSettings }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(settings.display_name ?? "")
  const [target, setTarget] = useState<number | null>(settings.default_target)
  const [start, setStart] = useState(settings.tracking_start)
  const [offDays, setOffDays] = useState<number[]>(settings.weekly_off_days ?? [])

  function toggleDay(d: number) {
    setOffDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
  }

  function submit() {
    startTransition(async () => {
      const res = await saveProfile({
        displayName: name,
        defaultTarget: target ?? 0,
        trackingStart: start,
        weeklyOffDays: offDays,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Profil & target disimpan")
      router.push("/setelan")
    })
  }

  return (
    <>
      <PageHeader title="Profil & Target" backHref="/setelan" />
      <main className="flex flex-col gap-4 pb-28">
        <Panel className="flex flex-col gap-3">
          <Label htmlFor="name" className="text-sm font-semibold">
            Nama tampilan
          </Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. Budi" maxLength={60} className="h-10" />
        </Panel>

        <Panel className="flex flex-col gap-3">
          <div>
            <Label htmlFor="target" className="text-sm font-semibold">
              Target penjualan harian
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Total harga jual per hari. Dipakai setiap hari kerja, kecuali diubah per hari di Rekap.
            </p>
          </div>
          <RupiahInput id="target" value={target} onChange={setTarget} />
          <div className="flex flex-wrap gap-2">
            {[1_000_000, 1_500_000, 2_000_000, 3_000_000, 5_000_000].map((v) => (
              <Button
                key={v}
                type="button"
                size="xs"
                variant={target === v ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setTarget(v)}
              >
                {formatCompact(v)}
              </Button>
            ))}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold">Libur rutin</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Hari yang dipilih otomatis tanpa target.</p>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {WEEK.map((d) => {
              const on = offDays.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d)}
                  className={cn(
                    "rounded-full border py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                  )}
                >
                  {DAYS_SHORT[d]}
                </button>
              )
            })}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-3">
          <div>
            <Label htmlFor="start" className="text-sm font-semibold">
              Mulai tracking
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">Hari sebelum tanggal ini tidak diberi target.</p>
          </div>
          <Input id="start" type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} className="h-10" />
        </Panel>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button size="lg" className="h-12 w-full rounded-full" onClick={submit} disabled={pending}>
            {pending && <Spinner />}
            Simpan
          </Button>
        </div>
      </div>
    </>
  )
}
