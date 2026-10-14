"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { isIsoDate } from "@/lib/date"
import { createClient, getUser } from "@/lib/supabase/server"
import type { ActionResult } from "@/lib/types"

const profileSchema = z.object({
  displayName: z.string().trim().max(60),
  defaultTarget: z.number().int().min(0, "Target tidak boleh negatif").max(100_000_000),
  trackingStart: z.string().refine(isIsoDate, "Tanggal mulai tidak valid"),
  weeklyOffDays: z.array(z.number().int().min(0).max(6)).max(7),
})

export async function saveProfile(input: z.input<typeof profileSchema>): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const user = await getUser()
  if (!user) return { ok: false, error: "Sesi berakhir, silakan login ulang" }

  const v = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      display_name: v.displayName || null,
      default_target: v.defaultTarget,
      tracking_start: v.trackingStart,
      weekly_off_days: [...new Set(v.weeklyOffDays)].sort(),
    },
    { onConflict: "user_id" }
  )
  if (error) return { ok: false, error: error.message }
  revalidatePath("/", "layout")
  return { ok: true }
}

const dayTargetSchema = z.object({
  date: z.string().refine(isIsoDate, "Tanggal tidak valid"),
  mode: z.enum(["default", "custom", "off"]),
  amount: z.number().int().min(0).max(100_000_000).nullable(),
})

/** Atur target satu hari: ikut default, target khusus, atau libur. */
export async function setDayTarget(input: z.input<typeof dayTargetSchema>): Promise<ActionResult> {
  const parsed = dayTargetSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const user = await getUser()
  if (!user) return { ok: false, error: "Sesi berakhir, silakan login ulang" }

  const { date, mode, amount } = parsed.data
  const supabase = await createClient()
  const { error } =
    mode === "default"
      ? await supabase.from("daily_targets").delete().eq("user_id", user.id).eq("date", date)
      : await supabase.from("daily_targets").upsert(
          {
            user_id: user.id,
            date,
            is_off: mode === "off",
            amount: mode === "custom" ? (amount ?? 0) : null,
          },
          { onConflict: "user_id,date" }
        )
  if (error) return { ok: false, error: error.message }
  revalidatePath("/", "layout")
  return { ok: true }
}
