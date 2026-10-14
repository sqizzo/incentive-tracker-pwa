import type { Metadata } from "next"

import { PriceList } from "@/components/app/price-list"
import { getCatalog, getRateMeta } from "@/lib/data"

export const metadata: Metadata = { title: "Tarif Insentif" }

export default async function PriceListPage() {
  const [catalog, meta] = await Promise.all([getCatalog(true), getRateMeta()])
  return <PriceList catalog={catalog} meta={meta} />
}
