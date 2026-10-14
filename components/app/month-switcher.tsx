import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { LinkPendingIcon } from "@/components/app/link-pending"
import { Button } from "@/components/ui/button"
import { addMonths, formatMonth } from "@/lib/date"

/** Navigasi bulan berbasis link (?m=YYYY-MM). */
export function MonthSwitcher({ month, basePath, maxMonth }: { month: string; basePath: string; maxMonth?: string }) {
  const next = addMonths(month, 1)
  const nextDisabled = maxMonth ? next > maxMonth : false
  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="icon-lg"
        className="rounded-full"
        render={<Link href={`${basePath}?m=${addMonths(month, -1)}`} aria-label="Bulan sebelumnya" scroll={false} />}
        nativeButton={false}
      >
        <LinkPendingIcon icon="left" />
      </Button>
      <p className="font-heading text-base font-semibold">{formatMonth(month)}</p>
      {nextDisabled ? (
        <Button variant="outline" size="icon-lg" className="rounded-full" disabled aria-label="Bulan berikutnya">
          <ChevronRightIcon />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          render={<Link href={`${basePath}?m=${next}`} aria-label="Bulan berikutnya" scroll={false} />}
          nativeButton={false}
        >
          <LinkPendingIcon icon="right" />
        </Button>
      )}
    </div>
  )
}
