"use client"

import { useTransition } from "react"
import { LogOutIcon } from "lucide-react"

import { IconBubble } from "@/components/app/bits"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { signOut } from "@/lib/actions/auth"

export function SignOutButton() {
  const [pending, startTransition] = useTransition()
  return (
    <AlertDialog>
      <AlertDialogTrigger className="flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left text-destructive transition-colors outline-none hover:bg-destructive/5 focus-visible:bg-destructive/5">
        <IconBubble className="bg-destructive/10 text-destructive">
          <LogOutIcon />
        </IconBubble>
        <span className="text-sm font-semibold">Keluar</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari akun?</AlertDialogTitle>
          <AlertDialogDescription>Data Anda tetap tersimpan. Masuk lagi kapan saja dengan email & password.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={() => startTransition(() => signOut())}>
            Keluar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
