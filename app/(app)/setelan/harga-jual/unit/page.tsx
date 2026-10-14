import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { UnitPrices } from "@/components/app/unit-prices"
import { getSalesCatalog } from "@/lib/data"

export const metadata: Metadata = { title: "Harga Jual Unit" }

export default async function UnitPricesPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u } = await searchParams
  const catalog = await getSalesCatalog(true)
  const unit = catalog.units.find((x) => x.type === "pl" && x.name === u)
  if (!unit) notFound()
  return <UnitPrices catalog={catalog} unitName={unit.name} kelompok={unit.kelompok} />
}
