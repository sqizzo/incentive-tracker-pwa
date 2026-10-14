import { cn } from "@/lib/utils"

/**
 * Tampilan status penuh (404, error, offline): ikon/maskot, kode kecil, judul, deskripsi, aksi.
 * Murni presentasi, bisa dipakai dari Server maupun Client Component.
 */
export function StatusView({
  media,
  code,
  title,
  description,
  children,
  footnote,
  className,
}: {
  media: React.ReactNode
  code?: string
  title: string
  description: React.ReactNode
  /** tombol aksi */
  children?: React.ReactNode
  /** teks kecil di bawah aksi, mis. kode error untuk dilaporkan */
  footnote?: React.ReactNode
  className?: string
}) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-md flex-col items-center justify-center gap-6 px-6 py-10 text-center",
        className
      )}
    >
      {media}
      <div className="flex flex-col gap-2">
        {code && <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">{code}</p>}
        <h1 className="font-heading text-2xl font-semibold text-balance">{title}</h1>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-center">{children}</div>}
      {footnote && <p className="text-xs text-muted-foreground/80">{footnote}</p>}
    </main>
  )
}

/** Ikon besar dalam lingkaran berwarna untuk StatusView. */
export function StatusIcon({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "destructive" | "muted" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-20 items-center justify-center rounded-full [&_svg]:size-9",
        tone === "primary" && "bg-primary/10 text-primary",
        tone === "destructive" && "bg-destructive/10 text-destructive",
        tone === "muted" && "bg-card text-muted-foreground shadow-xs ring-1 ring-foreground/5"
      )}
    >
      {children}
    </span>
  )
}
