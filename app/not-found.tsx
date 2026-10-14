import type { Metadata } from "next"
import Link from "next/link"
import { HouseIcon } from "lucide-react"

import { BackButton } from "@/components/app/back-button"
import { StatusView } from "@/components/app/status-view"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Halaman tidak ditemukan" }

export default function NotFound() {
  return (
    <StatusView
      code="404"
      title="Halaman tidak ditemukan"
      description="Alamatnya mungkin salah ketik, atau halaman ini sudah dipindahkan. Kuromi juga sudah cari ke mana-mana."
      media={
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/decor/kuromi.webp"
          alt=""
          aria-hidden
          draggable={false}
          className="w-32 -rotate-6 select-none dark:drop-shadow-[0_0_1px_rgb(255_255_255/0.55)]"
        />
      }
    >
      <Button size="lg" className="h-11 rounded-full px-6" render={<Link href="/" />} nativeButton={false}>
        <HouseIcon />
        Ke Beranda
      </Button>
      <BackButton />
    </StatusView>
  )
}
