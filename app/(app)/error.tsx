"use client"

import { ErrorView } from "@/components/app/error-view"

// Error di halaman utama: bottom nav (dari layout (app)) tetap tampil.
export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />
}
