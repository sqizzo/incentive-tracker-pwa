import { DatabaseIcon } from "lucide-react"

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DatabaseIcon />
          </EmptyMedia>
          <EmptyTitle>Supabase belum dikonfigurasi</EmptyTitle>
          <EmptyDescription>
            Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> di{" "}
            <code>.env.local</code> (lokal) atau environment variables Netlify, lalu jalankan ulang aplikasi.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  )
}
