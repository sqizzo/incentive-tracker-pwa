import type { Metadata } from "next"

import { KuromiDecor } from "@/components/app/kuromi-decor"
import { LoginForm } from "@/components/app/login-form"
import { SetupNotice } from "@/components/app/setup-notice"
import { hasSupabaseEnv } from "@/lib/supabase/env"

export const metadata: Metadata = { title: "Masuk" }

export default function LoginPage() {
  if (!hasSupabaseEnv) return <SetupNotice />
  return (
    <>
      <KuromiDecor variant="login" />
      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/icon-192.png"
            alt=""
            className="size-16 rounded-2xl shadow-sm"
          />
          <div>
            <h1 className="font-heading text-2xl font-semibold">
              Incentive Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              Catat servisan, pantau target harian.
            </p>
          </div>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Belum punya akun? Minta Mas Bai Buatin :)
        </p>
      </main>
    </>
  )
}
