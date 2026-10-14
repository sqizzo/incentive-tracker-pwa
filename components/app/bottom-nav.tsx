"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChartColumnIcon, HouseIcon, ListIcon, PlusIcon, SettingsIcon, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type Tab = { href: string; label: string; icon: LucideIcon }

const LEFT: Tab[] = [
  { href: "/", label: "Beranda", icon: HouseIcon },
  { href: "/riwayat", label: "Riwayat", icon: ListIcon },
]
const RIGHT: Tab[] = [
  { href: "/rekap", label: "Rekap", icon: ChartColumnIcon },
  { href: "/setelan", label: "Setelan", icon: SettingsIcon },
]

/** Halaman yang tidak menampilkan bottom nav (form & sub-halaman). */
const HIDDEN = [/^\/servis\//, /^\/setelan\/.+/]

export function BottomNav() {
  const pathname = usePathname()
  if (HIDDEN.some((re) => re.test(pathname))) return null

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-background/80"
    >
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
        {LEFT.map((tab) => (
          <NavTab key={tab.href} tab={tab} active={isActive(tab.href)} />
        ))}
        <div className="flex justify-center">
          <Link
            href="/servis/baru"
            aria-label="Tambah servis"
            className="-mt-8 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform outline-none focus-visible:ring-ring active:scale-95"
          >
            <PlusIcon className="size-7" strokeWidth={2.5} />
          </Link>
        </div>
        {RIGHT.map((tab) => (
          <NavTab key={tab.href} tab={tab} active={isActive(tab.href)} />
        ))}
      </div>
    </nav>
  )
}

function NavTab({ tab, active }: { tab: Tab; active: boolean }) {
  const Icon = tab.icon
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "font-semibold text-primary"
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
      {tab.label}
    </Link>
  )
}
