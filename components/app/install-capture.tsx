"use client"

import { useEffect } from "react"

import { initInstallCapture } from "@/lib/pwa-install"

/** Dipasang di root layout: menangkap event install sejak halaman pertama dibuka. */
export function InstallCapture() {
  useEffect(() => {
    initInstallCapture()
  }, [])
  return null
}
