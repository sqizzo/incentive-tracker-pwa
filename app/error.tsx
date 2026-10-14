"use client"

import { ErrorView } from "@/components/app/error-view"

// Error di luar halaman utama (mis. halaman login).
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />
}
