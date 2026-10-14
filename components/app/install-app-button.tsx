"use client"

import { useState, useSyncExternalStore } from "react"
import { ChevronRightIcon, DownloadIcon, EllipsisVerticalIcon, ShareIcon, SquarePlusIcon } from "lucide-react"
import { toast } from "sonner"

import { IconBubble, Panel } from "@/components/app/bits"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { getInstallState, getServerInstallState, promptInstall, subscribeInstall } from "@/lib/pwa-install"

/**
 * Tombol "Install aplikasi" di Setelan.
 * - Chrome/Edge/Android: memicu dialog install bawaan browser.
 * - iPhone/iPad, atau browser yang belum siap: membuka panduan langkah demi langkah.
 * - Sudah terpasang: tidak ditampilkan.
 */
export function InstallAppButton() {
  const install = useSyncExternalStore(subscribeInstall, getInstallState, getServerInstallState)
  const [guideOpen, setGuideOpen] = useState(false)

  if (install.installed) return null

  async function onClick() {
    if (!install.canPrompt) {
      setGuideOpen(true)
      return
    }
    const outcome = await promptInstall()
    if (outcome === "accepted") toast.success("Aplikasi sedang dipasang di layar utama")
    else if (outcome === "unavailable") setGuideOpen(true)
  }

  return (
    <>
      <Panel className="p-2">
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors outline-none hover:bg-muted focus-visible:bg-muted active:bg-muted"
        >
          <IconBubble tone="primary">
            <DownloadIcon />
          </IconBubble>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Install aplikasi</span>
            <span className="block truncate text-xs text-muted-foreground">
              Pasang di layar utama, buka seperti aplikasi biasa
            </span>
          </span>
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </button>
      </Panel>

      <Drawer open={guideOpen} onOpenChange={setGuideOpen}>
        <DrawerContent className="mx-auto max-w-md">
          <DrawerHeader>
            <DrawerTitle>Install aplikasi</DrawerTitle>
            <DrawerDescription>
              {install.ios ? "Di iPhone/iPad, install lewat Safari:" : "Install lewat menu browser:"}
            </DrawerDescription>
          </DrawerHeader>
          <ol className="flex flex-col gap-3 p-4">
            {(install.ios
              ? [
                  { icon: <ShareIcon />, text: <>Buka aplikasi ini di <b>Safari</b>, lalu ketuk tombol <b>Share</b> di bawah layar.</> },
                  { icon: <SquarePlusIcon />, text: <>Gulir ke bawah, pilih <b>Add to Home Screen</b> (Tambah ke Layar Utama).</> },
                  { icon: <DownloadIcon />, text: <>Ketuk <b>Add</b>. Ikon Incentive akan muncul di layar utama.</> },
                ]
              : [
                  { icon: <EllipsisVerticalIcon />, text: <>Ketuk menu <b>⋮</b> di pojok kanan atas browser.</> },
                  { icon: <DownloadIcon />, text: <>Pilih <b>Install app</b> atau <b>Tambahkan ke layar utama</b>.</> },
                  { icon: <SquarePlusIcon />, text: <>Konfirmasi. Ikon Incentive akan muncul di layar utama.</> },
                ]
            ).map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <IconBubble tone="muted" className="size-8 [&_svg]:size-4">
                  {step.icon}
                </IconBubble>
                <p className="pt-1.5 text-sm leading-relaxed">
                  <span className="mr-1 font-semibold text-muted-foreground">{i + 1}.</span>
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
          <DrawerFooter>
            <Button size="lg" className="h-11 rounded-full" onClick={() => setGuideOpen(false)}>
              Mengerti
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
