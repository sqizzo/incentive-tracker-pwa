"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckIcon, CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { toast } from "sonner"

import { IconBubble, Panel } from "@/components/app/bits"
import { PageHeader } from "@/components/app/page-header"
import { Button } from "@/components/ui/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { changePassword, type ChangePasswordState } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"

const MIN = 8

export function PasswordForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePassword, {})
  const [show, setShow] = useState(false)
  // semua kolom dikontrol: React 19 mereset input tak-terkontrol setelah form action,
  // jadi tanpa ini password lama harus diketik ulang setiap kali validasi gagal
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")

  useEffect(() => {
    if (!state.ok) return
    toast.success("Password berhasil diganti. Perangkat lain sudah di-logout.")
    router.push("/setelan")
  }, [state, router])

  const longEnough = next.length >= MIN
  const matches = confirm.length > 0 && next === confirm

  return (
    <>
      <PageHeader title="Ganti Password" backHref="/setelan" />
      <form action={action} className="flex flex-col gap-4 pb-28">
        <Panel className="flex items-center gap-3 bg-primary/5 ring-primary/10">
          <IconBubble>
            <CircleAlertIcon />
          </IconBubble>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Masukkan password lama untuk verifikasi. Setelah berhasil, akun ini
            otomatis keluar dari perangkat lain; perangkat ini tetap masuk.
          </p>
        </Panel>

        <Panel className="flex flex-col gap-4">
          <PasswordField
            id="current"
            label="Password lama"
            autoComplete="current-password"
            show={show}
            onToggle={() => setShow((v) => !v)}
            value={current}
            onChange={setCurrent}
            error={state.field === "current" ? state.error : undefined}
          />
          <PasswordField
            id="next"
            label="Password baru"
            autoComplete="new-password"
            show={show}
            onToggle={() => setShow((v) => !v)}
            value={next}
            onChange={setNext}
            error={state.field === "next" ? state.error : undefined}
          />
          <PasswordField
            id="confirm"
            label="Ulangi password baru"
            autoComplete="new-password"
            show={show}
            onToggle={() => setShow((v) => !v)}
            value={confirm}
            onChange={setConfirm}
            error={state.field === "confirm" ? state.error : undefined}
          />
          <ul
            className="flex flex-col gap-1 text-xs"
            aria-label="Syarat password"
          >
            <Requirement ok={longEnough}>Minimal {MIN} karakter</Requirement>
            <Requirement ok={matches}>
              Konfirmasi sama dengan password baru
            </Requirement>
          </ul>
        </Panel>

        {state.error && !state.field && (
          <p
            role="alert"
            className="rounded-2xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {state.error}
          </p>
        )}

        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto max-w-md px-4 py-3">
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full rounded-full"
              disabled={pending}
            >
              {pending && <Spinner />}
              Simpan password baru
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}

function PasswordField({
  id,
  label,
  autoComplete,
  show,
  onToggle,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  autoComplete: string
  show: boolean
  onToggle: () => void
  value: string
  onChange: (v: string) => void
  error?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup className="h-11" data-invalid={error ? "" : undefined}>
        <InputGroupInput
          id={id}
          name={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-xs"
            onClick={onToggle}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

function Requirement({
  ok,
  children,
}: {
  ok: boolean
  children: React.ReactNode
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full border",
          ok
            ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500"
            : "border-muted-foreground/40"
        )}
      >
        {ok && <CheckIcon className="size-2.5" strokeWidth={3} />}
      </span>
      {children}
    </li>
  )
}
