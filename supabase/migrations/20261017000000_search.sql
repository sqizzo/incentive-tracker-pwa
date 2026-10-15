-- Pencarian entri servis milik user (dipakai halaman Riwayat).
-- Mencocokkan setiap kata (AND, tidak peka huruf besar/kecil) di: nama unit, no. nota,
-- customer/catatan, unit insentif, deskripsi item, dan kategori insentif item. Memakai position() (bukan LIKE)
-- supaya karakter % dan _ dari input user tidak perlu di-escape.
create or replace function public.search_service_entries(p_query text, p_limit int default 100)
returns setof uuid
language sql
stable
security invoker
set search_path = public
as $$
  with words as (
    select ltrim(lower(w), '#') as w
    from regexp_split_to_table(trim(coalesce(p_query, '')), '\s+') as w
    where ltrim(w, '#') <> ''
  ),
  hay as (
    select
      e.id,
      e.service_date,
      e.created_at,
      lower(concat_ws(' ',
        e.device_name, e.nota_no, e.note, e.incentive_device_name,
        (select string_agg(concat_ws(' ', i.description, i.category_name), ' ') from public.service_entry_items i where i.entry_id = e.id)
      )) as h
    from public.service_entries e
    where e.user_id = auth.uid()
  )
  select hay.id
  from hay
  where exists (select 1 from words)
    and not exists (select 1 from words where position(words.w in hay.h) = 0)
  order by hay.service_date desc, hay.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
$$;

grant execute on function public.search_service_entries(text, int) to authenticated;
revoke execute on function public.search_service_entries(text, int) from anon, public;
