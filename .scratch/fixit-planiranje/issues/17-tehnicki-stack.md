# 17 — Tehnički stack (Tech.md)

Type: grilling
Status: resolved
Blocked by: 03, 04, 05, 07
Mapa: [map.md](../map.md)

## Question

`Tech.md` danas ima samo tri reda. Agentima od utorka treba konkretno: verzije, biblioteke, gdje šta radi, env varijable, komande. Pravilo 8 iz AGENTS.md („ne dodaji zavisnosti koje nisu u Tech.md") znači da sve što agent smije koristiti mora biti ovdje.

Konkretne preporuke upisujem kad stignu nalazi 03, 04, 05 i 07. Q1 je pitanje samo za tebe i možeš ga odgovoriti već sada.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - shadcn preset**: UI.md kaže „uvijek koristi preset iz `components.json`", ali `components.json` još ne postoji (u folderu nema koda). Imaš li već izabran shadcn preset (link ili kod iz `shadcn create`, ili stil/boju/radius/font)? Ako imaš, zalijepi ga ovdje.

➡️ Ako ga nemaš: podrazumijevani shadcn stil, neutralna osnovna boja, a jedna akcentna boja za brend i dugme „Prijavi problem". Inicijalizuje se u utorak, prvi korak izrade.

*Dopuna nakon nalaza 07:*
- `components.json` nema polje `preset`. Preset je kod koji `shadcn init` raspoređuje po ostalim poljima tog fajla, a vraća se komandom `npx shadcn preset resolve`. UI.md zato treba da zapiše sam kod preseta.
- shadcn sada podrazumijevano koristi Base UI. Za Radix se dodaje `-b radix`. Upiši šta preset koristi, ako znaš.

**Tvoj odgovor:** Zelim ovaj shadcn preset, evo je komanda: pnpm dlx shadcn@latest init --preset b2xaqzSRuK --template next

---

❓ **Q2 - Osnovni stack**: Da li je osnova: Next.js (trenutna stabilna, App Router), TypeScript `strict`, pnpm, Tailwind CSS + shadcn/ui, `@supabase/ssr` + `@supabase/supabase-js`, `zod` za validaciju ulaza i izlaza modela, Vitest za testove? Verzije upisujem iz nalaza 07.

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q3 - Agent tok kao jedan server endpoint sa streamingom koraka**: (Zavisi od 04 i 07.) Da li agent tok radi na Next.js serveru (route handler na Vercelu), sa koracima koje klijent prima kao stream („Prepoznajem…", „Određujem nadležnog…", „Pripremam…"), umjesto Supabase Edge funkcija?

➡️ Da, ako nalaz 07 potvrdi da trajanje funkcije na Vercelu to dozvoljava. Jedan jezik i jedno mjesto za tajne.

**Tvoj odgovor:**

---

❓ **Q4 - Mapa, tile-ovi i geocoding**: (Zavisi od 03.) Preporuka se upisuje kad stigne nalaz.

**Tvoj odgovor:**

---

❓ **Q5 - Model i način poziva**: (Zavisi od 04.) Preporuka se upisuje kad stigne nalaz.

**Tvoj odgovor:**

---

❓ **Q6 - Env varijable**: Da li je spisak ovakav (konačan spisak upisujem u Tech.md)?
Server: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `EMAIL_MODE` (podrazumijevano `test`), `TEST_INBOX`, `EMAIL_FROM`, `ANTHROPIC_MODEL`.
Klijent: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ili publishable key), `NEXT_PUBLIC_SITE_URL`, eventualno ključ za tile-ove.

➡️ Da.

**Tvoj odgovor:**

---

## Answer

*Napomena o procesu:* skill `wayfinder` nije mogao da se pokrene iz ove sesije (rezervisan je za ručno pokretanje), pa je tiket riješen po koordinatorovim uputstvima i [brief-u za talas 1](../wave1-brief.md); `grilling`, `domain-modeling` i `claude-api` su korišćeni kao kontrolna lista. Verzije paketa su ponovo provjerene u npm registru 3. 11. ujutru. Usklađeno sa odgovorima tiketa 10, 11, 12, 13, 15 i 16.

- **Q1 — shadcn preset:** `b2xaqzSRuK`, inicijalizacija `pnpm dlx shadcn@latest init --preset b2xaqzSRuK --template next`. **[Ivana]** Dopune **[Claude]**, prema nalazu 07: (a) UI.md više ne kaže „preset iz `components.json`", nego da je preset razložen u polja `components.json` i CSS varijable, koje se ne mijenjaju ručno, a provjerava se sa `shadcn preset resolve`; (b) baza komponenti (Base UI ili Radix) je ona koju preset postavi i upisuje se u UI.md poslije `init`-a, jer se kod preseta bez CLI-ja ne može dekodirati; (c) poslije `init`-a CLI se pinuje na 4.23.0 (i u `.mcp.json`), jer bi `@latest` usred sedmice mogao povući drugu verziju.
- **Q2 — Osnovni stack:** Next.js 16 (App Router), TypeScript `strict`, pnpm, Tailwind CSS 4 + shadcn/ui, `@supabase/ssr` + `@supabase/supabase-js`, `zod`, Vitest. **[Ivana]** Verzije **[Claude]**, iz nalaza 07 i npm registra: tačni pinovi, bez izdanja mlađih od 7 dana (izuzeci: Next.js zakrpa i Supabase CLI 3.0.0), jer novo izdanje usred sedmice izrade nosi rizik bez koristi. Zato `@anthropic-ai/sdk` 1.3.0 (ne 1.4.0 od 2. 11.), `vitest` 5.0.5, `resend` 6.35.0 i `typescript` 5.9.3 (ne 7.x, jer `create-next-app` traži `^5`). Next.js: prva zakrpljena 16.4.x iz bezbjednosnog izdanja od 3. 11.; ujutru 3. 11. zakrpa još nije bila na npm-u (`latest` = 16.4.4), pa kostur smije na 16.4.4, a prvi Vercel deploy ide tek sa zakrpom.
- **Q3 — Agent tok na Next.js serveru:** da, Route Handler-i na Vercelu (Node runtime, `maxDuration = 60`, strop na Hobby-ju 300 s), bez Supabase Edge funkcija. **[Claude]**, jer nalaz 07 potvrđuje da trajanje to dozvoljava, a jedan jezik i jedno mjesto za tajne je jednostavnije. Umjesto jednog endpointa su **dvije rute**, jer tiket 15 (Q2) traži da analiza krene prije potvrde pina: `POST /api/agent/classify` (pravi nacrt, jedan poziv modela sa 1–3 slike, JSON odgovor; „Prepoznajem problem…" prati sam zahtjev) i `POST /api/agent/prepare` (Podgorica, `resolve_jurisdiction`, adresa, duplikati, dopis; koraci stižu kao SSE događaji, kako je tiket 16 već upisao). Slanje je Server Action `sendReport`.
- **Q4 — Mapa, tile-ovi i geokodiranje:** `leaflet` 1.9.4 + `react-leaflet` 5.0.0 (oko 46 KB gzip, `next/dynamic` sa `ssr: false`); OSM standard tile-ovi sa vidljivom atribucijom, bez keširanja u service worker-u, CARTO kao rezerva; Nominatim samo sa servera, sa `accept-language=cnr-Latn` i sopstvenim User-Agent-om, transliteracija ćirilice kao zaštita, Photon kao rezerva. **[Claude]**, po preporuci nalaza 03 (najlakši stack za ≤ 2 s na 4G; `sr-Latn` vraća ćirilicu). Adresa ispod pina (tiket 15) ide preko `/api/geo/reverse` tek kad se mapa smiri; konačna adresa se uzima u `prepare`.
- **Q5 — Model i način poziva:** `claude-haiku-5-5` iz `ANTHROPIC_MODEL`, `messages.parse()` + `zodOutputFormat`, `effort: 'low'`, `max_tokens: 2048`, slike od 1024 px kao base64 u jednom pozivu, SDK `timeout: 12_000` i `maxRetries: 0` kao unutrašnji rok, a 15 s u UI-ju (tiket 15) kao spoljni. Bez `temperature`/`top_p`/`top_k` i bez `thinking: disabled`. **[Claude]**, po nalazu 04 i provjeri kroz `claude-api`: Haiku je najbrži za klasifikaciju, a bez parametara vezanih za jedan model tiket 20 može prebaciti na `claude-sonnet-5-5` samo promjenom env varijable. `refusal`, `max_tokens` ili neparsiran izlaz znače ručni tok.
- **Q6 — Env varijable:** spisak prihvaćen uz tri izmjene. **[Claude]**, jer: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` umjesto `…_ANON_KEY` (naziv iz trenutne Supabase dokumentacije, nalaz 07); dodata `EMAIL_REPLY_TO` (tiket 16); ključa za tile-ove u P0 nema (OSM ga ne traži). Mejl varijable opisuje sekcija tiketa 16, a ostale Tech.md §10.
- **Dodatne odluke [Claude]:**
  - Verzija od 1024 px za model ide na `classify` u `multipart` zahtjevu i ne čuva se; u Storage ide samo verzija od 1600 px, direktno iz pregledača. Razlog: nema drugog objekta u Storage-u ni preuzimanja sa servera, a prepoznavanje ne čeka otpremu; tri slike od ~300 KB su daleko ispod 4,5 MB. Ovo odstupa od preporuke nalaza 04 (server čita sliku iz Storage-a).
  - `lib/env.ts` provjerava serverske env varijable zod-om, da greška u konfiguraciji padne odmah.
  - Skripte `dev`, `build`, `typecheck`, `lint`, `test`, `db:types` u `package.json` (tiket 12 ih očekuje).
  - Kratke mutacije: RPC iz klijenta kad RLS dozvoljava, Server Action kad treba tajna; svaka ruta i akcija sama provjerava korisnika (`getClaims()`), `proxy.ts` nije zaštita.
  - Domain-modeling: nijedan nov pojam osim „korak agenta" (`classify`, `jurisdiction`, `duplicates`, `letter`), predložen za rječnik (09).

### Izmjene u dokumentima

- `Tech.md`: tri reda zamijenjena sekcijama 1–12: stack ukratko; verzije i dozvoljene zavisnosti (uz napomenu o Next.js zakrpi od 3. 11., šta se ne dodaje bez obrazloženja); struktura foldera i konvencije; Supabase u Next.js-u (`proxy.ts`, `getClaims()`, `is_anonymous`); fotografije (kompresija, upload direktno u Storage, privatni bucket, do 3 fotografije); agent tok (`classify`, `prepare` sa SSE koracima, `sendReport`, rokovi); model (Claude); mapa i adresa; realtime; env varijable; komande (Supabase CLI 3.0.0 sa `--remote`); testovi. Sekcija tiketa 16 „Hosting, domen i mejl" nije dirana.
- `UI.md`: nova sekcija „shadcn/ui setup" (preset `b2xaqzSRuK`, init komanda, šta preset znači za `components.json`, Base UI/Radix, pin CLI-ja, `.mcp.json`). Postojeća pravila zadržana (popravljen markdown `\-`/`\#`) i dopunjena: mapa kao izuzetak od shadcn-a, preset vrijednosti se ne mijenjaju ručno, zahtjevi iz PRD §6 (360 px, 44 × 44 px, WCAG AA, status ne samo bojom) i jezik.

### Za DB.md (tiket 18)

- Nacrt pravi server u ruti `classify` (admin klijent ili `SECURITY DEFINER` RPC), prije lokacije i vrste (usklađeno sa tiketom 15); dnevno ograničenje od 10 nacrta sa AI analizom provjerava se u toj ruti prije poziva modela, pa treba upit ili RPC koji broji nacrte korisnika po danu u Podgorici.
- Rezultat modela na nacrtu: `ai_category`, `ai_confidence`, `analysis_status`, `description`, `severity`, `immediate_danger`, `image_contains_instructions`. Oznaka ličnih podataka je po fotografiji: model vraća `personal_data_photos` (indeksi), a server upisuje `report_photos.has_personal_data`.
- `report_photos.sent_to_model` (tiket 15): `true` za fotografije poslate u `classify`, `false` za kasnije dodate.
- **Konflikt putanje fotografija:** tiket 11 traži `<uuid>.jpg` bez ID-a korisnika (potpisani URL sadrži putanju), a tiket 15 u svom „Za DB.md" predlaže `{user_id}/{report_id}/{uuid}.jpg`. Tech.md prati tiket 11. Vlasništvo se tada provjerava preko `storage.objects.owner_id` i reda u `report_photos`, a `sendReport` provjerava `owner_id` prije slanja. Folder `{report_id}/…` bi tražio da nacrt postoji prije otpreme, pa bi otprema i analiza išle jedna za drugom.
- `agent_runs`: red po koraku (`classify`, `jurisdiction`, `duplicates`, `letter`), sa modelom, trajanjem, `usage` (ulazni i izlazni tokeni), `stop_reason`, ishodom i kodom greške; bez imena, mejla i slike.
- Adresa uz prijavu: tekst, nullable (Nominatim može ne odgovoriti), plus izvor (`nominatim` / `photon`).
- RPC koje Tech.md pretpostavlja: provjera „tačka je u Podgorici" (može biti dio `resolve_jurisdiction`), `resolve_jurisdiction(category, tačka)`, duplikati do 50 m (otvorene, nesakrivene, ista vrsta), dodavanje i uklanjanje fotografija nacrta, podrška, „Podrži postojeću" (podrška + brisanje nacrta i fotografija).
- Realtime: `like_count` na `reports`, `reports` u publikaciji `supabase_realtime`, tabela podrški ne.

### Za provjeru

1. **Next.js zakrpa** ujutru 3. 11. još nije bila na npm-u. Čim izađe, upisati tačan broj u Tech.md §2 (`next` i `eslint-config-next`) i ne deploy-ovati 16.4.4.
2. **Slika za model ne prolazi kroz Storage** (ide `multipart` zahtjevom na `classify`), suprotno preporuci nalaza 04. Ako želiš da model vidi baš sačuvanu fotografiju, alternativa je da server pročita verziju od 1600 px iz Storage-a, ali je to sporije (otprema pa preuzimanje) i oko 2,4 puta više tokena.
3. **Adresa ispod pina** (tiket 15) znači više Nominatim poziva po prijavi nego što nalaz 03 preporučuje („samo jednom, na potvrdu pina"). Ublaženo: poziv tek kad se mapa smiri, samo preko servera, najviše 1/s po korisniku. Ako Nominatim počne da odbija, prvo se ukida adresa ispod pina, a konačna adresa ostaje.
4. **Lokacija van Podgorice:** `prepare` traži poznatu vrstu, pa poruku „van Podgorice" građanin vidi tek kad analiza završi (najviše 15 s) ili kad ručno izabere vrstu. Tiket 15 je stavlja prije izbora vrste. Slučaj je rijedak; ako smeta, provjera se izdvaja u mali poziv na „Potvrdi lokaciju".
5. **Konflikt putanje fotografija** između tiketa 11 i 15 (vidi „Za DB.md"); Tech.md prati tiket 11.
6. **pnpm 12 na Vercelu:** `"packageManager": "pnpm@12.16.1"` potvrditi na prvom deploy-u; ako Vercel ne prihvati, preći na pnpm 11.
7. **`shadcn init --template next` u repou koji već ima dokumente:** CLI može pitati za ime projekta i napraviti podfolder; tada sadržaj premjestiti u korijen.
8. **Imena ključeva:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` umjesto `…_ANON_KEY` iz tvog spiska; `SUPABASE_SERVICE_ROLE_KEY` zadržava ime iz AGENTS.md, iako Supabase novi ključ zove „secret key" (`sb_secret_…`), i oba rade.
9. Ograničenje 1/s na `/api/geo/reverse` čuva se u memoriji funkcije, pa nije strogo kad Vercel pokrene više instanci. Za demo je dovoljno.

### Novi tiketi / magla

- **Tiket 20** (dopuna): mjeriti i sa 3 slike u jednom pozivu (kao i tiket 15) i potvrditi da poziv radi nepromijenjen i na `claude-sonnet-5-5` (isti kod, samo `ANTHROPIC_MODEL`).
- **Magla:** CI (GitHub Actions) za `typecheck`/`lint`/`test` na PR-u (već predložio tiket 12).
- **Magla:** brisanje napuštenih nacrta i njihovih fotografija iz Storage-a (već predložio tiket 15).
- **Za rječnik (09):** „korak agenta".
