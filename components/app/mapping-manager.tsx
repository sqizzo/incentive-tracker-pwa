"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { Panel } from "@/components/app/bits"
import { NativeSelect } from "@/components/app/native-select"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { addPlItem, setItemCategory, setUnitMapping } from "@/lib/actions/pricelist"
import type { PlItem, PlUnit, SalesCatalog } from "@/lib/types"
import { cn } from "@/lib/utils"

const NO_CATEGORY = ""

export function MappingManager({ catalog, tab }: { catalog: SalesCatalog; tab: "item" | "unit" }) {
  const [pending, startTransition] = useTransition()
  const [query, setQuery] = useState("")
  const [adding, setAdding] = useState(false)
  const kelompokList = [...new Set(catalog.items.map((i) => i.kelompok))]
  const [draft, setDraft] = useState({ kelompok: kelompokList[0] ?? "iPhone", name: "", categoryId: NO_CATEGORY })

  // nilai optimistis agar select langsung berubah
  const [itemCats, setItemCats] = useState<Record<string, string>>({})
  const [unitMaps, setUnitMaps] = useState<Record<string, string>>({})

  const usage = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of catalog.prices) m.set(p.item_id, (m.get(p.item_id) ?? 0) + 1)
    return m
  }, [catalog.prices])

  const itemGroups = useMemo(() => {
    const map = new Map<string, PlItem[]>()
    for (const i of catalog.items) map.set(i.kelompok, [...(map.get(i.kelompok) ?? []), i])
    return [...map.entries()]
  }, [catalog.items])

  const unitGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, PlUnit[]>()
    for (const u of catalog.plUnits) {
      if (q && !q.split(/\s+/).every((t) => u.unit_key.toLowerCase().includes(t))) continue
      map.set(u.kelompok, [...(map.get(u.kelompok) ?? []), u])
    }
    return [...map.entries()]
  }, [catalog.plUnits, query])

  function changeItem(itemId: string, categoryId: string) {
    setItemCats((p) => ({ ...p, [itemId]: categoryId }))
    startTransition(async () => {
      const res = await setItemCategory(itemId, categoryId || null)
      if (res.ok) toast.success("Pemetaan item disimpan")
      else toast.error(res.error)
    })
  }

  function changeUnit(unit: PlUnit, value: string) {
    setUnitMaps((p) => ({ ...p, [unit.id]: value }))
    startTransition(async () => {
      const res = await setUnitMapping(
        value === "choose" || value === "none"
          ? { unitId: unit.id, mode: value }
          : { unitId: unit.id, mode: "fixed", deviceId: value }
      )
      if (res.ok) toast.success(`Pemetaan ${unit.unit_key} disimpan`)
      else toast.error(res.error)
    })
  }

  function addItem() {
    startTransition(async () => {
      const res = await addPlItem({ ...draft, categoryId: draft.categoryId || null })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Item ditambahkan")
      setAdding(false)
      setDraft((d) => ({ ...d, name: "" }))
    })
  }

  return (
    <>
      <PageHeader
        title="Pemetaan Insentif"
        backHref="/setelan"
        action={
          tab === "item" ? (
            <Button size="icon-lg" className="rounded-full" aria-label="Tambah item jual" onClick={() => setAdding(true)}>
              <PlusIcon />
            </Button>
          ) : undefined
        }
      />
      <main className="flex flex-col gap-4 pb-8">
        <div className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-medium" role="tablist">
          {(
            [
              { key: "item", label: "Item → Kategori" },
              { key: "unit", label: "Unit → Unit insentif" },
            ] as const
          ).map((t) => (
            <Link
              key={t.key}
              href={`/setelan/pemetaan?tab=${t.key}`}
              role="tab"
              aria-selected={tab === t.key}
              scroll={false}
              className={cn("rounded-full py-1.5 text-center transition-colors", tab === t.key ? "bg-background shadow-xs" : "text-muted-foreground")}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "item" ? (
          <>
            <p className="px-1 text-xs text-muted-foreground">
              Kategori insentif yang dipakai menghitung insentif tiap item jual. Berlaku untuk semua unit dalam kelompok.
            </p>
            {itemGroups.map(([kelompok, items]) => (
              <section key={kelompok} className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-semibold">{kelompok}</h2>
                <Panel className="p-1.5">
                  <ul className="flex flex-col divide-y">
                    {items.map((i) => (
                      <li key={i.id} className="flex flex-col gap-1.5 px-2.5 py-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{i.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{usage.get(i.id) ?? 0} harga</span>
                        </div>
                        <NativeSelect
                          value={itemCats[i.id] ?? i.category_id ?? NO_CATEGORY}
                          onChange={(e) => changeItem(i.id, e.target.value)}
                          aria-label={`Kategori insentif ${i.name}`}
                          disabled={pending}
                        >
                          <option value={NO_CATEGORY}>Tanpa insentif</option>
                          {catalog.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </NativeSelect>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </section>
            ))}
          </>
        ) : (
          <>
            <p className="px-1 text-xs text-muted-foreground">
              Unit di price list → unit di memo insentif. &ldquo;Pilih saat input&rdquo; untuk baris campuran (mis. MacBook Intel & M1).
            </p>
            <InputGroup className="h-11 rounded-full bg-card">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari, mis. iphone 17, A2338"
                aria-label="Cari unit"
              />
            </InputGroup>
            {unitGroups.map(([kelompok, units]) => (
              <section key={kelompok} className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-semibold">{kelompok}</h2>
                <Panel className="p-1.5">
                  <ul className="flex flex-col divide-y">
                    {units.map((u) => {
                      const value =
                        unitMaps[u.id] ?? (u.incentive_mode === "fixed" ? (u.incentive_device_id ?? "choose") : u.incentive_mode)
                      return (
                        <li key={u.id} className="flex flex-col gap-1.5 px-2.5 py-2.5">
                          <span className="text-sm font-medium">{u.unit_key}</span>
                          <NativeSelect
                            value={value}
                            onChange={(e) => changeUnit(u, e.target.value)}
                            aria-label={`Unit insentif ${u.unit_key}`}
                            disabled={pending}
                            className={cn(value === "none" && "[&_select]:text-muted-foreground")}
                          >
                            <option value="choose">Pilih saat input</option>
                            <option value="none">Belum ada insentif</option>
                            {catalog.devices.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </NativeSelect>
                        </li>
                      )
                    })}
                  </ul>
                </Panel>
              </section>
            ))}
          </>
        )}
      </main>

      <Drawer open={adding} onOpenChange={setAdding}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Item jual baru</DrawerTitle>
            <DrawerDescription>Setelah dibuat, isi harganya per unit di Setelan → Harga Jual.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4">
            <div className="grid gap-1.5">
              <Label htmlFor="ni-kel">Kelompok</Label>
              <NativeSelect id="ni-kel" value={draft.kelompok} onChange={(e) => setDraft({ ...draft, kelompok: e.target.value })}>
                {kelompokList.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ni-name">Nama item</Label>
              <Input id="ni-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="mis. Port Lightning" className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ni-cat">Kategori insentif</Label>
              <NativeSelect id="ni-cat" value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
                <option value={NO_CATEGORY}>Tanpa insentif</option>
                {catalog.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <DrawerFooter>
            <Button size="lg" className="h-11 rounded-full" onClick={addItem} disabled={pending || !draft.name.trim()}>
              {pending && <Spinner />}
              Tambah item
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
