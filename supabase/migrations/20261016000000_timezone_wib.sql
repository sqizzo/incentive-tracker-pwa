-- Zona waktu bisnis: WIB (Asia/Jakarta). Hanya mengubah default untuk user baru;
-- nilai tracking_start yang sudah tersimpan tidak berubah.
alter table public.user_settings
  alter column tracking_start set default (now() at time zone 'Asia/Jakarta')::date;
