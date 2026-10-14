import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient, getUser } from "./supabase/server"
import type {
  Catalog,
  Category,
  CategorySummary,
  DaySummary,
  Device,
  Entry,
  ItemSummary,
  PlItem,
  PlPrice,
  PlUnit,
  RateMeta,
  SalesCatalog,
  SalesUnit,
  UserSettings,
} from "./types"

const ENTRY_SELECT =
  "id, service_date, nota_no, note, device_id, device_name, incentive_device_name, total_sales, total_incentive, created_at, " +
  "service_entry_items(id, kind, item_name, description, sale_amount, incentive_amount, category_id, category_name, pl_price_id, sort_order)"

const PAGE = 1000
/** Jumlah halaman yang diambil sekaligus (paralel) di putaran pertama. */
const PARALLEL_PAGES = 2

type PageQuery<T> = (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>

/**
 * Ambil semua baris. PostgREST membatasi 1000 baris per request, jadi beberapa halaman
 * diminta PARALEL (bukan berurutan) supaya tabel ~1–2 ribu baris selesai dalam satu putaran jaringan.
 */
async function fetchAll<T>(query: PageQuery<T>) {
  const out: T[] = []
  for (let start = 0; ; start += PAGE * PARALLEL_PAGES) {
    const pages = await Promise.all(
      Array.from({ length: PARALLEL_PAGES }, (_, i) => query(start + i * PAGE, start + (i + 1) * PAGE - 1))
    )
    for (const { data, error } of pages) {
      if (error) throw error
      out.push(...(data ?? []))
      if (!data || data.length < PAGE) return out
    }
  }
}

function sortItems(entries: Entry[]) {
  for (const e of entries) e.service_entry_items.sort((a, b) => a.sort_order - b.sort_order)
  return entries
}

/** User login; redirect ke /login jika tidak ada sesi. */
export const requireUser = cache(async () => {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
})

/**
 * Pengaturan user; dibuat otomatis dengan nilai default saat pertama kali.
 * Tidak perlu menunggu cek login dulu: RLS sudah membatasi ke baris milik user,
 * dan kolom user_id default auth.uid(). Jadi bisa jalan paralel dengan query lain.
 */
export const getSettings = cache(async (): Promise<UserSettings> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from("user_settings").select("*").maybeSingle()
  if (error) throw error
  if (data) return data as UserSettings

  const { data: created, error: insertError } = await supabase.from("user_settings").insert({}).select("*").single()
  if (insertError?.code === "23505") {
    // dibuat bersamaan oleh request lain; ambil ulang
    const { data: again, error: againError } = await supabase.from("user_settings").select("*").single()
    if (againError) throw againError
    return again as UserSettings
  }
  if (insertError) throw insertError
  return created as UserSettings
})

export const getCatalog = cache(async (includeInactive: boolean = false): Promise<Catalog> => {
  const supabase = await createClient()
  let devicesQuery = supabase.from("devices").select("*").order("sort_order").order("name")
  let categoriesQuery = supabase.from("service_categories").select("*").order("sort_order").order("name")
  if (!includeInactive) {
    devicesQuery = devicesQuery.eq("is_active", true)
    categoriesQuery = categoriesQuery.eq("is_active", true)
  }
  const [devices, categories, rates] = await Promise.all([
    devicesQuery,
    categoriesQuery,
    fetchAll<{ device_id: string; category_id: string; amount: number }>((a, b) =>
      supabase.from("rates").select("device_id, category_id, amount").order("device_id").order("category_id").range(a, b)
    ),
  ])
  if (devices.error) throw devices.error
  if (categories.error) throw categories.error

  const map: Catalog["rates"] = {}
  for (const r of rates) {
    ;(map[r.device_id] ??= {})[r.category_id] = r.amount
  }
  return { devices: devices.data as Device[], categories: categories.data as Category[], rates: map }
})

/** Price list penjualan + tarif insentif, untuk form input & halaman Harga Jual. */
export const getSalesCatalog = cache(async (includeInactive: boolean = false): Promise<SalesCatalog> => {
  const supabase = await createClient()
  const [catalog, items, plUnits, prices] = await Promise.all([
    getCatalog(includeInactive),
    supabase.from("pl_items").select("id, kelompok, name, category_id, sort_order").order("sort_order"),
    supabase.from("pl_units").select("id, unit_key, kelompok, incentive_mode, incentive_device_id, note").order("unit_key"),
    fetchAll<PlPrice>((a, b) => {
      let q = supabase
        .from("pl_prices")
        .select("id, unit_name, item_id, unit_id, variant, warranty, price, sort_order, is_active")
        .order("sort_order")
        .order("id")
      if (!includeInactive) q = q.eq("is_active", true)
      return q.range(a, b)
    }),
  ])
  if (items.error) throw items.error
  if (plUnits.error) throw plUnits.error

  const itemById = new Map((items.data as PlItem[]).map((i) => [i.id, i]))
  const units: SalesUnit[] = []
  const seen = new Set<string>()
  for (const p of prices) {
    if (seen.has(p.unit_name)) continue
    seen.add(p.unit_name)
    units.push({ type: "pl", name: p.unit_name, kelompok: itemById.get(p.item_id)?.kelompok ?? "Lainnya" })
  }
  // unit insentif yang tidak tercakup price list (Android, iPad, Laptop, …)
  const mapped = new Set((plUnits.data as PlUnit[]).map((u) => u.incentive_device_id).filter(Boolean))
  for (const d of catalog.devices) {
    if (!mapped.has(d.id) && !seen.has(d.name)) {
      units.push({ type: "device", name: d.name, kelompok: d.jenis, deviceId: d.id })
    }
  }

  return { ...catalog, items: items.data as PlItem[], plUnits: plUnits.data as PlUnit[], prices, units }
})

export async function getDevice(id: string) {
  const supabase = await createClient()
  const [device, rates] = await Promise.all([
    supabase.from("devices").select("*").eq("id", id).maybeSingle(),
    supabase.from("rates").select("category_id, amount").eq("device_id", id),
  ])
  if (device.error) throw device.error
  if (rates.error) throw rates.error
  if (!device.data) return null
  return {
    device: device.data as Device,
    rates: Object.fromEntries(rates.data.map((r) => [r.category_id, r.amount])) as Record<string, number>,
  }
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("service_categories").select("*").order("sort_order").order("name")
  if (error) throw error
  return data as Category[]
}

export async function getRateMeta(): Promise<RateMeta | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("rate_meta").select("memo_no, effective_date, sales_pl_name, sales_effective, updated_at").eq("id", 1).maybeSingle()
  if (error) throw error
  return data as RateMeta | null
}

export async function getEntriesInRange(from: string, to: string): Promise<Entry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("service_entries")
    .select(ENTRY_SELECT)
    .gte("service_date", from)
    .lte("service_date", to)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false })
  if (error) throw error
  return sortItems(data as unknown as Entry[])
}

export async function getEntry(id: string): Promise<Entry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("service_entries").select(ENTRY_SELECT).eq("id", id).maybeSingle()
  if (error) throw error
  return data ? sortItems([data as unknown as Entry])[0] : null
}

export async function getDailySummary(from: string, to: string): Promise<DaySummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("daily_summary", { p_from: from, p_to: to })
  if (error) throw error
  return data as DaySummary[]
}

export async function getItemSummary(from: string, to: string): Promise<ItemSummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("item_summary", { p_from: from, p_to: to })
  if (error) throw error
  return data as ItemSummary[]
}

export async function getCategorySummary(from: string, to: string): Promise<CategorySummary[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("category_summary", { p_from: from, p_to: to })
  if (error) throw error
  return data as CategorySummary[]
}
