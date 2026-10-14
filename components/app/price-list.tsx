"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronRightIcon, FileTextIcon, PencilIcon, PlusIcon, SearchIcon } from "lucide-react"
import { toast } from "sonner"

import { IconBubble, Panel } from "@/components/app/bits"
import { PageHeader } from "@/components/app/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { saveRateMeta } from "@/lib/actions/pricelist"
import { formatDateLong } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import type { Catalog, RateMeta } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PriceList({ catalog, meta }: { catalog: Catalog; meta: RateMeta | null }) {
  const [query, setQuery] = useState("")
  const [metaOpen, setMetaOpen] = useState(false)
  const [memoNo, setMemoNo] = useState(meta?.memo_no ?? "")
  const [effective, setEffective] = useState(meta?.effective_date ?? "")
  const [pending, startTransition] = useTransition()

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<string, Catalog["devices"]>()
    for (const d of catalog.devices) {
      const hay = `${d.name} ${d.jenis} ${d.model ?? ""} ${d.series ?? ""}`.toLowerCase()
      if (q && !q.split(/\s+/).every((t) => hay.includes(t))) continue
      map.set(d.jenis, [...(map.get(d.jenis) ?? []), d])
    }
    return [...map.entries()]
  }, [catalog.devices, query])

  function rateRange(deviceId: string) {
    const values = Object.values(catalog.rates[deviceId] ?? {})
    if (values.length === 0) return "Belum ada tarif"
    const min = Math.min(...values)
    const max = Math.max(...values)
    return `${values.length} kategori · ${min === max ? formatRupiah(min) : `${formatRupiah(min)} – ${formatRupiah(max)}`}`
  }

  function saveMeta() {
    startTransition(async () => {
      const res = await saveRateMeta({ memoNo, effectiveDate: effective })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Info memo disimpan")
      setMetaOpen(false)
    })
  }

  return (
    <>
      <PageHeader
        title="Tarif Insentif"
        backHref="/setelan"
        action={
          <Button
            size="icon-lg"
            className="rounded-full"
            render={<Link href="/setelan/tarif/baru" aria-label="Tambah unit" />}
            nativeButton={false}
          >
            <PlusIcon />
          </Button>
        }
      />
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
              <p className="text-xs text-muted-foreground">Berlaku saat ini</p>
              <p className="truncate text-sm font-semibold">
                {meta?.memo_no ? `Memo ${meta.memo_no}` : "Belum ada info memo"}
              </p>
              {meta?.effective_date && (
                <p className="text-xs text-muted-foreground">Efektif {formatDateLong(meta.effective_date)}</p>
              )}
            </div>
            <PencilIcon className="size-4 text-muted-foreground" />
          </Panel>
        </button>

        <InputGroup className="h-11 rounded-full bg-card">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari unit, mis. 13 pro"
            aria-label="Cari unit"
          />
        </InputGroup>

        {groups.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Unit tidak ditemukan.</p>}

        {groups.map(([jenis, devices]) => (
          <section key={jenis} className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold">{jenis}</h2>
              <Link
                href={`/setelan/tarif/baru?jenis=${encodeURIComponent(jenis)}`}
                className="text-xs font-medium text-primary"
              >
                + Unit {jenis}
              </Link>
            </div>
            <Panel className="p-1.5">
              <ul className="flex flex-col divide-y">
                {devices.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/setelan/tarif/${d.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition-colors outline-none hover:bg-muted focus-visible:bg-muted",
                        !d.is_active && "opacity-55"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">{d.name}</span>
                          {!d.is_active && (
                            <Badge variant="outline" className="shrink-0">
                              Nonaktif
                            </Badge>
                          )}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground tabular-nums">{rateRange(d.id)}</span>
                      </span>
                      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </section>
        ))}
      </main>

      <Drawer open={metaOpen} onOpenChange={setMetaOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Info memo price list</DrawerTitle>
            <DrawerDescription>Perbarui saat ada memo tarif baru.</DrawerDescription>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4">
            <div className="grid gap-1.5">
              <Label htmlFor="memo">No. memo</Label>
              <Input
                id="memo"
                value={memoNo}
                onChange={(e) => setMemoNo(e.target.value)}
                placeholder="mis. 001/IM/2025"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="eff">Tanggal berlaku</Label>
              <Input id="eff" type="date" value={effective} onChange={(e) => setEffective(e.target.value)} className="h-10" />
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
