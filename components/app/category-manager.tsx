"use client"

import { useState, useTransition } from "react"
import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Panel } from "@/components/app/bits"
import { PageHeader } from "@/components/app/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { reorderCategories, saveCategory } from "@/lib/actions/pricelist"
import type { Category } from "@/lib/types"
import { cn } from "@/lib/utils"

type Editing = { id: string | null; name: string; isActive: boolean }

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [order, setOrder] = useState(categories)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [pending, startTransition] = useTransition()

  // sinkron saat data server berubah (setelah simpan)
  const [source, setSource] = useState(categories)
  if (source !== categories) {
    setSource(categories)
    setOrder(categories)
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)
    startTransition(async () => {
      const res = await reorderCategories(next.map((c) => c.id))
      if (!res.ok) {
        toast.error(res.error)
        setOrder(order)
      }
    })
  }

  function save() {
    if (!editing) return
    startTransition(async () => {
      const res = await saveCategory(editing)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(editing.id ? "Kategori diperbarui" : "Kategori ditambahkan")
      setEditing(null)
    })
  }

  return (
    <>
      <PageHeader
        title="Kategori Service"
        backHref="/setelan"
        action={
          <Button
            size="icon-lg"
            className="rounded-full"
            aria-label="Tambah kategori"
            onClick={() => setEditing({ id: null, name: "", isActive: true })}
          >
            <PlusIcon />
          </Button>
        }
      />
      <main className="flex flex-col gap-3 pb-8">
        <p className="px-1 text-xs text-muted-foreground">
          Urutan ini dipakai di form input servis. Mengganti nama tidak mengubah entri lama.
        </p>
        <Panel className="p-1.5">
          <ul className="flex flex-col divide-y">
            {order.map((c, i) => (
              <li key={c.id} className={cn("flex items-center gap-1 py-1 pl-2.5", !c.is_active && "opacity-55")}>
                <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => setEditing({ id: c.id, name: c.name, isActive: c.is_active })}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-xl py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  {!c.is_active && (
                    <Badge variant="outline" className="shrink-0">
                      Nonaktif
                    </Badge>
                  )}
                  <PencilIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Naikkan ${c.name}`}
                  disabled={i === 0 || pending}
                  onClick={() => move(i, -1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Turunkan ${c.name}`}
                  disabled={i === order.length - 1 || pending}
                  onClick={() => move(i, 1)}
                >
                  <ArrowDownIcon />
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      </main>

      <Drawer open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DrawerContent className="mx-auto max-w-md">
          {editing && (
            <>
              <DrawerHeader>
                <DrawerTitle>{editing.id ? "Edit kategori" : "Kategori baru"}</DrawerTitle>
                <DrawerDescription>
                  {editing.id ? "Ubah nama atau nonaktifkan kategori." : "Atur tarifnya per unit di Tarif Insentif."}
                </DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-3 p-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="cat-name">Nama kategori</Label>
                  <Input
                    id="cat-name"
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="mis. Ganti Baterai"
                    className="h-10"
                    autoFocus
                  />
                </div>
                <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-3 py-2.5">
                  <span>
                    <span className="block text-sm font-medium">Aktif</span>
                    <span className="block text-xs text-muted-foreground">Kategori nonaktif tidak muncul di form input.</span>
                  </span>
                  <Switch checked={editing.isActive} onCheckedChange={(v) => setEditing({ ...editing, isActive: v })} />
                </label>
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
