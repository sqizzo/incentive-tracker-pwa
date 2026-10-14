import Link from "next/link"
import { FileSearchIcon, HistoryIcon } from "lucide-react"

import { BackButton } from "@/components/app/back-button"
import { StatusIcon, StatusView } from "@/components/app/status-view"
import { Button } from "@/components/ui/button"

export default function EntryNotFound() {
  return (
    <StatusView
      code="404"
      title="Entri servis tidak ditemukan"
      description="Entri ini mungkin sudah dihapus, atau link-nya bukan milik akun Anda."
      media={
        <StatusIcon>
          <FileSearchIcon />
        </StatusIcon>
      }
    >
      <Button size="lg" className="h-11 rounded-full px-6" render={<Link href="/riwayat" />} nativeButton={false}>
        <HistoryIcon />
        Lihat Riwayat
      </Button>
      <BackButton />
    </StatusView>
  )
}
