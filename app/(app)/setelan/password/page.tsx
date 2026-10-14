import type { Metadata } from "next"

import { PasswordForm } from "@/components/app/password-form"

export const metadata: Metadata = { title: "Ganti Password" }

export default function PasswordPage() {
  return <PasswordForm />
}
