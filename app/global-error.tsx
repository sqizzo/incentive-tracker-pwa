"use client"

import { Figtree, Inter } from "next/font/google"
import { HouseIcon, RotateCwIcon, TriangleAlertIcon } from "lucide-react"

import "./globals.css"
import { StatusIcon, StatusView } from "@/components/app/status-view"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const figtreeHeading = Figtree({ subsets: ["latin"], variable: "--font-heading" })
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

// global-error menggantikan root layout, jadi ThemeProvider tidak aktif:
// terapkan tema (pilihan user di localStorage, atau tema sistem) dengan skrip kecil.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id" suppressHydrationWarning className={cn("antialiased font-sans", inter.variable, figtreeHeading.variable)}>
      <body className="min-h-dvh bg-muted/60 dark:bg-background">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <title>Terjadi kesalahan · Incentive Tracker</title>
        <StatusView
          className="min-h-dvh"
          title="Aplikasi gagal dimuat"
          description="Maaf, ada masalah saat memuat aplikasi. Data Anda tetap aman. Coba muat ulang, atau kembali ke Beranda."
          media={
            <StatusIcon tone="destructive">
              <TriangleAlertIcon />
            </StatusIcon>
          }
          footnote={error.digest ? <>Kode error: <span className="font-mono">{error.digest}</span></> : undefined}
        >
          <Button size="lg" className="h-11 rounded-full px-6" onClick={() => retry()}>
            <RotateCwIcon />
            Coba lagi
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-11 rounded-full px-6"
            // sengaja <a> biasa (bukan <Link>): muat ulang penuh karena root layout sedang bermasalah
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            render={<a href="/" />}
            nativeButton={false}
          >
            <HouseIcon />
            Ke Beranda
          </Button>
        </StatusView>
      </body>
    </html>
  )
}
