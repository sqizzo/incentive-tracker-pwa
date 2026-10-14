-- Penjualan: price list jual + target berpindah dari insentif ke penjualan.
--
-- Konsep:
--   * devices / service_categories / rates  = tarif INSENTIF, tidak berubah.
--   * pl_items / pl_units / pl_prices       = price list PENJUALAN (harga jual, sudah termasuk jasa pasang).
--   * pl_items.category_id                  = pemetaan item jual -> kategori insentif.
--   * pl_units.incentive_device_id          = pemetaan unit PL -> unit insentif.
--   * user_settings.default_target & daily_targets sekarang berarti target PENJUALAN.
--   * Setiap baris servis menyimpan harga jual & insentif sebagai snapshot.

-- ---------------------------------------------------------------- price list penjualan (shared)
create table public.pl_items (
  id          uuid primary key default gen_random_uuid(),
  kelompok    text not null,
  name        text not null check (length(trim(name)) > 0),
  category_id uuid references public.service_categories (id) on delete set null,
  sort_order  int  not null default 0,
  updated_at  timestamptz not null default now(),
  unique (kelompok, name)
);

-- incentive_mode: fixed = pakai incentive_device_id; choose = teknisi memilih saat input; none = belum ada insentif
create table public.pl_units (
  id                  uuid primary key default gen_random_uuid(),
  unit_key            text not null unique,
  kelompok            text not null,
  incentive_mode      text not null default 'fixed' check (incentive_mode in ('fixed', 'choose', 'none')),
  incentive_device_id uuid references public.devices (id) on delete set null,
  note                text,
  updated_at          timestamptz not null default now()
);

create table public.pl_prices (
  id          uuid primary key default gen_random_uuid(),
  unit_name   text not null,            -- unit yang dipilih teknisi, mis. "iPhone 13 Pro", "MacBook"
  item_id     uuid not null references public.pl_items (id) on delete cascade,
  unit_id     uuid not null references public.pl_units (id) on delete restrict,
  variant     text,
  warranty    text,
  price       int check (price >= 0),   -- null = harga "Ask" (diisi saat input)
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  note        text,
  updated_at  timestamptz not null default now()
);
create index pl_prices_unit_idx on public.pl_prices (unit_name);

create trigger pl_items_updated_at before update on public.pl_items
  for each row execute function public.set_updated_at();
create trigger pl_units_updated_at before update on public.pl_units
  for each row execute function public.set_updated_at();
create trigger pl_prices_updated_at before update on public.pl_prices
  for each row execute function public.set_updated_at();

alter table public.pl_items  enable row level security;
alter table public.pl_units  enable row level security;
alter table public.pl_prices enable row level security;
create policy "pl_items all"  on public.pl_items  for all to authenticated using (true) with check (true);
create policy "pl_units all"  on public.pl_units  for all to authenticated using (true) with check (true);
create policy "pl_prices all" on public.pl_prices for all to authenticated using (true) with check (true);

alter table public.rate_meta
  add column sales_pl_name   text,
  add column sales_effective date;

-- target sekarang untuk penjualan: default user baru Rp 1.000.000/hari (user lama tetap memakai nilainya)
alter table public.user_settings alter column default_target set default 1000000;

-- ---------------------------------------------------------------- entri servis: penjualan + insentif
alter table public.service_entries rename column total_amount to total_incentive;
alter table public.service_entries
  add column total_sales           int not null default 0,
  add column incentive_device_name text;
comment on column public.service_entries.device_id is 'Unit insentif (devices) yang dipakai menghitung insentif';
comment on column public.service_entries.device_name is 'Nama unit yang diservis (tampilan)';
update public.service_entries set incentive_device_name = device_name where incentive_device_name is null;

alter table public.service_entry_items rename column amount to incentive_amount;
alter table public.service_entry_items alter column category_name drop not null;
alter table public.service_entry_items
  add column kind        text not null default 'jasa' check (kind in ('pl', 'jasa', 'part')),
  add column item_name   text,
  add column description text,
  add column sale_amount int  not null default 0 check (sale_amount >= 0),
  add column pl_price_id uuid references public.pl_prices (id) on delete set null;
update public.service_entry_items set item_name = category_name, description = category_name where item_name is null;
alter table public.service_entry_items alter column item_name set not null;
alter table public.service_entry_items alter column description set not null;

-- ---------------------------------------------------------------- RPC simpan entri (v2)
drop function if exists public.save_service_entry(uuid, date, uuid, uuid[], text, text);

-- p_lines: [{ "kind": "pl",   "pl_price_id": uuid, "price": int }
--           { "kind": "jasa", "category_id": uuid, "price": int, "description"?: text }
--           { "kind": "part", "description": text, "price": int }]
-- p_incentive_device_id: unit insentif untuk baris jasa & baris PL ber-mode "choose".
create or replace function public.save_service_entry(
  p_id                  uuid,
  p_date                date,
  p_unit_name           text,
  p_incentive_device_id uuid,
  p_lines               jsonb,
  p_nota                text default null,
  p_note                text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_entry   uuid;
  v_device  public.devices%rowtype;
  v_line    jsonb;
  v_idx     int := 0;
  v_kind    text;
  v_price   int;
  v_pl      record;
  v_cat     public.service_categories%rowtype;
  v_dev_id  uuid;
  v_inc     int;
  v_desc    text;
begin
  if v_uid is null then
    raise exception 'Belum login' using errcode = '42501';
  end if;
  if p_date is null then
    raise exception 'Tanggal wajib diisi' using errcode = '22023';
  end if;
  if coalesce(trim(p_unit_name), '') = '' then
    raise exception 'Unit wajib diisi' using errcode = '22023';
  end if;
  if p_lines is null or jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Tambahkan minimal satu item' using errcode = '22023';
  end if;
  if p_incentive_device_id is not null then
    select * into v_device from public.devices where id = p_incentive_device_id;
    if not found then
      raise exception 'Unit insentif tidak ditemukan' using errcode = '22023';
    end if;
  end if;

  if p_id is null then
    insert into public.service_entries (user_id, service_date, nota_no, note, device_id, device_name, incentive_device_name)
    values (v_uid, p_date, nullif(trim(p_nota), ''), nullif(trim(p_note), ''), v_device.id, trim(p_unit_name), v_device.name)
    returning id into v_entry;
  else
    update public.service_entries
       set service_date = p_date,
           nota_no = nullif(trim(p_nota), ''),
           note = nullif(trim(p_note), ''),
           device_id = v_device.id,
           device_name = trim(p_unit_name),
           incentive_device_name = v_device.name
     where id = p_id and user_id = v_uid
    returning id into v_entry;
    if v_entry is null then
      raise exception 'Entri tidak ditemukan' using errcode = '22023';
    end if;
    delete from public.service_entry_items where entry_id = v_entry;
  end if;

  for v_line in select * from jsonb_array_elements(p_lines) loop
    v_idx := v_idx + 1;
    v_kind := v_line ->> 'kind';
    v_price := (v_line ->> 'price')::int;
    if v_price is null or v_price < 0 then
      raise exception 'Harga item ke-% tidak valid', v_idx using errcode = '22023';
    end if;

    if v_kind = 'pl' then
      select p.id, p.variant, i.name as item_name, i.category_id, u.incentive_mode, u.incentive_device_id
        into v_pl
        from public.pl_prices p
        join public.pl_items i on i.id = p.item_id
        join public.pl_units u on u.id = p.unit_id
       where p.id = (v_line ->> 'pl_price_id')::uuid;
      if not found then
        raise exception 'Item price list ke-% tidak ditemukan', v_idx using errcode = '22023';
      end if;
      v_dev_id := case v_pl.incentive_mode
                    when 'fixed' then v_pl.incentive_device_id
                    when 'choose' then p_incentive_device_id
                    else null end;
      select * into v_cat from public.service_categories where id = v_pl.category_id;
      v_inc := coalesce((select amount from public.rates where device_id = v_dev_id and category_id = v_pl.category_id), 0);
      v_desc := v_pl.item_name || coalesce(' · ' || nullif(v_pl.variant, ''), '');
      insert into public.service_entry_items
        (entry_id, kind, item_name, description, sale_amount, pl_price_id, category_id, category_name, incentive_amount, sort_order)
      values
        (v_entry, 'pl', v_pl.item_name, v_desc, v_price, v_pl.id, v_cat.id, v_cat.name, v_inc, v_idx);

    elsif v_kind = 'jasa' then
      select * into v_cat from public.service_categories where id = (v_line ->> 'category_id')::uuid;
      if not found then
        raise exception 'Kategori jasa ke-% tidak ditemukan', v_idx using errcode = '22023';
      end if;
      v_inc := coalesce((select amount from public.rates where device_id = p_incentive_device_id and category_id = v_cat.id), 0);
      v_desc := coalesce(nullif(trim(v_line ->> 'description'), ''), v_cat.name);
      insert into public.service_entry_items
        (entry_id, kind, item_name, description, sale_amount, category_id, category_name, incentive_amount, sort_order)
      values
        (v_entry, 'jasa', v_cat.name, v_desc, v_price, v_cat.id, v_cat.name, v_inc, v_idx);

    elsif v_kind = 'part' then
      v_desc := nullif(trim(v_line ->> 'description'), '');
      if v_desc is null then
        raise exception 'Nama part ke-% wajib diisi', v_idx using errcode = '22023';
      end if;
      insert into public.service_entry_items
        (entry_id, kind, item_name, description, sale_amount, incentive_amount, sort_order)
      values
        (v_entry, 'part', 'Part lepas', v_desc, v_price, 0, v_idx);

    else
      raise exception 'Jenis item ke-% tidak dikenal', v_idx using errcode = '22023';
    end if;
  end loop;

  update public.service_entries e
     set total_sales = s.sales, total_incentive = s.incentive
    from (select coalesce(sum(sale_amount), 0)::int as sales, coalesce(sum(incentive_amount), 0)::int as incentive
            from public.service_entry_items where entry_id = v_entry) s
   where e.id = v_entry;

  return v_entry;
end;
$$;

-- ---------------------------------------------------------------- RPC ringkasan harian (target = penjualan)
drop function if exists public.daily_summary(date, date);
create or replace function public.daily_summary(p_from date, p_to date)
returns table (
  day        date,
  target     int,
  is_off     boolean,
  is_custom  boolean,
  sales      int,
  incentive  int,
  unit_count int
)
language sql
stable
security invoker
set search_path = public
as $$
  with s as (
    select coalesce(us.default_target, 1000000) as default_target,
           coalesce(us.tracking_start, p_from)  as tracking_start,
           coalesce(us.weekly_off_days, '{}')   as off_days
    from (select 1) dummy
    left join public.user_settings us on us.user_id = auth.uid()
  ),
  d as (
    select gs::date as day from generate_series(p_from, p_to, interval '1 day') gs
  ),
  e as (
    select service_date,
           sum(total_sales)::int as sales,
           sum(total_incentive)::int as incentive,
           count(*)::int as unit_count
    from public.service_entries
    where user_id = auth.uid() and service_date between p_from and p_to
    group by service_date
  )
  select
    d.day,
    case
      when d.day < s.tracking_start then 0
      when dt.is_off then 0
      when dt.amount is not null then dt.amount
      when extract(dow from d.day)::smallint = any (s.off_days) then 0
      else s.default_target
    end as target,
    (d.day >= s.tracking_start and (coalesce(dt.is_off, false)
      or (dt.amount is null and extract(dow from d.day)::smallint = any (s.off_days)))) as is_off,
    (dt.amount is not null) as is_custom,
    coalesce(e.sales, 0) as sales,
    coalesce(e.incentive, 0) as incentive,
    coalesce(e.unit_count, 0) as unit_count
  from d
  cross join s
  left join public.daily_targets dt on dt.user_id = auth.uid() and dt.date = d.day
  left join e on e.service_date = d.day
  order by d.day;
$$;

-- Ringkasan per item penjualan & per kategori insentif (dipakai Rekap)
drop function if exists public.category_summary(date, date);
create or replace function public.item_summary(p_from date, p_to date)
returns table (item_name text, sales int, incentive int, item_count int)
language sql
stable
security invoker
set search_path = public
as $$
  select i.item_name, sum(i.sale_amount)::int, sum(i.incentive_amount)::int, count(*)::int
  from public.service_entry_items i
  join public.service_entries e on e.id = i.entry_id
  where e.user_id = auth.uid() and e.service_date between p_from and p_to
  group by i.item_name
  order by 2 desc, 3 desc;
$$;

create or replace function public.category_summary(p_from date, p_to date)
returns table (category_name text, total int, item_count int)
language sql
stable
security invoker
set search_path = public
as $$
  select i.category_name, sum(i.incentive_amount)::int, count(*)::int
  from public.service_entry_items i
  join public.service_entries e on e.id = i.entry_id
  where e.user_id = auth.uid() and e.service_date between p_from and p_to
    and i.category_name is not null
  group by i.category_name
  order by 2 desc;
$$;

grant execute on function public.save_service_entry(uuid, date, text, uuid, jsonb, text, text) to authenticated;
grant execute on function public.daily_summary(date, date) to authenticated;
grant execute on function public.item_summary(date, date) to authenticated;
grant execute on function public.category_summary(date, date) to authenticated;
revoke execute on function public.save_service_entry(uuid, date, text, uuid, jsonb, text, text) from anon, public;
revoke execute on function public.daily_summary(date, date) from anon, public;
revoke execute on function public.item_summary(date, date) from anon, public;
revoke execute on function public.category_summary(date, date) from anon, public;
