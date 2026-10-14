// Menangkap event `beforeinstallprompt` (Chrome/Edge/Android) supaya dialog install
// bisa dipicu dari tombol sendiri, tidak menunggu pop-up browser.
// Hanya dipakai di sisi browser.

type InstallOutcome = "accepted" | "dismissed"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: InstallOutcome }>
}

export type InstallState = {
  /** dialog install bawaan browser siap dipicu */
  canPrompt: boolean
  /** aplikasi sedang dibuka sebagai app terpasang, atau baru saja di-install */
  installed: boolean
  /** iPhone/iPad: tidak ada dialog install, harus lewat menu Share Safari */
  ios: boolean
}

const SERVER_STATE: InstallState = { canPrompt: false, installed: false, ios: false }

let deferred: BeforeInstallPromptEvent | null = null
let state: InstallState = SERVER_STATE
let initialized = false
const listeners = new Set<() => void>()

function update(patch: Partial<InstallState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS() {
  const ua = navigator.userAgent
  // iPadOS 13+ mengaku sebagai Mac; bedakan lewat layar sentuh
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
}

/** Pasang listener sekali, sedini mungkin (dipanggil dari root layout). */
export function initInstallCapture() {
  if (initialized || typeof window === "undefined") return
  initialized = true
  state = { canPrompt: false, installed: isStandalone(), ios: isIOS() }

  window.addEventListener("beforeinstallprompt", (e) => {
    // cegah mini-infobar otomatis; dialog dipicu dari tombol di Setelan
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    update({ canPrompt: true })
  })
  window.addEventListener("appinstalled", () => {
    deferred = null
    update({ canPrompt: false, installed: true })
  })
}

export function subscribeInstall(listener: () => void) {
  initInstallCapture()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const getInstallState = () => state
export const getServerInstallState = () => SERVER_STATE

/** Tampilkan dialog install bawaan browser. */
export async function promptInstall(): Promise<InstallOutcome | "unavailable"> {
  if (!deferred) return "unavailable"
  const event = deferred
  // event hanya bisa dipakai sekali
  deferred = null
  update({ canPrompt: false })
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}
