import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { z } from "zod"

import { DeviceForm } from "@/components/app/device-form"
import { getCategories, getDevice } from "@/lib/data"

export const metadata: Metadata = { title: "Tarif Unit" }

export default async function DeviceRatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ deviceId: string }>
  searchParams: Promise<{ jenis?: string }>
}) {
  const [{ deviceId }, { jenis }] = await Promise.all([params, searchParams])
  const categories = await getCategories()

  if (deviceId === "baru") {
    return <DeviceForm categories={categories} defaultJenis={jenis ?? ""} />
  }
  if (!z.uuid().safeParse(deviceId).success) notFound()
  const data = await getDevice(deviceId)
  if (!data) notFound()
  return <DeviceForm categories={categories} device={data.device} rates={data.rates} />
}
