export type Device = {
  id: string
  name: string
  jenis: string
  model: string | null
  series: string | null
  sort_order: number
  is_active: boolean
}

export type Category = {
  id: string
  name: string
  sort_order: number
  is_active: boolean
}

export type Rate = {
  device_id: string
  category_id: string
  amount: number
}

export type RateMeta = {
  memo_no: string | null
  effective_date: string | null
  sales_pl_name: string | null
  sales_effective: string | null
  updated_at: string
}

export type UserSettings = {
  user_id: string
  display_name: string | null
  /** target PENJUALAN harian (Rp) */
  default_target: number
  tracking_start: string
  weekly_off_days: number[]
}

export type EntryItemKind = "pl" | "jasa" | "part"

export type EntryItem = {
  id: string
  kind: EntryItemKind
  item_name: string
  description: string
  sale_amount: number
  incentive_amount: number
  category_id: string | null
  category_name: string | null
  pl_price_id: string | null
  sort_order: number
}

export type Entry = {
  id: string
  service_date: string
  nota_no: string | null
  note: string | null
  /** unit insentif (devices) */
  device_id: string | null
  /** unit yang diservis (tampilan) */
  device_name: string
  incentive_device_name: string | null
  total_sales: number
  total_incentive: number
  created_at: string
  service_entry_items: EntryItem[]
}

export type DaySummary = {
  day: string
  /** target penjualan */
  target: number
  is_off: boolean
  is_custom: boolean
  sales: number
  incentive: number
  unit_count: number
}

export type CategorySummary = {
  category_name: string
  /** total insentif */
  total: number
  item_count: number
}

export type ItemSummary = {
  item_name: string
  sales: number
  incentive: number
  item_count: number
}

// ---------------------------------------------------------------- price list penjualan
export type PlItem = {
  id: string
  kelompok: string
  name: string
  category_id: string | null
  sort_order: number
}

export type IncentiveMode = "fixed" | "choose" | "none"

export type PlUnit = {
  id: string
  unit_key: string
  kelompok: string
  incentive_mode: IncentiveMode
  incentive_device_id: string | null
  note: string | null
}

export type PlPrice = {
  id: string
  unit_name: string
  item_id: string
  unit_id: string
  variant: string | null
  warranty: string | null
  /** null = harga "Ask" */
  price: number | null
  sort_order: number
  is_active: boolean
}

/** Unit yang bisa dipilih di form: dari price list, atau unit insentif tanpa price list (Android, iPad, …). */
export type SalesUnit =
  | { type: "pl"; name: string; kelompok: string }
  | { type: "device"; name: string; kelompok: string; deviceId: string }

export type SalesCatalog = Catalog & {
  items: PlItem[]
  plUnits: PlUnit[]
  prices: PlPrice[]
  units: SalesUnit[]
}

/** Price list siap pakai untuk form input servis. */
export type Catalog = {
  devices: Device[]
  categories: Category[]
  /** rates[deviceId][categoryId] = amount */
  rates: Record<string, Record<string, number>>
}

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string }
