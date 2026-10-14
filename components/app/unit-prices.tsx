"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Panel } from "@/components/app/bits"
import { NativeSelect } from "@/components/app/native-select"
import { PageHeader } from "@/components/app/page-header"
import { RupiahInput } from "@/components/app/rupiah-input"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { addPlPrice, savePlPrices } from "@/lib/actions/pricelist"
import { formatRupiah } from "@/lib/format"
import type { PlPrice, SalesCatalog } from "@/lib/types"
import { cn } from "@/lib/utils"

type Edit = { price: number | null; isActive: boolean }

export function UnitPrices({ catalog, unitName, kelompok }: { catalog: SalesCatalog; unitName: string; kelompok: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [edits, setEdits] = useState<Record<string, Edit>>({})
  const [adding, setAdding] = useState(false)
  const kelompokItems = catalog.items.filter((i) => i.kelompok === kelompok)
  const [draft, setDraft] = useState({ itemId: kelompokItems[0]?.id ?? "", variant: "", warranty: "", price: null as number | null })

  const itemById = useMemo(() => new Map(catalog.items.map((i) => [i.id, i])), [catalog.items])
  const unitById = useMemo(() => new Map(catalog.plUnits.map((u) => [u.id, u])), [catalog.plUnits])
  const deviceById = useMemo(() => new Map(catalog.devices.map((d) => [d.id, d])), [catalog.devices])
  const catById = useMemo(() => new Map(catalog.categories.map((c) => [c.id, c])), [catalog.categories])

  const groups = useMemo(() => {
    const map = new Map<string, PlPrice[]>()
    for (const p of catalog.prices) {
      if (p.unit_name !== unitName) continue
      const name = itemById.get(p.item_id)?.name ?? "Lainnya"
      map.set(name, [...(map.get(name) ?? []), p])
    }
    return [...map.entries()]
  }, [catalog.prices, unitName, itemById])

  const dirty = Object.keys(edits).length

  function current(p: PlPrice): Edit {
    return edits[p.id] ?? { price: p.price, isActive: p.is_active }
  }

  function change(p: PlPrice, patch: Partial<Edit>) {
    const next = { ...current(p), ...patch }
    setEdits((prev) => {
      const copy = { ...prev }
      if (next.price === p.price && next.isActive === p.is_active) delete copy[p.id]
      else copy[p.id] = next
      return copy
    })
  }

  function incentiveLabel(p: PlPrice) {
    const item = itemById.get(p.item_id)
    const key = unitById.get(p.unit_id)
    const cat = item?.category_id ? catById.get(item.category_id) : undefined
    if (!cat) return "Belum dipetakan ke kategori insentif"
    if (!key || key.incentive_mode === "none") return `${cat.name} · unit belum ada di memo`
    if (key.incentive_mode === "choose") return `${cat.name} · unit insentif dipilih saat input`
    const amount = key.incentive_device_id ? catalog.rates[key.incentive_device_id]?.[cat.id] : undefined
    return `Insentif ${formatRupiah(amount ?? 0)} · ${cat.name} (${deviceById.get(key.incentive_device_id ?? "")?.name ?? "?"})`
  }

  function save() {
    startTransition(async () => {
      const res = await savePlPrices(Object.entries(edits).map(([id, e]) => ({ id, price: e.price, isActive: e.isActive })))
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(`${dirty} harga diperbarui`)
      setEdits({})
      router.refresh()
    })
  }

  function add() {
    startTransition(async () => {
      const res = await addPlPrice({ unitName, ...draft })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Harga ditambahkan")
      setAdding(false)
      setDraft((d) => ({ ...d, variant: "", warranty: "", price: null }))
      router.refresh()
    })
  }

  return (
    <>
      <PageHeader
        title={unitName}
        backHref="/setelan/harga-jual"
        action={
          <Button size="icon-lg" className="rounded-full" aria-label="Tambah harga" onClick={() => setAdding(true)}>
            <PlusIcon />
          </Button>
        }
      />
      <main className="flex flex-col gap-4 pb-28">
        <p className="px-1 text-xs text-muted-foreground">
          Kosongkan harga = &ldquo;Ask&rdquo; (diisi saat input). Matikan switch untuk menyembunyikan dari form input.
        </p>
        {groups.map(([name, rows]) => (
          <section key={name} className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-semibold">{name}</h2>
            <Panel className="p-1.5">
              <ul className="flex flex-col divide-y">
                {rows.map((p) => {
                  const e = current(p)
                  return (
                    <li key={p.id} className={cn("flex flex-col gap-2 px-2.5 py-3", !e.isActive && "opacity-55", edits[p.id] && "bg-primary/5")}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{p.variant || name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.warranty ? `Garansi ${p.warranty} · ` : ""}
                            {incentiveLabel(p)}
                          </p>
                        </div>
                        <Switch
                          checked={e.isActive}
                          onCheckedChange={(v) => change(p, { isActive: v })}
                          aria-label={`Aktifkan ${p.variant || name}`}
                        />
                      </div>
                      <RupiahInput
                        value={e.price}
                        onChange={(v) => change(p, { price: v })}
                        placeholder="Ask"
                        aria-label={`Harga ${name} ${p.variant ?? ""}`}
                        className="h-9"
                      />
                    </li>
                  )
                })}
              </ul>
            </Panel>
          </section>
        ))}
      </main>

      {dirty > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
            <Button variant="ghost" onClick={() => setEdits({})} disabled={pending}>
              Batal
            </Button>
            <Button size="lg" className="h-12 flex-1 rounded-full" onClick={save} disabled={pending}>
              {pending && <Spinner />}
              Simpan {dirty} perubahan
            </Button>
          </div>
        </div>
      )}

      <Drawer open={adding} onOpenChange={setAdding}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Tambah harga · {unitName}</DrawerTitle>
            <DrawerDescription>Item baru di luar daftar? Tambahkan dulu lewat Setelan → Pemetaan.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4">
            <div className="grid gap-1.5">
              <Label htmlFor="add-item">Item</Label>
              <NativeSelect id="add-item" value={draft.itemId} onChange={(e) => setDraft({ ...draft, itemId: e.target.value })}>
                {kelompokItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="add-var">Varian</Label>
                <Input
                  id="add-var"
                  value={draft.variant}
                  onChange={(e) => setDraft({ ...draft, variant: e.target.value })}
                  placeholder={kelompok === "MacBook" ? "A2337" : "OLED"}
                  className="h-10"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="add-gar">Garansi</Label>
                <Input
                  id="add-gar"
                  value={draft.warranty}
                  onChange={(e) => setDraft({ ...draft, warranty: e.target.value })}
                  placeholder="3 bln"
                  className="h-10"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="add-price">Harga jual</Label>
              <RupiahInput id="add-price" value={draft.price} onChange={(v) => setDraft({ ...draft, price: v })} placeholder="Kosong = Ask" />
            </div>
          </div>
          <DrawerFooter>
            <Button size="lg" className="h-11 rounded-full" onClick={add} disabled={pending || !draft.itemId}>
              {pending && <Spinner />}
              Tambah
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
