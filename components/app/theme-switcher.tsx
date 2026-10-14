"use client"

import { useSyncExternalStore } from "react"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { IconBubble } from "@/components/app/bits"
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "light", label: "Terang", icon: SunIcon },
  { value: "dark", label: "Gelap", icon: MoonIcon },
  { value: "system", label: "Sistem", icon: MonitorIcon },
] as const

const subscribe = () => () => {}

/** Pilihan tema: terang / gelap / ikut sistem (disimpan next-themes di localStorage). */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  // tema baru diketahui setelah hydrate; sebelum itu jangan tandai pilihan apa pun
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const current = mounted ? (theme ?? "system") : null

  return (
    <div className="flex items-center gap-3 px-2 py-2">
      <IconBubble tone="violet">{current === "dark" ? <MoonIcon /> : <SunIcon />}</IconBubble>
      <span className="min-w-0 flex-1 text-sm font-semibold">Tampilan</span>
      <div role="radiogroup" aria-label="Tema tampilan" className="flex rounded-full bg-muted p-1">
        {OPTIONS.map((o) => {
          const Icon = o.icon
          const active = current === o.value
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={o.label}
              title={o.label}
              onClick={() => setTheme(o.value)}
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-background text-foreground shadow-xs"
              )}
            >
              <Icon className="size-4" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
