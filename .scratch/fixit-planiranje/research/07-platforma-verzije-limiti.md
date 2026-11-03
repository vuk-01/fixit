# 07 — Next.js, Vercel i Supabase: verzije i ograničenja besplatnih planova

Istraživanje za tiket [07](../issues/07-platforma-verzije-limiti.md). Sve izvore pristupljeno **2. 11. 2026.** (u tekstu: „pristup 2026-11-02"). Verzije paketa su očitane iz npm registra (`npm view <paket> version` / `time` / `dist-tags`) istog dana. Gdje je nešto moj zaključak, a ne tvrdnja izvora, piše **(zaključak)**.

---

## 1. Next.js

### 1.1 Verzija

- Trenutna stabilna: **`next@16.4.4`** (dist-tag `latest`, objavljena 2026-11-02 10:49 UTC). 16.4.0 je izašla 2026-10-06. Izvor: npm registar; [nextjs.org/blog/next-16-4](https://nextjs.org/blog/next-16-4) (pristup 2026-11-02).
- **Zakazano bezbjednosno izdanje u utorak 3. 11. 2026** (prvi dan izgradnje): „will address seven medium vulnerabilities in Next.js … We recommend upgrading to a patched version once the release is available." Brojevi verzija još nijesu objavljeni. Izvor: [nextjs.org/blog/upcoming-nextjs-security-release-november-2026](https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026) (pristup 2026-11-02).
- Vercel je ranije automatski blokirao nove deploy-e sa ranjivom verzijom Next.js-a (CVE-2025-66478, 5. 12. 2025). Izvor: [vercel.com/changelog/new-deployments-of-vulnerable-next-js-applications-are-now-blocked-by](https://vercel.com/changelog/new-deployments-of-vulnerable-next-js-applications-are-now-blocked-by) (pristup 2026-11-02). **(zaključak)** Treba računati da Vercel može slično blokirati i ranjive verzije iz novembarskog izdanja, pa je pin na zakrpljenu verziju obavezan, ne opcion.
- Next 16.4 donosi **React 19.3**. `react@19.3.1` / `react-dom@19.3.1` (2026-10-14). Izvor: blog 16.4 (gore), npm.
- `next@16.4.4` traži Node `>=20.9.0` (`npm view next engines`).
- **Cache Components su od 16.4 podrazumijevano uključeni u novim aplikacijama iz `create-next-app`** („all new apps created with `create-next-app` will have Cache Components enabled by default"); to postaje podrazumijevano u Next.js 17. Izvor: blog 16.4 (gore). **(zaključak)** Stranice koje čitaju Supabase sesiju preko kolačića su dinamičke i u tom modelu idu iza `<Suspense>`. Supabase dodatno upozorava da statičko renderovanje može keširati podatke korisnika između različitih anonimnih korisnika i preporučuje dinamičko renderovanje: [supabase.com/docs/guides/auth/auth-anonymous](https://supabase.com/docs/guides/auth/auth-anonymous) (pristup 2026-11-02).

### 1.2 `middleware` → `proxy`

- Od Next 16.0: „Middleware is deprecated and renamed to Proxy. Proxy defaults to the Node.js runtime". Fajl je `proxy.ts` u korijenu (ili u `src/`), a funkcija se zove `proxy`. `runtime` se u Proxy-ju ne može podesiti. Codemod: `npx @next/codemod@canary middleware-to-proxy .`. Izvor: [nextjs.org/docs/app/api-reference/file-conventions/proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) (pristup 2026-11-02).
- Server Functions nijesu posebne rute: matcher koji isključi putanju preskače i Server Action pozive na njoj. Zato „Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone." Izvor: isto.

### 1.3 Server Actions i Route Handlers (upload i agent tok)

- **Server Actions**: podrazumijevano ograničenje tijela zahtjeva je **1 MB** (`serverActions.bodySizeLimit`, uključujući multipart overhead). Izvor: [nextjs.org/docs/app/api-reference/config/next-config-js/serverActions](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) (pristup 2026-11-02).
- Klijent šalje Server Actions **jedan po jedan** („Next.js dispatches Server Actions one at a time per client"). Odgovor je jedan Flight odgovor sa povratnom vrijednošću i eventualno ponovo renderovanom rutom. Svaka akcija je javni POST endpoint, pa se autentikacija i validacija rade unutar akcije. Izvor: [nextjs.org/docs/app/guides/server-actions](https://nextjs.org/docs/app/guides/server-actions) (pristup 2026-11-02).
- **Route Handlers** (`app/**/route.ts`) rade sa Web `Request`/`Response`. Dokumentacija ima primjer streaminga sa `new Response(new ReadableStream(...))` i čitanje `request.formData()`. `GET` handleri su od v15 podrazumijevano dinamički. Izvor: [nextjs.org/docs/app/api-reference/file-conventions/route](https://nextjs.org/docs/app/api-reference/file-conventions/route) (pristup 2026-11-02).
- **(zaključak)** Za korake agenta koje korisnik prati uživo (prepoznavanje → nadležnost → tekst) prirodan izbor je Route Handler koji vraća `ReadableStream` (SSE ili NDJSON). Server Action je bolji za kratke mutacije (promjena statusa u panelu, „Like" preko RPC-a).

### 1.4 Streaming na Vercelu

- Streaming je podrazumijevano uključen za Node.js Vercel funkcije. Primjer vraća `Content-Type: text/event-stream`. Izvor: [vercel.com/docs/functions/streaming-functions](https://vercel.com/docs/functions/streaming-functions) (pristup 2026-11-02).
- Maksimalno trajanje uključuje i vrijeme streamovanja odgovora („including streamed responses"). Izvor: [vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations) (pristup 2026-11-02).

---

## 2. Vercel (Hobby; Pro samo gdje je razlika bitna)

Izvori: [vercel.com/docs/functions/limitations](https://vercel.com/docs/functions/limitations), [vercel.com/docs/limits](https://vercel.com/docs/limits), [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby) (svi pristup 2026-11-02).

| Stavka | Hobby | Pro |
|---|---|---|
| Max trajanje funkcije (Fluid compute, Node.js) | **300 s** (podrazumijevano i maksimum) | 300 s podrazumijevano, 800 s maks., 1800 s beta |
| Memorija / CPU | 2 GB / 1 vCPU | do 4 GB / 2 vCPU |
| **Tijelo zahtjeva / odgovora** | **4,5 MB** (inače 413 `FUNCTION_PAYLOAD_TOO_LARGE`) | isto |
| Regioni funkcija | **jedan region** | do 5 |
| Deploy-a dnevno | 100 | 6000 |
| Istovremeni build-ovi | 1 | do 500 |
| Runtime logovi | **1 sat** | 1 dan |
| Uključeno mjesečno | 1M invokacija, 4 CPU-sata Active CPU, 360 GB-h memorije, 100 GB Fast Data Transfer, 5.000 transformacija slika | kredit |
| Prekoračenje | čeka se 30 dana | naplata |

- Hobby je „non-commercial, personal use only". Nema „team collaboration features" (to je Pro, $20 po developer mjestu mjesečno). Postoji Pro trial. Izvor: [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby).
- **Hobby projekat se ne može povezati sa Git repozitorijumom koji pripada Git organizaciji** („Vercel does not support connecting a project on your Hobby team to Git repositories owned by Git organizations"). Izvor: [vercel.com/docs/limits](https://vercel.com/docs/limits#connecting-a-project-to-a-git-repository).
- **Regioni:** funkcije se podrazumijevano izvršavaju u `iad1` (Washington, D.C.). Mijenja se u Settings → Functions → Function Regions ili sa `"regions": ["fra1"]` u `vercel.json`. Evropski regioni: `fra1` (eu-central-1, Frankfurt), `cdg1` (eu-west-3, Pariz), `dub1` (eu-west-1), `lhr1` (eu-west-2), `arn1` (eu-north-1). „Functions should be executed in the same region as your database." Izvori: [vercel.com/docs/regions](https://vercel.com/docs/regions), [vercel.com/docs/functions/configuring-functions/region](https://vercel.com/docs/functions/configuring-functions/region) (pristup 2026-11-02).
- **Env varijable:** po okruženju (Production, Preview, Development, i custom okruženja), a za Preview i po grani. Izmjena važi **samo za nove deploy-e**. `vercel env pull` puni lokalni `.env`. Ukupno do 64 KB po deploy-u. Postoje tipovi Config i Secret (Secret je write-only). Izvor: [vercel.com/docs/environment-variables](https://vercel.com/docs/environment-variables) (pristup 2026-11-02).
- **Preview deploy-i:** svaki push na granu koja nije produkciona pravi Preview deploy sa Preview varijablama. Izvor: isto. Hobby ima Vercel Authentication za zaštitu preview i produkcionih deploy-a (pa preview link može tražiti Vercel prijavu); Password Protection je samo na Pro-u. Izvor: [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby).
- **Node.js na Vercelu:** dostupni 26.x (podrazumijevano), 24.x i 22.x. Pin se radi preko `engines.node` u `package.json`. Izvor: [vercel.com/docs/functions/runtimes/node-js/node-js-versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) (pristup 2026-11-02).

**(zaključak) Upload fotografije:** zbog ograničenja od 4,5 MB (Vercel) i 1 MB (Server Action) fotografija ne treba da prolazi kroz našu funkciju. Klijent je kompresuje (FR-2: 1600 px JPEG) i šalje direktno u Supabase Storage, a funkciji prosljeđuje samo putanju objekta.

---

## 3. Supabase Free

Izvor tabele: [supabase.com/pricing](https://supabase.com/pricing) (pristup 2026-11-02).

| Stavka | Free | Pro (od $25/mj.) |
|---|---|---|
| Baza | 500 MB (shared CPU, 500 MB RAM) | 8 GB |
| Egress | 5 GB (+5 GB keširani) | 250 GB |
| Storage | **1 GB** | 100 GB |
| Max veličina fajla | **50 MB** | 500 GB |
| MAU | 50.000 | 100.000 |
| Realtime vršne konekcije | **200** | 500 |
| Realtime poruke/mjesečno | 2 miliona | 5 miliona |
| Transformacije slika | **nije uključeno** | uključeno |
| Pauziranje zbog neaktivnosti | **poslije 1 sedmice** | nikad |
| Aktivni projekti | 2 | — |
| Dnevni backup | nema | 7 dana |

### 3.1 PostGIS

- Uključuje se sa `create extension postgis with schema "extensions";` (ne u `public`, jer pravi `spatial_ref_sys`). Primjer kolone: `extensions.geography(POINT)`. Indeks: `using GIST (location)`. Upiti idu kroz funkcije koje se zovu sa `rpc()`. Izvor: [supabase.com/docs/guides/database/extensions/postgis](https://supabase.com/docs/guides/database/extensions/postgis) (pristup 2026-11-02). Stranica ne navodi ograničenje po planu.

### 3.2 Realtime

- Limiti (Free / Pro): 200 / 500 konekcija; **100 / 500 poruka u sekundi**; 100 / 500 pridruživanja kanalu u sekundi; 100 kanala po konekciji; Broadcast payload 256 KB / 3.000 KB; Postgres Changes payload 1.024 KB (iznad toga ostaju samo polja ≤ 64 bajta). Izvor: [supabase.com/docs/guides/realtime/limits](https://supabase.com/docs/guides/realtime/limits) (pristup 2026-11-02).
- **Postgres Changes:** „authorizes every event against each subscriber", tako da propusnost raste sa brojem pretplatnika, a ne sa brojem upisa. Promjene se obrađuju na jednoj niti, i veći compute ih ne ubrzava bitno. Uključuje se sa `alter publication supabase_realtime add table …`. „RLS policies are not applied to `DELETE` statements." Filteri se kombinuju samo sa `AND`. Izvor: [supabase.com/docs/guides/realtime/postgres-changes](https://supabase.com/docs/guides/realtime/postgres-changes) (pristup 2026-11-02).
- **Broadcast:** Supabase ga preporučuje („recommended method for scalability and security … We recommend using Broadcast for most use cases"). Iz baze se šalje trigerom preko `realtime.broadcast_changes(...)` ili `realtime.send(payload, event, topic, private)`. Izvor: [supabase.com/docs/guides/realtime/subscribing-to-database-changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes), [supabase.com/docs/guides/realtime/broadcast](https://supabase.com/docs/guides/realtime/broadcast) (pristup 2026-11-02).
  - Privatni kanali (podrazumijevano `private => true`) traže RLS politike na `realtime.messages` (`select` za prijem, `insert` za slanje) i `supabase.realtime.setAuth()` na klijentu. Za stvarno sprovođenje treba isključiti „Allow public access". Izvor: [supabase.com/docs/guides/realtime/authorization](https://supabase.com/docs/guides/realtime/authorization) (pristup 2026-11-02).
  - Javni kanali: „anyone can subscribe without authentication". Poruke u `realtime.messages` brišu se poslije 3 dana. Prije prvog slanja iz baze neki klijent mora da se poveže preko WebSocket-a, jer konekcija pravi dnevne particije („Without a partition, the insert fails"). Izvor: broadcast stranica (gore).
  - **(zaključak)** Izvor ne kaže eksplicitno da klijenti ne mogu *slati* na javni kanal, a politike važe samo za privatne kanale. Zato poruke na javnom kanalu ne treba smatrati pouzdanim podatkom, nego samo signalom.
- **Kako RLS utiče:** kod Postgres Changes važi RLS tabele: korisnik dobija samo redove koje smije da čita (uz cijenu jedne provjere po pretplatniku). Kod Broadcast-a važe politike na `realtime.messages`, a ne RLS tabele iz koje triger šalje. Izvori: postgres-changes i authorization stranice (gore).

### 3.3 Storage

- **Javni bucket:** preuzimanje bez kontrole pristupa (svako ko ima URL), a upload, brisanje i premještanje i dalje idu kroz RLS. **Privatni bucket:** sve, uključujući preuzimanje, ide kroz RLS na `storage.objects` (JWT ili vremenski ograničen potpisani URL, `createSignedUrl`). Ograničenja veličine i MIME tipova postavljaju se po bucket-u. Izvor: [supabase.com/docs/guides/storage/buckets/fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals) (pristup 2026-11-02).
- Upload traži samo `INSERT` politiku na `storage.objects` (upsert traži i `SELECT` + `UPDATE`). Bez politika upload nije dozvoljen. Primjer ograničava upload na folder `(storage.foldername(name))[1] = (select auth.jwt()->>'sub')`. Service ključ zaobilazi RLS i koristi se samo na serveru. Izvor: [supabase.com/docs/guides/storage/security/access-control](https://supabase.com/docs/guides/storage/security/access-control) (pristup 2026-11-02).
- Standardni upload je namijenjen fajlovima do 6 MB (za veće se preporučuje TUS resumable). Podrazumijevano nema prepisivanja (`400 Asset Already Exists`). Izvor: [supabase.com/docs/guides/storage/uploads/standard-uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) (pristup 2026-11-02).
- Globalno ograničenje veličine fajla na Free planu je 50 MB, a bucket može imati manje. Izvor: [supabase.com/docs/guides/storage/uploads/file-limits](https://supabase.com/docs/guides/storage/uploads/file-limits) (pristup 2026-11-02).
- `createSignedUploadUrl` pravi potpisani URL za upload koji „are valid for 2 hours". Izvor: [supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl](https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl) (pristup 2026-11-02).
- **Transformacije slika: samo Pro i viši** („Image Resizing is currently enabled for Pro Plan and above"). Ograničenja: 1–2500 px, izvor do 25 MB / 50 MP, a HEIC je samo ulazni format. Izvor: [supabase.com/docs/guides/storage/serving/image-transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) (pristup 2026-11-02). Na Free planu klijentska kompresija (FR-2) je jedino smanjivanje.

### 3.4 Anonimne sesije

- Uključuju se u dashboard-u (Auth providers → Anonymous Sign-Ins). Klijent: `supabase.auth.signInAnonymously()`. Anonimni korisnik ima ulogu **`authenticated`**, a JWT ima claim `is_anonymous`. U RLS-u se razlikuje preko `auth.jwt()->>'is_anonymous'`, i preporučuju se *restrictive* politike. Podrazumijevano ograničenje je **30 zahtjeva na sat po IP adresi** (može se mijenjati), uz preporuku za CAPTCHA/Turnstile. Automatskog čišćenja nema. Sesija se gubi odjavom, brisanjem podataka pregledača ili promjenom uređaja. Izvor: [supabase.com/docs/guides/auth/auth-anonymous](https://supabase.com/docs/guides/auth/auth-anonymous) (pristup 2026-11-02).
- **(zaključak)** 30 anonimnih prijava na sat po IP-u može smetati na demo-u ako mnogo ljudi u istoj sali (ista javna IP adresa, Wi-Fi) klikne „Like". Ograničenje treba podići u dashboard-u prije subote.

### 3.5 Pauziranje

- Free projekti se pauziraju poslije 7 dana slabe aktivnosti. Vlasnik dobija upozorenje mejlom oko sedmicu ranije. Nastavak ide preko „Resume project", a podaci se mogu vratiti do godinu dana. Nekoliko zahtjeva dnevno je obično dovoljno. Izvor: [supabase.com/docs/guides/platform/free-project-pausing](https://supabase.com/docs/guides/platform/free-project-pausing) (pristup 2026-11-02).

### 3.6 Region (EU)

- Konkretni EU regioni: `eu-central-1` (Frankfurt), `eu-west-1` (Irska), `eu-west-3` (Pariz), `eu-north-1` (Stokholm), kao i `eu-west-2` (London) i `eu-central-2` (Cirih), koji nijesu u EU. „General region" Europe može završiti u Londonu ili Cirihu, pa za jurisdikciju treba izabrati konkretan region. Izvor: [supabase.com/docs/guides/platform/regions](https://supabase.com/docs/guides/platform/regions) (pristup 2026-11-02).
- Par sa istim AWS regionom: Supabase `eu-central-1` ↔ Vercel `fra1` (eu-central-1). Izvori: gore + [vercel.com/docs/regions](https://vercel.com/docs/regions).

---

## 4. `@supabase/ssr` sa App Router-om, tipovi, CLI

### 4.1 Preporučeni obrazac

Izvor: [supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs) (pristup 2026-11-02).

- Env varijable: `NEXT_PUBLIC_SUPABASE_URL`, **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** (dokumentacija koristi „publishable" ključ, ne naziv `ANON_KEY`).
- Klijenti su u `lib/supabase/`: browser klijent (`createBrowserClient`, singleton) i server klijent (`createServerClient`, nov po zahtjevu). Oba koriste `cookies.getAll` / `setAll`. U Server Komponentama `setAll` ide u try/catch.
- **`proxy.ts` na Next 16+** (na 15 i ranije `middleware.ts`). Proxy pravi server klijent, poziva `supabase.auth.getClaims()` (osvježava token), upisuje kolačiće u request i response i vraća baš taj response. Matcher preskače rute koje ne diraju Supabase.
- „Always use `supabase.auth.getClaims()` to protect pages and user data." / „Never trust `supabase.auth.getSession()` inside server code such as Proxy." Odgovori koji postavljaju sesiju ne smiju u CDN/ISR keš.
- Verzije: `@supabase/ssr@0.12.7` (2026-09-08, peer `@supabase/supabase-js ^2.114.0`), `@supabase/supabase-js@2.118.0` (2026-10-15). Izvor: npm.

### 4.2 Supabase CLI: **v3.0.0 je izašao danas (2. 11. 2026)**

- npm `supabase@3.0.0` (dist-tag `latest`, 2026-11-02). Prethodna linija: `v2.stable` = 2.122.1. Izvor: npm; [github.com/supabase/cli/releases/tag/v3.0.0](https://github.com/supabase/cli/releases/tag/v3.0.0) (pristup 2026-11-02).
- Promjene koje lome kompatibilnost (izvor: GitHub release, gore):
  - `db push` bez cilja sada gađa **lokalni** stack. Za hostovani projekat ide `--remote` (povezani) ili `--remote=<ref>`. Traži potvrdu (podrazumijevani odgovor je „No"), a u CI-ju/neinteraktivno treba `--yes`. `--project-ref` je zastario.
  - `gen types` bez cilja generiše tipove iz lokalne baze. `--project-id` je zastario, umjesto njega ide `--remote`.
  - `supabase link --password` se ignoriše.
  - Flagovi i `SUPABASE_*` env varijable sada imaju prednost nad `config.toml`.
- Dokumentacija već koristi v3 sintaksu:
  - Migracije: `supabase migration new <naziv>` → `supabase db reset` (lokalno) → `supabase link` → `supabase db push --remote`. Izvor: [supabase.com/docs/guides/deployment/database-migrations](https://supabase.com/docs/guides/deployment/database-migrations) (pristup 2026-11-02).
  - Tipovi: `npx supabase gen types typescript --remote="$PROJECT_REF" --schema public > database.types.ts` (traži `supabase login` sa Personal Access Token-om). Izvor: [supabase.com/docs/guides/api/rest/generating-types](https://supabase.com/docs/guides/api/rest/generating-types) (pristup 2026-11-02).
- **Docker:** `supabase start` (lokalni stack) traži container runtime: Docker Desktop, **OrbStack (preporučen na macOS-u)**, Rancher Desktop, Podman ili colima. Postoji i eksperimentalni nativni runtime bez kontejnera (`supabase start --runtime native`, Linux i macOS na Apple silicon-u). CLI preko npm/npx traži Node ≥ 20. Instalacija: `npm install supabase --save-dev` ili `brew install supabase/tap/supabase`. Izvori: [supabase.com/docs/guides/local-development/cli/getting-started](https://supabase.com/docs/guides/local-development/cli/getting-started), GitHub release v3.0.0 (pristup 2026-11-02).
- **(zaključak)** Komande nad hostovanim projektom (`db push --remote`, `gen types --remote`) rade preko API-ja i baze. Izvor ne kaže eksplicitno da im treba Docker, ali ni da im ne treba. Tim može raditi bez lokalnog stack-a (migracije direktno na hostovani dev projekat), ali tada nema `db reset` testiranja migracija. Provjeriti prvog dana.
- **(zaključak)** Tutorijali, AI asistenti i stari skriptovi koji koriste `--project-id`, `--linked` ili `db push` bez flaga ponašaće se drugačije pod v3. CLI treba pinovati tačno kao devDependency.

---

## 5. Tailwind CSS i shadcn/ui

- **Tailwind:** `tailwindcss@4.3.3` i `@tailwindcss/postcss@4.3.3` (2026-07-16). Postavka za Next: `npm install tailwindcss @tailwindcss/postcss postcss`, `postcss.config.mjs` sa `"@tailwindcss/postcss": {}` i `@import "tailwindcss";` u `app/globals.css`. Bez `tailwind.config.js`. Izvor: [tailwindcss.com/docs/installation/framework-guides/nextjs](https://tailwindcss.com/docs/installation/framework-guides/nextjs) (pristup 2026-11-02), npm.
- **shadcn CLI:** `shadcn@4.23.0` (2026-10-27). `init`/`create` (alias) sa `--preset`, `--base` (`base`, `radix`, `aria`) i `--template next`. `init` dodaje `@import "shadcn/tailwind.css"` u globalni CSS. Izvor: [ui.shadcn.com/docs/cli](https://ui.shadcn.com/docs/cli) (pristup 2026-11-02).
- **Base UI je od jula 2026. podrazumijevana osnova za nove projekte.** Radix ostaje sa `-b radix` i nije zastario. Izvor: [ui.shadcn.com/docs/changelog/2026-07-base-ui-default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default) (pristup 2026-11-02).
- **Šta je „preset":** kratak kod (npr. `b5owWMfJ8l`) koji kodira dizajn konfiguraciju: style, baseColor, theme, chartColor, iconLibrary, font, fontHeading, radius, menuAccent, menuColor. Pravi se vizuelno na `ui.shadcn.com/create`, a primjenjuje sa `shadcn init --preset <kod> --template next` (nov projekat) ili `shadcn apply` (postojeći). Komande: `shadcn preset decode <kod>`, `shadcn preset resolve` (izvodi preset iz postojećeg projekta), `shadcn preset url|open`. Izvori: [ui.shadcn.com/docs/changelog/2026-04-preset-commands](https://ui.shadcn.com/docs/changelog/2026-04-preset-commands), [ui.shadcn.com/docs/installation/next](https://ui.shadcn.com/docs/installation/next) (pristup 2026-11-02).
- **`components.json` nema polje `preset`.** JSON šema ima `style`, `tailwind`, `rsc`, `tsx`, `iconLibrary`, `aliases`, `menuColor`, `menuAccent`, `rtl`, `registries`. Vrijednosti `style` su npr. `base-nova`, `radix-luma`, `aria-vega`… Izvor: [ui.shadcn.com/schema.json](https://ui.shadcn.com/schema.json) (pristup 2026-11-02). `style`, `tailwind.baseColor` i `tailwind.cssVariables` se ne mogu mijenjati poslije `init`-a. Za Tailwind v4 `tailwind.config` ostaje `""`. Izvor: [ui.shadcn.com/docs/components-json](https://ui.shadcn.com/docs/components-json) (pristup 2026-11-02).
  - **(zaključak)** Pravilo iz `UI.md` „use preset from components.json" u praksi znači: preset je razložen u polja `components.json`, a kod se dobija sa `npx shadcn preset resolve`. Preset kod vrijedi zapisati u `Tech.md`/`UI.md` radi ponovljivosti.
- **shadcn MCP za Claude Code:** `npx shadcn@latest mcp init --client claude` ili ručno `.mcp.json` u korijenu:
  ```json
  { "mcpServers": { "shadcn": { "command": "npx", "args": ["shadcn@latest", "mcp"] } } }
  ```
  Zatim restart Claude Code-a i provjera sa `/mcp`. Treba ispravan `components.json`. Podrazumijevani registar ne traži konfiguraciju. MCP pretražuje, pregleda i instalira komponente iz registara. Izvor: [ui.shadcn.com/docs/mcp](https://ui.shadcn.com/docs/mcp) (pristup 2026-11-02).

---

## 6. Vitest / Playwright

- Next.js dokumentacija navodi Vitest i Jest za unit testove, a Playwright i Cypress za E2E. Za `async` Server Components preporučuje E2E: „Vitest currently does not support them". Postavka za Vitest: `vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths` i `vitest.config.mts` sa `environment: 'jsdom'`. Izvori: [nextjs.org/docs/app/guides/testing](https://nextjs.org/docs/app/guides/testing), [nextjs.org/docs/app/guides/testing/vitest](https://nextjs.org/docs/app/guides/testing/vitest) (pristup 2026-11-02).
- Verzije: `vitest@5.1.0` (`latest`, objavljena **danas**, 2026-11-02 16:12 UTC). 5.0.0 je izašla 2026-09-03, poslednja 5.0.x je **5.0.5**. Vitest 5 traži Node `^22.12.0 || ^24.0.0 || >=26.0.0`. `@playwright/test@1.64.1` (2026-10-14). `next` ima opcioni peer `@playwright/test ^1.51.1`. Izvor: npm.

---

## Preporuka

> Ovo je **preporuka** za odluku u tiketu 17 (Tehnički stack), ne odluka.

**1. Verzije za pin (tačne, bez `^`, u `package.json`):**

| Paket | Verzija | Napomena |
|---|---|---|
| `next` | **zakrpljena 16.4.x iz izdanja od 3. 11. 2026.** | Ne počinjati na 16.4.4. Sačekati objavu u utorak i odmah pinovati zakrpu. |
| `react`, `react-dom` | 19.3.1 | Uz Next 16.4. |
| `@supabase/supabase-js` | 2.118.0 | |
| `@supabase/ssr` | 0.12.7 | |
| `supabase` (CLI, devDependency) | 3.0.0 | Dokumentacija je već na v3 sintaksi. Ako se pojavi blokirajući bag, fallback je `2.122.1` (`v2.stable`), ali tada stare komande. |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | |
| `shadcn` (CLI) | 4.23.0 | I u `.mcp.json` `shadcn@4.23.0` umjesto `@latest`, da agenti ne povuku drugu verziju usred sedmice. |
| `vitest` | 5.0.5 | 5.1.0 je stara nekoliko sati; 5.0.x je provjerena dva mjeseca. |
| `@playwright/test` | 1.64.1 | Samo ako 17 uvede E2E. |
| Node | `engines.node: "24.x"` | Isti major lokalno i na Vercelu; zadovoljava Next (≥ 20.9), Vitest 5 i Supabase CLI. |

Na shadcn `init`-u izabrati bazu (`base` je podrazumijevano, ili `-b radix`) i zapisati preset kod u `UI.md`.

**2. Regioni:** Supabase projekat u **`eu-central-1` (Frankfurt)**, konkretan region, ne „general Europe". Vercel funkcije u **`fra1`** preko `vercel.json` `"regions": ["fra1"]`, da podešavanje bude u repou, a ne samo u dashboard-u. Hobby dozvoljava tačno jedan region, što je ovdje dovoljno.

**3. Upload fotografije:** klijent kompresuje (FR-2) i otprema **direktno u Supabase Storage** sa korisnikovom sesijom (`supabase.storage.from(...).upload`), u putanju `<auth.uid()>/<uuid>.jpg`. RLS `INSERT` politika ograničava folder na `auth.jwt()->>'sub'`, a bucket ima `allowed_mime_types = image/jpeg` i mali `file_size_limit` (npr. 5 MB). Serveru (Route Handler agenta) ide samo putanja. Server čita fotografiju admin klijentom i šalje je Claude-u. Tako se izbjegavaju ograničenja od 4,5 MB (Vercel) i 1 MB (Server Action).
- Bucket: zbog zahtjeva da administrator može **sakriti** fotografiju sa licima ili tablicama, **privatni bucket + potpisani URL-ovi** su sigurniji (javni URL ostaje dostupan i kad je prijava sakrivena). Cijena je to što javna mapa i `/p/[code]` dobijaju URL-ove sa servera. Javni bucket je jednostavniji, ali sakrivanje tada traži brisanje ili premještanje objekta. Odluka pripada 11/18.
- Supabase transformacije slika nijesu na Free planu. Ne računati na `?width=` URL-ove. Vercel `next/image` ima 5.000 transformacija mjesečno na Hobby-ju, što je dovoljno za demo.

**4. Agent tok:** Route Handler (`app/api/.../route.ts`, Node runtime) koji vraća `ReadableStream` sa SSE/NDJSON događajima po koraku, uz `export const maxDuration = 60` (budžet iz PRD-a je ≤ 8 s + ≤ 3 s, a strop na Hobby-ju je 300 s). Server Actions koristiti za kratke mutacije.

**5. Realtime za brojač lajkova (FR-17), uz RLS:**
- Brojač držati kao denormalizovanu kolonu na javnoj tabeli `reports` (npr. `like_count`), ažuriranu u istoj transakciji kao upis lajka (RPC ili triger). Identitet lajkera ostaje u tabeli lajkova kojoj Realtime nema pristup.
- **Za demo: Postgres Changes na `reports`** (`UPDATE`, filter `id=eq.<id>` na `/p/[code]`, bez filtera na mapi). RLS `reports` već dozvoljava javno čitanje, pa poruke stižu i posjetiocima bez sesije (uloga `anon`) i ne mogu se lažirati sa klijenta. Cijena „jedna RLS provjera po pretplatniku" je zanemarljiva uz Free limit od 200 konekcija.
- **Ako treba skalirati:** Broadcast iz trigera (`realtime.send(..., private => false)`) na topic `report:<id>` sa payload-om `{ id, like_count }`. Supabase ga preporučuje za skaliranje, ali javni kanal ne treba smatrati pouzdanim, pa klijent poruku koristi samo kao signal za ponovno čitanje broja. Privatni kanal traži sesiju, a posjetioci javne mape je nemaju dok ne kliknu „Like".
- Ne objavljivati tabelu lajkova u `supabase_realtime`. Postgres Changes ne primjenjuju RLS na `DELETE`.

**6. Ostala ograničenja koja treba odmah riješiti (Pon/Uto):**
- Ako je GitHub repo u **organizaciji**, Vercel Hobby ga ne može povezati. Rješenje je repo na ličnom nalogu, Pro trial ili deploy preko CLI-ja. Hobby je zvanično samo za nekomercijalnu ličnu upotrebu i nema timsku saradnju.
- Podići Supabase rate limit za anonimne prijave (30 na sat po IP-u) prije demo-a u sali sa zajedničkim Wi-Fi-jem.
- Runtime logovi na Hobby-ju traju 1 sat, pa greške agenta treba upisivati u `agent_runs` (kako PRD već traži), a ne oslanjati se na Vercel logove.
- Supabase Free se pauzira poslije 7 dana slabe aktivnosti. Za demo u subotu to nije problem, ali jeste za nastavak pilota.
- Env varijable na Vercelu važe tek za novi deploy. Poslije izmjene treba uraditi redeploy.
