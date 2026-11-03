# Tiketi za izradu P0 (nacrt)

Svaka stavka ispod postaje jedan GitHub Issue: naslov iz `### N.`, tijelo je ostatak stavke, labele su prijedlog.
„Zavisi od" navodi brojeve stavki iz ove liste, ne brojeve GitHub Issues; pri pravljenju issue-a zamijeni ih stvarnim brojevima.
Jedan tiket = jedna grana = jedan PR (`AGENTS.md`, „Radni proces"). Izmjenu šeme, RPC-a, RLS-a ili storage-a opiši u tiketu i dodijeli je Ivani.
Izvori su pokazivači: pročitaj navedene sekcije prije rada; tekst ovdje ih ne zamjenjuje. Kad se tiket kosi sa dokumentom, stani i pitaj.
Nejasnoće iz ovog nacrta su razriješene u tiketu 22 (`issues/22-nejasnoce-za-izradu.md`) i upisane u dokumente i u stavke ispod; sažetak je u posljednjoj sekciji, „Razriješeno u tiketu 22".

## Pregled zavisnosti

| # | Naslov | Zavisi od | Vlasnik | Dan |
|---|---|---|---|---|
| 1 | Inicijalizacija repoa i naloga | — | Ivana | Uto |
| 2 | Migracije 1–8 i tipovi | 1 | Ivana | Uto |
| 3 | Migracije 9–10: granica Podgorice, institucije i pravila | 2 | Ivana | Uto |
| 4 | Zajednički temelj: Supabase klijenti, env, konstante, RLS testovi | 1, 2 | bilo ko | Uto |
| 5 | Demo nalozi (`pnpm db:seed-demo`, dio za naloge) | 2 | bilo ko | Uto |
| 6 | Registracija, ulogovanje i odjava (`/uloguj-se`, `/privatnost`) | 4 | bilo ko | Uto |
| 7 | Javna mapa `/` | 4 | bilo ko | Uto–Sri |
| 8 | Tok prijave: fotografije, otprema i lokacija | 3, 4, 6 | bilo ko | Uto |
| 9 | Agent `classify`: nacrt, prepoznavanje i ručni tok | 8 | bilo ko | Sri |
| 10 | Agent `prepare`: nadležnost, duplikati i dopis (SSE) | 3, 9 | bilo ko | Sri |
| 11 | Ekran „Pregled prijave" | 10 | bilo ko | Sri |
| 12 | Slanje prijave i guard za mejl | 10 (dugme iz 11) | bilo ko | Sri |
| 13 | Javna stranica prijave `/p/[code]` i podrška | 4 | bilo ko | Sri |
| 14 | Panel institucije | 4, 6 | bilo ko | Sri |
| 15 | `/admin`: ručno raspoređivanje | 6, 12 | bilo ko | Sri |
| 16 | Demo prijave i brisanje demo podataka | 3, 5, 10 | bilo ko | Sri–Čet |
| 17 | Generalna proba i spremnost aplikacije za video | 7, 12, 13, 14, 15, 16 | bilo ko (odobrava Ivana) | Čet–Pet |

**Kritični put:** 1 → 2 → 4 → 8 → 9 → 10 → 11/12 → 17. Stavka 3 mora biti u `main` prije nego što se provjeri 8 (provjera van Podgorice) i 10 (nadležnost). Stavke 13, 14 i 15 se grade paralelno, a provjeravaju na prijavi poslatoj kroz 12 (ili na demo prijavama iz 16).

## Plan po danima (PRD §9)

- **Uto 3. 11., temelji.** Ivana: 1, 2, 3 i prvo pokretanje 5 (demo nalozi postoje od prvog dana; tim se njima uloguje). Ostali, čim su 2 i tipovi u `main`: 4, pa 6, 7 i 8. Mjerenje modela (tiket 20 iz planiranja) ide kad stigne API ključ; ne blokira nijednu stavku.
- **Sri 4. 11., cijeli P0 tok.** 9 → 10 → 11 i 12 do mejla sa fotografijama u prilogu na `TEST_INBOX`; paralelno 13, 14 i 15. Do večeri proba registracije na produkcionom URL-u (stavka 6).
- **Čet 5. 11., demo podaci i dorada.** Demo prijave iz 16 već postoje (seed čim je 16 u `main`, najkasnije danas); poslije toga se demo podaci ne brišu i ne prave ponovo. Generalna proba iz 17. P1 tek kad cijeli P0 radi.
- **Pet 6. 11., zamrzavanje i video.** Bez novih funkcija; završne provjere iz 17 i snimanje.
- **Sub 7. 11.** Predaja. Demo podaci ostaju (`pnpm db:clear-demo` tek poslije ocjenjivanja, FR-25).

---

### 1. Inicijalizacija repoa i naloga

**Cilj:** Next.js projekat sa presetom i fiksiranim verzijama u repou, povezan sa Supabase projektom i Vercelom, tako da ostali mogu da počnu čim stignu migracije.

**Obim:**
- `pnpm dlx shadcn@latest init --preset b2xaqzSRuK --template next` u korijenu repoa; upisati bazu komponenti (`style` prefiks iz `components.json`) u `UI.md`, „Base after init".
- Tačne verzije iz `Tech.md` §2 (`--save-exact` ili `save-exact=true` u `.npmrc`), `engines` (`node 24.x`), `packageManager` (`pnpm@12.16.1`), `"strict": true`, skripte iz `Tech.md` §11.
- Next.js: `next@16.4.5` i `eslint-config-next@16.4.5` (bezbjednosna zakrpa od 3. 11., upisana u `Tech.md` §2).
- `supabase@3.0.0` kao dev zavisnost, `pnpm supabase init`, `login`, `link`.
- `vercel.json` (`"regions": ["fra1"]`), `.mcp.json` (`shadcn@4.23.0`, `UI.md`), `.env.example` sa svim varijablama iz `Tech.md` §10 i „Env varijable za hosting i mejl", bez vrijednosti; `vitest.config.mts` (`Tech.md` §12) sa `setupFiles` fajlom koji mockuje `server-only` za sve testove (`vi.mock('server-only', () => ({}))`, tiket 22 Q6).
- Van koda (dashboardi): Supabase projekat u `eu-central-1`, `Confirm email` isključen, Anonymous Sign-Ins uključen, URL Configuration; Resend nalog i ključ samo za slanje; Vercel projekat (Hobby) sa env varijablama za Production, Preview i Development, `EMAIL_MODE=test`, `NEXT_PUBLIC_SITE_URL` = produkcioni `vercel.app` URL; `.env.local` podijeljen timu.

**Izvori:** `Tech.md` §2, §3, §10, §11 („Inicijalizacija"), §12, „Hosting i mejl" (sve podsekcije); `UI.md` („shadcn/ui setup"); `DB.md` §13 (podešavanja van migracija); `AGENTS.md` („Radni proces"); PRD §9 (Uto), §10.

**Kriterijumi prihvatanja:**
- [ ] `package.json` nema nijedan `^` ni `~`; `pnpm-lock.yaml` je u repou; `.env.local` nije u git-u.
- [ ] `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint` i `pnpm test` se izvršavaju bez greške.
- [ ] `components.json` i `app/globals.css` su onakvi kakve ih je napravio `init`; `UI.md` ima upisanu bazu.
- [ ] `pnpm exec shadcn preset resolve` prepoznaje `b2xaqzSRuK`; `/mcp` u Claude Code-u vidi shadcn server.
- [ ] `package.json` ima tačno `next@16.4.5`.
- [ ] Produkcioni URL se otvara u privatnom prozoru bez Vercel prijave.
- [ ] Na Vercelu i u `.env.local` je `EMAIL_MODE=test`; `TEST_INBOX` i `EMAIL_REPLY_TO` postoje samo tamo, nigdje u repou, ni u ovom issue-u (`TEST_INBOX` je Ivanin lični mejl, PRD §10).
- [ ] Zapisano (komentar u ovom issue-u) da li Vercel Hobby pravi preview deploy za commit kolege (PRD §10). Ako ne pravi, tim je obaviješten da važi rezerva iz `AGENTS.md` („Tiketi, grane, PR"): provjera na `localhost`-u, a na telefonu poslije merge-a u `main` (tiket 22 Q8).
- [ ] Test koji uvozi modul sa `import 'server-only'` prolazi u `pnpm test`.

**Zavisi od:** —
**Vlasnik:** Ivana
**Labele:** `p0`, `infra`

---

### 2. Migracije 1–8 i tipovi

**Cilj:** cijela šema iz `DB.md` je na zajedničkom projektu i `lib/supabase/database.types.ts` je u `main`, pa ostali mogu da pišu upite i konstante nad generisanim tipovima.

**Obim:**
- Migracije 1–8 iz `DB.md` §13: `extensions_and_schemas`, `enums`, `reference_tables`, `report_tables`, `helpers_policies_triggers`, `rpc`, `storage`, `realtime`.
- Svaka po Ivaninom redoslijedu: `pnpm supabase migration new <naziv>` → `pnpm supabase db push --remote` → `pnpm db:types`.
- PR samo sa migracijama i tipovima; merge odmah.

**Izvori:** `DB.md` §1–§11, §13; `AGENTS.md` zlatna pravila 4 i 5, „Baza (Supabase)"; `Tech.md` §11 („Baza, Supabase CLI 3.0.0").

**Kriterijumi prihvatanja:**
- [ ] Svaka tabela u `public` ima uključen RLS; politike su tačno one iz `DB.md` §9 (nijedna `INSERT`/`UPDATE`/`DELETE` politika za `anon` ili `authenticated`).
- [ ] Svaka funkcija ima `revoke execute … from public, anon, authenticated` i `grant` samo ulogama iz `DB.md` §8.2.
- [ ] `report_status` ima svih osam vrijednosti; bucket `report-photos` je privatan, samo `image/jpeg`, 5 MB; u `supabase_realtime` je samo `reports`.
- [ ] Registracija sa `first_name`/`last_name` u metapodacima pravi red u `profiles` sa ulogom `citizen`; bez imena registracija pada (trigger 4, `DB.md` §6).
- [ ] `lib/supabase/database.types.ts` je regenerisan i `pnpm typecheck` prolazi.
- [ ] Nijedna komanda nije korišćena bez `--remote`, i nijedna sa `--linked`, `--project-ref`, `--project-id`.

**Zavisi od:** 1
**Vlasnik:** Ivana
**Labele:** `p0`, `baza`

---

### 3. Migracije 9–10: granica Podgorice, institucije i pravila

**Cilj:** baza zna gdje je Podgorica i ko je nadležan za koju vrstu, sa izvorom za svako pravilo.

**Obim:**
- Migracija 9 `seed_podgorica_boundary`: jedan red u `municipalities` iz OSM relacije `2319360`, bez pojednostavljivanja, sa izvorom i datumom snimka.
- Prije migracije 10: ponovna provjera svih 8 mejl adresa na zvaničnom izvoru; nepotvrđena adresa ostaje `null`.
- Migracija 10 `seed_institutions_and_rules`: 8 institucija i 10 pravila iz `DB.md` §12.2, bez dopuna.
- `pnpm db:types` poslije obje.

**Izvori:** `DB.md` §12.1, §12.2, §13; PRD §5.2 („Pravila nadležnosti"), §10 (ponovna provjera adresa); `AGENTS.md` zlatno pravilo 1.

**Kriterijumi prihvatanja:**
- [ ] `resolve_municipality` za centar Podgorice vraća red, a za Golubovce (Zeta) i Tuzi vraća `null`.
- [ ] `select count(*) from jurisdiction_rules` = 10; `resolve_jurisdiction('graffiti', <Podgorica>)` vraća `no_rule`.
- [ ] Svako pravilo ima `source_type`, `source_title`, `verified_at`; svaka adresa ima `email_source_url` i `email_verified_at` sa datumom ponovne provjere.
- [ ] Nijedna institucija se ne pojavljuje van migracije 10 (ni u kodu, ni u promptu).

**Zavisi od:** 2
**Vlasnik:** Ivana
**Labele:** `p0`, `baza`

---

### 4. Zajednički temelj: Supabase klijenti, env, konstante, RLS testovi

**Cilj:** svi kasniji tiketi koriste iste Supabase klijente, istu provjeru env varijabli i jedan `lib/constants.ts`, a obavezni RLS test čuva granicu između klijenta i baze.

**Obim:**
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts` (`import 'server-only'`), `proxy.ts` (`getClaims()`, matcher bez statičnih fajlova i `_next`).
- `lib/env.ts`: zod provjera serverskih varijabli, `server-only`.
- `lib/constants.ts`: vrste problema (slug, naziv, opis za prompt) i nazivi statusa (javni i u panelu) kao `Record<…>` nad generisanim enumima; `MAX_PHOTOS_PER_REPORT`, prag pouzdanosti 0.6, radijus 50 m, dnevno ograničenje 10, `MAP_TILES`; tekstovi za kodove grešaka iz `DB.md` §8.1; tekst brojača dana (FR-15) i oblik riječi za podrške (FR-16).
- `app/layout.tsx` osnovni okvir.
- Obavezni test 4 (RLS), na zajedničkom projektu.

**Izvori:** `Tech.md` §3 (konvencije), §4, §10; `DB.md` §3, §5, §8.1, §9; PRD FR-7 (prag), FR-15, FR-16, FR-18 (nazivi statusa), §6 (ograničenje); `GLOSSARY.md` („Statusi", „Podrška"); `AGENTS.md` „Obavezni testovi" 4.

**Kriterijumi prihvatanja:**
- [ ] Test 4: anonimni klijent i anonimna sesija (`is_anonymous = true`) ne mogu upisati u `reports`, pročitati `report_private` niti pozvati `create_draft`; test samo pokušava zabranjene operacije.
- [ ] Uklanjanje bilo koje vrijednosti iz `Record`-a za vrste ili statuse ruši `pnpm typecheck`.
- [ ] `lib/supabase/admin.ts` uvezen u klijentsku komponentu ruši build; nijedna tajna nema prefiks `NEXT_PUBLIC_`.
- [ ] Na serveru se korisnik čita samo sa `getClaims()`, nigdje sa `getSession()`.
- [ ] Brojač dana daje „Prijavljeno danas", „1 dan", „11 dana", „21 dan", „Riješeno istog dana", po kalendaru `Europe/Podgorica`.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 1, 2
**Vlasnik:** bilo ko
**Labele:** `p0`, `infra`

---

### 5. Demo nalozi (`pnpm db:seed-demo`, dio za naloge)

**Cilj:** demo nalozi postoje od prvog dana: tim se njima uloguje, razvija i proba, a isti nalozi služe i za video. Njihove prijave se brišu jednom komandom tek poslije ocjenjivanja.

**Obim:**
- `scripts/seed-demo.ts`: nalozi iz tabele `DB.md` §12.3 preko `auth.admin.createUser({ email_confirm: true, user_metadata: { first_name, last_name } })`, zatim `role`, `institution_id` i `is_demo = true` servisnim ključem.
- Mejlovi su plus-adrese `TEST_INBOX`; šifra je `DEMO_PASSWORD` iz `.env.local`; imena izmišljena.
- Jedan način rada, bez opcija (nema `--accounts` za seed; tiket 22 Q1): skripta za svaki nalog provjeri da li postoji i pravi samo one koji nedostaju; postojeći nalog se preskače, bez nove šifre i bez greške. Stavka 16 kasnije dodaje dio za prijave u istu skriptu (`DB.md` §12, §12.3).
- Bez aliasa `@/` i bez sintakse koja nije samo tip (Node 24 izvršava TypeScript direktno).

**Izvori:** `DB.md` §12 (uvod: demo podaci unaprijed), §12.3, §12.5; `Tech.md` §11 (`pnpm db:seed-demo`, napomena o skriptama), „Registracija"; `AGENTS.md` „Baza (Supabase)".

**Kriterijumi prihvatanja:**
- [ ] Poslije `pnpm db:seed-demo` postoje `citizen-video`, `citizen-seed`, `dev-1`…`dev-3`, pet službenika i `admin`, svi potvrđeni i sa `is_demo = true`.
- [ ] Službenik ima tačno svoju instituciju (CHECK `(role = 'official') = (institution_id is not null)` prolazi).
- [ ] Drugo pokretanje ne pravi duplikate, ne mijenja šifre postojećih naloga i ne pada; komanda nema opciju `--accounts`.
- [ ] U repou nema ni šifre ni prave adrese `TEST_INBOX`.
- [ ] Ivana je skriptu pokrenula na zajedničkom projektu (PRD §9, Uto), a tim je dobio spisak naloga.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi (dio koji se odnosi na skripte).

**Zavisi od:** 2
**Vlasnik:** bilo ko
**Labele:** `p0`, `demo`, `baza`

---

### 6. Registracija, ulogovanje i odjava (`/uloguj-se`, `/privatnost`)

**Cilj:** građanin se registruje sa imenom i prezimenom ili se uloguje i vraća tamo odakle je krenuo; službenik i administrator koriste istu stranicu; svako se odjavljuje iz menija zaglavlja.

**Obim:**
- `app/uloguj-se/`: registracija (ime, prezime, mejl, šifra, sve obavezno; `signUp` sa `options.data`) i ulogovanje mejlom i šifrom; parametar `next`. Registracija novog naloga radi za svakog, iako se u videu ne prikazuje (tiket 22 Q4).
- „Odjavi se" u meniju zaglavlja (P0, tiket 22 Q7): samo za nalog koji nije anoniman; Server Action sa `supabase.auth.signOut()` serverskim klijentom, pa `/`.
- Pasus o privatnosti sa linkom „Više o privatnosti", bez checkbox-a.
- `app/privatnost/`: sadržaj iz PRD §8, bez članova zakona i rokova.
- Na `/privatnost` odjeljak „Demo fotografije" (licenca to traži, tiket 21): lista iz `scripts/demo-photos/CREDITS.md`, a obavezno atribucija za `street_light-2.jpg`: naslov „Švehlova, pod mostem Jižní spojky, rozbitá lampa (01).jpg", autor „ŠJů, Wikimedia Commons", licenca [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) sa linkom, link na stranicu fajla na Commons-u (iz `CREDITS.md`) i napomena da je fotografija izmijenjena (smanjena na 1600 px, uklonjeni metapodaci).
- `/auth/callback` se ne pravi.

**Izvori:** PRD FR-1, §4.1 (odjava), §6 („Privatnost", „Obavještenje"), §8 (zaglavlje, `/uloguj-se`, `/privatnost`, `/auth/callback`), §10 (tekst `/privatnost`); `Tech.md` §4 (odjava), „Registracija"; `DB.md` §6 (trigger 4), §12.4 („Autori i licence"); `scripts/demo-photos/CREDITS.md`; `GLOSSARY.md` („Građanin", „Profil").

**Kriterijumi prihvatanja:**
- [ ] Bez imena ili prezimena forma ne šalje zahtjev, a nalog ne nastaje.
- [ ] Nov nalog je odmah ulogovan, bez mejla; provjereno na produkcionom URL-u do srijede uveče (PRD §9), a probni nalog obrisan.
- [ ] `/uloguj-se?next=/prijavi` poslije ulogovanja ili registracije vodi na `/prijavi`.
- [ ] Pasus o privatnosti je doslovno tekst iz PRD §6; `/privatnost` ima kontakt mejl tima za uklanjanje fotografije ili prijave.
- [ ] `/privatnost` u odjeljku „Demo fotografije" navodi za `street_light-2.jpg` autora „ŠJů, Wikimedia Commons", CC BY 4.0 sa linkom na licencu, link na stranicu fajla i napomenu da je izmijenjena.
- [ ] „Odjavi se" postoji za građanina, službenika i administratora, ne postoji za gosta i anonimnu sesiju; poslije odjave korisnik je na `/` i neulogovan, a `/prijavi` ga vodi na `/uloguj-se`.
- [ ] Ivana je pregledala tekst `/privatnost`.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 4
**Vlasnik:** bilo ko
**Labele:** `p0`, `gradjanin`

---

### 7. Javna mapa `/`

**Cilj:** gost vidi sve javne prijave u Podgorici sa statusom, brojačem dana i brojem podrški koji raste uživo, i ima dugme „Prijavi problem".

**Obim:**
- `app/page.tsx` (Server Component; čita `reports` serverskim klijentom, RLS izbacuje nacrte i sakriveno).
- `components/map/`: Leaflet preko `next/dynamic(…, { ssr: false })` iz klijentske komponente; `L.divIcon` sa bojom **i** ikonom statusa po tabeli „Status colours and icons" u `UI.md` (tokeni iz preseta, lucide ikone; tiket 22 Q10); tile-ovi i atribucija iz `MAP_TILES`.
- Jedno mapiranje status → boja, ikona i naziv (`Record` nad enumom statusa), koje koriste i stavke 13 i 14.
- Oblačić markera: naziv vrste, status tekstom, brojač dana, broj podrški, fotografija (potpisani URL) ili „Demo prijava nema fotografiju.", oznaka „Demo prijava" (`Badge`), link na `/p/[code]`.
- Realtime: `UPDATE` na `reports` bez filtera osvježava `like_count`.
- Dugme „Prijavi problem" (podrazumijevana varijanta `Button`) vodi na `/prijavi`.

**Izvori:** PRD §4.1, FR-14, FR-15, FR-16, FR-17, FR-25, §6 (performanse, pristupačnost), §8 (`/`); `Tech.md` §5 (potpisani URL-ovi), §8, §9; `DB.md` §9 (napomene o javnoj stranici i mapi), §10 (potpisani URL-ovi), §11, §12.4 (oznaka); `UI.md` (uključujući „Status colours and icons").

**Kriterijumi prihvatanja:**
- [ ] Mapa prikazuje sve prijave osim `draft` i sakrivenih; status se razlikuje i bojom i ikonom, tačno po tabeli u `UI.md`, a u oblačiću piše i tekstom.
- [ ] Boje dolaze iz tokena preseta; `app/globals.css` i `components.json` nijesu ručno mijenjani. Nijanse i kontrast ikone na markeru provjereni poslije `init`-a; ako token ne valja, mijenja se token u tabeli `UI.md`, ne tema.
- [ ] Podrška data na drugom uređaju mijenja broj u oblačiću bez ponovnog učitavanja.
- [ ] Server potpisuje samo putanje koje je isti zahtjev pročitao iz `report_photos` sa sesijom posjetioca.
- [ ] Atribucija „© OpenStreetMap" je uvijek vidljiva; nema `Referrer-Policy: no-referrer`.
- [ ] Mapa se učitava za ≤ 2 s na 4G (PRD §6).
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 4
**Vlasnik:** bilo ko
**Labele:** `p0`, `gradjanin`, `mapa`

---

### 8. Tok prijave: fotografije, otprema i lokacija

**Cilj:** građanin fotografiše ili izabere do 3 fotografije, one se kompresuju i otpremaju u pozadini, a on na mapi potvrđuje pin u Podgorici; lokacija van Podgorice se odbija odmah na „Potvrdi lokaciju".

**Obim:**
- `app/prijavi/page.tsx`: gost i anonimna sesija idu na `/uloguj-se?next=/prijavi`; dugmad „Fotografiši" (`capture="environment"`) i „Iz galerije"; ispod njih, pri svakoj prijavi, jedan kratak red „Izbjegavajte lica i registarske tablice na fotografiji." (bez pamćenja po nalogu; PRD §6, tiket 22 Q11); dodir pokreće i geolokaciju (opcije iz FR-3).
- `lib/photos/compress.ts`: verzije od 1600 px i 1024 px iz istog bitmapa, bez EXIF-a; poruka za format koji pregledač ne dekodira.
- Otprema verzije od 1600 px iz pregledača u `report-photos` pod `<uuid>.jpg`, u pozadini; sličica iz lokalnog bloba. Verzije od 1024 px i putanje ostaju u stanju toka za stavku 9.
- Ekran lokacije: pin fiksiran u centru, građanin pomjera mapu; početni položaj i poruke iz FR-3; adresa ispod pina.
- `app/api/geo/reverse/route.ts`, `lib/geo/reverse.ts`, `lib/geo/transliterate.ts` (Nominatim samo sa servera). Photon se u P0 ne pravi; dodaje se iza iste funkcije tek ako Nominatim stvarno počne da odbija zahtjeve (`Tech.md` §8, tiket 22 Q9).
- „Potvrdi lokaciju": `supabase.rpc('resolve_municipality', …)`; `null` = poruka iz FR-4 i građanin ostaje na mapi; mrežna greška = tok ide dalje. Tok se ovdje završava potvrđenom tačkom za stavku 10.

**Izvori:** PRD FR-1, FR-2, FR-3, FR-4, FR-5 („Fotografije", „Redoslijed ekrana" koraci 1–2), §6 („Privatnost": metapodaci, obavještenje); `Tech.md` §5, §6 („Provjera opštine na „Potvrdi lokaciju""), §8, „Hosting" (provjera bez preview-a); `DB.md` §8.2, §8.3 (`resolve_municipality`), §10; `AGENTS.md` („Tiketi, grane, PR").

**Kriterijumi prihvatanja:**
- [ ] Iz galerije prolaze najviše 3 fotografije, a višak dobija poruku „Možete dodati najviše 3 fotografije.".
- [ ] Otpremljeni fajl je JPEG, najduža strana 1600 px, bez EXIF-a (provjereno EXIF čitačem), uspravno okrenut.
- [ ] Putanja ne sadrži ID korisnika ni prijave; klijent ne piše ni u jednu tabelu.
- [ ] Bez GPS-a mapa je na centru Podgorice uz poruku iz FR-3; uz preciznost lošiju od 50 m ili prvu fotografiju iz galerije stoji poruka da građanin provjeri pin.
- [ ] Adresa se traži tek kad se mapa smiri, koordinate zaokružene na 5 decimala, najviše 1 zahtjev u sekundi po korisniku, `accept-language=cnr-Latn`, timeout 3 s; adresa je latinicom.
- [ ] Pin u Tuzima ili Golubovcima daje poruku iz FR-4 odmah na dodir; pin u Podgorici prolazi.
- [ ] Napomena o licima i tablicama stoji na početnom ekranu `/prijavi` pri svakoj prijavi, i drugoj i desetoj, a ne samo pri prvoj.
- [ ] `address_source` je `nominatim`; nema koda za Photon.
- [ ] Provjereno na telefonu preko HTTPS-a (Vercel preview). Ako preview za commit kolege ne postoji: provjereno na `localhost`-u u širini 360 px, a na telefonu na produkcionom URL-u poslije merge-a, što piše u PR opisu (`AGENTS.md`, tiket 22 Q8).
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 3, 4, 6
**Vlasnik:** bilo ko
**Labele:** `p0`, `gradjanin`, `mapa`

---

### 9. Agent `classify`: nacrt, prepoznavanje i ručni tok

**Cilj:** čim se fotografije vrate u aplikaciju nastaje nacrt i jedan poziv modela prepoznaje vrstu i opis, a kad model zakaže ili nije siguran, građanin bira vrstu sam bez prekida toka.

**Obim:**
- `app/api/agent/classify/route.ts` (`runtime = 'nodejs'`, `maxDuration = 60`): niz iz `Tech.md` §6, tačka 1 (`getClaims()`, ne-anonimni nalog, validacija, `create_draft`, jedan poziv modela, `record_classification`).
- `lib/agent/classify.ts`, `lib/agent/schema.ts`, `lib/agent/prompt.ts`: poziv, šema i prompt tačno po `Tech.md` §7 (uključujući zabranjene parametre i serversku provjeru izlaza).
- Klijent: poziv kreće odmah, paralelno sa otpremom i pinom; traka „Prepoznajem problem…"; `AbortController` poslije 15 s; zakašnjeli odgovor se zanemaruje.
- Ekran za izbor vrste (FR-7): sve vrste iz `lib/constants.ts`, jedan dodir bira vrstu i vodi dalje.
- „Odustani" na svakom koraku: Server Action u `app/prijavi/actions.ts` (`delete_draft`, pa brisanje fajlova admin klijentom).

**Izvori:** PRD §4.2, FR-5, FR-6, FR-7, FR-13, „Vrste problema (P0)", §6 (bezbjednost: ograničenje; privatnost; troškovi); `Tech.md` §4, §6 (tačka 1), §7; `DB.md` §8.3 (`create_draft`, `record_classification`, `delete_draft`), §4.5 (`agent_runs`); `AGENTS.md` zlatna pravila 1, 3 i 7.

**Kriterijumi prihvatanja:**
- [ ] Prompt ne pominje nijednu instituciju niti nadležnost; zabranjuje izmišljanje propisa, rokova i činjenica; tekst sa fotografije tretira kao podatak.
- [ ] U pozivu nema `temperature`, `top_p`, `top_k`, `thinking`, prefill-a ni alata; model dolazi iz `ANTHROPIC_MODEL`.
- [ ] Bez `ANTHROPIC_API_KEY` (ili uz timeout od 12 s) ruta vraća `fallback`, a građanin dobija traku „Prepoznavanje nije uspjelo. Vrstu ćete izabrati sami." i ekran izbora vrste.
- [ ] Pouzdanost ispod 0.6 ili `is_municipal_problem = false` vodi na ekran izbora vrste, a opis modela ostaje.
- [ ] Jedanaesti pokušaj u danu dobija poruku o dnevnom ograničenju iz PRD §6.
- [ ] Opis upisan u nacrt nema URL-ove, mejl adrese ni brojeve telefona; `agent_runs` nema ime, mejl ni sliku.
- [ ] „Odustani" briše nacrt i njegove fajlove iz Storage-a.
- [ ] Testovi, ako ih ima, mockuju Anthropic SDK.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 8 (i 4 preko nje)
**Vlasnik:** bilo ko
**Labele:** `p0`, `agent`, `gradjanin`

---

### 10. Agent `prepare`: nadležnost, duplikati i dopis (SSE)

**Cilj:** poslije potvrde pina i poznate vrste građanin uživo vidi korake agenta, sistem iz tabele pravila određuje primaoca, nudi duplikat ako postoji i priprema dopis za pregled.

**Obim:**
- `app/api/agent/prepare/route.ts`: ulaz `{ reportId, lat, lng, category }` (zod), provjera vlasništva nacrta; odgovor `text/event-stream` sa koracima `jurisdiction`, `duplicates`, `letter`, događajima `step`, `result` i `error`; red u `agent_runs` po koraku.
- `lib/agent/steps.ts`; klijent čita tok preko `fetch` i `response.body`; tekstovi koraka iz `lib/constants.ts`; dok `classify` traje, prikazuje prvi korak i čeka (najviše do roka od 15 s).
- `jurisdiction`: provjera opštine (`outside_area` → povratak na mapu), konačna adresa (`lib/geo/reverse.ts`), `update_draft`, `resolve_jurisdiction`.
- `duplicates`: `find_nearby_open_reports`; ekran duplikata (FR-9) sa „Podrži postojeću" (Server Action `support_existing_report`, brisanje fajlova, odlazak na `/p/[code]`) i „Ipak pošalji novu"; za svoju prijavu „Ovaj problem ste već prijavili." uz link.
- `letter`: šablon dopisa (FR-10, FR-11), u kom AI daje samo opis, podijeljen na dva fajla (tiket 22 Q6):
  - `lib/email/letter-template.ts`: čista funkcija, bez `server-only`, bez aliasa `@/`, bez uvoza vrijednosti; sve podatke (i naziv vrste) dobija kao parametre i vraća naslov i tekst. Istu funkciju koriste `sendReport` (12), `/admin` (15), seed (16) i test 3.
  - `lib/email/report-letter.ts` (`server-only`): skuplja podatke prijave i zove šablon.
- Dopis za pregled (tiket 22 Q5): broj prijave još ne postoji, pa na mjestu broja (naslov, nazivi priloga), datuma i vremena prijave i reda „Ranije prijave…" stoji „dodjeljuje se pri slanju" (tekst u `lib/constants.ts`).
- Obavezni testovi 2 i 3; `server-only` je mockovan u `setupFiles` iz stavke 1.

**Izvori:** PRD FR-4, FR-5 („Redoslijed ekrana" koraci 3–5), FR-8, FR-9, FR-10, FR-11 (sadržaj mejla), FR-13, „Pravila nadležnosti", §6 (performanse); `Tech.md` §3 (`letter-template.ts`, konvencije), §6 (tačka 2), §8 („Adresa"), §11 (uvoz iz skripti), §12 (`server-only` mock); `DB.md` §8.3 (`resolve_jurisdiction`, `find_nearby_open_reports`, `update_draft`, `support_existing_report`), §8.5; `AGENTS.md` zlatna pravila 1 i 7, „Obavezni testovi" 2 i 3.

**Kriterijumi prihvatanja:**
- [ ] Test 2: lokacija van Podgorice se odbija; vrsta sa pravilom daje instituciju iz `jurisdiction_rules`; vrsta bez pravila daje prijavu bez nadležnog, za administratora.
- [ ] Test 3 (nad `lib/email/letter-template.ts`): dopis iz šablona ima sva polja iz FR-11; ime, prezime i mejl građanina samo kad je dostavljanje podataka uključeno; bez broja prijave šablon na tim mjestima piše „dodjeljuje se pri slanju".
- [ ] `node -e "import('./lib/email/letter-template.ts')"` (Node 24) uvozi šablon bez greške, kao što će ga uvoziti seed; `letter-template.ts` nema `import 'server-only'` ni `@/`.
- [ ] U ruti nema poziva modela; primalac nikad ne dolazi iz izlaza modela ni iz teksta na fotografiji.
- [ ] Bez pravila (`graffiti`, `other`) građanin vidi poruku iz FR-8.
- [ ] Duplikat se nudi samo za otvorenu, nesakrivenu prijavu iste vrste do 50 m; „Podrži postojeću" briše nacrt sa fotografijama i dodaje podršku.
- [ ] Tekst prijave je spreman ≤ 3 s nakon prepoznavanja (PRD §6), mjereno na preview-u.
- [ ] Ako Nominatim ne odgovori, tok ide dalje sa koordinatama, bez adrese.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 3, 9
**Vlasnik:** bilo ko
**Labele:** `p0`, `agent`, `gradjanin`

---

### 11. Ekran „Pregled prijave"

**Cilj:** građanin na jednom ekranu vidi sve što ide instituciji, mijenja samo vrstu i opis, i jednim dodirom šalje prijavu.

**Obim:**
- Komponente u `components/report/`: fotografije sa „Dodaj fotografiju" („Fotografiši" / „Iz galerije", kompresija i otprema kao u stavci 8, Server Action sa `add_report_photo`) i „Ukloni" (`remove_report_photo`, pa brisanje fajla); vrsta sa „Promijeni"; nadležna institucija ili poruka iz FR-8; „Zašto ova institucija?" (`get_jurisdiction_source`); adresa; polje „Opis problema" sa napomenom da je opis javan.
- Napomena za označenu fotografiju i traka „Ako je neko u opasnosti, pozovite 112." kad je `immediate_danger`; obje bez dodira.
- „Prikaži cijeli tekst" (dopis samo za čitanje, iz koraka `letter` stavke 10): na mjestu broja prijave, datuma i vremena prijave i broja ranijih prijava piše „dodjeljuje se pri slanju" (PRD FR-11, tiket 22 Q5); prekidač „Dostavi moje ime i mejl instituciji", isključen pri svakoj prijavi.
- „Promijeni" vrstu ponovo zove `prepare` sa novom vrstom (bez poziva modela); pronađen duplikat je obavještenje na istom ekranu.
- Dugme „Pošalji prijavu" predaje stanje akciji `sendReport` iz stavke 12; „Odustani".

**Izvori:** PRD §4.1, FR-2, FR-5 („Fotografije", korak 6), FR-6 (opasnost), FR-7 (ručni tok: prazan opis), FR-8, FR-9 (promjena vrste), FR-11, „Pravila nadležnosti" („Zašto ova institucija?"), §6 („Privatnost": opis je javan, označene fotografije); `Tech.md` §5; `DB.md` §8.3 (`add_report_photo`, `remove_report_photo`, `get_jurisdiction_source`); `GLOSSARY.md` („Dopis", „Dostavljanje podataka", „Slabiji izvor").

**Kriterijumi prihvatanja:**
- [ ] Srećni put od fotografije do „Pošalji prijavu" ima 2 obavezna dodira; izbor vrste i duplikat dodaju po 1, najviše 4 (PRD §2).
- [ ] Posljednja fotografija nema „Ukloni" (ili dobija poruku za `photos_required`); četvrta se ne može dodati.
- [ ] Prekidač je isključen pri svakoj novoj prijavi, i kad je prethodna imala uključen.
- [ ] U ručnom toku polje „Opis problema" je prazno i nije obavezno.
- [ ] „Prikaži cijeli tekst" nigdje ne izmišlja broj, datum ni broj ranijih prijava: na tim mjestima stoji „dodjeljuje se pri slanju".
- [ ] Pravilo sa telefonskom potvrdom prikazuje „slabiji izvor (potvrda telefonom)".
- [ ] Tekstovi napomena su doslovno iz PRD-a.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 10
**Vlasnik:** bilo ko
**Labele:** `p0`, `gradjanin`

---

### 12. Slanje prijave i guard za mejl

**Cilj:** „Pošalji prijavu" podnosi prijavu i šalje dopis sa fotografijama u prilogu, ali mejl uvijek završava na `TEST_INBOX`; građanin dobija broj prijave i link.

**Obim:**
- `lib/email/send.ts`: jedino mjesto slanja; sve osim tačno `EMAIL_MODE=live` = test, primalac i kopija idu na `TEST_INBOX`, bez `TEST_INBOX` nema slanja; `from` `EMAIL_FROM`, `reply-to` `EMAIL_REPLY_TO`; ID pokušaja kao `Idempotency-Key`.
- Server Action `sendReport` u `app/prijavi/actions.ts`: niz iz `Tech.md` §6, tačka 3 (`begin_submission` → `count_previous_reports` + šablon → `start_dispatch` → `send.ts` sa prilozima `{kod}-{position}.jpg` → `complete_dispatch`); red u `agent_runs` za korak `send`. Šablon je `lib/email/letter-template.ts` iz stavke 10, sada sa kodom, datumom i vremenom podnošenja i brojem ranijih prijava umjesto „dodjeljuje se pri slanju" (tiket 22 Q5, Q6).
- Neuspjelo slanje: nacrt zadržava broj, „Pokušaj ponovo" ponavlja cijeli niz; `photo_missing` čeka otpremu; `dispatch_in_progress` ne šalje drugi mejl.
- Ekran „Prijava poslata": broj prijave, link na `/p/[code]`, „Podijeli", „Nova prijava"; za `routing` poruka iz FR-8 ispod naslova.
- Obavezni test 1.

**Izvori:** PRD FR-8, FR-11, FR-12, FR-13, FR-24, §6 (pouzdanost, bezbjednost slanja); `Tech.md` §6 (tačka 3), „Mejl (Resend)", „Env varijable za hosting i mejl"; `DB.md` §4.4, §8.3 (`begin_submission`, `start_dispatch`, `complete_dispatch`, `count_previous_reports`), §8.5, §10 („Prilog dopisa"); `AGENTS.md` zlatna pravila 2 i 3, „Obavezni testovi" 1.

**Kriterijumi prihvatanja:**
- [ ] Test 1: za `EMAIL_MODE=test`, prazan, `LIVE` i svaku vrijednost osim tačno `live`, i primalac i `cc` idu na `TEST_INBOX`; bez `TEST_INBOX` nema slanja; Resend je mockovan.
- [ ] Nijedan drugi fajl ne uvozi `resend`.
- [ ] Poslati dopis nema nijedno „dodjeljuje se pri slanju"; naslov ima pravi kod iz FR-24.
- [ ] Sa dev naloga stiže mejl na `TEST_INBOX` od `Fixit <onboarding@resend.dev>`, sa naslovom iz FR-11 i svim fotografijama u prilogu.
- [ ] Poslije uspjeha prijava je `sent` i javna; za `graffiti` je `routing`, javna, bez mejla.
- [ ] Dvostruki dodir na „Pošalji prijavu" šalje najviše jedan mejl.
- [ ] Ekran uspjeha ima naslov „Prijava poslata" i u slučaju `routing`.
- [ ] `EMAIL_MODE` nije promijenjen ni u jednom okruženju.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 10; dugme „Pošalji prijavu" dolazi iz 11 (mogu se raditi paralelno)
**Vlasnik:** bilo ko
**Labele:** `p0`, `agent`, `gradjanin`

---

### 13. Javna stranica prijave `/p/[code]` i podrška

**Cilj:** svako vidi prijavu, njen status, nadležnog, brojač dana i vremensku liniju, a jednim dodirom na „Podržavam" (i bez naloga) diže brojač podrški koji svi vide uživo.

**Obim:**
- `app/p/[code]/page.tsx`: naslov = naziv vrste i adresa; nesakrivene fotografije (potpisani URL-ovi), sakrivena = „Fotografija je uklonjena radi zaštite privatnosti", demo bez fotografije = „Demo prijava nema fotografiju."; opis; status tekstom, uz boju i ikonu iz mapiranja stavke 7 (`UI.md`, „Status colours and icons"); nadležna institucija sa „Zašto ova institucija?" ili „Nadležnog je ručno odredio administrator Fixita."; brojač dana; vremenska linija iz `report_events`; „Podijeli"; oznaka „Demo prijava".
- Dugme „Podržavam": gost dobija anonimnu sesiju tek na dodir, pa `like_report`; poslije podrške „Podržano" (onemogućeno); zatvorena prijava „Prijava je zatvorena".
- Realtime: `UPDATE` na `reports` sa filterom `id=eq.<id>` osvježava `like_count`; status se osvježava ponovnim učitavanjem.

**Izvori:** PRD §4.1, FR-8 (javna `routing`), FR-15, FR-16, FR-17, FR-18 (vremenska linija, nazivi statusa), FR-21, FR-23 (tekstovi u vremenskoj liniji), FR-25, §6 („Privatnost"), §8 (`/p/[code]`); `Tech.md` §5, §9; `DB.md` §3 (vremenska linija se sklapa u UI-ju), §5, §8.3 (`like_report`, `get_jurisdiction_source`), §9, §10, §11; `GLOSSARY.md` („Podrška", „Vremenska linija").

**Kriterijumi prihvatanja:**
- [ ] Nacrt, sakrivena prijava i nepostojeći kod daju istu stranicu „nije pronađeno"; dopis i identitet prijavioca se nigdje ne vide.
- [ ] Gost na dodir „Podržavam" dobija anonimnu sesiju i podrška se računa; ponovni dodir u istoj sesiji ne diže broj.
- [ ] Prijavilac, službenik i administrator ne mogu podržati prijavu; poruka je iz `lib/constants.ts`.
- [ ] Podrška sa drugog uređaja diže broj na otvorenoj stranici bez ponovnog učitavanja.
- [ ] Brojač podrški poštuje oblik riječi (1 podrška, 2–4 podrške, 5 i više podrški, 21 podrška, 11–14 podrški).
- [ ] Poruke službenika u vremenskoj liniji potpisuje institucija, a administratora „Tim Fixit".
- [ ] Status ima istu boju i ikonu kao marker na mapi i uvijek i naziv tekstom (`UI.md`).
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 4; za provjeru treba poslata prijava (12) ili demo prijave (16)
**Vlasnik:** bilo ko
**Labele:** `p0`, `gradjanin`, `javno`

---

### 14. Panel institucije

**Cilj:** službenik vidi samo prijave svoje institucije, otvaranjem ih potvrđuje kao primljene i mijenja im status uz poruku koja se javno vidi.

**Obim:**
- `app/panel/page.tsx`: lista prijava institucije (RLS), status tekstom uz boju i ikonu iz mapiranja stavke 7 (`UI.md`; za `not_competent` naziv iz panela); filteri i sortiranje nisu P0.
- `app/panel/prijave/[id]/page.tsx`: detalji uključujući ozbiljnost, fotografije (i sakrivene), opis, adresa, dopis upućen instituciji, vremenska linija.
- Prvo otvaranje zove `acknowledge_report` (`sent` → `acknowledged`).
- Promjena statusa preko `set_report_status` (prelazi 8–10) uz opcionu poruku, obaveznu za `rejected`; dugme „Nije naša nadležnost" nije P0.
- Pristup samo ulozi `official`; ulogovanje preko `/uloguj-se?next=/panel`.

**Izvori:** PRD §4.3, FR-6 (ozbiljnost), FR-18 (tabela prelaza), FR-20, FR-21, FR-22, FR-23, §8 („Institucija"); `DB.md` §8.3 (`acknowledge_report`, `set_report_status`), §8.4, §9 (službenik), §10; `GLOSSARY.md` („Službenik", „Primalac", „Kopija").

**Kriterijumi prihvatanja:**
- [ ] `official-saobracaj` ne vidi prijave ViK-a, ni prijave u kojima je Putevi samo kopija.
- [ ] Prvo otvaranje prijave u `sent` je mijenja u „Primljena"; otvaranje kao administrator je ne mijenja.
- [ ] „U radu" sa porukom pojavljuje se na `/p/[code]` poslije ponovnog učitavanja, potpisano imenom institucije.
- [ ] Odbijanje bez poruke je odbijeno porukom za `message_required`; nedozvoljen prelaz se ne nudi.
- [ ] Panel radi na desktopu i upotrebljiv je na tabletu.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi (širina 360 px važi za stranice građana; panel je desktop-first, PRD §6).

**Zavisi od:** 4, 6; za provjeru treba poslata prijava (12) ili demo prijave (16)
**Vlasnik:** bilo ko
**Labele:** `p0`, `panel`

---

### 15. `/admin`: ručno raspoređivanje

**Cilj:** administrator za prijavu bez nadležnog bira instituciju sa provjerenim mejlom i šalje joj dopis istim šablonom i istim slanjem kao kod građanina.

**Obim:**
- `app/admin/page.tsx`: lista prijava u `routing`; izbor institucije (samo `email is not null and is_active`); dugme „Pošalji dopis".
- Server Action: `getClaims()`, uloga `admin`, šablon (`kind = 'assignment'`), `start_dispatch(assignment)` → `lib/email/send.ts` → `complete_dispatch`; prikaz statusa koji funkcija vrati.
- Pristup samo ulozi `admin`. Moderacija i `not_competent` lista nisu P0.

**Izvori:** PRD §4.4 (`/admin`), FR-8, FR-11, FR-23 (ručno raspoređivanje), „Pravila nadležnosti" („Nema rezervnog primaoca"), §8 („Administrator"); `Tech.md` §6 (posljednji pasus tačke 3); `DB.md` §8.3 (`start_dispatch`, `complete_dispatch`), §8.4 (prelaz 6), §8.5 (tačka 4); `AGENTS.md` zlatna pravila 1 i 2.

**Kriterijumi prihvatanja:**
- [ ] Demo `graffiti` prijava (ili nova `graffiti` sa dev naloga) poslije „Pošalji dopis" je `sent`, a mejl stiže na `TEST_INBOX`.
- [ ] Vremenska linija na `/p/[code]` kaže „Proslijeđeno: {institucija}" uz „Nadležnog je odredio administrator Fixita."
- [ ] Institucija bez provjerenog mejla se ne nudi; ručni izbor ne pravi red u `jurisdiction_rules`.
- [ ] Službenik izabrane institucije poslije toga vidi prijavu u panelu.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 6, 12
**Vlasnik:** bilo ko
**Labele:** `p0`, `admin`

---

### 16. Demo prijave i brisanje demo podataka

**Cilj:** demo prijave postoje unaprijed: mapa ima ~10 demo prijava sa istorijom, iste na probi, u videu i na ocjenjivanju, bez brisanja i ponovnog seed-a prije snimanja (tiket 22 Q4). Sve demo podatke briše jedna komanda tek poslije ocjenjivanja.

**Obim:**
- Dopuna `scripts/seed-demo.ts`: prijave iz tabele `DB.md` §12.4 (prijavilac `citizen-seed`), upisane direktno u konačnom stanju: `reports` sa unazad postavljenim `submitted_at`/`closed_at`, `report_private`, `report_details`, `report_photos` + otprema pod novim `<uuid>.jpg`, `letters`, `dispatches` (`email_mode = 'test'`, `succeeded`, bez poziva `send.ts`), `report_events` sa unazad postavljenim `created_at`; kodovi iz `next_report_code()` od najstarije; `like_count` direktno.
- Isti jedan način rada kao u stavci 5 (tiket 22 Q1): naloge dopunjava, a prijave pravi samo ako `citizen-seed` nema nijednu; inače preskače dio za prijave uz poruku. Probne prijave sa `dev-*` i `citizen-video` naloga ne sprečavaju seed.
- Datumi od fiksnog dana snimanja, petka 6. 11. 2026. (`Europe/Podgorica`, konstanta u skripti), ne od trenutka pokretanja; vrijeme koje bi palo poslije pokretanja (red 6, „danas") pomjera se na nekoliko minuta prije pokretanja, uz isti redoslijed (`DB.md` §12.4, tiket 22 Q2).
- `letters.subject` i `letters.body_text` iz `lib/email/letter-template.ts` (stavka 10), uvezenog relativnom putanjom sa nastavkom `.ts`; nazivi vrsta iz `lib/constants.ts` istim putem (`Tech.md` §11, tiket 22 Q6).
- Fotografije iz `scripts/demo-photos/` (8 fajlova i `CREDITS.md` su već u repou). Atribuciju za `street_light-2.jpg` (CC BY 4.0) na `/privatnost` pravi stavka 6.
- Lokacije: stvarne tačke u Podgorici sa ispravnom adresom, po pravilima iz `DB.md` §12.4.
- `scripts/clear-demo.ts`: `clear_demo_data()`, brisanje fajlova u grupama, `--accounts` briše i demo naloge. Pokreće se tek poslije ocjenjivanja, ne prije probe ni snimanja.

**Izvori:** PRD §4.4 (seed), §9, FR-15, FR-24, FR-25; `DB.md` §8.3 (`next_report_code`, `clear_demo_data`), §12 (uvod), §12.3, §12.4, §12.5; `Tech.md` §3 (`scripts/`, `letter-template.ts`), §11; `GLOSSARY.md` („Demo prijava").

**Kriterijumi prihvatanja:**
- [ ] Mapa prikazuje sve statuse osim `not_competent` i četiri institucije; brojači odgovaraju tabeli `DB.md` §12.4 (npr. „Riješeno za 6 dana", „21 dan bez rješenja").
- [ ] Poruke institucija i opisi su kratki i neutralni, bez rokova, obećanja i imena.
- [ ] Svaka demo prijava ima oznaku „Demo prijava"; prijave 9 i 10 prikazuju „Demo prijava nema fotografiju.".
- [ ] Drugo pokretanje `pnpm db:seed-demo` ne pravi nove demo prijave ni duplikate naloga i ne pada; postojeće probne prijave sa `dev-*` naloga ne blokiraju prvo pravljenje demo prijava.
- [ ] Brojači odgovaraju tabeli i kad je seed pokrenut prije petka (računato od 6. 11. 2026.); nijedno `submitted_at`, `closed_at` ni `report_events.created_at` nije u budućnosti.
- [ ] Demo dopis (`letters.body_text`) ima isti oblik kao dopis prave prijave, jer dolazi iz `letter-template.ts`.
- [ ] `scripts/clear-demo.ts` radi po `DB.md` §12.5 (sve `is_demo` prijave i njihovi fajlovi, brojač kodova se ne vraća unazad); na zajedničkom projektu se ne pokreće prije ocjenjivanja, pa se u PR-u provjerava pregledom koda.
- [ ] Dvije demo prijave iste vrste su međusobno dalje od 50 m; mjesto snimanja iz stavke 17 nije bliže od 50 m demo prijavi iste vrste.
- [ ] Pokrenuto jednom na zajedničkom projektu čim je stavka u `main` (najkasnije u četvrtak); poslije toga se demo prijave ne brišu i ne prave ponovo.
- [ ] Definicija „gotovo" iz `AGENTS.md` važi.

**Zavisi od:** 3, 5, 10 (`lib/email/letter-template.ts`); fotografije u `scripts/demo-photos/` (već u repou)
**Vlasnik:** bilo ko
**Labele:** `p0`, `demo`

---

### 17. Generalna proba i spremnost aplikacije za video

**Cilj:** aplikacija radi za video: tok jedne prijave od fotografije do promjene statusa prošao je generalnu probu na Vercel adresi, ispod 60 s i sa najviše 4 dodira, na istim demo nalozima i demo prijavama koje će biti u videu.

**Obim:**
- Ovaj tiket ne pravi video. Detaljan plan snimanja (scene, mjesto, redoslijed) Ivana daje posebno; scenarij iz PRD §9 je okvirni, a stavka se usklađuje s Ivaninim planom kad stigne (tiket 22 Q4).
- Generalna proba u četvrtak na srednjem telefonu, 4G ili hotspot, sa već datim dozvolama: tri mjerenja toka od fotografije do „Prijava poslata".
- Provjere sa pravog telefona iz nalaza 06 („Provjeriti na probi u četvrtak", `.scratch/fixit-planiranje/research/06-pwa-kamera-lokacija.md`).
- Probno snimanje sve četiri scene iz PRD §9.
- Bez brisanja i bez ponovnog seed-a prije snimanja: demo prijave iz stavke 16 i probne prijave ostaju (tiket 22 Q4). Zato se proba ne radi na mjestu snimanja za vrstu koja se snima.
- Priprema za petak: nalozi, mjesto snimanja, zagrijavajući poziv modela, natpis o testnom sandučetu.

**Izvori:** PRD §2 (mjerenje), §4.4, §9 (scenarij i pravila snimanja), FR-25; `Tech.md` §7 (zagrijavajući poziv), „Hosting" (produkcioni URL); `DB.md` §12 (uvod), §12.3 (`citizen-video`), §12.4 (lokacije, oznaka); nalaz 06 („Preporuka", tačka 5); Ivanin plan snimanja (kad stigne).

**Kriterijumi prihvatanja:**
- [ ] Tri pokušaja srećnog puta, sva ispod 60 s, svaki sa 2 obavezna dodira; ručno izbrojano i zapisano u ovaj issue.
- [ ] Snima se u Safariju ili Chrome-u kao pregledaču (ne instalirana PWA), na produkcionom `vercel.app` URL-u, sa „Precise Location" i dozvolama za kameru i lokaciju datim unaprijed.
- [ ] `citizen-video` je ulogovan na telefonu za snimanje; službenik institucije iz scene 3 je ulogovan na drugom uređaju, van kadra.
- [ ] Izabran je stvaran problem u Podgorici, vrste sa pravilom, a nijedna otvorena prijava iste vrste, ni demo ni probna, nije bliža od 50 m (nema ekrana duplikata u videu; tiket 22 Q4).
- [ ] Prijava napravljena u videu sa `citizen-video` nosi oznaku „Demo prijava" i ide samo na `TEST_INBOX` (tiket 22 Q3).
- [ ] Prije snimanja nije pokrenut ni `pnpm db:clear-demo` ni novo pravljenje demo prijava; kodovi demo prijava su isti kao na probi.
- [ ] Neposredno prije snimanja: jedan zagrijavajući poziv modela; `EMAIL_MODE=test` provjeren na Vercelu.
- [ ] Natpis u videu i prezentaciji kaže da dopisi u demou idu na testno sanduče, ne institucijama; `TEST_INBOX` je zamućen gdje god se vidi; u aplikaciji nema oznake „Testni režim".
- [ ] Tok slanja (scene 1–2) nije ubrzan bez vidljive oznake.
- [ ] Scena 4: podrška na demo prijavi diže brojač za 1 uživo.
- [ ] Demo podaci nisu obrisani prije predaje.

**Zavisi od:** 7, 12, 13, 14, 15, 16
**Vlasnik:** bilo ko (Ivana odobrava proba-snimak)
**Labele:** `p0`, `video`

---

## Ne sada (P1)

Počinju tek kad cijeli P0 radi (PRD §4, §9):
- `/moje-prijave` i `/obavjestenja` (FR-19), uključujući mejl prijaviocu.
- Panel: `/panel/mapa`, filteri i sortiranje, dugme „Nije naša nadležnost", `/panel/analitika`.
- `/admin`: lista `not_competent`, preusmjeravanje (prelaz 13), moderacija fotografija i prijava; `/admin/institucije`, `/admin/pravila`, `/admin/korisnici`.
- `/statistika`.
- Status uživo na javnoj stranici (Realtime za status).

## Razriješeno u tiketu 22

Svih 12 nejasnoća iz ovog nacrta je odlučeno u tiketu 22 (`issues/22-nejasnoce-za-izradu.md`, sekcija „Answer"), upisano u PRD, `Tech.md`, `DB.md`, `UI.md`, `AGENTS.md` i `GLOSSARY.md`, i uneseno u stavke iznad:
- `TEST_INBOX` je Ivanin lični mejl i ne upisuje se u repo (ispravljeno prije tiketa 22; stavka 1).
- Demo nalozi i demo prijave postoje unaprijed i isti su na probi, u videu i na ocjenjivanju; `pnpm db:seed-demo` ima jedan način rada i samo dopunjava ono što nedostaje; prije snimanja nema `db:clear-demo` ni ponovnog seed-a (Q1, Q4; stavke 5, 16, 17).
- Datumi demo prijava se računaju od petka 6. 11. 2026. (Q2; stavka 16).
- Prijava iz videa nosi oznaku „Demo prijava" (Q3; stavka 17).
- Pregled dopisa piše „dodjeljuje se pri slanju" umjesto broja, datuma i broja ranijih prijava (Q5; stavke 10, 11, 12).
- Šablon je čista funkcija `lib/email/letter-template.ts`, a `server-only` je mockovan u Vitest-u (Q6; stavke 1, 10, 12, 16).
- „Odjavi se" je P0 (Q7; stavka 6).
- Bez Vercel preview-a: `localhost` na računaru, telefon poslije merge-a (Q8; stavke 1, 8).
- Photon nije u P0 (Q9; stavka 8).
- Boje i ikone statusa su u `UI.md` (Q10; stavke 7, 13, 14).
- Napomena o licima i tablicama stoji na svakom početku `/prijavi` (Q11; stavka 8).
- Atribucija za `street_light-2.jpg` (CC BY 4.0) na `/privatnost` je u stavci 6.

Otvoreno pitanje za Ivanu iz tiketa 22 („Answer", „Otvoreno") ne blokira nijednu stavku.
