"use client"

import { useLinkStatus } from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

const ICONS = { left: ChevronLeftIcon, right: ChevronRightIcon }

/**
 * Ikon panah di dalam <Link>: berganti spinner selama navigasi menunggu server.
 * Harus dirender sebagai turunan <Link> agar useLinkStatus bekerja.
 */
export function LinkPendingIcon({ icon }: { icon: keyof typeof ICONS }) {
  const { pending } = useLinkStatus()
  const Icon = ICONS[icon]
  return pending ? <Spinner aria-label="Memuat" /> : <Icon />
}

/**
 * Sorotan berdenyut di atas <Link> (mis. pill tanggal) selama navigasi menunggu.
 * <Link> induknya harus `relative`.
 */
export function LinkPendingOverlay({ className }: { className?: string }) {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return <span aria-hidden className={cn("absolute inset-0 animate-pulse rounded-full bg-primary/25", className)} />
}
