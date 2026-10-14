import type { Metadata } from "next"

import { EntryForm } from "@/components/app/entry-form"
import { getQuickPicks, getSalesCatalog } from "@/lib/data"
import { isIsoDate, todayWIB } from "@/lib/date"

export const metadata: Metadata = { title: "Tambah Servis" }

export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await searchParams
  const today = todayWIB()
  const [catalog, quickPicks] = await Promise.all([getSalesCatalog(), getQuickPicks()])
  return <EntryForm catalog={catalog} today={today} defaultDate={isIsoDate(d) ? d : today} quickPicks={quickPicks} />
}
