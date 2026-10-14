"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CheckIcon,
  ChevronDownIcon,
  PackageIcon,
  ReceiptTextIcon,
  SmartphoneIcon,
  Trash2Icon,
  WrenchIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Money, Panel } from "@/components/app/bits"
import { PageHeader } from "@/components/app/page-header"
import { RupiahInput } from "@/components/app/rupiah-input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { deleteEntry, saveEntry } from "@/lib/actions/entries"
import { addDays, formatDateLong } from "@/lib/date"
import { formatRupiah } from "@/lib/format"
import {
  type DraftLine,
  entryDevice,
  lineIncentive,
  needsDeviceChoice,
  totals,
  unitIncentive,
} from "@/lib/incentive"
import type { Entry, PlPrice, SalesCatalog, SalesUnit } from "@/lib/types"
import { cn } from "@/lib/utils"

let keySeq = 0
const newKey = () => `l${++keySeq}`

function initialLines(catalog: SalesCatalog, entry?: Entry): DraftLine[] {
  if (!entry) return []
  return entry.service_entry_items.map((i) => {
    if (i.kind === "pl" && i.pl_price_id && catalog.prices.some((p) => p.id === i.pl_price_id)) {
      return { key: newKey(), kind: "pl", plPriceId: i.pl_price_id, description: i.description, price: i.sale_amount }
    }
    if (i.kind !== "part" && i.category_id) {
      return { key: newKey(), kind: "jasa", categoryId: i.category_id, description: i.description, price: i.sale_amount }
    }
    return { key: newKey(), kind: "part", description: i.description, price: i.sale_amount }
  })
}

function initialUnit(catalog: SalesCatalog, entry?: Entry): SalesUnit | null {
  if (!entry) return null
  return (
    catalog.units.find((u) => u.name === entry.device_name) ??
    catalog.units.find((u) => u.type === "device" && u.deviceId === entry.device_id) ??
    null
  )
}

export function EntryForm({
  catalog,
  entry,
  today,
  defaultDate,
}: {
  catalog: SalesCatalog
  entry?: Entry
  today: string
  defaultDate: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [date, setDate] = useState(entry?.service_date ?? defaultDate)
  const [unit, setUnit] = useState<SalesUnit | null>(() => initialUnit(catalog, entry))
  const [lines, setLines] = useState<DraftLine[]>(() => initialLines(catalog, entry))
  const [chosenDevice, setChosenDevice] = useState<string | null>(entry?.device_id ?? null)
  const [nota, setNota] = useState(entry?.nota_no ?? "")
  const [note, setNote] = useState(entry?.note ?? "")
  // keterangan dilipat secara default supaya tombol "Next" di keyboard HP tidak mampir ke sini;
  // terbuka otomatis saat mengedit entri yang sudah punya keterangan
  const [metaOpen, setMetaOpen] = useState(Boolean(entry?.nota_no || entry?.note))
  const [focusMeta, setFocusMeta] = useState(false)
  const metaSummary = [nota.trim() && `#${nota.trim()}`, note.trim()].filter(Boolean).join(" · ")
  const [drawer, setDrawer] = useState<null | "unit" | "pl" | "jasa">(null)

  const itemById = useMemo(() => new Map(catalog.items.map((i) => [i.id, i])), [catalog.items])
  const priceById = useMemo(() => new Map(catalog.prices.map((p) => [p.id, p])), [catalog.prices])
  const deviceById = useMemo(() => new Map(catalog.devices.map((d) => [d.id, d])), [catalog.devices])
  const catById = useMemo(() => new Map(catalog.categories.map((c) => [c.id, c])), [catalog.categories])

  const unitInc = unit ? unitIncentive(catalog, unit) : null
  const mustChoose = unitInc ? needsDeviceChoice(catalog, unitInc, lines) : false
  const deviceId = unitInc ? entryDevice(catalog, unitInc, lines, mustChoose ? chosenDevice : null) : null
  const sum = totals(catalog, lines, deviceId)
  const backHref = date === today ? "/" : `/?d=${date}`

  const unitPrices = useMemo(
    () => (unit?.type === "pl" ? catalog.prices.filter((p) => p.unit_name === unit.name) : []),
    [catalog.prices, unit]
  )
  const selectedPriceIds = new Set(lines.filter((l) => l.kind === "pl").map((l) => l.plPriceId!))
  const unitGroups = useMemo(() => {
    const map = new Map<string, SalesUnit[]>()
    for (const u of catalog.units) {
      const g = u.type === "pl" ? u.kelompok : `${u.kelompok} (tanpa price list)`
      map.set(g, [...(map.get(g) ?? []), u])
    }
    return [...map.entries()]
  }, [catalog.units])

  function pickUnit(u: SalesUnit) {
    if (unit && u.name !== unit.name && lines.some((l) => l.kind === "pl")) {
      // baris price list milik unit lama tidak berlaku lagi
      setLines((prev) => prev.filter((l) => l.kind !== "pl"))
      toast.info("Item price list unit sebelumnya dihapus")
    }
    setUnit(u)
    setChosenDevice(null)
    setDrawer(null)
  }

  function togglePrice(p: PlPrice) {
    setLines((prev) => {
      const existing = prev.find((l) => l.kind === "pl" && l.plPriceId === p.id)
      if (existing) return prev.filter((l) => l !== existing)
      const item = itemById.get(p.item_id)
      return [
        ...prev,
        {
          key: newKey(),
          kind: "pl",
          plPriceId: p.id,
          description: [item?.name, p.variant].filter(Boolean).join(" · "),
          price: p.price,
        },
      ]
    })
  }

  function addJasa(categoryId: string) {
    setLines((prev) => [
      ...prev,
      { key: newKey(), kind: "jasa", categoryId, description: catById.get(categoryId)?.name ?? "Jasa", price: null },
    ])
    setDrawer(null)
  }

  function addPart() {
    setLines((prev) => [...prev, { key: newKey(), kind: "part", description: "", price: null }])
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function submit() {
    if (!unit) return toast.error("Pilih unit terlebih dahulu")
    if (lines.length === 0) return toast.error("Tambahkan minimal satu item")
    const missingPrice = lines.find((l) => l.price === null)
    if (missingPrice) return toast.error(`Isi harga untuk "${missingPrice.description || "part lepas"}"`)
    if (lines.some((l) => l.kind === "part" && !l.description.trim())) return toast.error("Isi nama part lepas")
    if (mustChoose && !chosenDevice) return toast.error("Pilih unit insentif")

    startTransition(async () => {
      const res = await saveEntry({
        id: entry?.id ?? null,
        date,
        unitName: unit.name,
        incentiveDeviceId: deviceId,
        lines: lines.map((l) =>
          l.kind === "pl"
            ? { kind: "pl", plPriceId: l.plPriceId!, price: l.price! }
            : l.kind === "jasa"
              ? { kind: "jasa", categoryId: l.categoryId!, price: l.price!, description: l.description }
              : { kind: "part", description: l.description, price: l.price! }
        ),
        nota,
        note,
      })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(entry ? "Perubahan disimpan" : `Tersimpan · ${formatRupiah(sum.sales)}`)
      router.push(res.data.date === today ? "/" : `/?d=${res.data.date}`)
    })
  }

  function remove() {
    if (!entry) return
    startTransition(async () => {
      const res = await deleteEntry(entry.id)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Entri dihapus")
      router.push(backHref)
    })
  }

  const jasaCategories = catalog.categories.filter((c) => !deviceId || catalog.rates[deviceId]?.[c.id])

  return (
    <>
      <PageHeader
        title={entry ? "Edit Servis" : "Tambah Servis"}
        backHref={backHref}
        action={
          entry ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="outline" size="icon-lg" className="rounded-full text-destructive" aria-label="Hapus entri" />
                }
              >
                <Trash2Icon />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus entri ini?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {entry.device_name} · {formatRupiah(entry.total_sales)}. Tindakan ini tidak bisa dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={remove} disabled={pending}>
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : undefined
        }
      />

      <main className="flex flex-col gap-4 pb-32">
        {/* Tanggal */}
        <Panel className="flex flex-col gap-3">
          <Label htmlFor="date" className="text-sm font-semibold">
            Tanggal
          </Label>
          <div className="flex gap-2">
            {[
              { label: "Hari ini", value: today },
              { label: "Kemarin", value: addDays(today, -1) },
            ].map((opt) => (
              <Button
                key={opt.label}
                type="button"
                size="sm"
                variant={date === opt.value ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setDate(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <Input
              id="date"
              type="date"
              value={date}
              max={addDays(today, 30)}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="h-8 flex-1 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground">{formatDateLong(date)}</p>
        </Panel>

        {/* Unit */}
        <Panel className="flex flex-col gap-3">
          <p className="text-sm font-semibold">Unit</p>
          <button
            type="button"
            onClick={() => setDrawer("unit")}
            className={cn(
              "flex items-center gap-3 rounded-2xl border bg-background px-3 py-3 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
              !unit && "border-dashed"
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SmartphoneIcon className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1">
              {unit ? (
                <>
                  <span className="block truncate font-semibold">{unit.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {unit.type === "pl" ? `${unit.kelompok} · ${unitPrices.length} harga` : `${unit.kelompok} · tanpa price list`}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Pilih unit…</span>
              )}
            </span>
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </button>

          {unitInc?.mode === "none" && (
            <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              Unit ini belum ada di memo insentif. Penjualan tetap tercatat, insentif Rp 0.
            </p>
          )}
          {mustChoose && unitInc && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium">Unit insentif</p>
              <div className="flex flex-wrap gap-2">
                {unitInc.candidates.map((id) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={chosenDevice === id ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setChosenDevice(id)}
                  >
                    {deviceById.get(id)?.name ?? "?"}
                  </Button>
                ))}
              </div>
              {!chosenDevice && <p className="text-xs text-destructive">Pilih salah satu untuk menghitung insentif.</p>}
            </div>
          )}
        </Panel>

        {/* Items */}
        <Panel className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold">Yang dikerjakan / dijual</p>
            {lines.length > 0 && <p className="text-xs text-muted-foreground">{lines.length} item</p>}
          </div>

          {lines.length === 0 && (
            <p className="rounded-2xl bg-muted/60 px-3 py-5 text-center text-sm text-muted-foreground">
              {unit ? "Tambahkan item dari price list, jasa lain, atau part lepas." : "Pilih unit dulu."}
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {lines.map((l) => {
              const p = l.plPriceId ? priceById.get(l.plPriceId) : undefined
              const inc = lineIncentive(catalog, l, deviceId)
              const incCat =
                l.kind === "pl" ? catById.get(itemById.get(p?.item_id ?? "")?.category_id ?? "")?.name : catById.get(l.categoryId ?? "")?.name
              return (
                <li key={l.key} className="flex flex-col gap-2 rounded-2xl border bg-background p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                        l.kind === "pl" && "bg-primary/10 text-primary",
                        l.kind === "jasa" && "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                        l.kind === "part" && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                      )}
                    >
                      {l.kind === "pl" ? (
                        <ReceiptTextIcon className="size-3.5" />
                      ) : l.kind === "jasa" ? (
                        <WrenchIcon className="size-3.5" />
                      ) : (
                        <PackageIcon className="size-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      {l.kind === "part" ? (
                        <Input
                          value={l.description}
                          onChange={(e) => updateLine(l.key, { description: e.target.value })}
                          placeholder="Nama part, mis. Tempered glass"
                          aria-label="Nama part lepas"
                          maxLength={120}
                          className="h-8"
                        />
                      ) : (
                        <p className="text-sm leading-tight font-medium">{l.description}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {l.kind === "part"
                          ? "Part lepas · tanpa insentif"
                          : [p?.warranty && `Garansi ${p.warranty}`, incCat && `Insentif ${formatRupiah(inc)}`]
                              .filter(Boolean)
                              .join(" · ") || "Insentif Rp 0"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Hapus ${l.description || "item"}`}
                      onClick={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
                    >
                      <XIcon />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 pl-9">
                    <RupiahInput
                      value={l.price}
                      onChange={(v) => updateLine(l.key, { price: v })}
                      aria-label={`Harga ${l.description}`}
                      placeholder={p && p.price === null ? "Harga Ask, isi manual" : "Harga jual"}
                      className={cn("h-9 flex-1", l.price === null && "ring-1 ring-destructive/40")}
                    />
                    {p && p.price !== null && l.price !== p.price && (
                      <Button type="button" variant="ghost" size="xs" onClick={() => updateLine(l.key, { price: p.price })}>
                        PL {formatRupiah(p.price)}
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {unit && (
            <div className="grid grid-cols-3 gap-2">
              {unit.type === "pl" && (
                <Button type="button" variant="outline" className="h-auto flex-col gap-1 rounded-2xl py-2.5" onClick={() => setDrawer("pl")}>
                  <ReceiptTextIcon />
                  <span className="text-xs">Price list</span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                className={cn("h-auto flex-col gap-1 rounded-2xl py-2.5", unit.type !== "pl" && "col-span-2")}
                onClick={() => setDrawer("jasa")}
              >
                <WrenchIcon />
                <span className="text-xs">Jasa lain</span>
              </Button>
              <Button type="button" variant="outline" className="h-auto flex-col gap-1 rounded-2xl py-2.5" onClick={addPart}>
                <PackageIcon />
                <span className="text-xs">Part lepas</span>
              </Button>
            </div>
          )}
        </Panel>

        {/* Keterangan (bisa dilipat) */}
        <Panel className="flex flex-col gap-3 py-2">
          <button
            type="button"
            aria-expanded={metaOpen}
            aria-controls="entry-meta"
            onClick={() => {
              setMetaOpen((v) => !v)
              setFocusMeta(!metaOpen)
            }}
            className="-mx-2 flex items-center gap-3 rounded-2xl px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">
                Keterangan <span className="font-normal text-muted-foreground">(opsional)</span>
              </span>
              {!metaOpen && (
                <span className="block truncate text-xs text-muted-foreground">
                  {metaSummary || "No. nota, customer / catatan"}
                </span>
              )}
            </span>
            <ChevronDownIcon
              className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", metaOpen && "rotate-180")}
            />
          </button>
          {metaOpen && (
            <div id="entry-meta" className="flex flex-col gap-3 pb-2">
              <div className="grid gap-1.5">
                <Label htmlFor="nota" className="text-xs text-muted-foreground">
                  No. nota
                </Label>
                <Input
                  id="nota"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="mis. NT-0457"
                  maxLength={60}
                  autoFocus={focusMeta}
                  enterKeyHint="next"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="note" className="text-xs text-muted-foreground">
                  Customer / catatan
                </Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="mis. Bu Sari"
                  maxLength={500}
                  enterKeyHint="done"
                />
              </div>
            </div>
          )}
        </Panel>
      </main>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Total penjualan</p>
            <Money value={sum.sales} className="text-xl" />
            <p className="text-xs text-muted-foreground">
              Insentif <span className="font-semibold text-foreground tabular-nums">{formatRupiah(sum.incentive)}</span>
            </p>
          </div>
          <Button size="lg" className="h-12 rounded-full px-6" onClick={submit} disabled={pending}>
            {pending && <Spinner />}
            Simpan
          </Button>
        </div>
      </div>

      {/* Unit picker */}
      <Drawer open={drawer === "unit"} onOpenChange={(o) => !o && setDrawer(null)}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Pilih unit</DrawerTitle>
            <DrawerDescription>Cari model, mis. &ldquo;13 pro&rdquo;, &ldquo;macbook&rdquo;, &ldquo;ipad&rdquo;.</DrawerDescription>
          </DrawerHeader>
          <Command className="min-h-0 flex-1 bg-transparent p-2">
            <CommandInput placeholder="Cari unit…" />
            <CommandList className="max-h-[60dvh]">
              <CommandEmpty>Unit tidak ditemukan.</CommandEmpty>
              {unitGroups.map(([group, units]) => (
                <CommandGroup key={group} heading={group}>
                  {units.map((u) => (
                    <CommandItem key={`${u.type}:${u.name}`} value={`${u.name} ${u.kelompok}`} onSelect={() => pickUnit(u)} className="py-2.5">
                      <span className="flex-1">{u.name}</span>
                      {unit?.name === u.name && <CheckIcon className="text-primary" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DrawerContent>
      </Drawer>

      {/* Price list picker */}
      <Drawer open={drawer === "pl"} onOpenChange={(o) => !o && setDrawer(null)}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Price list · {unit?.name}</DrawerTitle>
            <DrawerDescription>Tap untuk menambah/menghapus. Bisa pilih beberapa.</DrawerDescription>
          </DrawerHeader>
          <PricePicker
            prices={unitPrices.filter((p) => p.is_active || selectedPriceIds.has(p.id))}
            itemById={itemById}
            selected={selectedPriceIds}
            onToggle={togglePrice}
          />
          <DrawerFooter>
            <Button size="lg" className="h-11 rounded-full" onClick={() => setDrawer(null)}>
              Selesai
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Jasa picker */}
      <Drawer open={drawer === "jasa"} onOpenChange={(o) => !o && setDrawer(null)}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Jasa lain</DrawerTitle>
            <DrawerDescription>
              Jasa di luar price list (mis. Face ID Soldering). Harga jual diisi manual
              {deviceId ? `, insentif mengikuti ${deviceById.get(deviceId)?.name}` : ""}.
            </DrawerDescription>
          </DrawerHeader>
          <ul className="flex max-h-[60dvh] flex-col overflow-y-auto px-2 pb-4">
            {jasaCategories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => addJasa(c.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {deviceId ? `Insentif ${formatRupiah(catalog.rates[deviceId]?.[c.id] ?? 0)}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </>
  )
}

function PricePicker({
  prices,
  itemById,
  selected,
  onToggle,
}: {
  prices: PlPrice[]
  itemById: Map<string, { name: string }>
  selected: Set<string>
  onToggle: (p: PlPrice) => void
}) {
  const groups = useMemo(() => {
    const map = new Map<string, PlPrice[]>()
    for (const p of prices) {
      const name = itemById.get(p.item_id)?.name ?? "Lainnya"
      map.set(name, [...(map.get(name) ?? []), p])
    }
    return [...map.entries()]
  }, [prices, itemById])

  return (
    <Command className="min-h-0 flex-1 bg-transparent p-2">
      <CommandInput placeholder="Cari item, mis. lcd oled, baterai…" />
      <CommandList className="max-h-[55dvh]">
        <CommandEmpty>Item tidak ditemukan.</CommandEmpty>
        {groups.map(([name, rows]) => (
          <CommandGroup key={name} heading={name}>
            {rows.map((p) => {
              const on = selected.has(p.id)
              return (
                <CommandItem
                  key={p.id}
                  value={`${name} ${p.variant ?? ""} ${p.warranty ?? ""} ${p.id}`}
                  onSelect={() => onToggle(p)}
                  className="gap-3 py-2.5"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}
                  >
                    {on && <CheckIcon className="size-3" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{p.variant || name}</span>
                    {p.warranty && <span className="block text-xs text-muted-foreground">Garansi {p.warranty}</span>}
                  </span>
                  <span className="shrink-0 text-xs font-semibold tabular-nums">
                    {p.price === null ? "Ask" : formatRupiah(p.price)}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  )
}

