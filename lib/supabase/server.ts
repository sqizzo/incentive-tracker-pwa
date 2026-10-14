import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { supabaseKey, supabaseUrl } from "./env"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Dipanggil dari Server Component: cookie tidak bisa ditulis di sini,
          // sesi sudah di-refresh oleh proxy.ts.
        }
      },
    },
  })
}

/** User yang sedang login (divalidasi lewat JWT claims). */
export async function getUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null
  return { id: claims.sub as string, email: (claims.email as string) ?? "" }
}
