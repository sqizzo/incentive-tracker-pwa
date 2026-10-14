# Incentive Tracker

Web app mobile-first untuk teknisi servis: catat unit yang dikerjakan beserta item yang dijual, pantau **penjualan harian terhadap target pribadi**, dan lacak **insentif** yang didapat.

Stack: Next.js 16 (App Router) · shadcn/ui (Base UI) · lucide · Supabase (Postgres + Auth) · Netlify.

## Fitur

- **Beranda**: penjualan hari ini vs target (ring progres), insentif hari ini, jumlah unit, kalender mingguan, perayaan saat target tercapai.
- **Input servis**: pilih unit, lalu tambahkan
  - item dari **price list penjualan**: harga terisi otomatis dan bisa diedit
  - **jasa lain** di luar price list: harga manual, insentif dari tabel tarif
  - **part lepas** / upselling: harga manual, tanpa insentif
- **Riwayat**: per bulan, dikelompokkan per tanggal.
- **Rekap**: mode minggu/bulan, grafik penjualan vs target, total insentif, rincian per item dan per kategori, target khusus/libur per hari.
- **Setelan**: profil & target, harga jual, tarif insentif, pemetaan insentif, kategori, tema terang/gelap.
- **PWA**: bisa di-install ke home screen.

## Konsep data

- **Price list penjualan** (`pl_items`, `pl_units`, `pl_prices`): harga jual per unit dan item.
- **Tarif insentif** (`devices`, `service_categories`, `rates`): insentif per unit dan kategori.
- **Pemetaan**: item jual → kategori insentif, dan unit price list → unit insentif. Pemetaan ini yang membuat insentif terhitung otomatis saat input. Unit yang memetakan ke beberapa unit insentif meminta teknisi memilih saat input.
- Insentif dihitung **di server** (RPC `save_service_entry`). Harga jual dan insentif disimpan sebagai snapshot, jadi perubahan price list/tarif tidak mengubah entri lama.
- Setiap user hanya melihat data servis dan targetnya sendiri (Row Level Security). Price list dan tarif dipakai bersama oleh semua user yang login.
- Arti "hari ini" mengikuti zona waktu **WIB (Asia/Jakarta)** (`lib/date.ts`).

## Setup

### 1. Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Di **SQL Editor**, jalankan migrasi secara berurutan:
   1. `supabase/migrations/20261014000000_init.sql`
   2. `supabase/migrations/20261015000000_sales.sql`
   3. `supabase/migrations/20261016000000_timezone_wib.sql`
3. Isi data:
   - **Coba-coba**: jalankan `supabase/seed.example.sql` (data contoh fiktif).
   - **Produksi**: jalankan file seed privat Anda (lihat [Data privat](#data-privat)).
4. **Authentication → Sign In / Providers → Email**: matikan *Allow new users to sign up*.
5. **Authentication → Users → Add user**: buat akun untuk tiap teknisi (centang *Auto Confirm User*).

### 2. Lokal

```bash
cp .env.example .env.local   # isi URL & publishable key dari Supabase → Project Settings → API
npm install
npm run dev
```

### 3. Deploy (Netlify)

1. Import repo di Netlify (**Add new site → Import an existing project**).
2. Isi environment variables `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Di Supabase **Authentication → URL Configuration**, set *Site URL* ke domain Netlify.

## Data privat

Harga jual, tarif insentif, dan dokumen sumbernya **tidak disimpan di repo**. `.gitignore` sudah mengecualikan:

- `supabase/seed*.sql` (kecuali `seed.example.sql`)
- `*.xlsx`, `*.xls`, `*.pdf`
- `.env*` (kecuali `.env.example`)

Simpan file-file tersebut di luar repo (mis. folder privat atau penyimpanan internal), lalu jalankan di SQL Editor saat setup.

Seed price list penjualan bisa dibuat dari file Excel dengan format sheet `Harga Jual`, `Pemetaan Item`, `Pemetaan Unit`:

```bash
python supabase/gen_pricelist_seed.py "/path/ke/price-list.xlsx"
```

Hasilnya `supabase/seed_pricelist.sql` (ter-ignore). Nama dan tanggal berlaku price list bisa diatur lewat env `PL_NAME` dan `PL_EFFECTIVE`. Perubahan kecil cukup lewat **Setelan → Harga Jual / Pemetaan Insentif** di aplikasi.

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development |
| `npm run build` | Build produksi |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit test (vitest) |

## Struktur

```
app/(auth)/login          halaman login
app/(app)/                halaman utama (bottom nav): beranda, riwayat, rekap, setelan, servis/*
components/app/           komponen aplikasi
components/ui/            komponen shadcn
lib/data.ts               query baca (server)
lib/actions/              server actions (zod-validated)
lib/date.ts, format.ts    util tanggal & Rupiah
lib/target.ts             status target & statistik periode
lib/incentive.ts          preview insentif di form (cermin RPC save_service_entry)
proxy.ts                  refresh sesi Supabase + redirect ke /login
supabase/                 migrasi SQL, seed contoh, generator seed
```
