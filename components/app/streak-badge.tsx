import { FlameIcon } from "lucide-react"

import type { Streak } from "@/lib/target"
import { cn } from "@/lib/utils"

/**
 * Badge streak target harian. Api menyala bila target hari ini sudah tercapai;
 * redup bila streak masih berjalan tapi hari ini belum tercapai (perlu dijaga).
 */
export function StreakBadge({ streak }: { streak: Streak }) {
  const { days, todayDone, capped } = streak
  const label =
    days === 0
      ? "Belum ada streak target"
      : `Streak ${days}${capped ? "+" : ""} hari target tercapai${todayDone ? "" : ", capai target hari ini untuk melanjutkan"}`

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        days === 0 && "bg-muted text-muted-foreground",
        days > 0 && todayDone && "bg-orange-500/12 text-orange-600 dark:text-orange-400",
        days > 0 && !todayDone && "bg-orange-500/8 text-orange-600/70 dark:text-orange-400/70"
      )}
    >
      <FlameIcon
        aria-hidden
        className={cn("size-3.5", days > 0 && todayDone && "fill-orange-500 text-orange-500", days > 0 && !todayDone && "fill-orange-500/25")}
      />
      {days}
      {capped && "+"}
    </span>
  )
}
