import { Panel, Screen } from "@/components/app/bits"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** Skeleton yang berada langsung di latar halaman (bukan di dalam kartu) butuh warna lebih kontras. */
const ON_BG = "bg-foreground/10"

/** Kerangka header halaman (judul di tengah, tombol bulat opsional) — meniru PageHeader. */
export function HeaderSkeleton({ back = false, action = false }: { back?: boolean; action?: boolean }) {
  return (
    <div className="-mx-4 mb-2 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3">
      {back ? <Skeleton className={cn("size-10 rounded-full", ON_BG)} /> : <span />}
      <Skeleton className={cn("mx-auto h-5 w-28", ON_BG)} />
      {action ? <Skeleton className={cn("size-10 justify-self-end rounded-full", ON_BG)} /> : <span />}
    </div>
  )
}

export function CardListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <Panel key={i} className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </Panel>
      ))}
    </div>
  )
}

export function ListPanelSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Panel className="flex flex-col gap-1 p-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2.5">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
      ))}
    </Panel>
  )
}

/** Beranda: header sapaan, hero ring, 2 kartu stat, kalender minggu, daftar entri. */
export function HomeSkeleton() {
  return (
    <Screen className="pt-4" aria-busy aria-label="Memuat beranda">
      <div className="flex items-center gap-3">
        <Skeleton className={cn("size-10 rounded-full", ON_BG)} />
        <div className="flex flex-col gap-1.5">
          <Skeleton className={cn("h-3 w-24", ON_BG)} />
          <Skeleton className={cn("h-4 w-32", ON_BG)} />
        </div>
      </div>
      <Panel className="flex items-center gap-4 bg-primary/10 ring-primary/15 dark:bg-primary/15">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-28 bg-primary/15" />
          <Skeleton className="h-8 w-40 bg-primary/15" />
          <Skeleton className="h-3 w-32 bg-primary/15" />
        </div>
        <Skeleton className="size-[92px] rounded-full bg-primary/15" />
      </Panel>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <Panel key={i} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="size-9 rounded-full" />
            </div>
            <Skeleton className="h-7 w-24" />
          </Panel>
        ))}
      </div>
      <Panel className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-8 w-[4.5rem] rounded-full" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[4.25rem] rounded-full" />
          ))}
        </div>
      </Panel>
      <Skeleton className="h-16 w-full rounded-3xl bg-card ring-1 ring-foreground/5" />
      <Skeleton className={cn("h-4 w-36", ON_BG)} />
      <CardListSkeleton rows={2} />
    </Screen>
  )
}

/** Rekap: toggle minggu/bulan, navigasi periode, kartu chart, grid statistik. */
export function RecapSkeleton() {
  return (
    <Screen aria-busy aria-label="Memuat rekap">
      <HeaderSkeleton />
      <Skeleton className={cn("h-9 w-full rounded-full", ON_BG)} />
      <div className="flex items-center justify-between">
        <Skeleton className={cn("size-10 rounded-full", ON_BG)} />
        <Skeleton className={cn("h-5 w-32", ON_BG)} />
        <Skeleton className={cn("size-10 rounded-full", ON_BG)} />
      </div>
      <Panel className="flex flex-col gap-4 p-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-3 w-36" />
        <div className="flex h-44 items-end gap-2.5">
          {[45, 80, 60, 30, 70, 50, 20].map((h, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-[4px] rounded-b-none" style={{ height: `${h}%` }} />
          ))}
        </div>
      </Panel>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Panel key={i} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-7 w-20" />
          </Panel>
        ))}
      </div>
    </Screen>
  )
}

/** Riwayat: navigasi bulan, kartu total, daftar entri. */
export function HistorySkeleton() {
  return (
    <Screen aria-busy aria-label="Memuat riwayat">
      <HeaderSkeleton />
      <div className="flex items-center justify-between">
        <Skeleton className={cn("size-10 rounded-full", ON_BG)} />
        <Skeleton className={cn("h-5 w-32", ON_BG)} />
        <Skeleton className={cn("size-10 rounded-full", ON_BG)} />
      </div>
      <Panel className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-36" />
        </div>
        <Skeleton className="h-5 w-14" />
      </Panel>
      <Skeleton className={cn("h-4 w-40", ON_BG)} />
      <CardListSkeleton rows={4} />
    </Screen>
  )
}

/** Halaman daftar di Setelan (harga jual, tarif, pemetaan, kategori). */
export function SettingsListSkeleton({ title = true }: { title?: boolean }) {
  return (
    <Screen aria-busy aria-label="Memuat">
      <HeaderSkeleton back={title} action={title} />
      <Skeleton className="h-11 w-full rounded-full bg-card ring-1 ring-foreground/10" />
      <Skeleton className={cn("h-4 w-20", ON_BG)} />
      <ListPanelSkeleton rows={7} />
    </Screen>
  )
}

/** Form (tambah/edit servis, profil, tarif unit): beberapa panel isian + footer tombol. */
export function FormSkeleton({ panels = 3 }: { panels?: number }) {
  return (
    <div aria-busy aria-label="Memuat formulir">
      <HeaderSkeleton back />
      <div className="flex flex-col gap-4">
        {Array.from({ length: panels }, (_, i) => (
          <Panel key={i} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full rounded-2xl" />
            {i === 1 && <Skeleton className="h-16 w-full rounded-2xl" />}
          </Panel>
        ))}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-12 w-28 rounded-full" />
        </div>
      </div>
    </div>
  )
}

/** Setelan: kartu profil, menu, tampilan, keluar. */
export function SettingsHomeSkeleton() {
  return (
    <Screen aria-busy aria-label="Memuat setelan">
      <HeaderSkeleton />
      <Panel className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </Panel>
      <ListPanelSkeleton rows={5} />
      <Skeleton className="h-14 w-full rounded-3xl bg-card ring-1 ring-foreground/5" />
      <Skeleton className="h-14 w-full rounded-3xl bg-card ring-1 ring-foreground/5" />
    </Screen>
  )
}
