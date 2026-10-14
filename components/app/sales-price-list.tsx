"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronRightIcon, FileTextIcon, PencilIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { IconBubble, Panel } from "@/components/app/bits"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { saveSalesMeta } from "@/lib/actions/pricelist"
import { formatDateLong } from "@/lib/date"
import { formatCompact } from "@/lib/format"
import type { RateMeta, SalesCatalog } from "@/lib/types"

export function SalesPriceList({ catalog, meta }: { catalog: SalesCatalog; meta: RateMeta | null }) {
  const [query, setQuery] = useState("")
  const [metaOpen, setMetaOpen] = useState(false)
  const [name, setName] = useState(meta?.sales_pl_name ?? "")
  const [effective, setEffective] = useState(meta?.sales_effective ?? "")
  const [pending, startTransition] = useTransition()

  const stats = useMemo(() => {
    const map = new Map<string, { count: number; min: number; max: number; ask: number }>()
    for (const p of catalog.prices) {
      if (!p.is_active) continue
      const s = map.get(p.unit_name) ?? { count: 0, min: Infinity, max: 0, ask: 0 }
      s.count++
      if (p.price === null) s.ask++
      else {
        s.min = Math.min(s.min, p.price)
        s.max = Math.max(s.max, p.price)
      }
      map.set(p.unit_name, s)
    }
    return map
  }, [catalog.prices])

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, string[]>()
    for (const u of catalog.units) {
      if (u.type !== "pl") continue
      const hay = `${u.name} ${u.kelompok}`.toLowerCase()
      if (q && !q.split(/\s+/).every((t) => hay.includes(t))) continue
      map.set(u.kelompok, [...(map.get(u.kelompok) ?? []), u.name])
    }
    return [...map.entries()]
  }, [catalog.units, query])

  function saveMeta() {
    startTransition(async () => {
      const res = await saveSalesMeta({ name, effective })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Info price list disimpan")
      setMetaOpen(false)
    })
  }

  return (
    <>
      <PageHeader title="Harga Jual" backHref="/setelan" />
      <main className="flex flex-col gap-4 pb-8">
        <button
          type="button"
          onClick={() => setMetaOpen(true)}
          className="rounded-3xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Panel className="flex items-center gap-3 bg-primary/10 ring-primary/15">
            <IconBubble className="bg-background">
              <FileTextIcon />
            </IconBubble>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Price list penjualan</p>
              <p className="truncate text-sm font-semibold">{meta?.sales_pl_name || "Belum diberi nama"}</p>
              {meta?.sales_effective && (
                <p className="text-xs text-muted-foreground">Berlaku {formatDateLong(meta.sales_effective)}</p>
              )}
            </div>
            <PencilIcon className="size-4 text-muted-foreground" />
          </Panel>
        </button>

        <p className="px-1 text-xs text-muted-foreground">
          Harga sudah termasuk jasa pasang. Perubahan harga hanya berlaku untuk input baru.
        </p>

        <InputGroup className="h-11 rounded-full bg-card">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari unit, mis. 13 pro, macbook"
            aria-label="Cari unit"
          />
        </InputGroup>

        {groups.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Unit tidak ditemukan.</p>}

        {groups.map(([kelompok, names]) => (
          <section key={kelompok} className="flex flex-col gap-2">
            <h2 className="px-1 text-sm font-semibold">{kelompok}</h2>
            <Panel className="p-1.5">
              <ul className="flex flex-col divide-y">
                {names.map((n) => {
                  const s = stats.get(n)
                  return (
                    <li key={n}>
                      <Link
                        href={`/setelan/harga-jual/unit?u=${encodeURIComponent(n)}`}
                        className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors outline-none hover:bg-muted focus-visible:bg-muted"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{n}</span>
                          <span className="block truncate text-xs text-muted-foreground tabular-nums">
                            {s
                              ? `${s.count} harga · ${s.min === Infinity ? "–" : `${formatCompact(s.min)} – ${formatCompact(s.max)}`}${s.ask ? ` · ${s.ask} Ask` : ""}`
                              : "Tidak ada harga aktif"}
                          </span>
                        </span>
                        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </Panel>
          </section>
        ))}
      </main>

      <Drawer open={metaOpen} onOpenChange={setMetaOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Info price list penjualan</DrawerTitle>
            <DrawerDescription>Perbarui saat ada price list baru.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pl-name">Nama</Label>
              <Input id="pl-name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pl-eff">Tanggal berlaku</Label>
              <Input id="pl-eff" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className="h-10" />
            </div>
          </div>
          <DrawerFooter>
            <Button size="lg" className="h-11 rounded-full" onClick={saveMeta} disabled={pending}>
              {pending && <Spinner />}
              Simpan
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
