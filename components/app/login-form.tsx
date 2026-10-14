"use client"

import { useActionState } from "react"

import { Panel } from "@/components/app/bits"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { signIn, type LoginState } from "@/lib/actions/auth"

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {})
  return (
    <Panel className="p-5">
      <form action={action} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            defaultValue={state.email}
            className="h-11"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-11" />
        </div>
        {state.error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11 rounded-full" disabled={pending}>
          {pending && <Spinner />}
          Masuk
        </Button>
      </form>
    </Panel>
  )
}
