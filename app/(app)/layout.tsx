import { BottomNav } from "@/components/app/bottom-nav"
import { SetupNotice } from "@/components/app/setup-notice"
import { hasSupabaseEnv } from "@/lib/supabase/env"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv) return <SetupNotice />
  return (
    <>
      <div className="mx-auto min-h-dvh w-full max-w-md px-4 pt-[env(safe-area-inset-top)] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </>
  )
}
