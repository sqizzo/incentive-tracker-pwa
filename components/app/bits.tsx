import { cn } from "@/lib/utils"
import { formatNumber } from "@/lib/format"

/** Nominal besar dengan prefix "Rp" kecil, mis. Rp 55.000 */
export function Money({
  value,
  className,
  prefixClassName,
}: {
  value: number
  className?: string
  prefixClassName?: string
}) {
  return (
    <span className={cn("font-heading font-semibold tabular-nums", className)}>
      <span className={cn("mr-1 text-[0.55em] font-medium text-muted-foreground", prefixClassName)}>Rp</span>
      {formatNumber(value)}
    </span>
  )
}

/** Ikon dalam lingkaran berwarna lembut. */
export function IconBubble({
  children,
  tone = "primary",
  className,
}: {
  children: React.ReactNode
  tone?: "primary" | "orange" | "sky" | "emerald" | "violet" | "muted"
  className?: string
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    muted: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-4.5",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

/** Kartu putih dasar bergaya referensi (sudut besar, tanpa border tebal). */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-3xl bg-card p-4 text-card-foreground shadow-xs ring-1 ring-foreground/5", className)}
      {...props}
    />
  )
}

/** Wrapper isi halaman di dalam shell mobile. */
export function Screen({ className, ...props }: React.ComponentProps<"main">) {
  return <main className={cn("flex flex-col gap-4", className)} {...props} />
}
