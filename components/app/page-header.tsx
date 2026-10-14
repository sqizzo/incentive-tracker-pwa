import Link from "next/link"
import { ChevronLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/** Header halaman: tombol back bulat, judul di tengah, slot aksi di kanan. */
export function PageHeader({
  title,
  backHref,
  action,
}: {
  title: string
  backHref?: string
  action?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-2 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 bg-muted/60 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur dark:bg-background/80">
      {backHref ? (
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          render={<Link href={backHref} aria-label="Kembali" />}
          nativeButton={false}
        >
          <ChevronLeftIcon />
        </Button>
      ) : (
        <span />
      )}
      <h1 className="truncate text-center font-heading text-lg font-semibold">{title}</h1>
      <div className="flex justify-end">{action}</div>
    </header>
  )
}
