import type { Metadata } from "next"

import { MappingManager } from "@/components/app/mapping-manager"
import { getSalesCatalog } from "@/lib/data"

export const metadata: Metadata = { title: "Pemetaan Insentif" }

export default async function MappingPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const catalog = await getSalesCatalog(true)
  return <MappingManager catalog={catalog} tab={tab === "unit" ? "unit" : "item"} />
}
