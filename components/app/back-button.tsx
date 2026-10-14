"use client"

import { useRouter } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Kembali ke halaman sebelumnya; kalau tidak ada riwayat (mis. link dibuka langsung), ke Beranda. */
export function BackButton({ label = "Kembali" }: { label?: string }) {
  const router = useRouter()
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-11 rounded-full px-6"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
    >
      <ArrowLeftIcon />
      {label}
    </Button>
  )
}
