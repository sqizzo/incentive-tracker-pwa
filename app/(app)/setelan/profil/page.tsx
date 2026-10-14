import type { Metadata } from "next"

import { ProfileForm } from "@/components/app/profile-form"
import { getSettings } from "@/lib/data"

export const metadata: Metadata = { title: "Profil & Target" }

export default async function ProfilePage() {
  const settings = await getSettings()
  return <ProfileForm settings={settings} />
}
