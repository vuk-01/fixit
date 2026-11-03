-- DB.md §12.2, from ticket 14 ("Tabela pravila za seed", "Institucije za seed"), nothing added.
-- The only place institutions and jurisdiction rules exist (AGENTS.md rule 1); a change is a new migration.
-- Every address and every source re-checked on the official source on 2026-11-03 (ticket 14 Q9).

insert into public.institutions (slug, name, municipality_id, email, email_source_url, email_verified_at)
select v.slug, v.name, m.id, v.email, v.email_source_url, date '2026-11-03'
from public.municipalities m
cross join (values
  ('pg-sekretarijat-saobracaj', 'Sekretarijat za saobraćaj Glavnog grada Podgorice',
   'saobracaj@podgorica.me', 'https://podgorica.me/sekretarijat-za-saobracaj/'),
  ('pg-putevi', '„Putevi“ d.o.o. Podgorica',
   'putevi@t-com.me', 'https://podgorica.me/putevi-d-o-o/'),
  -- the address the source labels "Prijava kvara rada javne rasvjete i svjetlosne signalizacije"
  ('pg-komunalne-usluge', '„Komunalne usluge“ d.o.o. Podgorica',
   'dispecer@komunalneusluge.me', 'https://podgorica.me/komunalne-usluge-d-o-o/'),
  ('pg-vik', '„Vodovod i kanalizacija“ d.o.o. Podgorica',
   'info@vikpg.me', 'https://podgorica.me/vodovod-i-kanalizacija-d-o-o/'),
  ('pg-cistoca', '„Čistoća“ d.o.o. Podgorica',
   'cistocapg@t-com.me', 'https://podgorica.me/cistoca-d-o-o/'),
  ('pg-zelenilo', '„Zelenilo“ d.o.o. Podgorica',
   'zelenilo@t-com.me', 'https://podgorica.me/zelenilo-d-o-o/'),
  -- no rule; only an admin's manual choice on /admin
  ('pg-komunalna-policija', 'Služba komunalne policije Glavnog grada Podgorice',
   'pgkompolicija@t-com.me', 'https://podgorica.me/sluzba-komunalne-policije/'),
  ('pg-uprava-inspekcijski-poslovi', 'Uprava za inspekcijske poslove Glavnog grada Podgorice',
   'uip@podgorica.me', 'https://podgorica.me/uprava-za-inspekcijske-poslove/')
) as v (slug, name, email, email_source_url)
where m.iso_code = 'ME-16';

-- 10 rules for Podgorica; none for graffiti and other (other cannot have one, CHECK).
-- For street_light and traffic_light only the URL the excerpt is quoted from (ticket 14, "Za provjeru").
insert into public.jurisdiction_rules (
  category, municipality_id, institution_id, cc_institution_id,
  source_type, source_url, source_title, source_excerpt, verified_at, verified_by
)
select v.category::public.report_category, m.id, i.id, cc.id,
       v.source_type::public.source_type, v.source_url, v.source_title, v.source_excerpt,
       date '2026-11-03', 'nalaz 02; ponovna provjera 2026-11-03 (Claude Code)'
from public.municipalities m
cross join (values
  ('pothole', 'pg-sekretarijat-saobracaj', 'pg-putevi', 'official_document',
   'https://putevi.me/wp-content/uploads/2026/01/Program-obavlj.-kom.-djelatnosti-za-2026.-god.-Putevi-doo.pdf',
   'Program obavljanja komunalnih djelatnosti „Puteva“ d.o.o. za 2026. godinu (Glavni grad, br. 14820, 8. 12. 2025), str. 2 i 10',
   '„Društvu su povjereni poslovi tekućeg održavanja opštinskih i nekategorisanih putnih pravaca … asfaltiranje puteva, održavanje ulica, bulevara, drumova…“; „…dobijenim nalozima i rješenjima od strane resornog Sekretarijata za saobraćaj“'),
  ('sidewalk', 'pg-sekretarijat-saobracaj', 'pg-putevi', 'official_document',
   'https://putevi.me/wp-content/uploads/2026/01/Program-obavlj.-kom.-djelatnosti-za-2026.-god.-Putevi-doo.pdf',
   'Program obavljanja komunalnih djelatnosti „Puteva“ d.o.o. za 2026. godinu (Glavni grad, br. 14820, 8. 12. 2025), str. 2 i 10',
   '„obnavljanje postojećih i izrada novih trotoarskih površina“'),
  ('traffic_sign', 'pg-sekretarijat-saobracaj', 'pg-putevi', 'official_document',
   'https://putevi.me/wp-content/uploads/2026/01/Program-obavlj.-kom.-djelatnosti-za-2026.-god.-Putevi-doo.pdf',
   'Program obavljanja komunalnih djelatnosti „Puteva“ d.o.o. za 2026. godinu (Glavni grad, br. 14820, 8. 12. 2025), str. 2 i 10',
   '„postavljanje saobraćajnik znakova i ostale putne opreme (vertikalna signalizacija)“'),
  ('street_light', 'pg-komunalne-usluge', null, 'official_page',
   'https://www.komunalneusluge.me/',
   '„Komunalne usluge“ d.o.o. Podgorica — zvanični sajt',
   '„Osnovna djelatnost Društva sa ograničenom odgovornošću … održavanje javne rasvjete i svjetlosne signalizacije“'),
  ('traffic_light', 'pg-komunalne-usluge', null, 'official_page',
   'https://www.komunalneusluge.me/',
   '„Komunalne usluge“ d.o.o. Podgorica — zvanični sajt',
   '„Osnivač je povjerio obavljanje komunalnih djelatnosti i to: … održavanje svjetlosne signalizacije“'),
  ('manhole', 'pg-vik', null, 'official_page',
   'https://www.vikpg.me/o-nama/djelatnost.html',
   '„Vodovod i kanalizacija“ d.o.o. Podgorica — Djelatnost',
   '„održavanje kanalizacionog sistema i sistema za atmosferske vode“'),
  ('water_leak', 'pg-vik', null, 'official_page',
   'https://www.vikpg.me/o-nama/djelatnost.html',
   '„Vodovod i kanalizacija“ d.o.o. Podgorica — Djelatnost',
   '„održavanje vodovodnog sistema na teritoriji Glavnog grada“'),
  ('illegal_dump', 'pg-cistoca', null, 'official_page',
   'https://www.cistoca.me/servisi/usluge/javna-higijena',
   '„Čistoća“ d.o.o. Podgorica — Javna higijena',
   '„Uklanjanje nepropisno odloženog otpada – intervencija na mjestima gdje je otpad odložen van predviđenih mjesta i kontejnera“'),
  ('waste_container', 'pg-cistoca', null, 'official_page',
   'https://www.cistoca.me/o-nama',
   '„Čistoća“ d.o.o. Podgorica — O nama',
   '„sakupljanje, transport i odlaganje komunalnog otpada za potrebe korisnika usluga“'),
  ('greenery', 'pg-zelenilo', null, 'official_page',
   'https://www.zelenilo.me/djelatnosti',
   '„Zelenilo“ d.o.o. Podgorica — Djelatnosti',
   '„Orezivanje drveća, žbunja i žive ograde neophodno je za … stvaranje sigurnih uslova za posjetioce zelenih površina, prolaznike i učesnike u saobraćaju“; održavanje „u parkovima, na dječijim igralištima, duž saobraćajnica“')
) as v (category, institution_slug, cc_slug, source_type, source_url, source_title, source_excerpt)
join public.institutions i on i.slug = v.institution_slug
left join public.institutions cc on cc.slug = v.cc_slug
where m.iso_code = 'ME-16';
