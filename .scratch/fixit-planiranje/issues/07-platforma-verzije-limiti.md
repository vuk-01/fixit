# 07 — Next.js, Vercel i Supabase: verzije i ograničenja besplatnih planova

Type: research
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Koje su trenutne stabilne verzije i ograničenja platformi na kojima gradimo, da `Tech.md` propiše nešto što radi od prvog dana?

Treba utvrditi:

1. Next.js: trenutna stabilna verzija, App Router; server actions vs. route handlers za upload i agent tok; streaming odgovora (SSE / `ReadableStream`) na Vercelu.
2. Vercel Hobby (i Pro, ako je razlika presudna): maksimalno trajanje funkcije, veličina request body-ja (upload fotografije ide direktno u Supabase Storage ili kroz našu funkciju?), regioni (blizina Supabase regionu), env varijable po okruženju, preview deploy-i.
3. Supabase Free: PostGIS ekstenzija, Realtime (limiti konekcija i poruka; Postgres Changes vs. Broadcast; kako RLS utiče na Realtime), Storage (limit, javni vs. privatni bucket, potpisani URL-ovi, transformacije slika: na kom planu), anonimne sesije, pauziranje projekta zbog neaktivnosti, region (EU).
4. `@supabase/ssr` sa Next.js App Router-om: preporučen obrazac (middleware/proxy, server/client klijenti), generisanje tipova (`supabase gen types`), Supabase CLI tok za migracije (`migration new`, `db push`) i da li lokalni razvoj traži Docker.
5. Tailwind CSS i shadcn/ui: trenutne verzije; šta je „preset" u `components.json` / `shadcn create`; shadcn MCP server (UI.md ga pominje): kako se podešava za Claude Code.
6. Vitest / Playwright: šta je uobičajeno sa Next.js trenutne verzije (samo radi preporuke za 17).

Odluke koje ovo čeka: Tehnički stack (17).

Nalaze zapisati u `.scratch/fixit-planiranje/research/07-platforma-verzije-limiti.md`.

## Answer

- **[istraživanje]** Next.js `latest` je 16.4.4 (React 19.3.1), ali je za **utorak 3. 11. 2026.** zakazano bezbjednosno izdanje (7 ranjivosti srednje težine), pa treba pinovati zakrpljenu 16.4.x. `middleware.ts` je od v16 preimenovan u `proxy.ts` (Node runtime). `create-next-app` od 16.4 uključuje Cache Components.
- **[istraživanje]** Vercel Hobby: funkcija traje najviše 300 s, tijelo zahtjeva i odgovora je ograničeno na 4,5 MB (Server Action podrazumijevano 1 MB), funkcije rade u jednom regionu (podrazumijevano `iad1`, pa ga treba promijeniti), runtime logovi traju 1 h. Hobby je samo za nekomercijalnu upotrebu i **ne može se povezati sa repoom u GitHub organizaciji**.
- **[istraživanje]** Fotografija zato treba da ide direktno iz pregledača u Supabase Storage (RLS `INSERT` na `storage.objects`, folder = `auth.uid()`), a serveru samo putanja. Supabase transformacije slika **nijesu na Free planu**.
- **[istraživanje]** Supabase Free: 500 MB baze, 1 GB Storage-a, 50 MB po fajlu, 200 Realtime konekcija, 100 poruka/s, 2 projekta, pauziranje poslije 7 dana neaktivnosti. PostGIS se uključuje u šemi `extensions`. Region za EU: `eu-central-1` (Frankfurt), u paru sa Vercel `fra1`.
- **[istraživanje]** Realtime: Postgres Changes provjeravaju RLS za svaki događaj i svakog pretplatnika (jednostavno, ne može se lažirati, slabije skalira). Supabase preporučuje Broadcast, ali privatni kanali traže sesiju i politike na `realtime.messages`. Anonimni korisnici imaju ulogu `authenticated` i claim `is_anonymous`, uz podrazumijevano ograničenje od 30 prijava na sat po IP-u.
- **[istraživanje]** `@supabase/ssr` 0.12.7: browser i server klijent sa `getAll`/`setAll`, `proxy.ts` koji poziva `getClaims()`, env `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Zaštita stranica ide preko `getClaims()`, nikad preko `getSession()` na serveru.
- **[istraživanje]** **Supabase CLI 3.0.0 je izašao 2. 11. 2026.** sa izmjenama koje lome kompatibilnost: `db push` i `gen types` bez cilja sada gađaju lokalnu bazu, za hostovani projekat ide `--remote`, a `--project-id` je zastario. Lokalni stack traži container runtime (OrbStack, Docker, Podman), osim eksperimentalnog `--runtime native`.
- **[istraživanje]** Tailwind 4.3.3 (bez `tailwind.config`), shadcn CLI 4.23.0 (Base UI je podrazumijevan, Radix sa `-b radix`). „Preset" je kod koji se razlaže u polja `components.json` (polje `preset` ne postoji); dobija se sa `shadcn preset resolve`. MCP se podešava sa `npx shadcn@latest mcp init --client claude`.
- **[istraživanje]** Testovi: Next dokumentacija preporučuje Vitest za unit testove i E2E (Playwright 1.64.1) za async Server Components. Vitest 5 traži Node ≥ 22.12. Prijedlog: Vitest 5.0.5, Node 24.x.

[Nalazi](../research/07-platforma-verzije-limiti.md)
