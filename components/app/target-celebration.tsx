"use client"

import { useCallback, useEffect } from "react"
import { PartyPopperIcon, SparklesIcon } from "lucide-react"

import { IconBubble, Panel } from "@/components/app/bits"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/format"

const COLORS = ["#c6005c", "#f472b6", "#facc15", "#a78bfa", "#34d399"]

async function burst() {
  const confetti = (await import("canvas-confetti")).default
  const base = { colors: COLORS, disableForReducedMotion: true, zIndex: 60 }
  confetti({ ...base, particleCount: 90, spread: 75, startVelocity: 45, origin: { y: 0.7 } })
  setTimeout(() => {
    confetti({ ...base, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.75 } })
    confetti({ ...base, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.75 } })
  }, 250)
}

/**
 * Banner selamat saat target penjualan HARI INI tercapai.
 * Confetti diputar otomatis sekali per tanggal per perangkat; tombol "Rayakan lagi" memutar ulang.
 */
export function TargetCelebration({ date, sales, target }: { date: string; sales: number; target: number }) {
  const fire = useCallback(() => void burst(), [])

  useEffect(() => {
    const key = `celebrated:${date}`
    try {
      if (localStorage.getItem(key)) return
      localStorage.setItem(key, "1")
    } catch {
      // storage tidak tersedia (mis. mode private): tetap rayakan, tanpa diingat
    }
    fire()
  }, [date, fire])

  const surplus = sales - target

  return (
    <Panel className="relative z-10 flex items-center gap-3 ring-primary/25" role="status">
      <IconBubble className="size-11 [&_svg]:size-5.5">
        <PartyPopperIcon />
      </IconBubble>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-[15px] leading-snug font-semibold text-balance">Selamat yaa, udah tercapai nih targetnya. Good job!</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {surplus > 0 ? (
            <>
              Lebih <span className="font-semibold text-foreground tabular-nums">{formatRupiah(surplus)}</span> dari
              target hari ini. Mantap!
            </>
          ) : (
            "Pas sesuai target hari ini. Mantap!"
          )}
        </p>
      </div>
      <Button variant="ghost" size="icon-lg" className="rounded-full" onClick={fire} aria-label="Rayakan lagi">
        <SparklesIcon />
      </Button>
    </Panel>
  )
}
