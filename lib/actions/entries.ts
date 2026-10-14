"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { isIsoDate } from "@/lib/date"
import { createClient } from "@/lib/supabase/server"
import type { ActionResult } from "@/lib/types"

const price = z.number({ error: "Harga wajib diisi" }).int().min(0, "Harga tidak boleh negatif").max(1_000_000_000)

const lineSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("pl"), plPriceId: z.uuid(), price }),
  z.object({ kind: z.literal("jasa"), categoryId: z.uuid(), price, description: z.string().max(120).optional() }),
  z.object({ kind: z.literal("part"), description: z.string().trim().min(1, "Nama part wajib diisi").max(120), price }),
])

const entrySchema = z.object({
  id: z.uuid().nullable(),
  date: z.string().refine(isIsoDate, "Tanggal tidak valid"),
  unitName: z.string().trim().min(1, "Pilih unit terlebih dahulu").max(120),
  incentiveDeviceId: z.uuid().nullable(),
  lines: z.array(lineSchema).min(1, "Tambahkan minimal satu item"),
  nota: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
})

export type EntryInput = z.input<typeof entrySchema>

export async function saveEntry(input: EntryInput): Promise<ActionResult<{ id: string; date: string }>> {
  const parsed = entrySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const v = parsed.data

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("save_service_entry", {
    p_id: v.id,
    p_date: v.date,
    p_unit_name: v.unitName,
    p_incentive_device_id: v.incentiveDeviceId,
    p_lines: v.lines.map((l) =>
      l.kind === "pl"
        ? { kind: "pl", pl_price_id: l.plPriceId, price: l.price }
        : l.kind === "jasa"
          ? { kind: "jasa", category_id: l.categoryId, price: l.price, description: l.description }
          : { kind: "part", description: l.description, price: l.price }
    ),
    p_nota: v.nota ?? null,
    p_note: v.note ?? null,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/", "layout")
  return { ok: true, data: { id: data as string, date: v.date } }
}

export async function deleteEntry(id: string): Promise<ActionResult> {
  if (!z.uuid().safeParse(id).success) return { ok: false, error: "ID tidak valid" }
  const supabase = await createClient()
  const { error, count } = await supabase.from("service_entries").delete({ count: "exact" }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  if (!count) return { ok: false, error: "Entri tidak ditemukan" }
  revalidatePath("/", "layout")
  return { ok: true }
}
