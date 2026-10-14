"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { createClient } from "@/lib/supabase/server"

export type LoginState = { error?: string; email?: string }

const loginSchema = z.object({
  email: z.email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const parsed = loginSchema.safeParse({ email, password: formData.get("password") })
  if (!parsed.success) return { error: parsed.error.issues[0].message, email }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return {
      error: error.code === "invalid_credentials" ? "Email atau password salah" : error.message,
      email,
    }
  }
  redirect("/")
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Password lama wajib diisi"),
    next: z.string().min(8, "Password baru minimal 8 karakter").max(72, "Password baru maksimal 72 karakter"),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Konfirmasi password tidak sama", path: ["confirm"] })
  .refine((v) => v.next !== v.current, { message: "Password baru harus berbeda dari password lama", path: ["next"] })

export type ChangePasswordState = { ok?: boolean; error?: string; field?: "current" | "next" | "confirm" }

const PASSWORD_ERRORS: Record<string, string> = {
  same_password: "Password baru harus berbeda dari password lama",
  weak_password: "Password baru terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol",
  reauthentication_needed: "Demi keamanan, silakan keluar lalu masuk lagi sebelum mengganti password",
  over_request_rate_limit: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi",
}

/**
 * Ganti password user yang sedang login.
 * Password lama diverifikasi dulu (login ulang), lalu sesi di perangkat lain di-logout.
 */
export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  })
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { error: issue.message, field: issue.path[0] as ChangePasswordState["field"] }
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = data?.claims?.email as string | undefined
  if (!email) return { error: "Sesi berakhir, silakan login ulang" }

  // verifikasi password lama
  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: parsed.data.current })
  if (verifyError) {
    return verifyError.code === "invalid_credentials"
      ? { error: "Password lama salah", field: "current" }
      : { error: PASSWORD_ERRORS[verifyError.code ?? ""] ?? verifyError.message }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.next })
  if (error) return { error: PASSWORD_ERRORS[error.code ?? ""] ?? error.message, field: "next" }

  // perangkat lain yang masih login dengan password lama di-logout; perangkat ini tetap login
  await supabase.auth.signOut({ scope: "others" })
  return { ok: true }
}
