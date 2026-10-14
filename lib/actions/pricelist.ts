"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { isIsoDate } from "@/lib/date"
import { createClient, getUser } from "@/lib/supabase/server"
import type { ActionResult } from "@/lib/types"

function friendly(error: { code?: string; message: string }) {
  if (error.code === "23505") return "Nama sudah dipakai, gunakan nama lain"
  return error.message
}

function done() {
  revalidatePath("/", "layout")
}

// ---------------------------------------------------------------- devices + rates
const deviceSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Nama unit wajib diisi").max(80),
  jenis: z.string().trim().min(1, "Jenis wajib diisi").max(40),
  model: z.string().trim().max(80),
  series: z.string().trim().max(80),
  isActive: z.boolean(),
  /** categoryId -> amount; null/0 = tidak berlaku */
  rates: z.record(z.uuid(), z.number().int().min(0).max(100_000_000).nullable()),
})

export async function saveDevice(input: z.input<typeof deviceSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = deviceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const v = parsed.data
  const supabase = await createClient()

  const row = {
    name: v.name,
    jenis: v.jenis,
    model: v.model || null,
    series: v.series || null,
    is_active: v.isActive,
  }
  let id = v.id
  if (id) {
    const { error } = await supabase.from("devices").update(row).eq("id", id)
    if (error) return { ok: false, error: friendly(error) }
  } else {
    const { data: last } = await supabase
      .from("devices")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    const { data, error } = await supabase
      .from("devices")
      .insert({ ...row, sort_order: (last?.sort_order ?? 0) + 10 })
      .select("id")
      .single()
    if (error) return { ok: false, error: friendly(error) }
    id = data.id as string
  }

  const entries = Object.entries(v.rates)
  const upserts = entries
    .filter(([, amount]) => amount && amount > 0)
    .map(([category_id, amount]) => ({ device_id: id, category_id, amount: amount! }))
  const removes = entries.filter(([, amount]) => !amount).map(([categoryId]) => categoryId)

  if (upserts.length) {
    const { error } = await supabase.from("rates").upsert(upserts, { onConflict: "device_id,category_id" })
    if (error) return { ok: false, error: friendly(error) }
  }
  if (removes.length) {
    const { error } = await supabase.from("rates").delete().eq("device_id", id).in("category_id", removes)
    if (error) return { ok: false, error: friendly(error) }
  }

  done()
  return { ok: true, data: { id: id! } }
}

// ---------------------------------------------------------------- rate meta (memo)
const metaSchema = z.object({
  memoNo: z.string().trim().max(80),
  effectiveDate: z.string().refine((v) => v === "" || isIsoDate(v), "Tanggal tidak valid"),
})

export async function saveRateMeta(input: z.input<typeof metaSchema>): Promise<ActionResult> {
  const parsed = metaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const user = await getUser()
  const supabase = await createClient()
  const { error } = await supabase
    .from("rate_meta")
    .update({
      memo_no: parsed.data.memoNo || null,
      effective_date: parsed.data.effectiveDate || null,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1)
  if (error) return { ok: false, error: friendly(error) }
  done()
  return { ok: true }
}

// ---------------------------------------------------------------- categories
const categorySchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(60),
  isActive: z.boolean(),
})

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const v = parsed.data
  const supabase = await createClient()
  if (v.id) {
    const { error } = await supabase
      .from("service_categories")
      .update({ name: v.name, is_active: v.isActive })
      .eq("id", v.id)
    if (error) return { ok: false, error: friendly(error) }
  } else {
    const { data: last } = await supabase
      .from("service_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    const { error } = await supabase
      .from("service_categories")
      .insert({ name: v.name, is_active: v.isActive, sort_order: (last?.sort_order ?? 0) + 1 })
    if (error) return { ok: false, error: friendly(error) }
  }
  done()
  return { ok: true }
}

/** Simpan urutan kategori sesuai array id. */
export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  if (!z.array(z.uuid()).safeParse(ids).success) return { ok: false, error: "Data tidak valid" }
  const supabase = await createClient()
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("service_categories").update({ sort_order: i + 1 }).eq("id", id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: friendly(failed.error) }
  done()
  return { ok: true }
}

// ================================================================ price list PENJUALAN
const priceValue = z.number().int().min(0).max(1_000_000_000).nullable()

const priceUpdatesSchema = z
  .array(z.object({ id: z.uuid(), price: priceValue, isActive: z.boolean() }))
  .min(1)
  .max(500)

/** Simpan perubahan harga/aktif beberapa baris sekaligus. */
export async function savePlPrices(input: z.input<typeof priceUpdatesSchema>): Promise<ActionResult> {
  const parsed = priceUpdatesSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const results = await Promise.all(
    parsed.data.map((r) => supabase.from("pl_prices").update({ price: r.price, is_active: r.isActive }).eq("id", r.id))
  )
  const failed = results.find((r) => r.error)
  if (failed?.error) return { ok: false, error: friendly(failed.error) }
  done()
  return { ok: true }
}

const newPriceSchema = z.object({
  unitName: z.string().trim().min(1).max(120),
  itemId: z.uuid("Pilih item"),
  variant: z.string().trim().max(120),
  warranty: z.string().trim().max(60),
  price: priceValue,
})

/** Tambah baris harga ke sebuah unit. Unit dengan beberapa kunci (mis. MacBook) mendapat kunci baru "unit + varian". */
export async function addPlPrice(input: z.input<typeof newPriceSchema>): Promise<ActionResult> {
  const parsed = newPriceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const v = parsed.data
  const supabase = await createClient()

  const [{ data: item }, { data: existing }] = await Promise.all([
    supabase.from("pl_items").select("id, kelompok").eq("id", v.itemId).maybeSingle(),
    supabase.from("pl_prices").select("unit_id, sort_order").eq("unit_name", v.unitName),
  ])
  if (!item) return { ok: false, error: "Item tidak ditemukan" }

  const unitIds = [...new Set((existing ?? []).map((p) => p.unit_id))]
  let unitId = unitIds.length === 1 ? unitIds[0] : null
  if (!unitId) {
    const key = v.variant ? `${v.unitName} ${v.variant}` : v.unitName
    const { data: found } = await supabase.from("pl_units").select("id").eq("unit_key", key).maybeSingle()
    if (found) {
      unitId = found.id
    } else {
      const { data: created, error } = await supabase
        .from("pl_units")
        .insert({ unit_key: key, kelompok: item.kelompok, incentive_mode: "choose" })
        .select("id")
        .single()
      if (error) return { ok: false, error: friendly(error) }
      unitId = created.id
    }
  }

  const maxSort = Math.max(0, ...(existing ?? []).map((p) => p.sort_order))
  const { error } = await supabase.from("pl_prices").insert({
    unit_name: v.unitName,
    item_id: v.itemId,
    unit_id: unitId,
    variant: v.variant || null,
    warranty: v.warranty || null,
    price: v.price,
    sort_order: maxSort + 1,
  })
  if (error) return { ok: false, error: friendly(error) }
  done()
  return { ok: true }
}

const salesMetaSchema = z.object({
  name: z.string().trim().max(120),
  effective: z.string().refine((v) => v === "" || isIsoDate(v), "Tanggal tidak valid"),
})

export async function saveSalesMeta(input: z.input<typeof salesMetaSchema>): Promise<ActionResult> {
  const parsed = salesMetaSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase
    .from("rate_meta")
    .update({ sales_pl_name: parsed.data.name || null, sales_effective: parsed.data.effective || null })
    .eq("id", 1)
  if (error) return { ok: false, error: friendly(error) }
  done()
  return { ok: true }
}

// ---------------------------------------------------------------- pemetaan
export async function setItemCategory(itemId: string, categoryId: string | null): Promise<ActionResult> {
  if (!z.uuid().safeParse(itemId).success || (categoryId && !z.uuid().safeParse(categoryId).success)) {
    return { ok: false, error: "Data tidak valid" }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("pl_items").update({ category_id: categoryId }).eq("id", itemId)
  if (error) return { ok: false, error: friendly(error) }
  done()
  return { ok: true }
}

const unitMapSchema = z.discriminatedUnion("mode", [
  z.object({ unitId: z.uuid(), mode: z.literal("fixed"), deviceId: z.uuid() }),
  z.object({ unitId: z.uuid(), mode: z.literal("choose") }),
  z.object({ unitId: z.uuid(), mode: z.literal("none") }),
])

export async function setUnitMapping(input: z.input<typeof unitMapSchema>): Promise<ActionResult> {
  const parsed = unitMapSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Data tidak valid" }
  const v = parsed.data
  const supabase = await createClient()
  const { error } = await supabase
    .from("pl_units")
    .update({ incentive_mode: v.mode, incentive_device_id: v.mode === "fixed" ? v.deviceId : null })
    .eq("id", v.unitId)
  if (error) return { ok: false, error: friendly(error) }
  done()
  return { ok: true }
}

const newItemSchema = z.object({
  kelompok: z.string().trim().min(1, "Kelompok wajib diisi").max(40),
  name: z.string().trim().min(1, "Nama item wajib diisi").max(120),
  categoryId: z.uuid().nullable(),
})

export async function addPlItem(input: z.input<typeof newItemSchema>): Promise<ActionResult> {
  const parsed = newItemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const v = parsed.data
  const supabase = await createClient()
  const { data: last } = await supabase
    .from("pl_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()
  const { error } = await supabase
    .from("pl_items")
    .insert({ kelompok: v.kelompok, name: v.name, category_id: v.categoryId, sort_order: (last?.sort_order ?? 0) + 1 })
  if (error) return { ok: false, error: friendly(error) }
  done()
  return { ok: true }
}
