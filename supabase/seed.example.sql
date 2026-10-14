-- CONTOH DATA (fiktif) untuk mencoba aplikasi. Angka & item bukan data asli.
-- Data asli disimpan di seed.sql / seed_pricelist.sql yang di-ignore git.
-- Jalankan setelah semua migrasi.
begin;

-- ---------------------------------------------------------------- tarif insentif
insert into public.service_categories (name, sort_order) values
  ('Software', 1),
  ('Replacement Parts', 2),
  ('Backglass & Housing', 3),
  ('IC Board', 4)
on conflict (name) do nothing;

insert into public.devices (name, jenis, model, series, sort_order) values
  ('Contoh Phone 1', 'Smartphone', 'Seri Contoh', '1', 10),
  ('Contoh Phone 1 Pro', 'Smartphone', 'Seri Contoh', '1 Pro', 20),
  ('Contoh Tablet', 'Tablet', 'Semua seri', null, 30)
on conflict (name) do nothing;

insert into public.rates (device_id, category_id, amount)
select d.id, c.id, v.amount
from (values
  ('Contoh Phone 1', 'Software', 5000),
  ('Contoh Phone 1', 'Replacement Parts', 10000),
  ('Contoh Phone 1', 'Backglass & Housing', 20000),
  ('Contoh Phone 1 Pro', 'Software', 5000),
  ('Contoh Phone 1 Pro', 'Replacement Parts', 15000),
  ('Contoh Phone 1 Pro', 'IC Board', 100000),
  ('Contoh Tablet', 'Software', 5000),
  ('Contoh Tablet', 'Replacement Parts', 25000)
) as v(device_name, category_name, amount)
join public.devices d on d.name = v.device_name
join public.service_categories c on c.name = v.category_name
on conflict (device_id, category_id) do update set amount = excluded.amount;

insert into public.rate_meta (id, memo_no, effective_date)
values (1, 'CONTOH-001', '2025-01-01')
on conflict (id) do update set memo_no = excluded.memo_no, effective_date = excluded.effective_date;

-- ---------------------------------------------------------------- price list penjualan
insert into public.pl_items (kelompok, name, category_id, sort_order)
select v.kelompok, v.name, c.id, v.sort_order from (values
  ('Smartphone', 'Baterai', 'Replacement Parts', 1),
  ('Smartphone', 'LCD', 'Replacement Parts', 2),
  ('Smartphone', 'Backglass', 'Backglass & Housing', 3),
  ('Smartphone', 'Update OS', 'Software', 4)
) as v(kelompok, name, category_name, sort_order)
left join public.service_categories c on c.name = v.category_name
on conflict (kelompok, name) do update set category_id = excluded.category_id;

insert into public.pl_units (unit_key, kelompok, incentive_mode, incentive_device_id)
select v.unit_key, 'Smartphone', v.mode, d.id from (values
  ('Contoh Phone 1', 'fixed', 'Contoh Phone 1'),
  ('Contoh Phone 1 Pro', 'fixed', 'Contoh Phone 1 Pro'),
  ('Contoh Phone 2', 'none', null)
) as v(unit_key, mode, device_name)
left join public.devices d on d.name = v.device_name
on conflict (unit_key) do nothing;

insert into public.pl_prices (unit_name, item_id, unit_id, variant, warranty, price, sort_order)
select v.unit_key, i.id, u.id, v.variant, v.warranty, v.price, v.sort_order from (values
  ('Contoh Phone 1', 'Baterai', 'Standar', '6 bln', 250000, 1),
  ('Contoh Phone 1', 'LCD', 'Standar', '6 bln', 600000, 2),
  ('Contoh Phone 1', 'Backglass', null, 'Garansi pemasangan', 200000, 3),
  ('Contoh Phone 1 Pro', 'Baterai', 'Standar', '6 bln', 350000, 4),
  ('Contoh Phone 1 Pro', 'LCD', 'Standar', '6 bln', 900000, 5),
  ('Contoh Phone 1 Pro', 'LCD', 'Premium', '12 bln', null, 6),           -- null = harga "Ask"
  ('Contoh Phone 1 Pro', 'Update OS', null, null, 150000, 7),
  ('Contoh Phone 2', 'Baterai', 'Standar', '6 bln', 450000, 8)
) as v(unit_key, item_name, variant, warranty, price, sort_order)
join public.pl_items i on i.kelompok = 'Smartphone' and i.name = v.item_name
join public.pl_units u on u.unit_key = v.unit_key;

update public.rate_meta set sales_pl_name = 'Price List Contoh', sales_effective = '2025-01-01' where id = 1;

commit;
