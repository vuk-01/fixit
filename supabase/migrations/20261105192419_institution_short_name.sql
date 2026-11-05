-- Short institution name for the UI (ticket 54): the official's account menu shows it instead of the
-- official `name`. Without „d.o.o." and „Glavnog grada Podgorice"; null = use `name`.
-- `institutions` stays publicly readable through the existing "public read" policy (DB.md §9); no new
-- function, so no revoke/grant.

alter table public.institutions
  add column short_name text null,
  add constraint institutions_short_name_not_blank check (short_name is null or btrim(short_name) <> '');

update public.institutions i
set short_name = v.short_name
from (values
  ('pg-cistoca', 'Čistoća'),
  ('pg-komunalna-policija', 'Komunalna policija'),
  ('pg-komunalne-usluge', 'Komunalne usluge'),
  ('pg-putevi', 'Putevi'),
  ('pg-sekretarijat-saobracaj', 'Sekretarijat za saobraćaj'),
  ('pg-uprava-inspekcijski-poslovi', 'Inspekcijski poslovi'),
  ('pg-vik', 'Vodovod i kanalizacija'),
  ('pg-zelenilo', 'Zelenilo')
) as v (slug, short_name)
where i.slug = v.slug;

-- all eight seeded institutions (migration 10) must have one; otherwise the whole migration rolls back
do $$
begin
  if (select count(*) from public.institutions where short_name is not null) <> 8 then
    raise exception 'institution_short_name: expected 8 institutions with short_name';
  end if;
end
$$;
