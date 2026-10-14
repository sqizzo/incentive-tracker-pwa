import { cn } from "@/lib/utils"

/**
 * Dekorasi Kuromi (murni hiasan): tidak bisa diklik, disembunyikan dari screen reader.
 * - login: besar, mengintip dari pojok kanan bawah layar
 * - home: kecil, mengintip di pojok kanan atas, di belakang kartu hero
 */
export function KuromiDecor({ variant, className }: { variant: "login" | "home"; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/decor/kuromi.webp"
      alt=""
      aria-hidden
      draggable={false}
      className={cn(
        "pointer-events-none select-none",
        // di mode gelap kepala hitam Kuromi tenggelam; beri garis tepi tipis
        "dark:drop-shadow-[0_0_1px_rgb(255_255_255/0.55)]",
        variant === "login" &&
          "fixed right-[-3.5rem] bottom-[-4rem] z-0 w-64 rotate-[-10deg] opacity-25 sm:right-[calc(50%-15rem)] dark:opacity-35",
        variant === "home" && "absolute top-1 right-1 z-0 w-[5.5rem] rotate-[8deg] opacity-90",
        className
      )}
    />
  )
}
