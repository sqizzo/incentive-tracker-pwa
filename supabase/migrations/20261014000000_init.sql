-- Tracker Insentif Teknisi: skema awal
-- Tarif (devices, service_categories, rates, rate_meta) dipakai bersama oleh semua user login.
-- Data servis & target bersifat per user (RLS user_id = auth.uid()).


-- ---------------------------------------------------------------- helpers
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- price list (shared)
create table public.devices (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  jenis       text not null,
  model       text,
  series      text,
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.service_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (length(trim(name)) > 0),
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Tidak ada baris = kategori tidak berlaku untuk unit tersebut.
create table public.rates (
  device_id   uuid not null references public.devices (id) on delete cascade,
  category_id uuid not null references public.service_categories (id) on delete cascade,
  amount      int  not null check (amount > 0),
  updated_at  timestamptz not null default now(),
  primary key (device_id, category_id)
);

create table public.rate_meta (
  id             int primary key default 1 check (id = 1),
  memo_no        text,
  effective_date date,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------- per user
create table public.user_settings (
  user_id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name    text,
  default_target  int  not null default 150000 check (default_target >= 0),
  tracking_start  date not null default (now() at time zone 'Asia/Jakarta')::date,
  -- 0 = Minggu ... 6 = Sabtu (sama dengan extract(dow))
  weekly_off_days smallint[] not null default '{}',
  updated_at      timestamptz not null default now()
);

-- Override per tanggal: is_off = libur, amount = target khusus.
create table public.daily_targets (
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date     date not null,
  amount   int  check (amount >= 0),
  is_off   boolean not null default false,
  primary key (user_id, date)
);

create table public.service_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  service_date  date not null,
  nota_no       text,
  note          text,
  device_id     uuid references public.devices (id) on delete set null,
  device_name   text not null,
  total_amount  int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index service_entries_user_date_idx on public.service_entries (user_id, service_date);

create table public.service_entry_items (
  id             uuid primary key default gen_random_uuid(),
  entry_id       uuid not null references public.service_entries (id) on delete cascade,
  category_id    uuid references public.service_categories (id) on delete set null,
  category_name  text not null,
  amount         int  not null,
  sort_order     int  not null default 0
);
create index service_entry_items_entry_idx on public.service_entry_items (entry_id);

create trigger devices_updated_at before update on public.devices
  for each row execute function public.set_updated_at();
create trigger service_categories_updated_at before update on public.service_categories
  for each row execute function public.set_updated_at();
create trigger rates_updated_at before update on public.rates
  for each row execute function public.set_updated_at();
create trigger user_settings_updated_at before update on public.user_settings
  for each row execute function public.set_updated_at();
create trigger service_entries_updated_at before update on public.service_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- RLS
alter table public.devices             enable row level security;
alter table public.service_categories  enable row level security;
alter table public.rates               enable row level security;
alter table public.rate_meta           enable row level security;
alter table public.user_settings       enable row level security;
alter table public.daily_targets       enable row level security;
alter table public.service_entries     enable row level security;
alter table public.service_entry_items enable row level security;

-- price list: semua user login boleh baca & ubah (tanpa hapus fisik unit/kategori)
create policy "devices read"   on public.devices for select to authenticated using (true);
create policy "devices insert" on public.devices for insert to authenticated with check (true);
create policy "devices update" on public.devices for update to authenticated using (true) with check (true);

create policy "categories read"   on public.service_categories for select to authenticated using (true);
create policy "categories insert" on public.service_categories for insert to authenticated with check (true);
create policy "categories update" on public.service_categories for update to authenticated using (true) with check (true);

create policy "rates all" on public.rates for all to authenticated using (true) with check (true);

create policy "rate_meta read"   on public.rate_meta for select to authenticated using (true);
create policy "rate_meta update" on public.rate_meta for update to authenticated using (true) with check (true);

-- data pribadi
create policy "own settings" on public.user_settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own targets" on public.daily_targets for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own entries" on public.service_entries for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own entry items" on public.service_entry_items for all to authenticated
  using (exists (select 1 from public.service_entries e where e.id = entry_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.service_entries e where e.id = entry_id and e.user_id = (select auth.uid())));

-- ---------------------------------------------------------------- RPC: simpan entri servis
-- Nominal dihitung dari tabel rates di server (nilai dari client tidak dipakai),
-- lalu disimpan sebagai snapshot agar perubahan tarif tidak mengubah entri lama.
create or replace function public.save_service_entry(
  p_id           uuid,
  p_date         date,
  p_device_id    uuid,
  p_category_ids uuid[],
  p_nota         text default null,
  p_note         text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_device  public.devices%rowtype;
  v_entry   uuid;
  v_missing int;
  v_total   int;
begin
  if v_uid is null then
    raise exception 'Belum login' using errcode = '42501';
  end if;
  if p_date is null then
    raise exception 'Tanggal wajib diisi' using errcode = '22023';
  end if;
  if p_category_ids is null or cardinality(p_category_ids) = 0 then
    raise exception 'Pilih minimal satu kategori service' using errcode = '22023';
  end if;

  select * into v_device from public.devices where id = p_device_id;
  if not found then
    raise exception 'Unit tidak ditemukan' using errcode = '22023';
  end if;

  select count(*) into v_missing
  from unnest(p_category_ids) as c(id)
  where not exists (select 1 from public.rates r where r.device_id = p_device_id and r.category_id = c.id);
  if v_missing > 0 then
    raise exception 'Ada kategori yang tidak punya tarif untuk unit %', v_device.name using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.service_entries (user_id, service_date, nota_no, note, device_id, device_name)
    values (v_uid, p_date, nullif(trim(p_nota), ''), nullif(trim(p_note), ''), v_device.id, v_device.name)
    returning id into v_entry;
  else
    update public.service_entries
       set service_date = p_date,
           nota_no      = nullif(trim(p_nota), ''),
           note         = nullif(trim(p_note), ''),
           device_id    = v_device.id,
           device_name  = v_device.name
     where id = p_id and user_id = v_uid
    returning id into v_entry;
    if v_entry is null then
      raise exception 'Entri tidak ditemukan' using errcode = '22023';
    end if;
    delete from public.service_entry_items where entry_id = v_entry;
  end if;

  insert into public.service_entry_items (entry_id, category_id, category_name, amount, sort_order)
  select v_entry, sc.id, sc.name, r.amount, sc.sort_order
  from (select distinct unnest(p_category_ids) as id) c
  join public.service_categories sc on sc.id = c.id
  join public.rates r on r.device_id = p_device_id and r.category_id = sc.id;

  select coalesce(sum(amount), 0) into v_total from public.service_entry_items where entry_id = v_entry;
  update public.service_entries set total_amount = v_total where id = v_entry;

  return v_entry;
end;
$$;

-- ---------------------------------------------------------------- RPC: ringkasan harian
-- Target per hari: sebelum tracking_start = 0; override daily_targets (is_off -> 0, amount -> amount);
-- libur rutin (weekly_off_days) -> 0; selain itu default_target.
create or replace function public.daily_summary(p_from date, p_to date)
returns table (
  day          date,
  target       int,
  is_off       boolean,
  is_custom    boolean,
  total        int,
  unit_count   int
)
language sql
stable
security invoker
set search_path = public
as $$
  with s as (
    select coalesce(us.default_target, 150000) as default_target,
           coalesce(us.tracking_start, p_from)  as tracking_start,
           coalesce(us.weekly_off_days, '{}')   as off_days
    from (select 1) dummy
    left join public.user_settings us on us.user_id = auth.uid()
  ),
  d as (
    select gs::date as day from generate_series(p_from, p_to, interval '1 day') gs
  ),
  e as (
    select service_date, sum(total_amount)::int as total, count(*)::int as unit_count
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
    coalesce(e.total, 0) as total,
    coalesce(e.unit_count, 0) as unit_count
  from d
  cross join s
  left join public.daily_targets dt on dt.user_id = auth.uid() and dt.date = d.day
  left join e on e.service_date = d.day
  order by d.day;
$$;

-- Ringkasan per kategori untuk rentang tanggal (dipakai Rekap)
create or replace function public.category_summary(p_from date, p_to date)
returns table (category_name text, total int, item_count int)
language sql
stable
security invoker
set search_path = public
as $$
  select i.category_name, sum(i.amount)::int, count(*)::int
  from public.service_entry_items i
  join public.service_entries e on e.id = i.entry_id
  where e.user_id = auth.uid() and e.service_date between p_from and p_to
  group by i.category_name
  order by 2 desc;
$$;

grant execute on function public.save_service_entry(uuid, date, uuid, uuid[], text, text) to authenticated;
grant execute on function public.daily_summary(date, date) to authenticated;
grant execute on function public.category_summary(date, date) to authenticated;
revoke execute on function public.save_service_entry(uuid, date, uuid, uuid[], text, text) from anon, public;
revoke execute on function public.daily_summary(date, date) from anon, public;
revoke execute on function public.category_summary(date, date) from anon, public;
