import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

import { Money } from "@/components/app/bits"
import { Badge } from "@/components/ui/badge"
import { formatRupiah } from "@/lib/format"
import type { Entry } from "@/lib/types"

export function EntryCard({ entry }: { entry: Entry }) {
  const meta = [entry.nota_no && `#${entry.nota_no}`, entry.note].filter(Boolean).join(" · ")
  return (
    <Link
      href={`/servis/${entry.id}`}
      className="group flex items-center gap-3 rounded-3xl bg-card p-4 text-card-foreground shadow-xs ring-1 ring-foreground/5 transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate font-heading font-semibold">{entry.device_name}</p>
          <Money value={entry.total_sales} className="shrink-0 text-base" />
        </div>
        <div className="mt-0.5 flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{meta}</span>
          <span className="shrink-0 tabular-nums">Insentif {formatRupiah(entry.total_incentive)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entry.service_entry_items.map((item) => (
            <Badge key={item.id} variant="secondary" className="max-w-full truncate font-normal">
              {item.description}
            </Badge>
          ))}
        </div>
      </div>
      <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
