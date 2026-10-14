import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRightIcon, GitCompareArrowsIcon, ReceiptTextIcon, TagsIcon, UserRoundCogIcon, WalletIcon } from "lucide-react"

import { IconBubble, Panel, Screen } from "@/components/app/bits"
import { PageHeader } from "@/components/app/page-header"
import { SignOutButton } from "@/components/app/sign-out-button"
import { ThemeSwitcher } from "@/components/app/theme-switcher"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRateMeta, getSettings, requireUser } from "@/lib/data"
import { formatRupiah, initials } from "@/lib/format"

export const metadata: Metadata = { title: "Setelan" }

export default async function SettingsPage() {
  const [user, settings, meta] = await Promise.all([requireUser(), getSettings(), getRateMeta()])
  const name = settings.display_name || user.email.split("@")[0]

  const items = [
    {
      href: "/setelan/profil",
      icon: <UserRoundCogIcon />,
      tone: "sky" as const,
      title: "Profil & Target",
      desc: `Target penjualan ${formatRupiah(settings.default_target)}/hari`,
    },
    {
      href: "/setelan/harga-jual",
      icon: <ReceiptTextIcon />,
      tone: "primary" as const,
      title: "Harga Jual",
      desc: meta?.sales_pl_name || "Price list penjualan",
    },
    {
      href: "/setelan/tarif",
      icon: <WalletIcon />,
      tone: "emerald" as const,
      title: "Tarif Insentif",
      desc: meta?.memo_no ? `Memo ${meta.memo_no}` : "Tarif insentif per unit",
    },
    {
      href: "/setelan/pemetaan",
      icon: <GitCompareArrowsIcon />,
      tone: "orange" as const,
      title: "Pemetaan Insentif",
      desc: "Item jual → kategori, unit → unit insentif",
    },
    {
      href: "/setelan/kategori",
      icon: <TagsIcon />,
      tone: "violet" as const,
      title: "Kategori Service",
      desc: "Tambah, ubah nama, urutkan",
    },
  ]

  return (
    <Screen>
      <PageHeader title="Setelan" />

      <Panel className="flex items-center gap-3">
        <Avatar size="lg" className="size-12">
          <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-semibold">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
      </Panel>

      <Panel className="p-2">
        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors outline-none hover:bg-muted focus-visible:bg-muted active:bg-muted"
              >
                <IconBubble tone={it.tone}>{it.icon}</IconBubble>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{it.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{it.desc}</span>
                </span>
                <ChevronRightIcon className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="p-2">
        <ThemeSwitcher />
      </Panel>

      <Panel className="p-2">
        <SignOutButton />
      </Panel>
    </Screen>
  )
}
