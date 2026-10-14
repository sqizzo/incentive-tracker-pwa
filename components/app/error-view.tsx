"use client"

import { useEffect, useSyncExternalStore } from "react"
import Link from "next/link"
import { HouseIcon, RotateCwIcon, TriangleAlertIcon, WifiOffIcon } from "lucide-react"

import { StatusIcon, StatusView } from "@/components/app/status-view"
import { Button } from "@/components/ui/button"

function subscribe(callback: () => void) {
  window.addEventListener("online", callback)
  window.addEventListener("offline", callback)
  return () => {
    window.removeEventListener("online", callback)
    window.removeEventListener("offline", callback)
  }
}

/** Status koneksi browser; saat render di server dianggap online. */
function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  )
}

/**
 * Tampilan untuk error boundary (error.tsx). Pesan teknis dari server tidak ditampilkan
 * (Next.js menyembunyikannya di produksi); yang tampil hanya kode `digest` untuk dicocokkan dengan log server.
 */
export function ErrorView({
  error,
  retry,
  showHome = true,
}: {
  error: Error & { digest?: string }
  retry: () => void
  showHome?: boolean
}) {
  const online = useOnline()

  useEffect(() => {
    console.error(error)
  }, [error])

  // begitu koneksi kembali, coba muat ulang otomatis
  useEffect(() => {
    const onOnline = () => retry()
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [retry])

  return (
    <StatusView
      code={online ? undefined : "Offline"}
      title={online ? "Halaman gagal dimuat" : "Tidak ada koneksi internet"}
      description={
        online
          ? "Mungkin koneksi sedang lambat atau server sedang bermasalah. Data Anda tetap aman. Coba muat ulang sebentar lagi."
          : "Periksa sinyal atau Wi-Fi. Halaman akan dimuat ulang otomatis begitu koneksi kembali."
      }
      media={<StatusIcon tone={online ? "destructive" : "muted"}>{online ? <TriangleAlertIcon /> : <WifiOffIcon />}</StatusIcon>}
      footnote={error.digest ? <>Kode error: <span className="font-mono">{error.digest}</span></> : undefined}
    >
      <Button size="lg" className="h-11 rounded-full px-6" onClick={() => retry()}>
        <RotateCwIcon />
        Coba lagi
      </Button>
      {showHome && (
        <Button variant="outline" size="lg" className="h-11 rounded-full px-6" render={<Link href="/" />} nativeButton={false}>
          <HouseIcon />
          Ke Beranda
        </Button>
      )}
    </StatusView>
  )
}
