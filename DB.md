# DB.md — Fixit

*Šema, enumi, triggeri, RPC funkcije, RLS, storage, Realtime, seed i redoslijed migracija. Odluke iz tiketa 18 (3. 11. 2026), izvedene iz tiketa 09, 10, 11, 13, 14, 15 i 17. Prva verzija radi **samo za Glavni grad Podgoricu**. Pojmovi su iz `GLOSSARY.md`, stack i tokovi iz `Tech.md`, pravila rada iz `AGENTS.md`. Migracije piše i primjenjuje samo Ivana (sekcija 13).*

## 1. Principi

- Identifikatori na engleskom (`snake_case`), labele za UI su u `lib/constants.ts`.
- **RLS je uključen na svakoj tabeli.** Klijent nikad ne piše direktno ni u jednu tabelu prijave (`reports` i tabele uz nju); sve izmjene idu kroz RPC funkcije iz sekcije 8. Server sa servisnim ključem takođe piše samo kroz te funkcije; izuzeci su log `agent_runs` (koraci agenta) i demo skripta iz sekcije 12, koja demo prijave upisuje direktno u konačnom stanju.
- **Identitet nikad nije u javnoj tabeli.** Javni podaci prijave (`reports`, uključujući opis, `report_photos`, `report_events`) ne sadrže nijedan ID korisnika. Ko je prijavio je u `report_private`, ko je podržao u `report_likes`, a tekst dopisa sa eventualnim imenom i mejlom u `letters`. Nijedna tabela sa ID-jem korisnika nema javnu `SELECT` politiku i nije u Realtime publikaciji (sekcije 5 i 11).
- **Anonimna sesija nije nalog.** Anonimni korisnik ima Supabase ulogu `authenticated`, pa nijedna dozvola ne smije zavisiti samo od uloge `authenticated`. Prava se izvode iz `profiles` preko pomoćne funkcije koja za anonimnu sesiju vraća `null` (sekcija 7).
- Lokacija se čuva kao `lat`/`lng` (lako za klijent) i kao `geography(Point, 4326)` (za prostorne upite), koju postavlja trigger. Isti trigger određuje opštinu i odbija tačku van Podgorice.
- Nadležnost postoji samo u tabeli `jurisdiction_rules` i čita se samo kroz `resolve_jurisdiction` (zlatno pravilo 1). Nijedno pravilo ne postoji bez izvora (`source_type`, `source_title`, `verified_at`). Jedini drugi put do primaoca je ručni izbor administratora (ručno raspoređivanje, preusmjeravanje), koji ne stvara pravilo.
- Tabela prelaza statusa (FR-18) živi na jednom mjestu u bazi: trigger odbija svaki nedozvoljen par (iz, u), a RPC funkcije provjeravaju ko smije.
- Vrijeme se čuva kao `timestamptz`; „dan" (brojač dana, dnevno ograničenje, godina u broju prijave) uvijek se računa u `Europe/Podgorica`.

## 2. Ekstenzije i šeme

- `create extension if not exists postgis with schema extensions;` PostGIS ide u šemu `extensions`, ne u `public` (inače se `spatial_ref_sys` izlaže kroz Data API). Tipovi se pišu sa prefiksom: `extensions.geography(Point, 4326)`, `extensions.geometry(MultiPolygon, 4326)`.
- `public`: tabele, enumi i RPC funkcije koje se zovu preko `supabase.rpc()`. Samo ova šema ide u `database.types.ts` (`pnpm db:types`).
- `private`: pomoćne funkcije za RLS i triggere. Šema nije među izloženim šemama Data API-ja, pa ih klijent ne može zvati preko REST-a. Ipak treba `grant usage on schema private to anon, authenticated` i `grant execute` na pomoćne funkcije, jer ih RLS politike pozivaju u ime korisnika.
- `gen_random_uuid()` je ugrađen u Postgres; druge ekstenzije nisu potrebne.

## 3. Enumi

Svi enumi su u šemi `public`. Nova vrijednost = nova migracija (`alter type … add value`) i, ako se prikazuje, red u `lib/constants.ts` (kompajler javlja vrijednost bez labele, jer je `lib/constants.ts` `Record<…>` nad generisanim tipom).

| Enum | Vrijednosti | Izvor |
|---|---|---|
| `user_role` | `citizen`, `official`, `admin` | 09 Q5, 18 Q2 |
| `report_status` | `draft`, `routing`, `sent`, `acknowledged`, `in_progress`, `resolved`, `not_competent`, `rejected` (svih osam od prve migracije) | 09 Q6, 10 Q1, Q4 |
| `report_category` | `pothole`, `sidewalk`, `traffic_sign`, `street_light`, `traffic_light`, `manhole`, `water_leak`, `illegal_dump`, `waste_container`, `greenery`, `graffiti`, `other` | 13 Q1 |
| `report_severity` | `low`, `medium`, `high` | 13 Q3 |
| `source_type` | `official_document`, `official_page`, `written_confirmation`, `phone_confirmation` | 14 Q3 |
| `jurisdiction_outcome` | `matched`, `no_rule`, `no_email` | 14 Q2 |
| `routing_reason` | `no_rule`, `no_email` | 14 Q2, 10 Q1 |
| `analysis_status` | `pending`, `done`, `failed`, `timed_out` | 15 |
| `category_source` | `ai`, `citizen` | 15 |
| `report_event_kind` | `submitted`, `routed`, `assigned`, `acknowledged`, `status_changed`, `not_competent`, `redirected`, `reopened` | 10 (tabela prelaza) |
| `event_actor` | `reporter`, `institution`, `fixit` | 10, FR-18 |
| `letter_kind` | `initial`, `assignment`, `redirect` | 10 Q2, 14 Q5 |
| `dispatch_status` | `pending`, `succeeded`, `failed` | 09 Q2, 10 |
| `agent_step` | `classify`, `jurisdiction`, `duplicates`, `letter`, `send` | 17, FR-13 |
| `agent_run_outcome` | `ok`, `fallback`, `error` | 17 |
| `moderation_action` | `hide_report`, `unhide_report`, `hide_photo`, `unhide_photo` | 11 Q3 |

- Vrsta je enum, ne tabela (tiket 13): vrste se u P0 ne mijenjaju u radu, enum ne traži RLS, a generisani tip veže `lib/constants.ts` za bazu. Nazivi i opisi vrsta su samo u `lib/constants.ts`.
- **Otvorena prijava** (GLOSSARY, FR-18) = status u `routing`, `sent`, `acknowledged`, `in_progress`, `not_competent` **i** `hidden_at is null`. **Zatvorena** = `resolved` ili `rejected`. Ovaj skup je u jednoj funkciji, `private.is_open(status, hidden_at)`, koju koriste i RPC i politike.
- Javni tekst vremenske linije se ne čuva u bazi: UI ga sklapa iz `kind`, `to_status`, institucija i `message` (labele u `lib/constants.ts`).

## 4. Tabele

Sve tabele imaju `created_at timestamptz not null default now()`; tabele koje se mijenjaju imaju i `updated_at` (trigger u sekciji 6). Primarni ključevi su `uuid default gen_random_uuid()` osim gdje piše drugačije. Strani ključevi ka prijavi su `on delete cascade`, da brisanje nacrta i `db:clear-demo` počiste sve.

### 4.1 Referentni podaci

**`municipalities`**: opština; u P0 tačno jedan red (Glavni grad Podgorica).

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `iso_code` | `text not null unique` | `ME-16`; stabilan ključ za seed |
| `name` | `text not null` | kratki naziv za UI: „Podgorica" |
| `official_name` | `text not null` | „Glavni grad Podgorica" (dopis, naziv institucije) |
| `osm_relation_id` | `bigint not null` | `2319360` |
| `boundary` | `extensions.geometry(MultiPolygon, 4326) not null` | iz OSM-a, `ST_Multi(ST_MakeValid(…))` |
| `boundary_source` | `text not null` | npr. „© OpenStreetMap contributors, ODbL; polygons.openstreetmap.fr, rel. 2319360" |
| `boundary_snapshot_at` | `date not null` | datum OSM snimka |

Indeks: `gist (boundary)`.

**`institutions`**: svaki mogući primalac ili kopija dopisa.

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `slug` | `text not null unique` | stabilan ključ za seed i pravila, npr. `pg-sekretarijat-saobracaj` |
| `name` | `text not null unique` | zvaničan naziv, npr. „Sekretarijat za saobraćaj Glavnog grada Podgorice" |
| `short_name` | `text null` | kratak naziv za UI (meni naloga službenika), bez „d.o.o." i „Glavnog grada Podgorice"; `null` = prikazuje se `name`; CHECK: nije prazan string [tiket 54, migracija 11] |
| `municipality_id` | `uuid null` FK | `null` za državne organe (u P0 ih nema) |
| `email` | `text null` | prava javna institucionalna adresa; `null` = nema provjeren mejl |
| `email_source_url` | `text null` | gdje je adresa objavljena |
| `email_verified_at` | `date null` | datum posljednje provjere |
| `is_active` | `boolean not null default true` | neaktivna institucija se ne nudi i ne prima dopise |
| `updated_at` | `timestamptz not null` | |

CHECK: `email is null or (email_source_url is not null and email_verified_at is not null)`; `email = lower(email)`. „Primalac ima provjeren mejl" u cijelom dokumentu znači `email is not null and is_active`. Lične adrese službenika se ne unose (tiket 14).

**`jurisdiction_rules`**: pravilo nadležnosti (tiket 14).

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `category` | `report_category not null` | |
| `municipality_id` | `uuid not null` FK | NOT NULL: u P0 nema nacionalnih pravila |
| `institution_id` | `uuid not null` FK | primalac |
| `cc_institution_id` | `uuid null` FK | kopija (putevi: „Putevi" d.o.o.) |
| `source_type` | `source_type not null` | |
| `source_url` | `text null` | obavezan za zvanični dokument i stranicu |
| `source_title` | `text not null` | |
| `source_excerpt` | `text null` | kratak citat |
| `verified_at` | `date not null` | |
| `verified_by` | `text not null` | „nalaz 02" ili ime osobe iz tima; nije javno |
| `notes` | `text null` | obavezno za pisanu i telefonsku potvrdu (datum, kanal, ko je potvrdio); nije javno |
| `updated_at` | `timestamptz not null` | |

Ograničenja:

```sql
unique (category, municipality_id),
check (category <> 'other'),  -- „Drugi problem" namjerno nikad nema pravilo (tiket 13 Q2)
check (source_type in ('written_confirmation','phone_confirmation') or source_url is not null),
check (source_type in ('official_document','official_page') or notes is not null),
check (cc_institution_id is null or cc_institution_id <> institution_id)
```

Nema rangiranja ni rezervnog pravila: `UNIQUE` garantuje najviše jedan pogodak, a nedostatak pravila znači `routing`.

### 4.2 Korisnici

**`profiles`**: podaci korisnika sa nalogom. Anonimni korisnik nema profil.

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK, FK `auth.users(id) on delete cascade` | |
| `first_name` | `text not null` | CHECK `char_length(first_name) between 1 and 50 and first_name = btrim(first_name)` |
| `last_name` | `text not null` | isto |
| `role` | `user_role not null default 'citizen'` | mijenja samo servisni ključ (sekcija 6) |
| `institution_id` | `uuid null` FK | samo za službenika |
| `is_demo` | `boolean not null default false` | demo i razvojni nalozi (sekcija 12) |
| `updated_at` | `timestamptz not null` | |

CHECK: `(role = 'official') = (institution_id is not null)`. Službenik pripada tačno jednoj instituciji; posebna tabela `officials` nije potrebna.

Mejl korisnika se ne kopira u `profiles`; server ga čita iz `auth.users` (admin klijent) samo kad pravi dopis uz saglasnost.

### 4.3 Prijava

**`reports`**: javni zapis prijave. **Bez ijednog ID-ja korisnika.** Jedina tabela u Realtime publikaciji.

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `code` | `text null unique` | `FX-2026-00142`; `null` dok nacrt nije prvi put poslat |
| `status` | `report_status not null default 'draft'` | mijenja se samo kroz RPC (sekcija 8) |
| `category` | `report_category null` | konačna vrsta; `null` u nacrtu dok nije poznata |
| `lat`, `lng` | `double precision null` | potvrđeni pin |
| `location` | `extensions.geography(Point, 4326) null` | postavlja trigger iz `lat`/`lng` |
| `municipality_id` | `uuid null` FK | postavlja trigger; van Podgorice upis pada |
| `address` | `text null` | konačna adresa potvrđene tačke; `null` ako geocoder nije odgovorio |
| `address_source` | `text null` | CHECK `in ('nominatim','photon')` |
| `description` | `text null` | **javni** opis problema, prikazuje se uz fotografije na `/p/[code]` i ide u dopis (tiket 19 Q4). U nacrtu ga upisuje model (`record_classification`), a konačni tekst građanin na pregledu (`begin_submission`); do 1000 znakova; prazan = `null`. Dok je prijava `draft`, RLS ga ne pokazuje javnosti |
| `institution_id` | `uuid null` FK | trenutni primalac; `null` u `draft` i `routing` |
| `cc_institution_id` | `uuid null` FK | kopija trenutnog dopisa |
| `jurisdiction_rule_id` | `uuid null` FK | pravilo po kom je primalac određen; `null` kad ga je odredio administrator |
| `routing_reason` | `routing_reason null` | zašto je prijava išla u `routing`; ostaje i nakon raspoređivanja |
| `like_count` | `integer not null default 0` | CHECK `>= 0`; mijenja ga samo trigger (i demo seed) |
| `is_demo` | `boolean not null default false` | |
| `hidden_at` | `timestamptz null` | sakrivena prijava (moderacija); ko je sakrio je u `moderation_log` |
| `is_hidden` | `boolean generated always as (hidden_at is not null) stored` | za filtere |
| `submitted_at` | `timestamptz null` | podnošenje; od njega teče brojač dana (FR-15) |
| `closed_at` | `timestamptz null` | `resolved` ili `rejected`; ponovno otvaranje ga briše |
| `updated_at` | `timestamptz not null` | |

Nema `sent_at` ni `resolved_at`: vrijeme slanja dopisa je na `letters.sent_at`, a zatvaranja u `closed_at` (tiket 10 Q5).

```sql
check (code ~ '^FX-[0-9]{4}-[0-9]{5}$'),
check (description is null or char_length(description) between 1 and 1000),
check ((status = 'draft') = (submitted_at is null)),
check ((status in ('resolved','rejected')) = (closed_at is not null)),
check (status = 'draft'
       or (code is not null and category is not null
           and location is not null and municipality_id is not null)),
check (status not in ('sent','acknowledged','in_progress','not_competent')
       or institution_id is not null),
check (status not in ('draft','routing')
       or (institution_id is null and cc_institution_id is null and jurisdiction_rule_id is null)),
check (status <> 'routing' or routing_reason is not null),
check (cc_institution_id is null or cc_institution_id <> institution_id),
check ((lat is null) = (lng is null)),
check (lat is null or (lat between -90 and 90 and lng between -180 and 180))
```

Indeksi: `gist (location) where status <> 'draft' and hidden_at is null` (duplikati, ranije prijave, mapa); `(institution_id, status)` (panel); `(status, submitted_at)`; `(is_demo) where is_demo`.

**`report_details`**: nejavni podaci o prijavi, 1:1 sa `reports`: ozbiljnost, naslov i sirovi izlaz modela. Čitaju ih prijavilac, službenik primaoca i administrator; javnost ne (FR-6: ozbiljnost samo u panelu). Opis **nije** ovdje: javan je i nalazi se u `reports.description` (tiket 19 Q4).

| Kolona | Tip | Napomena |
|---|---|---|
| `report_id` | `uuid` PK, FK | |
| `analysis_status` | `analysis_status not null default 'pending'` | |
| `is_municipal_problem` | `boolean null` | iz modela |
| `ai_category` | `report_category null` | prvobitna vrsta modela (tiket 20) |
| `ai_confidence` | `numeric(3,2) null` | CHECK `between 0 and 1` |
| `category_source` | `category_source null` | postavlja se pri podnošenju: `ai` ako je konačna vrsta = `ai_category`, inače `citizen` |
| `title` | `text null` | iz modela, do 120 znakova. Nije javan i nije naslov javne stranice: građanin ga ne vidi ni ne mijenja na pregledu (FR-11), a u ručnom toku ga nema. Javni naslov je naziv vrste i adresa (tiket 19 Q4) |
| `severity` | `report_severity null` | `null` u ručnom toku |
| `immediate_danger` | `boolean not null default false` | |
| `image_contains_instructions` | `boolean not null default false` | |
| `updated_at` | `timestamptz not null` | |

**`report_private`**: ko je prijavio i šta je dozvolio. 1:1 sa `reports`. Čitaju samo prijavilac i administrator.

| Kolona | Tip | Napomena |
|---|---|---|
| `report_id` | `uuid` PK, FK | |
| `reporter_id` | `uuid not null` FK `profiles(id)` | indeks |
| `share_contact` | `boolean not null default false` | „Dostavi moje ime i mejl instituciji"; postavlja se pri podnošenju, podrazumijevano isključeno pri svakoj prijavi (tiket 11 Q1) |

**`report_photos`**: fotografije prijave (1–3).

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `report_id` | `uuid not null` FK | indeks |
| `storage_path` | `text not null unique` | `<uuid>.jpg` u bucket-u `report-photos` (sekcija 10); CHECK regex iz sekcije 10 |
| `position` | `smallint not null` | CHECK `between 1 and 3`; `unique (report_id, position)`; redoslijed i nazivi priloga `{kod}-1.jpg`… |
| `sent_to_model` | `boolean not null default false` | `true` za fotografije poslate u `classify` |
| `has_personal_data` | `boolean not null default false` | model označio lica ili tablice (po fotografiji, tiket 11) |
| `hidden_at` | `timestamptz null` | sakrivena fotografija |

Trigger (sekcija 6) drži najviše 3 fotografije po prijavi.

**`report_events`**: javna vremenska linija. **Bez ID-ja korisnika**: nosi samo ulogu aktera i instituciju (FR-18, tiket 11 Q5).

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `report_id` | `uuid not null` FK | indeks `(report_id, created_at)` |
| `kind` | `report_event_kind not null` | |
| `from_status` | `report_status null` | |
| `to_status` | `report_status not null` | |
| `actor` | `event_actor not null` | `reporter` (podnošenje), `institution` (službenik), `fixit` (administrator) |
| `institution_id` | `uuid null` FK | institucija koja je djelovala, ili nova institucija kod `submitted`/`assigned`/`redirected` |
| `previous_institution_id` | `uuid null` FK | samo kod `redirected` |
| `message` | `text null` | javna poruka službenika ili administratora, do 1000 znakova |
| `created_at` | `timestamptz not null default now()` | demo seed ga postavlja unazad |

**`report_likes`**: podrške.

| Kolona | Tip | Napomena |
|---|---|---|
| `report_id` | `uuid not null` FK | |
| `user_id` | `uuid not null` | **namjerno bez FK** ka `auth.users`: brisanje (anonimnog) korisnika ne smije kaskadno smanjiti brojač (tiket 11) |
| `created_at` | `timestamptz not null default now()` | |

PK `(report_id, user_id)`: jedna podrška po korisniku (ili anonimnoj sesiji) po prijavi. U P0 nema povlačenja podrške. Indeks `(user_id)`.

**`report_code_counters`**: godišnji brojač broja prijave (tiket 10 Q8).

| Kolona | Tip |
|---|---|
| `year` | `integer` PK |
| `last_value` | `integer not null` |

RLS uključen, bez ijedne politike: čita ga i mijenja samo `next_report_code()`.

### 4.4 Dopis i slanje

**`letters`**: dopis (tiket 09 Q2). Prijava ima jedan dopis po instituciji kojoj je upućena: prvi (`initial`), iz `routing` (`assignment`) i svaki nakon preusmjeravanja (`redirect`).

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `report_id` | `uuid not null` FK | |
| `kind` | `letter_kind not null` | |
| `institution_id` | `uuid not null` FK | primalac |
| `cc_institution_id` | `uuid null` FK | kopija (samo ako ima provjeren mejl) |
| `jurisdiction_rule_id` | `uuid null` FK | `null` za `assignment` i `redirect` |
| `to_email`, `cc_email` | `text not null`, `text null` | snimak prave adrese u trenutku slanja |
| `subject` | `text not null` | naslov iz FR-11 |
| `body_text` | `text not null` | cijeli tekst iz šablona; ime i mejl prijavioca samo ako `includes_contact` |
| `includes_contact` | `boolean not null` | snimak `share_contact` |
| `sent_at` | `timestamptz null` | vrijeme prvog uspješnog slanja |

Indeks: `unique (report_id, institution_id) where sent_at is null` (najviše jedan neposlat dopis po instituciji; ponovni pokušaj koristi isti red).

**`dispatches`**: slanje dopisa, jedan pokušaj.

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | služi i kao Resend `Idempotency-Key` |
| `letter_id` | `uuid not null` FK | |
| `report_id` | `uuid not null` FK | radi indeksa ispod |
| `status` | `dispatch_status not null default 'pending'` | |
| `email_mode` | `text not null` | CHECK `in ('test','live')`; šta je `lib/email/send.ts` stvarno primijenio |
| `delivered_to` | `text[] null` | stvarni primaoci poslije guard-a (u test režimu samo `TEST_INBOX`) |
| `provider_message_id` | `text null` | Resend ID |
| `error_code` | `text null` | bez ličnih podataka |
| `started_at` | `timestamptz not null default now()` | |
| `finished_at` | `timestamptz null` | |

```sql
create unique index dispatches_one_pending_per_report on dispatches (report_id) where status = 'pending';
create unique index dispatches_one_success_per_letter on dispatches (letter_id) where status = 'succeeded';
```

Prvi indeks sprečava dva istovremena slanja iste prijave (dvostruki dodir na „Pošalji prijavu", dva administratora). Drugi garantuje da dopis uspješno ode najviše jednom.

### 4.5 Log i moderacija

**`agent_runs`**: korak agenta (FR-13). Bez imena, mejla i slike (tiket 11).

| Kolona | Tip | Napomena |
|---|---|---|
| `id` | `uuid` PK | |
| `report_id` | `uuid null` FK `on delete set null` | red ostaje i kad se nacrt obriše (dnevno ograničenje ga broji) |
| `user_id` | `uuid null` FK `auth.users on delete set null` | |
| `step` | `agent_step not null` | |
| `model` | `text null` | samo za `classify` |
| `photo_count` | `smallint null` | |
| `started_at` | `timestamptz not null default now()` | |
| `finished_at` | `timestamptz null` | |
| `duration_ms` | `integer null` | |
| `outcome` | `agent_run_outcome null` | `null` dok korak traje |
| `stop_reason` | `text null` | |
| `input_tokens`, `output_tokens` | `integer null` | |
| `error_code` | `text null` | |
| `meta` | `jsonb null` | podaci koraka bez ličnih podataka (npr. `jurisdiction_outcome`, broj duplikata) |

Indeks: `(user_id, step, started_at)` za dnevno ograničenje.

**`moderation_log`**: ko je i zašto sakrio ili vratio prijavu ili fotografiju. Samo administrator.

| Kolona | Tip |
|---|---|
| `id` | `uuid` PK |
| `report_id` | `uuid not null` FK |
| `photo_id` | `uuid null` FK `report_photos on delete cascade` |
| `action` | `moderation_action not null` |
| `admin_id` | `uuid not null` FK `profiles(id)` |
| `reason` | `text null` |
| `created_at` | `timestamptz not null default now()` |

Nema tabele obavještenja: obavještenja (FR-19) su P1 i dobijaju svoju migraciju.

## 5. Javno i privatno

Pravilo: **tabela sa ID-jem korisnika nema javnu `SELECT` politiku i nije u publikaciji `supabase_realtime`.** Postgres Changes šalje pretplatniku cijeli red, pa bi `reporter_id` u `reports` ili `user_id` u objavljenoj `report_likes` bio vidljiv svakome ko ima publishable ključ (tiket 11).

| Tabela | Ko čita (sekcija 9) | ID korisnika | Realtime |
|---|---|---|---|
| `reports` (uključujući `description`) | svi (javne), prijavilac, službenik primaoca, administrator | nema | **da** |
| `report_photos` | svi (nesakrivene fotografije javnih prijava), prijavilac, službenik, administrator | nema | ne |
| `report_events` | svi (javne prijave), prijavilac, službenik, administrator | nema | ne |
| `municipalities`, `institutions` | svi | nema | ne |
| `report_details` (ozbiljnost, naslov, AI polja) | prijavilac, službenik primaoca, administrator | nema | ne |
| `letters` | prijavilac, službenik primaoca (samo dopis upućen njoj), administrator | nema kolone; tekst sadrži ime i mejl samo uz saglasnost | ne |
| `report_private` | prijavilac, administrator | `reporter_id` | ne |
| `report_likes` | samo vlasnik reda (ni administrator) | `user_id` | ne |
| `profiles` | sam korisnik, administrator | `id` | ne |
| `jurisdiction_rules` | administrator (javnost kroz `get_jurisdiction_source`) | nema; `notes`/`verified_by` mogu imati ime | ne |
| `dispatches`, `agent_runs`, `moderation_log` | administrator | `agent_runs.user_id`, `moderation_log.admin_id` | ne |
| `report_code_counters` | niko (samo funkcija) | nema | ne |

- „Da li je ovo moja prijava" i „da li sam već podržao" klijent saznaje bez posebnog RPC-a: prijavilac kroz RLS vidi svoj red u `report_private`, a korisnik svoj red u `report_likes`. Za tuđu prijavu oba upita vraćaju prazno.
- Službenik ne vidi ko je prijavio (`report_private`, `profiles`); ime i mejl prijavioca vidi samo u tekstu dopisa, ako je građanin uključio dostavljanje.
- Administrator vidi nalog prijavioca (`report_private` + `profiles`), ali ne i ko je podržao prijavu (FR-16, §6 Privatnost).

## 6. Triggeri

Sve trigger funkcije su u šemi `private`, `security definer`, sa `set search_path = ''`.

1. **Lokacija i opština** (`reports`, `before insert or update of lat, lng`): postavlja `location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography` (ili `null`), a `municipality_id = public.resolve_municipality(lat, lng)`. Ako tačka postoji, a opština je `null`, baca `outside_area`. Tako prijava van Podgorice ne može ni postojati (FR-4), bez obzira na to ko piše.
2. **Brojač podrški** (`report_likes`, `after insert or delete`, za svaki red):

   ```sql
   if tg_op = 'INSERT' then
     update public.reports set like_count = like_count + 1 where id = new.report_id;
   else
     update public.reports set like_count = greatest(like_count - 1, 0) where id = old.report_id;
   end if;
   ```

   Svaki `UPDATE` na `reports` je Realtime događaj, pa brojač na mapi i na `/p/[code]` raste uživo (FR-17). `DELETE` u P0 radi samo kaskada i čišćenje.
3. **Zaštita uloge** (`profiles`, `before update`): ako se mijenja `role`, `institution_id` ili `is_demo`, a zahtjev dolazi sa korisničkim JWT-om (`auth.jwt() ->> 'role'` je `anon` ili `authenticated`), baca `not_allowed`. Servisni ključ, SQL Editor i migracije prolaze. Klijent ionako nema `UPDATE` politiku na `profiles`; trigger je druga brava za slučaj da se kasnije doda izmjena imena (18 Q2).
4. **Novi korisnik** (`auth.users`, `after insert`): ako je `new.is_anonymous`, ne radi ništa (anonimni korisnik nema profil). Inače upisuje `profiles(id, first_name, last_name)` iz `raw_user_meta_data` (`btrim`), koje šalje `signUp({ options: { data: { first_name, last_name } } })`, odnosno `user_metadata` kod `auth.admin.createUser`. **Uloga se nikad ne čita iz metapodataka** (korisnik ih sam piše); uvijek je `citizen`, a službenika i administratora postavlja seed skripta servisnim ključem. Bez imena ili prezimena CHECK pada i registracija ne uspijeva (FR-1). Anonimni korisnik koji bi se kasnije pretvorio u stalnog (`updateUser`) ostaje bez profila i ne može praviti prijave; to nije P0 put.
5. **Prelazi statusa** (`reports`, `before update of status`): ako je `old.status <> new.status` i par nije dozvoljen, baca `transition_not_allowed`. Isti trigger održava `closed_at`: prelaz u `resolved`/`rejected` ga postavlja na `now()`, prelaz iz njih u `in_progress` ga briše. Dozvoljeni parovi (`private.is_allowed_transition`), iz tabele prelaza tiketa 10:

   | Iz | U |
   |---|---|
   | `draft` | `sent`, `routing` |
   | `routing` | `sent`, `rejected` |
   | `sent` | `acknowledged`, `in_progress`, `resolved`, `rejected`, `not_competent` |
   | `acknowledged` | `in_progress`, `resolved`, `rejected`, `not_competent`, `sent` (preusmjeravanje) |
   | `in_progress` | `resolved`, `rejected`, `not_competent`, `sent` (preusmjeravanje) |
   | `not_competent` | `rejected`, `sent` (preusmjeravanje) |
   | `resolved`, `rejected` | `in_progress` (ponovno otvaranje) |

   Preusmjeravanje iz `sent` je `sent → sent` (isti status, nova institucija), pa ga trigger ne vidi kao prelaz. **Ko** smije koji prelaz provjeravaju RPC funkcije (sekcija 8.4). Demo seed upisuje prijave odmah u konačnom statusu (`INSERT`), pa trigger ne smeta.
6. **Najviše 3 fotografije** (`report_photos`, `before insert`): zaključava red prijave (`select … for update`) i baca `photo_limit` ako prijava već ima 3 fotografije.
7. **`updated_at`** (`reports`, `report_details`, `profiles`, `institutions`, `jurisdiction_rules`, `before update`): `new.updated_at = now()`.

## 7. Pomoćne funkcije (šema `private`)

Koriste ih RLS politike, triggeri i RPC funkcije. Sve su `stable`, `security definer`, `set search_path = ''` (da politike ne upadnu u rekurziju kroz RLS na `profiles`). U politikama se pozivaju kao `(select private.fn())`, da ih Postgres izračuna jednom po upitu.

```sql
-- null for anonymous sessions, guests and users without a profile
create function private.current_user_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) = false
$$;
```

- `private.current_user_role()`: kao gore. Nedostajući claim `is_anonymous` se tumači kao anonimna sesija (ne propušta kad nije siguran).
- `private.current_institution_id()`: `institution_id` službenika, uz isti uslov; inače `null`.
- `private.is_admin()`: `current_user_role() = 'admin'`.
- `private.is_reporter(p_report_id uuid)`: postoji red u `report_private` sa `reporter_id = auth.uid()` i sesija nije anonimna.
- `private.is_public_report(p_status, p_hidden_at)`: `p_status <> 'draft' and p_hidden_at is null`.
- `private.is_open(p_status, p_hidden_at)`: status u skupu otvorenih i `p_hidden_at is null`.
- `private.is_allowed_transition(p_from, p_to)`: tabela iz sekcije 6.

## 8. RPC funkcije

### 8.1 Pravila za sve funkcije

- Sve su u `public`, `security definer`, `set search_path = ''`, sa punim imenima objekata (`public.reports`, `extensions.st_dwithin`). Nijedan pogled (view): pogledi u Supabase-u podrazumijevano zaobilaze RLS.
- **Postgres podrazumijevano daje `EXECUTE` svima (`PUBLIC`), a Supabase još i `anon` i `authenticated`.** Zato migracija za svaku funkciju piše eksplicitno:

  ```sql
  revoke execute on function public.create_draft(uuid, text[]) from public, anon, authenticated;
  grant execute on function public.create_draft(uuid, text[]) to service_role;
  ```

  i obrnuto za klijentske funkcije (`grant … to authenticated`, `anon` samo gdje tabela 8.2 kaže). Funkcija bez ovog para se ne merguje (isto kao tabela bez RLS-a).
- **Klijentske funkcije** (grant `authenticated`) korisnika uzimaju samo iz `auth.uid()` i JWT-a, nikad iz parametra. Prava provjeravaju preko pomoćnih funkcija iz sekcije 7, pa anonimna sesija prolazi samo tamo gdje je to izričito dozvoljeno (`like_report`).
- **Serverske funkcije** (grant samo `service_role`) zove samo server admin klijentom (`lib/supabase/admin.ts`), poslije `getClaims()`. Primaju `p_user_id` koji je server dobio iz `getClaims()` i same provjeravaju u bazi da taj korisnik nije anoniman (`auth.users.is_anonymous = false`) i da ima ulogu `citizen` ili `admin`, gdje treba.
- Greške se bacaju sa stabilnim kodom u poruci (`raise exception 'daily_limit_reached'`); server i klijent ih prevode u tekst iz `lib/constants.ts`. Kodovi: `not_authenticated`, `not_allowed`, `not_found`, `invalid_state`, `transition_not_allowed`, `message_required`, `daily_limit_reached`, `outside_area`, `photo_limit`, `photo_missing`, `photos_required`, `own_report`, `report_not_open`, `dispatch_in_progress`, `no_verified_email`, `same_institution`, `code_overflow`.
- Funkcije koje mijenjaju prijavu prvo zaključavaju njen red (`select … for update`).
- Poruke (`p_message`, `p_reason`) se `btrim`-uju; prazan string = `null`; najviše 1000 znakova.

### 8.2 Pregled

| Funkcija | Poziva | Grant | Svrha |
|---|---|---|---|
| `resolve_municipality(p_lat, p_lng)` | klijent na „Potvrdi lokaciju" (tiket 19 Q6), trigger, ruta `prepare` | `authenticated`, `service_role` | opština tačke ili `null` (FR-4) |
| `resolve_jurisdiction(p_category, p_municipality_id)` | ruta `prepare`, `begin_submission` | `authenticated`, `service_role` | primalac iz pravila (FR-8) |
| `get_jurisdiction_source(p_rule_id)` | „Zašto ova institucija?" | `anon`, `authenticated` | javni dio pravila |
| `find_nearby_open_reports(p_category, p_lat, p_lng, p_exclude_report_id)` | ruta `prepare` (sesija građanina) | `authenticated` | duplikati do 50 m (FR-9) |
| `like_report(p_report_id)` | dugme „Podržavam" | `authenticated` | podrška (FR-16) |
| `support_existing_report(p_draft_id, p_report_id)` | „Podrži postojeću" | `authenticated` | podrška + brisanje nacrta |
| `add_report_photo(p_report_id, p_storage_path)` | „Dodaj fotografiju" | `authenticated` | fotografija nacrta |
| `remove_report_photo(p_photo_id)` | „Ukloni" | `authenticated` | |
| `delete_draft(p_report_id)` | „Odustani" | `authenticated` | prelaz 2 |
| `acknowledge_report(p_report_id)` | panel, otvaranje prijave | `authenticated` | prelaz 7 (FR-22) |
| `set_report_status(p_report_id, p_to, p_message)` | panel, `/admin` | `authenticated` | prelazi 8–12 i 14 |
| `set_report_hidden(p_report_id, p_hidden, p_reason)` | `/admin` | `authenticated` | moderacija |
| `set_photo_hidden(p_photo_id, p_hidden, p_reason)` | `/admin` | `authenticated` | moderacija |
| `create_draft(p_user_id, p_photo_paths)` | ruta `classify` | `service_role` | prelaz 1 + dnevno ograničenje |
| `record_classification(p_report_id, p_agent_run_id, …)` | ruta `classify` | `service_role` | rezultat modela |
| `update_draft(p_report_id, p_user_id, p_lat, p_lng, p_address, p_address_source, p_category)` | ruta `prepare` | `service_role` | lokacija, adresa, vrsta nacrta |
| `begin_submission(p_report_id, p_user_id, p_category, p_description, p_share_contact)` | `sendReport` | `service_role` | kod, nadležnost, prelaz 5 |
| `start_dispatch(…)` | `sendReport`, `/admin` | `service_role` | dopis + pokušaj slanja |
| `complete_dispatch(p_dispatch_id, …)` | `sendReport`, `/admin` | `service_role` | ishod slanja, prelazi 3, 4, 6, 13 |
| `count_previous_reports(p_report_id)` | sastavljanje dopisa | `service_role` | red „Ranije prijave…" (FR-11) |
| `next_report_code()` | `begin_submission`, demo seed | `service_role` | `FX-{godina}-{broj}` (FR-24) |
| `clear_demo_data()` | `pnpm db:clear-demo` | `service_role` | FR-25 |

`add_report_photo`, `remove_report_photo`, `delete_draft` i `support_existing_report` vraćaju putanje fotografija koje treba obrisati iz Storage-a. Zato ih zove Server Action sa sesijom korisnika (provjera prava je u funkciji), a ista akcija zatim briše fajlove admin klijentom. Ako ih klijent pozove direktno, najgore što ostane je fajl bez reda u bazi.

### 8.3 Funkcije

**`resolve_municipality(p_lat double precision, p_lng double precision) returns uuid`**, `stable`. `id` iz `municipalities` čija granica pokriva tačku (`ST_Covers(boundary, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326))`), inače `null`. U P0 postoji samo Podgorica, pa `null` = „van Podgorice". Nema pufera ni „najbliže opštine": 18 Q4 (samo Podgorica) zamjenjuje ideju od 500 m.

**`resolve_jurisdiction(p_category report_category, p_municipality_id uuid) returns table (outcome jurisdiction_outcome, rule_id uuid, institution_id uuid, cc_institution_id uuid)`**, `stable`. Jedan nivo, bez rangiranja i bez AI-ja (tiket 14 Q2):

```sql
select
  case when r.id is null                         then 'no_rule'
       when i.email is null or not i.is_active    then 'no_email'
       else 'matched' end::public.jurisdiction_outcome,
  r.id,
  case when i.email is not null and i.is_active then r.institution_id end,
  case when i.email is not null and i.is_active
        and cc.email is not null and cc.is_active then r.cc_institution_id end
from (select 1) as one
left join public.jurisdiction_rules r
       on r.category = p_category and r.municipality_id = p_municipality_id
left join public.institutions i  on i.id  = r.institution_id
left join public.institutions cc on cc.id = r.cc_institution_id;
```

Kopija bez provjerenog mejla se izostavlja i nije razlog za `routing` (14 Q8).

**`get_jurisdiction_source(p_rule_id uuid)`**, `stable`, `anon` i `authenticated`. Vraća samo javna polja: naziv primaoca i kopije, `source_type`, `source_title`, `source_url`, `source_excerpt`, `verified_at`. Nikad `notes` ni `verified_by` (mogu sadržati ime osobe iz institucije). Za prijavu sa `jurisdiction_rule_id is null` UI ne zove funkciju, nego prikazuje „Nadležnog je ručno odredio administrator Fixita." (14 Q7).

**`find_nearby_open_reports(p_category, p_lat, p_lng, p_exclude_report_id uuid default null) returns table (id, code, status, like_count, submitted_at, distance_m, is_own)`**, `stable`. Samo za stalnog korisnika (`current_user_role() = 'citizen'`). Vraća do 3 otvorene, nesakrivene prijave iste vrste u krugu od **50 m** (konstanta u funkciji; ista vrijednost je u `lib/constants.ts`), sortirane po udaljenosti (`ST_DWithin(location, tačka, 50)`, `ST_Distance`). `is_own = private.is_reporter(id)`, za poruku „Ovaj problem ste već prijavili." (FR-9). Ne vraća ništa što nije već javno.

**`like_report(p_report_id uuid) returns table (liked boolean, already_liked boolean, like_count integer)`**. Uslovi, redom:
1. `auth.uid()` postoji (anonimna sesija ili nalog), inače `not_authenticated`.
2. Ako sesija nije anonimna: `current_user_role() = 'citizen'`; službenik, administrator i nalog bez profila dobijaju `not_allowed`.
3. Prijava postoji, `private.is_open(status, hidden_at)`, inače `report_not_open` (zatvorena, sakrivena ili nacrt).
4. Pozivalac nije prijavilac (`private.is_reporter`), inače `own_report`.
5. `insert into report_likes (report_id, user_id) values (p_report_id, auth.uid()) on conflict do nothing`. Ako red već postoji, vraća `already_liked = true` bez greške. Novi `like_count` postavlja trigger.

Jedna podrška po prijavi važi po sesiji (PK); brisanje kolačića i nova anonimna sesija je prihvaćen rizik (PRD §6).

**`support_existing_report(p_draft_id uuid, p_report_id uuid) returns table (like_count integer, removed_paths text[])`**. U jednoj transakciji: provjere iz `delete_draft` za nacrt i iz `like_report` za postojeću prijavu (uključujući `own_report`), podrška, brisanje nacrta. Ako bilo šta padne, ništa se ne mijenja (tiket 15).

**`add_report_photo(p_report_id uuid, p_storage_path text) returns uuid`**: pozivalac je prijavilac, status `draft`, putanja odgovara obrascu iz sekcije 10; `position` = najmanji slobodan od 1 do 3; `sent_to_model = false`. Trigger baca `photo_limit` za četvrtu. Postojanje fajla se ne provjerava ovdje (otprema može još trajati), nego u `begin_submission`.

**`remove_report_photo(p_photo_id uuid) returns text`**: pozivalac je prijavilac, status `draft`, prijava ima više od jedne fotografije (inače `photos_required`). Briše red i vraća putanju.

**`delete_draft(p_report_id uuid) returns text[]`**: pozivalac je prijavilac, status `draft`. Briše prijavu (kaskadno `report_details`, `report_private`, `report_photos`, eventualni neposlat `letters` i neuspjeli `dispatches`), vraća putanje fotografija. `agent_runs` ostaje (`report_id = null`), pa se napušten nacrt i dalje broji u dnevno ograničenje (tiket 10 Q11).

**`acknowledge_report(p_report_id uuid) returns report_status`**: ako je pozivalac službenik institucije `reports.institution_id` i status je `sent`, prelazi u `acknowledged` i upisuje događaj (`kind = 'acknowledged'`, `actor = 'institution'`). U svim drugim slučajevima (administrator, druga institucija, drugi status) ne radi ništa i vraća trenutni status.

**`set_report_status(p_report_id uuid, p_to report_status, p_message text default null) returns report_status`**. Pokriva prelaze 8–12 i 14 iz tabele 8.4; za sve ostalo baca `transition_not_allowed`. Uloga: službenik institucije `reports.institution_id` ili administrator. Upisuje događaj sa `actor = 'institution'` (službenik; `institution_id` = njegova institucija) ili `'fixit'` (administrator, i kad mijenja status u ime institucije koja je odgovorila mejlom). `kind`: `not_competent` za prelaz u `not_competent`, `reopened` za ponovno otvaranje, inače `status_changed`. Službenik i administrator mogu mijenjati i sakrivenu prijavu.

**`set_report_hidden(p_report_id, p_hidden boolean, p_reason text)`** i **`set_photo_hidden(p_photo_id, p_hidden boolean, p_reason text)`**: samo administrator. Postavljaju ili brišu `hidden_at` i upisuju red u `moderation_log`. Status prijave se ne mijenja (GLOSSARY: sakrivanje nije status). Ekran za moderaciju na `/admin` je **P1** (tiket 19 Q2), ali funkcije ostaju u migraciji 6. Do tada, u hitnom slučaju, Ivana postavlja `hidden_at` u Supabase Table Editoru (tada bez reda u `moderation_log`).

**`create_draft(p_user_id uuid, p_photo_paths text[]) returns table (report_id uuid, agent_run_id uuid)`**. Serverska; prelaz 1.
1. `auth.users.is_anonymous = false` i `profiles.role = 'citizen'` za `p_user_id`, inače `not_allowed`.
2. 1–3 putanje, svaka po obrascu iz sekcije 10, inače `photos_required` / `photo_limit`.
3. Dnevno ograničenje (tiket 10 Q11, PRD §6), pod zaključavanjem po korisniku, da dva istovremena zahtjeva ne prođu oba:

   ```sql
   perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
   if (select count(*) from public.agent_runs
       where user_id = p_user_id and step = 'classify'
         and started_at >= (date_trunc('day', now() at time zone 'Europe/Podgorica')
                            at time zone 'Europe/Podgorica')) >= 10
   then raise exception 'daily_limit_reached'; end if;
   ```

   Broji pokrenute analize, ne redove `reports`, jer se napušteni nacrti brišu. Broj 10 je i u `lib/constants.ts` (tekst poruke); baza je ta koja ga sprovodi.
4. Upisuje `reports` (`status = 'draft'`, `is_demo` = `profiles.is_demo` korisnika), `report_private` (`reporter_id`), `report_details` (`analysis_status = 'pending'`), `report_photos` (`position` 1..n, `sent_to_model = true`) i `agent_runs` (`step = 'classify'`, `outcome = null`).

**`record_classification(p_report_id uuid, p_agent_run_id uuid, p_analysis_status analysis_status, p_result jsonb, p_usage jsonb)`**. Serverska. Samo dok je prijava `draft`. Iz `p_result` (već provjeren zod-om i očišćen od URL-ova, mejl adresa i brojeva telefona, Tech.md §7) upisuje `description` u `reports.description`, a u `report_details`: `is_municipal_problem`, `ai_category`, `ai_confidence`, `title`, `severity`, `immediate_danger`, `image_contains_instructions`; u `report_photos.has_personal_data` za pozicije iz `personal_data_photos`; završava red `agent_runs` (`finished_at`, `duration_ms`, `outcome`, `model`, `stop_reason`, tokeni, `error_code`). Za ručni tok (`failed`, `timed_out`) upisuje samo status i `agent_runs`. Zakašnjeli rezultat se upisuje u log, ali ne mijenja `reports.category` (to radi samo `update_draft`).

**`update_draft(p_report_id, p_user_id, p_lat, p_lng, p_address, p_address_source, p_category)`**. Serverska; pozivalac je prijavilac, status `draft`. Postavlja `lat`/`lng` (trigger određuje opštinu ili baca `outside_area`), adresu i trenutnu vrstu. Ruta `prepare` je zove pri potvrdi pina i pri svakoj promjeni vrste.

**`begin_submission(p_report_id, p_user_id, p_category, p_description, p_share_contact) returns table (code text, outcome jurisdiction_outcome, rule_id uuid, institution_id uuid, cc_institution_id uuid)`**. Serverska; prvi korak „Pošalji prijavu":
1. Zaključava prijavu; pozivalac je prijavilac; status `draft`; lokacija i opština postoje (inače `invalid_state`).
2. 1–3 fotografije, i za svaku postoji objekat u Storage-u koji je otpremio baš prijavilac (inače `photo_missing`, a UI čeka otpremu):

   ```sql
   exists (select 1 from storage.objects o
           where o.bucket_id = 'report-photos' and o.name = ph.storage_path
             and o.owner_id = v_reporter_id::text)
   ```

3. Upisuje konačnu vrstu, `reports.description` (tekst koji je građanin ostavio na pregledu; `btrim`, prazan = `null`), `report_details.category_source` i `report_private.share_contact`.
4. `code = coalesce(code, next_report_code())`: kod se dodjeljuje pri prvom pritisku i ostaje i kad slanje ne uspije (FR-24).
5. `resolve_jurisdiction(category, municipality_id)`. Ako je ishod `no_rule` ili `no_email`: status `routing`, `routing_reason`, `submitted_at = now()`, događaj `routed` (`actor = 'reporter'`); mejl se ne šalje (prelaz 5). Ako je `matched`: status ostaje `draft`, a server nastavlja sa `start_dispatch`.

**`start_dispatch(p_report_id uuid, p_kind letter_kind, p_institution_id uuid, p_cc_institution_id uuid, p_rule_id uuid, p_subject text, p_body_text text, p_includes_contact boolean, p_actor_id uuid) returns table (letter_id uuid, dispatch_id uuid, to_email text, cc_email text)`**. Serverska. Zaključava prijavu i provjerava po vrsti dopisa:
- `initial`: status `draft`, `code is not null`, `p_actor_id` je prijavilac, `p_institution_id`/`p_rule_id` su baš ono što `resolve_jurisdiction` sada vraća (server ne može podmetnuti drugu instituciju);
- `assignment` (ručno raspoređivanje): status `routing`, `p_actor_id` je administrator, `p_rule_id is null`;
- `redirect` (preusmjeravanje, P1): status `not_competent`, `sent`, `acknowledged` ili `in_progress`, `p_actor_id` je administrator, `p_institution_id <> reports.institution_id` (inače `same_institution`), `p_rule_id is null`.

Za sve: primalac ima provjeren mejl (inače `no_verified_email`). Pokušaj `pending` stariji od 2 minuta za istu prijavu se prvo označava kao `failed` (`error_code = 'stale'`), da pad funkcije usred slanja ne zaključa prijavu zauvijek. Zatim upisuje ili ažurira neposlat `letters` red za `(report_id, institution_id)` (sa snimkom adresa iz `institutions`) i dodaje `dispatches` red `pending`. Drugi istovremeni pokušaj pada na jedinstvenom indeksu → `dispatch_in_progress`. Server tek tada šalje kroz `lib/email/send.ts` (jedino mjesto slanja; `EMAIL_MODE=test` preusmjerava i primaoca i kopiju na `TEST_INBOX`).

**`complete_dispatch(p_dispatch_id uuid, p_succeeded boolean, p_email_mode text, p_delivered_to text[], p_provider_message_id text, p_error_code text) returns report_status`**. Serverska. Završava pokušaj. Ako slanje nije uspjelo: `failed`, prijava se ne mijenja (prelaz 4: nacrt zadržava kod, `submitted_at` ostaje `null`). Ako je uspjelo: `succeeded`, `letters.sent_at = now()`, i u istoj transakciji, prema `letters.kind`:
- `initial`: `draft → sent`, `submitted_at = now()`, `institution_id`, `cc_institution_id`, `jurisdiction_rule_id` iz dopisa; događaj `submitted` (`actor = 'reporter'`) (prelaz 3);
- `assignment`: `routing → sent`, institucija iz dopisa, `jurisdiction_rule_id = null`; događaj `assigned` (`actor = 'fixit'`) (prelaz 6);
- `redirect`: `→ sent`, nova institucija, `jurisdiction_rule_id = null`; događaj `redirected` sa `previous_institution_id` (prelaz 13). Prethodna institucija od tada ne vidi prijavu (RLS ide po `reports.institution_id`).

Ako se status prijave u međuvremenu promijenio (npr. administrator je odbio prijavu), pokušaj se bilježi kao uspješan, prelaz se ne radi, a funkcija vraća trenutni status da bi ga `/admin` prikazao.

**`count_previous_reports(p_report_id uuid) returns integer`**. Serverska. Broj podnesenih, nesakrivenih prijava iste vrste u krugu od 50 m od lokacije te prijave, podnesenih prije nje, uključujući riješene i odbijene (tiket 10 Q10). Red u dopisu ide samo ako je broj > 0.

**`next_report_code() returns text`**. Serverska; godišnji brojač (sekvenca se ne resetuje sama):

```sql
insert into public.report_code_counters as c (year, last_value)
values (extract(year from now() at time zone 'Europe/Podgorica')::int, 1)
on conflict (year) do update set last_value = c.last_value + 1
returning c.year, c.last_value into v_year, v_n;
if v_n > 99999 then raise exception 'code_overflow'; end if;
return format('FX-%s-%s', v_year, lpad(v_n::text, 5, '0'));
```

Rupe u nizu su moguće i nisu greška (FR-24).

**`clear_demo_data() returns text[]`**. Serverska. Briše sve prijave sa `is_demo = true` (kaskadno sve uz njih) i redove `agent_runs` demo korisnika; vraća putanje njihovih fotografija za brisanje iz Storage-a. Brojač `report_code_counters` se **ne vraća unazad**: kod koji se vidio u videu nikad ne smije pokazivati na drugu prijavu.

### 8.4 Prelazi statusa i ko ih sprovodi

Numeracija iz tiketa 10 (i FR-18). Sve što nije u tabeli je zabranjeno.

| # | Iz → U | Ko | Funkcija | Provjera uloge u funkciji |
|---|---|---|---|---|
| 1 | — → `draft` | građanin | `create_draft` | stalni nalog, `citizen`, dnevno ograničenje |
| 2 | `draft` → obrisan | prijavilac | `delete_draft`, `support_existing_report` | `is_reporter` |
| 3 | `draft` → `sent` | sistem, na „Pošalji prijavu" | `begin_submission` → `start_dispatch(initial)` → `complete_dispatch` | prijavilac; primalac iz `resolve_jurisdiction` |
| 4 | `draft` → `draft` | sistem, slanje nije uspjelo | `complete_dispatch` | — |
| 5 | `draft` → `routing` | sistem, na „Pošalji prijavu" | `begin_submission` | prijavilac; `no_rule`/`no_email` |
| 6 | `routing` → `sent` | administrator (P0) | `start_dispatch(assignment)` → `complete_dispatch` | `admin` |
| 7 | `sent` → `acknowledged` | sistem, službenik otvori prijavu | `acknowledge_report` | službenik primaoca |
| 8 | `sent`, `acknowledged` → `in_progress` | službenik, administrator | `set_report_status` | službenik primaoca ili `admin` |
| 9 | `sent`, `acknowledged`, `in_progress` → `resolved` | službenik, administrator | `set_report_status` | isto |
| 10 | `sent`, `acknowledged`, `in_progress` → `rejected` | službenik, administrator | `set_report_status`, poruka obavezna | isto |
| 11 | `routing`, `not_competent` → `rejected` | administrator | `set_report_status`, poruka obavezna | `admin` |
| 12 | `sent`, `acknowledged`, `in_progress` → `not_competent` | službenik (dugme P1), administrator | `set_report_status`, obrazloženje obavezno | službenik primaoca ili `admin` |
| 13 | `not_competent`, `sent`, `acknowledged`, `in_progress` → `sent` | administrator (P1) | `start_dispatch(redirect)` → `complete_dispatch` | `admin`, nova institucija ≠ trenutna |
| 14 | `resolved`, `rejected` → `in_progress` | administrator | `set_report_status`, poruka obavezna | `admin` |

Službenik nikad ne vraća status unazad i ne otvara zatvorenu prijavu. Građanin poslije podnošenja ne mijenja ništa.

### 8.5 Tok jedne prijave kroz funkcije

1. Ruta `classify`: `getClaims()` → `create_draft` → poziv modela → `record_classification`.
1a. Klijent na „Potvrdi lokaciju": `supabase.rpc('resolve_municipality', { p_lat, p_lng })` sa sesijom građanina; `null` = poruka iz FR-4 i građanin ostaje na mapi, a `prepare` se ne zove (tiket 19 Q6). Provjera u `prepare` i trigger ostaju kao druga i treća brava.
2. Ruta `prepare`: `resolve_municipality` (van Podgorice: `outside_area`) → `update_draft` → `resolve_jurisdiction` → `find_nearby_open_reports` → dopis za pregled (ne čuva se). Promjena vrste na pregledu ponavlja `update_draft`, `resolve_jurisdiction` i `find_nearby_open_reports`.
3. `sendReport`: `begin_submission` → (`routing`: kraj) → `count_previous_reports` + šablon dopisa → `start_dispatch` → `lib/email/send.ts` → `complete_dispatch`. Ako slanje ne uspije, „Pokušaj ponovo" ponavlja cijeli niz; kod ostaje isti.
4. `/admin`, „Pošalji dopis": `start_dispatch(assignment)` → `lib/email/send.ts` → `complete_dispatch`.

## 9. RLS politike

RLS je uključen na svakoj tabeli. **Nijedna tabela nema `INSERT`, `UPDATE` ni `DELETE` politiku za `anon` ili `authenticated`**: svaki upis ide kroz funkcije iz sekcije 8 (`security definer`) ili kroz servisni ključ. Jedini klijentski upis u cijeloj bazi je otprema fotografije u Storage (sekcija 10). Zato anonimna sesija ne može ništa upisati osim kroz `like_report`, a zahtjev iz AGENTS.md (test 4: anonimni klijent i anonimna sesija ne mogu upisati u `reports` ni pročitati `report_private`) slijedi iz nepostojanja politika. Druga brava (migracija 4): `anon` i `authenticated` imaju na tabelama u `public` samo `SELECT`; `insert`, `update`, `delete` i `truncate` su im oduzeti, nezavisno od toga da li projekat nove tabele sam izlaže API ulogama.

Politike čitanja (`SELECT`); više politika na istoj tabeli se sabira (OR). Helperi su iz sekcije 7.

| Tabela | Politika | Za | `using` |
|---|---|---|---|
| `municipalities` | javno čitanje | `anon`, `authenticated` | `true` |
| `institutions` | javno čitanje | `anon`, `authenticated` | `true` |
| `jurisdiction_rules` | administrator | `authenticated` | `(select private.is_admin())` |
| `profiles` | svoj profil | `authenticated` | `id = (select auth.uid())` |
| `profiles` | administrator | `authenticated` | `(select private.is_admin())` |
| `reports` | javne prijave | `anon`, `authenticated` | `status <> 'draft' and hidden_at is null` |
| `reports` | prijavilac | `authenticated` | `private.is_reporter(id)` |
| `reports` | službenik primaoca | `authenticated` | `institution_id = (select private.current_institution_id())` |
| `reports` | administrator | `authenticated` | `(select private.is_admin())` |
| `report_details` | prijavilac, službenik primaoca, administrator | `authenticated` | isti uslovi kao tri posljednja reda za `reports` (preko `report_id`) |
| `report_private` | prijavilac | `authenticated` | `reporter_id = (select auth.uid())` i sesija nije anonimna |
| `report_private` | administrator | `authenticated` | `(select private.is_admin())` |
| `report_photos` | javne fotografije | `anon`, `authenticated` | `hidden_at is null` i prijava je javna |
| `report_photos` | prijavilac, službenik primaoca, administrator | `authenticated` | kao za `reports` (vide i sakrivene) |
| `report_events` | javna vremenska linija | `anon`, `authenticated` | prijava je javna |
| `report_events` | prijavilac, službenik primaoca, administrator | `authenticated` | kao za `reports` |
| `report_likes` | svoje podrške | `authenticated` | `user_id = (select auth.uid())` (važi i za anonimnu sesiju) |
| `letters` | službenik | `authenticated` | `institution_id = (select private.current_institution_id())` **i** prijava je trenutno upućena toj instituciji |
| `letters` | prijavilac, administrator | `authenticated` | `private.is_reporter(report_id)` ili `is_admin()` |
| `dispatches` | administrator | `authenticated` | `(select private.is_admin())` |
| `agent_runs` | administrator | `authenticated` | `(select private.is_admin())` |
| `moderation_log` | administrator | `authenticated` | `(select private.is_admin())` |
| `report_code_counters` | — | — | nema politike |

Napomene:
- **Anonimna sesija** ima ulogu `authenticated`, ali `current_user_role()`, `current_institution_id()`, `is_admin()` i `is_reporter()` za nju vraćaju `null`/`false`, pa vidi tačno ono što vidi gost, plus svoje redove u `report_likes`. Politike ne treba dodatno uslovljavati sa `is_anonymous`, jer nijedna dozvola ne zavisi samo od uloge `authenticated`.
- **Službenik** vidi samo prijave čiji je trenutni primalac njegova institucija (FR-20), uključujući sakrivene; poslije preusmjeravanja stara institucija gubi pristup. Prijavu u kojoj je njegova institucija samo kopija ne vidi (14 Q8).
- **Javna stranica i mapa** čitaju `reports` i `report_photos` serverskim klijentom sa kolačićima (gost = `anon`), pa RLS sam izbacuje nacrte i sakriveno. Admin klijent zatim samo potpisuje putanje koje je taj upit vratio (sekcija 10).
- **Nalog bez profila** (ne bi trebalo da postoji, sekcija 6) vidi isto što i gost.
- **`institutions` je javno čitljiva**, iako je tiket 14 predložio da je čita samo administrator: naziv institucije treba javnoj stranici i mapi, a tabela ima samo javne institucionalne podatke (zvaničan naziv, javna adresa i njen izvor). Ono zbog čega je 14 tražio zatvaranje (`notes` i `verified_by` mogu sadržati ime osobe) je u `jurisdiction_rules`, koja ostaje samo za administratora; javnost dobija `get_jurisdiction_source`.
- Prijava `routing` je javna i može se podržati (FR-8), ali je ne vidi nijedan službenik dok je administrator ne rasporedi.
- **Opis je javan** (tiket 19 Q4): `reports.description` se čita javnom politikom za `reports`, zajedno sa ostatkom reda, od trenutka podnošenja. Ozbiljnost, naslov, pouzdanost i ostala AI polja ostaju u `report_details`. Kolona koja nije javna nikad ne ide u `reports`, jer bi je javna politika i Realtime pokazali svima.

## 10. Storage

- **Bucket `report-photos`**, privatan (`public = false`), `allowed_mime_types = '{image/jpeg}'`, `file_size_limit = 5242880` (5 MB). Pravi se u migraciji (`insert into storage.buckets …`).
- **Putanja: `<uuid>.jpg` u korijenu bucket-a**, gdje je `uuid` iz `crypto.randomUUID()` na klijentu. Bez ID-a korisnika i bez ID-a prijave. Obrazac (CHECK na `report_photos.storage_path` i uslov u politici):

  ```sql
  name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
  ```

- **Zašto ne `{user_id}/{report_id}/…` (tiket 15).** Tiketi 11 i 15 su se razišli; odluka je za tiket 11 (i `Tech.md`), zbog privatnosti:
  - potpisani URL sadrži putanju, a javna stranica i mapa ih dijele svakome. Sa `{user_id}/` u putanji svako bi mogao povezati sve prijave istog prijavioca, iako mu ime ne vidi, što krši FR „identitet prijavioca nikad nije javan";
  - `{report_id}/` bi tražio da nacrt postoji prije otpreme, pa bi otprema i prepoznavanje išli jedno za drugim, protivno 15 Q2 (analiza počinje odmah, paralelno);
  - ono što je tiket 15 htio postići folderom (otprema samo za sebe, samo u nacrt) postiže se drugačije: politika otpreme dozvoljava samo stalnom građaninu; Storage sam upisuje `owner_id = auth.uid()`; `storage_path` je `unique`, pa ista putanja ne može ući u dvije prijave; `begin_submission` prije slanja provjerava da svaki fajl postoji i da mu je `owner_id` baš prijavilac. Tuđa putanja, viđena u nečijem potpisanom URL-u, tako ne može ući u dopis.
- **Politike na `storage.objects`:** za klijente samo jedna, za otpremu (druga je `SELECT` za ulogu `postgres`, vlasnika funkcija, da provjera fajlova u `begin_submission` ne zavisi od toga da li `postgres` zaobilazi RLS; klijenti nikad ne rade kao `postgres`):

  ```sql
  create policy "citizens upload report photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'report-photos'
    and (select private.current_user_role()) = 'citizen'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
  );
  ```

  `current_user_role()` je `null` za anonimnu sesiju, gosta, službenika i administratora. Nema `SELECT`, `UPDATE` ni `DELETE` politike: klijent ne čita fotografije iz bucket-a (sličicu na nacrtu prikazuje iz lokalnog bloba), ne prepisuje ih (otprema bez `upsert`) i ne briše ih.
- **Potpisani URL-ovi** (tiket 11 Q4): pravi ih samo server admin klijentom (`createSignedUrls`, trajanje 1 sat), i to **samo za putanje koje je isti zahtjev pročitao iz `report_photos` sa sesijom posjetioca**. Tako RLS iz sekcije 9 odlučuje ko šta vidi: gost i drugi građani nesakrivene fotografije javnih prijava, prijavilac svoje, službenik fotografije prijava svoje institucije (i sakrivene), administrator sve. Server nikad ne potpisuje putanju koju je dobio od klijenta.
- **Prilog dopisa:** `sendReport` i `/admin` čitaju fotografije admin klijentom (`download`) i prilažu ih kao `{kod}-{position}.jpg`.
- **Brisanje fajlova** radi samo server, Storage API-jem (`remove`), poslije funkcije koja vraća putanje (sekcija 8.2). Direktan `DELETE` iz `storage.objects` ne briše fajl i ne koristi se.
- **Fajlovi bez reda u bazi** (otpremljeni, a nacrt nikad nije nastao ili je napušten) ostaju u bucket-u. Za hakaton je to prihvaćeno; čišćenje je van P0 (sekcija 14).

## 11. Realtime

- U publikaciji `supabase_realtime` je **samo `reports`**:

  ```sql
  alter publication supabase_realtime add table public.reports;
  ```

- Klijent sluša Postgres Changes `UPDATE` na `reports`: na `/p/[code]` sa filterom `id=eq.<id>`, na mapi bez filtera (Tech.md §9). Brojač podrški (FR-17) stiže kao nova vrijednost `like_count`; promjena statusa stiže istim kanalom, ali je prikaz statusa uživo P1 (FR-18), pa je UI u P0 može zanemariti.
- Realtime provjerava RLS za svakog pretplatnika, pa gost dobija samo događaje za javne prijave. Nacrt postaje vidljiv tek kad pređe u `sent`/`routing` (tada mapa može dodati marker); prijava koja se sakrije prestaje da šalje događaje javnosti.
- `REPLICA IDENTITY` ostaje podrazumijevan (stari red nosi samo `id`).
- Postgres Changes šalje cijeli novi red, pa pretplatnik dobija i `description`. To je u redu jer je opis javan (tiket 19 Q4), a `reports` i dalje nema nijedan ID korisnika; zato u `reports` ne smije ući nijedna nejavna kolona.
- **Nisu u publikaciji:** `report_likes` (nosi `user_id`; uz to Postgres Changes ne primjenjuje RLS na `DELETE`), `report_private`, `report_events`, `letters` i sve ostale tabele.
- Ako broj pretplatnika ikad pređe limite Free plana, zamjena je Broadcast iz triggera na javni kanal `report:<id>` sa `{ id, like_count }`, koji klijent tretira samo kao signal za ponovno čitanje. U P0 se ne radi.

## 12. Seed i demo podaci

Podaci su u dvije grupe, sa različitim životnim vijekom:

| Grupa | Šta | Kako ulazi | Briše se |
|---|---|---|---|
| **Referentni podaci** | granica Podgorice, institucije, pravila nadležnosti | **migracije** (sekcija 13) | nikad; izmjena = nova migracija |
| **Demo podaci** | demo nalozi, ~10 demo prijava sa istorijom, 8 fotografija (tiket 21) | skripta `pnpm db:seed-demo` (servisni ključ) | `pnpm db:clear-demo` |

`supabase/seed.sql` se ne koristi: lokalne baze nema, a referentni podaci su dio šeme koji mora postojati u svakoj bazi i mijenjati se samo novom migracijom (PRD: „izmjene pravila u P0 idu samo kroz migraciju"). Demo podaci traže `auth.admin.createUser` i otpremu fotografija u Storage, što SQL ne može (tiket 16).

**Demo podaci postoje unaprijed i ne mijenjaju se do kraja ocjenjivanja** (tiket 22 Q1, Q4). `pnpm db:seed-demo` ima jedan način rada, bez dodatnih opcija, i smije se pokrenuti više puta: pravi demo naloge koji ne postoje (sekcija 12.3) i, ako `citizen-seed` još nema nijednu prijavu, demo prijave (sekcija 12.4). Prvo pokretanje je u utorak, odmah poslije migracije 10, pa se tim od prvog dana uloguje demo nalozima. Drugo pokretanje dolazi čim je dio skripte za prijave gotov; poslije njega se demo podaci ne brišu i ne prave ponovo ni prije probe, ni prije snimanja, ni prije ocjenjivanja. Na probi, u videu i na ocjenjivanju prikazuju se iste demo prijave.

### 12.1 Granica Podgorice

- Samo Glavni grad Podgorica: `ME-16`, OSM relacija `2319360` (nalaz 01). Bez granice države i bez ostalih 24 opštine (18 Q4, brief). Tuzi (`ME-24`) i Zeta (`ME-25`) su van granice, pa se tamo prijave odbijaju (FR-4).
- Postupak (jednom, Ivana): preuzeti pun poligon sa `https://polygons.openstreetmap.fr/get_geojson.py?id=2319360&params=0`, pa ga ubaciti u migraciju kao `ST_Multi(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON('<geojson>'), 4326)))`. Bez pojednostavljivanja: jedna opština je mala, a pojednostavljivanje pomjera granicu. U komentar migracije i u `boundary_source`/`boundary_snapshot_at` upisati izvor, ID relacije i datum snimka.
- Nazivi se upisuju ručno: `name = 'Podgorica'`, `official_name = 'Glavni grad Podgorica'`, ne iz OSM-a.
- Atribucija „© OpenStreetMap contributors" (ODbL) je već na mapi (Tech.md §8).
- Provjera poslije migracije: `resolve_municipality` za centar Podgorice vraća red, a za Golubovce (Zeta) i Tuzi vraća `null`.

### 12.2 Institucije i pravila

Iz tabela tiketa 14 („Tabela pravila za seed", „Institucije za seed"), bez ijedne dopune. Prije migracije Ivana ponovo provjerava svaku mejl adresu na zvaničnom izvoru (14 Q9) i upisuje datum u `email_verified_at` i `verified_at`; adresa koja se ne potvrdi ostaje `null` (pravilo onda vraća `no_email` → `routing`).

| `slug` | Institucija | `email` | Uloga |
|---|---|---|---|
| `pg-sekretarijat-saobracaj` | Sekretarijat za saobraćaj (Glavni grad Podgorica) | `saobracaj@podgorica.me` | primalac: `pothole`, `sidewalk`, `traffic_sign` |
| `pg-putevi` | „Putevi" d.o.o. Podgorica | `putevi@t-com.me` | kopija za ista tri pravila |
| `pg-komunalne-usluge` | „Komunalne usluge" d.o.o. Podgorica | `dispecer@komunalneusluge.me` | primalac: `street_light`, `traffic_light` |
| `pg-vik` | „Vodovod i kanalizacija" d.o.o. Podgorica | `info@vikpg.me` | primalac: `manhole`, `water_leak` |
| `pg-cistoca` | „Čistoća" d.o.o. Podgorica | `cistocapg@t-com.me` | primalac: `illegal_dump`, `waste_container` |
| `pg-zelenilo` | „Zelenilo" d.o.o. Podgorica | `zelenilo@t-com.me` | primalac: `greenery` |
| `pg-komunalna-policija` | Služba komunalne policije (Glavni grad Podgorica) | `pgkompolicija@t-com.me` | bez pravila; samo izbor administratora |
| `pg-uprava-inspekcijski-poslovi` | Uprava za inspekcijske poslove (Glavni grad Podgorica) | `uip@podgorica.me` | bez pravila; samo izbor administratora |

- `email_source_url` za svaku je iz tabele tiketa 14.
- **10 pravila** za Podgoricu (`pothole`, `sidewalk`, `traffic_sign`, `street_light`, `traffic_light`, `manhole`, `water_leak`, `illegal_dump`, `waste_container`, `greenery`), sa `source_type`, `source_url`, `source_title`, `source_excerpt` i `verified_at` iz tabele tiketa 14; `verified_by = 'nalaz 02'` dok ne prođe ponovna provjera, zatim ime osobe iz tima. Za rasvjetu i semafor upisati samo onaj URL sa kog je citat (14, „Za provjeru").
- **Nijedno pravilo** za `graffiti` i `other` (`other` to i ne može, CHECK). Provjera poslije migracije: `select count(*) from jurisdiction_rules` = 10, i `resolve_jurisdiction('graffiti', <Podgorica>)` vraća `no_rule`.
- Ne ulaze: Služba za građane, Uprava za saobraćaj, CEDIS, „Deponija" d.o.o. (tiket 14).
- **Kratki nazivi (`short_name`, migracija 11, tiket 54):** Sekretarijat za saobraćaj, Putevi, Komunalne usluge, Vodovod i kanalizacija, Čistoća, Zelenilo, Komunalna policija, Inspekcijski poslovi (redom kao u tabeli iznad). Prikazuju se u meniju naloga službenika; dopis i javne stranice i dalje koriste `name`.
- **Ponovna provjera (3. 11. 2026, migracija 10):** svih 8 adresa stoji nepromijenjeno na stranicama institucija na podgorica.me (`email_source_url`), a svi citati na izvorima pravila; PDF Programa „Puteva" 2026 je dostupan (citati na str. 2 i 10). Za rasvjetu i semafor citat je sa `https://www.komunalneusluge.me/`, pa je to jedini `source_url` tih pravila. Konačni nazivi institucija i tekstovi izvora su u migraciji 10.

### 12.3 Demo nalozi (`pnpm db:seed-demo`)

Skripta `scripts/seed-demo.ts` radi sa servisnim ključem iz `.env.local` i pravi naloge preko `auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { first_name, last_name } })` (tiket 16), pa im postavlja `role`, `institution_id` i `is_demo = true`.

| Nalog | Uloga | Svrha |
|---|---|---|
| `citizen-video` | `citizen` | snimanje videa; nema nijednu demo prijavu iz seed-a, pa može podržati sve. Prijava koju napravi u videu je `is_demo` i nosi oznaku „Demo prijava" (tiket 22 Q3): i ona ide samo na `TEST_INBOX`, ne instituciji. |
| `citizen-seed` | `citizen` | prijavilac svih demo prijava |
| `dev-1`, `dev-2`, `dev-3` | `citizen` | razvoj i ručne probe (svako ima svoje dnevno ograničenje od 10) |
| `official-saobracaj`, `official-komunalne-usluge`, `official-vik`, `official-cistoca`, `official-zelenilo` | `official` | panel za svaku instituciju koja je primalac nekog pravila (`official-zelenilo` nema demo prijavu i služi za probe) |
| `admin` | `admin` | `/admin` |

- Mejl adrese su izmišljene, `<nalog>@fixit.test` (npr. `dev-1@fixit.test`, `admin@fixit.test`) [Ivana, 4. 11.]: nisu povezane ni sa čijim mejlom. Domen `.test` je rezervisan (RFC 2606) i ne prima poštu, a Supabase ni ne šalje Auth mejlove, jer je `Confirm email` isključen. Šifra je iz env varijable `DEMO_PASSWORD` (samo `.env.local`, nikad u repou).
- Imena su izmišljena, ne imena članova tima ni stvarnih službenika.
- **Sve što tim napravi tokom razvoja mora nastati sa ovih naloga**: `create_draft` kopira `profiles.is_demo` u `reports.is_demo`, pa `db:clear-demo` poslije ocjenjivanja briše i probne prijave iz razvoja (tiket 12). Prijava napravljena sa običnog naloga ostaje javna.
- **Postojeći nalog se ne dira:** skripta za svaki nalog iz tabele prvo provjeri da li postoji (po mejlu); ako postoji, preskače ga, bez nove šifre i bez greške. Tako drugo pokretanje samo dodaje ono što nedostaje.
- **Registracija ostaje otvorena:** novi nalog građanina se pravi na `/uloguj-se` (FR-1) i radi kao i ranije, ali se u videu ne prikazuje (tiket 22 Q4). Takav nalog nije demo nalog, pa njegova prijava nema oznaku „Demo prijava" i `db:clear-demo` je ne briše.

### 12.4 Demo prijave

~10 prijava u Podgorici, sve `is_demo = true`, prijavilac `citizen-seed`, upisane direktno u konačnom stanju (servisni ključ, `INSERT`, pa trigger prelaza ne smeta). Za svaku skripta upisuje `reports` (sa unazad postavljenim `submitted_at`/`closed_at`), `report_private`, `report_details`, `report_photos` (+ fajl u Storage), `letters` i `dispatches` (`email_mode = 'test'`, `status = 'succeeded'`, bez stvarnog slanja; ne zove `lib/email/send.ts`) i `report_events` sa unazad postavljenim `created_at`. Kodovi idu iz `next_report_code()`, redom od najstarije prijave (FR-24). `letters.subject` i `letters.body_text` pravi isti šablon kao za prave prijave, `lib/email/letter-template.ts` (čista funkcija bez `server-only`, Tech.md §3; tiket 22 Q6), pa demo dopis izgleda kao pravi.

**Datumi se računaju od fiksnog dana snimanja** (tiket 22 Q2): „prije N dana" znači N kalendarskih dana prije petka **6. 11. 2026.** (`Europe/Podgorica`), konstanta u skripti, a ne prije trenutka pokretanja. Tako brojači u videu izgledaju tačno kao u tabeli, bez obzira kad je seed pokrenut. Vrijeme koje bi palo poslije trenutka pokretanja (red 6, „danas", kad se seed pokrene prije petka) skripta pomjera na nekoliko minuta prije pokretanja, uz isti redoslijed događaja, pa u bazi nema datuma iz budućnosti, a „Riješeno istog dana" ostaje tačno. Pokretanje od srijede 4. 11. ne mijenja nijedan drugi brojač iz tabele.

Prijedlog skupa (raspored statusa i brojača za video; „dana" = dana prije 6. 11. 2026.):

| # | Vrsta | Konačni status | Podneseno | Zatvoreno | Primalac | Podrške | Fotografija | Istorija (vremenska linija) |
|---|---|---|---|---|---|---|---|---|
| 1 | `pothole` | `in_progress` | prije 14 dana | — | Sekretarijat za saobraćaj (kopija Putevi) | 23 | `pothole-1.jpg` | poslata → primljena (13) → u radu (9) |
| 2 | `street_light` | `resolved` | prije 8 dana | prije 2 dana | Komunalne usluge | 7 | `street_light-1.jpg` | poslata → primljena → u radu → riješena („Riješeno za 6 dana") |
| 3 | `illegal_dump` | `sent` | prije 21 dan | — | Čistoća | 41 | `illegal_dump-1.jpg` | poslata („21 dan bez rješenja") |
| 4 | `manhole` | `acknowledged` | prije 3 dana | — | ViK | 5 | `manhole-1.jpg` | poslata → primljena |
| 5 | `pothole` | `sent` | prije 30 dana | — | Sekretarijat za saobraćaj (kopija Putevi) | 18 | `pothole-2.jpg` | poslata („30 dana bez rješenja") |
| 6 | `street_light` | `resolved` | danas | danas | Komunalne usluge | 9 | `street_light-2.jpg` | poslata → u radu → riješena („Riješeno istog dana") |
| 7 | `illegal_dump` | `resolved` | prije 5 dana | prije 4 dana | Čistoća | 3 | `illegal_dump-2.jpg` | poslata → riješena („Riješeno za 1 dan") |
| 8 | `manhole` | `in_progress` | prije 10 dana | — | ViK | 12 | `manhole-2.jpg` | poslata → primljena → u radu |
| 9 | `graffiti` | `routing` | prije 6 dana | — | — (`routing_reason = 'no_rule'`) | 2 | bez fotografije | „Prijava primljena. Nadležnu instituciju određuje tim Fixit." |
| 10 | `other` | `rejected` | prije 4 dana | prije 3 dana | — (iz `routing`) | 0 | bez fotografije | primljena → odbijena, `actor = 'fixit'` |

Skup je prilagođen tiketu 21 (8 fotografija, po 2 za 4 vrste): redovi 5–8 su ranije bili `sidewalk`, `traffic_light`, `waste_container` i `greenery`, a sada ponavljaju četiri vrste sa fotografijama, uz iste statuse i brojače dana. Tako svaka fotografija ima svoju prijavu, a mapa i dalje ima sve statuse osim `not_competent` i četiri institucije.

- **Podrške:** skripta upisuje `like_count` direktno, bez redova u `report_likes` (nema stotinu naloga ni anonimnih sesija). Zato za demo prijave važi `like_count ≥ broj redova u report_likes`; za sve ostale je jednako. Prava podrška na demo prijavi (npr. u videu) radi normalno i diže broj za 1.
- **Poruke institucija u istoriji** su kratke i neutralne („Prijava je proslijeđena ekipi na terenu.", „Svjetiljka je zamijenjena."), bez rokova, obećanja i imena, jer se pripisuju stvarnim institucijama (pravilo 7: bez izmišljenih činjenica i rokova). Isto važi za opis demo prijave, koji je javan (tiket 19 Q4).
- **Oznaka:** svaka prijava sa `is_demo = true` na `/p/[code]` i u oblačiću markera ima malu oznaku „Demo prijava" (shadcn `Badge`; tiket 19 Q5, FR-25). Vidi se i u videu. Oznaku nosi i prijava koju `citizen-video` napravi u videu, kao i svaka prijava sa demo naloga (tiket 22 Q3).
- **Lokacije:** stvarne tačke u Podgorici koje izabere tim, sa ispravnom adresom; dvije demo prijave iste vrste su međusobno udaljene više od 50 m, a **nijedna demo prijava vrste koja se snima uživo nije bliže od 50 m mjestu snimanja**, inače video dobija ekran duplikata. Pošto se prije snimanja ništa ne briše (tiket 22 Q4), isto važi za probne prijave: generalna proba se ne radi na mjestu snimanja za vrstu koja se snima.
- **Fotografije (tiket 21):** 8 stvarnih fotografija sa otvorenom licencom sa Wikimedia Commons, po 2 za `pothole`, `street_light`, `illegal_dump` i `manhole`. Nisu snimljene u Podgorici, što pokriva oznaka „Demo prijava". Svaka fotografija pripada tačno jednoj demo prijavi (kolona „Fotografija") i prikazuje baš njenu vrstu. Bez prepoznatljivih lica i čitljivih tablica (tiket 11), smanjene na 1600 px JPEG bez EXIF-a (i GPS-a iz njega); čuvaju se u repou (`scripts/demo-photos/pothole-1.jpg` …), a skripta ih otprema pod novim `<uuid>.jpg` putanjama (`position = 1`, `has_personal_data = false`).
- **Autori i licence:** `scripts/demo-photos/CREDITS.md` uz fotografije: za svaki fajl naslov i link Commons stranice, autor, licenca sa linkom, datum preuzimanja i izmjena („smanjeno na 1600 px, uklonjeni metapodaci"). Dozvoljeni su CC0, javno dobro, CC BY i CC BY-SA, sa prednošću za CC0 i javno dobro. Ako je ijedna fotografija CC BY ili CC BY-SA (jeste: `street_light-2.jpg`, CC BY 4.0, autor „ŠJů, Wikimedia Commons", izmijenjena), ista lista stoji i u odjeljku „Demo fotografije" na `/privatnost`, jer licenca traži da atribucija bude dostupna i onome ko fotografiju vidi u aplikaciji, ne samo u repou (tiket 21).
- **Demo prijave bez fotografije:** redovi 9 i 10 (`graffiti`, `other`) nemaju fotografiju (tiket 21). Fotografija druge vrste bila bi netačan prikaz, a ista fotografija u dvije prijave izgledala bi kao duplikat. To je jedini izuzetak od „1–3 fotografije" (FR-5) i važi samo za demo prijave, koje skripta upisuje direktno; za prave prijave `begin_submission` i dalje traži fotografiju. U listi, u oblačiću markera i na `/p/[code]` umjesto fotografije stoji ista neutralna površina za svaku vrstu problema, sa običnom ikonom slike i tekstom „Bez fotografije" (`NoPhoto` u `components/report/report-summary.tsx`; UI.md „Report card"), ne precrtana slika.
- **Probne prijave tima bez ponovljenih fotografija (5. 11. 2026):** prijave sa `dev-*` naloga su takođe javne demo prijave, pa za njih važi isto pravilo kao za seed: fotografija prikazuje baš vrstu prijave i ne ponavlja nijednu drugu javnu prijavu. Zato nijedna proba ne koristi fotografiju iz `scripts/demo-photos/`. Obrisane su četiri probne prijave koje to nisu ispunjavale: FX-2026-00011 (udarna rupa, `pothole-1` i `pothole-2`), FX-2026-00012 (rasvjeta, `street_light-1`), FX-2026-00013 (grafiti sa fotografijom divlje deponije `illegal_dump-1`) i FX-2026-00015 (ista fotografija kao FX-2026-00014). FX-2026-00014 ostaje, jer jedina ima svoju fotografiju. Brisanje je išlo kao u `clear_demo_data()` (kaskadno, pa fajlovi iz Storage-a), samo za te četiri prijave; seed prijave nisu dirane [Danijela].
- **Bez udvostručavanja:** skripta pravi demo prijave samo ako `citizen-seed` nema nijednu prijavu. Ako ih ima, preskače dio za prijave uz poruku da demo prijave već postoje, a naloge i dalje dopunjava. Probne prijave tima sa `dev-*` i `citizen-video` naloga (takođe `is_demo`) ne sprečavaju seed.
- **Izvedba (tiket 16):** plan je u `scripts/demo-plan.ts` (čiste funkcije, Vitest), upis u `scripts/seed-demo-reports.ts`.
  - Lokacije (Nominatim, oblik adrese iz `lib/geo/address.ts`): 1 Bulevar Džordža Vašingtona · 2 Ivana Vujoševića · 3 Braće Ribar · 4 Meše Selimovića · 5 Bracana Bracanovića · 6 Vasa Raičkovića · 7 Filipa Lainovića · 8 Kraljevačka · 9 Brijeg Ćukovića · 10 Vijenci Danila Kiša (sve Podgorica; koordinate u planu). Mjesto snimanja (tiket 17) mora biti dalje od 50 m od demo prijave iste vrste.
  - Prije prvog upisa skripta provjerava sve: brojače u petak prema tabeli, tačku u Podgorici (`resolve_municipality`), primaoca i kopiju iz `resolve_jurisdiction` (plan samo navodi očekivanu instituciju; ako se pravilo promijenilo, skripta staje), fotografije i šablon dopisa.
  - Ako upis padne na pola, skripta briše samo prijave i fajlove koje je to pokretanje napravilo, da ponovno pokretanje krene ispočetka; potrošeni kodovi ostaju rupe (FR-24).
  - Redovi 9 i 10 izgledaju kao ručni tok: `analysis_status = 'failed'`, `category_source = 'citizen'`, bez naslova i ozbiljnosti. Šahtovi (4, 8) imaju `immediate_danger = true`, pa dopis ima red o neposrednoj opasnosti.
  - `dispatches.delivered_to` je `null`: demo dopis nikome nije poslat, pa ni `TEST_INBOX` nije upisan. Potpis demo dopisa je produkcioni URL `https://fixit-b73a.vercel.app` (FR-11), ne `NEXT_PUBLIC_SITE_URL` iz `.env.local`, koji je lokalno `localhost`.

### 12.5 Brisanje demo podataka (`pnpm db:clear-demo`, FR-25)

`scripts/clear-demo.ts`, servisni ključ. **Kada:** tek poslije ocjenjivanja, ne prije predaje, da žiri koji otvori link vidi mapu sa demo prijavama (tiket 19 Q5). Ne pokreće se ni prije generalne probe ni prije snimanja (tiket 22 Q4). Skripta prvo pokaže broj demo prijava i briše tek kad se upiše „obriši" (zaštita od slučajnog pokretanja; tiket 16).
1. `select clear_demo_data()` → briše sve `is_demo` prijave (kaskadno sve uz njih) i `agent_runs` demo naloga, vraća putanje fotografija;
2. `storage.from('report-photos').remove(paths)` u grupama;
3. samo uz `--accounts` (opcija komande `db:clear-demo`, ne `db:seed-demo`): briše i demo naloge (`auth.admin.deleteUser` za svaki `profiles.is_demo`). Bez toga nalozi ostaju za novo `db:seed-demo`.

Podrške demo naloga na pravim prijavama ostaju (namjerno bez FK, sekcija 4.3). Brojač kodova se ne vraća (sekcija 8.3).

## 13. Redoslijed migracija

Supabase CLI je fiksiran na **3.0.0** i nema lokalne baze (AGENTS.md, Tech.md §11). Migracije piše i primjenjuje **samo Ivana**, svaku ovako:

```
pnpm supabase migration new <naziv>
pnpm supabase db push --remote
pnpm db:types        # supabase gen types typescript --remote --schema public > lib/supabase/database.types.ts
```

pa PR samo sa migracijom i tipovima, merge odmah. Ne koristiti `db push` bez `--remote` (u v3 gađa lokalnu bazu), `--project-ref`, `--project-id`, `--linked`, `supabase start` ni `supabase db reset`. `db push` primjenjuje svaku migraciju u transakciji: ako padne, ništa iz nje nije primijenjeno i fajl se smije ispraviti; migracija koja je jednom primijenjena se više ne mijenja (AGENTS.md pravilo 5).

| # | Naziv | Sadržaj |
|---|---|---|
| 1 | `extensions_and_schemas` | `postgis` u `extensions`; šema `private` i `grant usage` |
| 2 | `enums` | svi enumi iz sekcije 3 |
| 3 | `reference_tables` | `municipalities`, `institutions`, `jurisdiction_rules`, `profiles` + indeksi + `enable row level security` (još bez politika) |
| 4 | `report_tables` | `reports`, `report_details`, `report_private`, `report_photos`, `report_events`, `report_likes`, `report_code_counters`, `letters`, `dispatches`, `agent_runs`, `moderation_log` + CHECK + indeksi + `enable row level security` (još bez politika) |
| 5 | `helpers_policies_triggers` | funkcije iz sekcije 7, sve RLS politike iz sekcije 9 i triggeri iz sekcije 6 (uključujući trigger na `auth.users`) |
| 6 | `rpc` | funkcije iz sekcije 8 sa `revoke`/`grant` za svaku |
| 7 | `storage` | bucket `report-photos` i politika otpreme |
| 8 | `realtime` | `reports` u `supabase_realtime` |
| 9 | `seed_podgorica_boundary` | jedan red u `municipalities` (sekcija 12.1) |
| 10 | `seed_institutions_and_rules` | 8 institucija i 10 pravila (sekcija 12.2) |
| 11 | `institution_short_name` | kolona `institutions.short_name` i kratki nazivi za 8 institucija (sekcija 12.2; tiket 54) |

- Politike koriste helpere iz sekcije 7, a helperi čitaju tabele; zato se tabele u koracima 3 i 4 prave sa uključenim RLS-om bez politika (= sve zatvoreno), a politike se dodaju u koraku 5, odmah poslije helpera. Između koraka baza je zatvorena, nikad otvorena.
- Podešavanja koja nisu u migracijama (Ivana, Supabase dashboard): Anonymous Sign-Ins uključen; limit anonimnih prijavljivanja ostaje 30/h po IP-u (PRD §6); `Confirm email` isključen (Tech.md, „Hosting i mejl", „Registracija"; tiket 16); region `eu-west-3` (Pariz) [Ivana].
- Poslije koraka 10: ručna provjera iz sekcija 12.1 i 12.2, pa `pnpm db:seed-demo`.
- RLS testovi iz AGENTS.md (test 4) idu na zajednički projekat i samo pokušavaju zabranjene operacije; šema ih podržava jer zabranjen upis pada prije nego što išta upiše.

## 14. Van P0

Nije u šemi, a vjerovatno dolazi kasnije (svaka stavka = nova migracija):
- obavještenja (FR-19, P1);
- administratorski CRUD institucija i pravila (P1): dodaje `INSERT`/`UPDATE` politike samo za administratora;
- čišćenje napuštenih nacrta i fajlova bez reda u bazi (npr. starijih od 24 h);
- čišćenje anonimnih korisnika starijih od 30 dana (podrške ostaju, jer `report_likes` nema FK);
- nacionalni nivo pravila (`jurisdiction_rules.municipality_id` postaje nullable) i ostale opštine;
- javna statistika po instituciji (P1): funkcija nad `report_events`, bez nove tabele;
- ko je od službenika promijenio status (sada vremenska linija čuva samo instituciju; ako zatreba revizija, privatna tabela kao `moderation_log`).

**Prihvaćeni rizici za hakaton** (tiket 18, tačke 6, 7 i 10; prihvaćeni u tiketu 19 Q7). Prije pilota se ponovo otvaraju:
- ako server padne poslije uspješnog slanja u Resendu, a prije `complete_dispatch`, ponovni pokušaj poslije 2 minuta šalje drugi mejl (novi `dispatches.id` = novi `Idempotency-Key`); u testnom režimu to je samo drugi mejl u `TEST_INBOX`;
- svaka ispravka mejla institucije ili pravila je nova migracija koju piše Ivana (CRUD je P1);
- svaki građanin sa nalogom može otpremiti fajl u Storage i bez nacrta, pa zlonamjeran nalog može napuniti 1 GB Free plana (čišćenje fajlova bez reda u bazi je stavka iznad).
