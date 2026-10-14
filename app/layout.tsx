import type { Metadata, Viewport } from "next"
import { Inter, Figtree } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const figtreeHeading = Figtree({ subsets: ["latin"], variable: "--font-heading" })

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: { default: "Incentive Tracker", template: "%s · Incentive Tracker" },
  description: "Catat servisan, pantau target penjualan harian dan insentif teknisi.",
  applicationName: "Incentive Tracker",
  appleWebApp: { capable: true, title: "Incentive", statusBarStyle: "default" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", inter.variable, figtreeHeading.variable)}
    >
      <body className="min-h-dvh bg-muted/60 dark:bg-background">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
