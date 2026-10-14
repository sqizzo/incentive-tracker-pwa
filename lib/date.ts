// Semua tanggal bisnis memakai zona waktu WIB (Asia/Jakarta, UTC+7).
// Tanggal disimpan sebagai string ISO "YYYY-MM-DD" agar tidak bergeser oleh timezone.

export const TIMEZONE = "Asia/Jakarta"

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
/** Index = getUTCDay() (0 = Minggu) */
export const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
export const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_RE.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00Z"))
}

export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_RE.test(value)
}

/** Tanggal hari ini di WIB, "YYYY-MM-DD". */
export function todayWIB(now: Date = new Date()) {
  // en-CA memformat sebagai YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

/** Jam sekarang di WIB (0-23). */
export function hourWIB(now: Date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hourCycle: "h23" }).format(now)
  )
}

export function greeting(now: Date = new Date()) {
  const h = hourWIB(now)
  if (h < 11) return "Selamat pagi"
  if (h < 15) return "Selamat siang"
  if (h < 18) return "Selamat sore"
  return "Selamat malam"
}

function toUTC(iso: string) {
  return new Date(iso + "T00:00:00Z")
}

function fromUTC(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number) {
  const d = toUTC(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return fromUTC(d)
}

export function dayOfWeek(iso: string) {
  return toUTC(iso).getUTCDay()
}

/** Senin pada minggu yang sama (minggu dimulai Senin). */
export function startOfWeek(iso: string) {
  const dow = dayOfWeek(iso)
  return addDays(iso, dow === 0 ? -6 : 1 - dow)
}

export function weekDays(iso: string) {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthKey(iso: string) {
  return iso.slice(0, 7)
}

export function monthRange(key: string) {
  const [y, m] = key.split("-").map(Number)
  const first = `${key}-01`
  const last = fromUTC(new Date(Date.UTC(y, m, 0)))
  return { from: first, to: last }
}

export function addMonths(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number)
  const d = new Date(Date.UTC(y, m - 1 + delta, 1))
  return fromUTC(d).slice(0, 7)
}

export function formatMonth(key: string) {
  const [y, m] = key.split("-").map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** "2026-10-14" -> "Rabu, 14 Oktober 2026" */
export function formatDateLong(iso: string) {
  const d = toUTC(iso)
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** "2026-10-14" -> "14 Okt" */
export function formatDateShort(iso: string) {
  const d = toUTC(iso)
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`
}

export function dayNumber(iso: string) {
  return toUTC(iso).getUTCDate()
}
