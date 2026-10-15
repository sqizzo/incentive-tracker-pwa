"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, XIcon } from "lucide-react"

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"

const DEBOUNCE_MS = 300

function historyUrl(query: string, month?: string) {
  const params = new URLSearchParams()
  if (month) params.set("m", month)
  if (query) params.set("q", query)
  const qs = params.toString()
  return qs ? `/riwayat?${qs}` : "/riwayat"
}

/**
 * Kotak cari Riwayat. Kata kunci disimpan di URL (?q=) dengan debounce, jadi tombol back
 * kembali ke hasil yang sama. `month` dipertahankan supaya tombol × kembali ke bulan semula.
 */
export function HistorySearch({ query, month }: { query: string; month?: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(query)
  /** kata kunci terakhir yang kita kirim ke URL; perubahan lain berarti datang dari luar (mis. tombol back) */
  const [sent, setSent] = useState(query)
  const [prevQuery, setPrevQuery] = useState(query)

  // URL berubah dari luar (back/forward): samakan isi kotak cari. Hasil pencarian yang kita
  // kirim sendiri diabaikan, supaya respons yang datang terlambat tidak menimpa ketikan terbaru.
  if (query !== prevQuery) {
    setPrevQuery(query)
    if (query !== sent) {
      setSent(query)
      setValue(query)
    }
  }

  useEffect(() => {
    const next = value.trim()
    if (next === sent) return
    const t = setTimeout(() => {
      setSent(next)
      startTransition(() => router.replace(historyUrl(next, month), { scroll: false }))
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [value, sent, month, router])

  function clear() {
    setValue("")
    setSent("")
    startTransition(() => router.replace(historyUrl("", month), { scroll: false }))
  }

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()}>
      <InputGroup className="h-11 rounded-full bg-card">
        <InputGroupAddon>{pending ? <Spinner /> : <SearchIcon />}</InputGroupAddon>
        <InputGroupInput
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cari nota, customer, unit, item…"
          aria-label="Cari riwayat servis"
          enterKeyHint="search"
          maxLength={100}
          autoComplete="off"
          className="[&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" className="rounded-full" onClick={clear} aria-label="Hapus pencarian">
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  )
}
