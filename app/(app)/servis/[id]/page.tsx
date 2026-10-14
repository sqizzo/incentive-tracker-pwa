import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { z } from "zod"

import { EntryForm } from "@/components/app/entry-form"
import { getSalesCatalog, getEntry } from "@/lib/data"
import { todayWIB } from "@/lib/date"

export const metadata: Metadata = { title: "Edit Servis" }

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) notFound()
  const [entry, catalog] = await Promise.all([getEntry(id), getSalesCatalog(true)])
  if (!entry) notFound()
  return <EntryForm catalog={catalog} entry={entry} today={todayWIB()} defaultDate={entry.service_date} />
}
