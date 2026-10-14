import type { Metadata } from "next"

import { SalesPriceList } from "@/components/app/sales-price-list"
import { getRateMeta, getSalesCatalog } from "@/lib/data"

export const metadata: Metadata = { title: "Harga Jual" }

export default async function SalesPriceListPage() {
  const [catalog, meta] = await Promise.all([getSalesCatalog(true), getRateMeta()])
  return <SalesPriceList catalog={catalog} meta={meta} />
}
