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
import { Switch } from "@/components/ui/switch"
import { saveDevice } from "@/lib/actions/pricelist"
import type { Category, Device } from "@/lib/types"
import { cn } from "@/lib/utils"

export function DeviceForm({
  categories,
  device,
  rates = {},
  defaultJenis = "",
}: {
  categories: Category[]
  device?: Device
  rates?: Record<string, number>
  defaultJenis?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(device?.name ?? "")
  const [jenis, setJenis] = useState(device?.jenis ?? defaultJenis)
  const [model, setModel] = useState(device?.model ?? "")
  const [series, setSeries] = useState(device?.series ?? "")
  const [active, setActive] = useState(device?.is_active ?? true)
  const [values, setValues] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, rates[c.id] ?? null]))
  )
  const filled = Object.values(values).filter((v) => v && v > 0).length

  function submit() {
    startTransition(async () => {
      const res = await saveDevice({
        id: device?.id ?? null,
        name,
        jenis,
        model,
        series,
        isActive: active,
        rates: values,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(device ? "Tarif diperbarui" : "Unit ditambahkan")
      router.push("/setelan/tarif")
    })
  }

  return (
    <>
      <PageHeader title={device ? "Edit Tarif" : "Unit Baru"} backHref="/setelan/tarif" />
      <main className="flex flex-col gap-4 pb-28">
        <Panel className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="name" className="text-sm font-semibold">
              Nama unit
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. iPhone 17 Pro"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">Nama ini yang muncul saat memilih unit.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="jenis" className="text-xs text-muted-foreground">
                Jenis
              </Label>
              <Input id="jenis" value={jenis} onChange={(e) => setJenis(e.target.value)} placeholder="iPhone" className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="series" className="text-xs text-muted-foreground">
                Series
              </Label>
              <Input id="series" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="17 Pro" className="h-10" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="model" className="text-xs text-muted-foreground">
              Model / grup
            </Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="iPhone Face ID"
              className="h-10"
            />
          </div>
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3 py-2.5">
            <span>
              <span className="block text-sm font-medium">Aktif</span>
              <span className="block text-xs text-muted-foreground">Unit nonaktif tidak muncul di pilihan input.</span>
            </span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
        </Panel>

        <Panel className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Tarif insentif</p>
            <p className="text-xs text-muted-foreground">{filled} kategori berlaku</p>
          </div>
          <p className="-mt-1 text-xs text-muted-foreground">Kosongkan jika kategori tidak berlaku untuk unit ini.</p>
          <ul className="flex flex-col gap-2.5">
            {categories.map((c) => (
              <li key={c.id} className={cn("grid grid-cols-[1fr_9.5rem] items-center gap-3", !c.is_active && "opacity-55")}>
                <Label htmlFor={`rate-${c.id}`} className="text-sm leading-tight font-normal">
                  {c.name}
                  {!c.is_active && <span className="text-xs text-muted-foreground"> (nonaktif)</span>}
                </Label>
                <RupiahInput
                  id={`rate-${c.id}`}
                  value={values[c.id]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [c.id]: v }))}
                  placeholder="—"
                />
              </li>
            ))}
          </ul>
          {device && (
            <p className="text-xs text-muted-foreground">
              Perubahan tarif hanya berlaku untuk input baru. Entri yang sudah tersimpan tidak berubah.
            </p>
          )}
        </Panel>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto max-w-md px-4 py-3">
          <Button size="lg" className="h-12 w-full rounded-full" onClick={submit} disabled={pending}>
            {pending && <Spinner />}
            {device ? "Simpan tarif" : "Tambah unit"}
          </Button>
        </div>
      </div>
    </>
  )
}
