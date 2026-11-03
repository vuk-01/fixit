# Mapa: planiranje Fixit-a do početka izrade

Type: map (wayfinder:map)
Napravljena: ponedjeljak, 2. 11. 2026.

## Destination

`PRD.md`, `Tech.md`, `DB.md`, `AGENTS.md` (i `UI.md`) su završeni i međusobno usaglašeni: svaka P0 funkcija ima odluku iz koje agent može graditi bez pitanja, šema/RPC/RLS/seed su zapisani, a nijedno otvoreno pitanje iz PRD §10 ne blokira izradu. Mapa se završava odlukama i ažuriranim dokumentima, ne kodom. Izrada počinje u utorak 3. 11.

## Notes

- **Kako odgovaraš:** svaki tiket ima `## Question` sa numerisanim pitanjima i mojom preporukom (➡️). Ispod svakog pitanja je red `**Tvoj odgovor:**`. Napiši „da" da prihvatiš preporuku, ili svoj odgovor. Ono što ostaviš prazno odlučujem ja.
- **Ko je šta odlučio:** u svakom `## Answer` i u „Decisions so far" svaka odluka je označena sa **[Ivana]** (tvoj odgovor), **[Claude]** (ostavila si prazno, pa sam odlučio ja) ili **[istraživanje]** (činjenica iz research tiketa, ne odluka).
- **Dokumenti se mijenjaju uz odluku:** ova mapa izuzetno nosi i pisanje dokumenata. Kad se tiket razriješi, u istoj sesiji se ažurira odgovarajuća sekcija `PRD.md` / `Tech.md` / `DB.md` / `AGENTS.md` / `UI.md` (pravilo iz AGENTS.md: „ako se odluka promijeni, ažuriraj dokument"). Pojmovi se upisuju u `GLOSSARY.md` čim se razriješe.
- **Zlatna pravila iz AGENTS.md važe za svaku odluku:** nadležnost samo iz `jurisdiction_rules` (nikad AI), svako pravilo ima izvor, samo `EMAIL_MODE=test`, RLS na svakoj tabeli, izmjene baze samo migracijama, sav tekst za korisnika na crnogorskom, latinicom, ijekavski.
- **Skillovi:** grilling tiketi → `grilling` + `domain-modeling`; research tiketi → `research`; tiketi 04 i 17 → i `claude-api`.
- **Jezik planiranja:** srpski, latinica. Tekst proizvoda: crnogorski, latinica, ijekavski.
- **Kritični put za utorak** (plan iz PRD §9: kamera + mapa, agent prepoznaje vrstu i nadležnog, auth i lista u panelu): 13 Vrste problema → 14 Pravila nadležnosti → 17 Tehnički stack → 18 Šema baze. Ako vrijeme pritisne, ove rješavamo prve.
- **Odstupanje od uobičajenog toka:** nalazi istraživanja se ne čuvaju na `research/<ime>` granama (repo još nema nijedan commit, a paralelni agenti dijele isti radni direktorijum), nego u `.scratch/fixit-planiranje/research/`, sa linkom iz tiketa.
- Tracker: lokalni markdown. Tiketi su u `issues/NN-*.md`, sa redovima `Type:`, `Status:` (`open` / `claimed` / `resolved`) i `Blocked by:`.

## Decisions so far

<!-- jedan red po zatvorenom tiketu: [naziv](link): suština odgovora, uz oznaku [Ivana]/[Claude]/[istraživanje] -->

- [Resend i Supabase Auth: slanje sa i bez domena](issues/05-mejl-i-auth-mejlovi.md): **[istraživanje]**
  - Bez domena Resend šalje samo na mejl vlasnika naloga, pa `TEST_INBOX` mora biti taj mejl.
  - Ugrađeni Supabase SMTP šalje samo članovima tima: žiri ne može potvrditi registraciju bez domena i custom SMTP-a ili bez isključenog `Confirm email`.
  - Anonimne sesije imaju ulogu `authenticated`, pa RLS mora provjeravati `is_anonymous = false`; limit je 30/h po IP-u.
- [Mapa, tile-ovi i reverse geocoding za Crnu Goru](issues/03-mapa-i-geokodiranje.md): **[istraživanje]**
  - Preporuka: Leaflet + react-leaflet (~46 KB) i standardni OSM tile-ovi, uz CARTO kao rezervu.
  - Za adresu: Nominatim sa servera, sa `accept-language=cnr-Latn`, jer `sr-Latn` vraća ćirilicu. Photon je rezerva.
- [Claude vision: model, latencija i strukturisan izlaz](issues/04-claude-vision.md): **[istraživanje]**
  - Preporuka: `claude-haiku-5-5` (`effort: low`), slika od 1024 px u base64, JSON preko `messages.parse()` + zod, timeout ~10–12 s.
  - Latencija ≤ 8 s i kvalitet ijekavice **nisu izmjereni**; plan testa (< $1) je u nalazima. Mjerenje je tiket [20 Mjerenje brzine i jezika modela](issues/20-mjerenje-modela.md).
- [Next.js, Vercel i Supabase: verzije i ograničenja](issues/07-platforma-verzije-limiti.md): **[istraživanje]**
  - Next.js 16: u utorak izlazi bezbjednosna zakrpa (koristimo tu verziju); `middleware.ts` se sada zove `proxy.ts`.
  - Vercel Hobby: region `fra1`, uz Supabase `eu-central-1`; fotografije idu direktno u Storage (limit je 4,5 MB); nema timova, nema org repoa, samo nekomercijalno.
  - Supabase CLI 3.0.0 mijenja komande (`--remote`), pa verziju fiksiramo. Brojač podrški: kolona `like_count` + Postgres Changes.
- [PWA kamera, galerija i GPS na iOS-u i Androidu](issues/06-pwa-kamera-lokacija.md): **[istraživanje]**
  - Kamera iz browsera uvijek traži okidač + „Use Photo"/✓.
  - Izvor fotografije se ne može otkriti (potrebna su dva dugmeta), a EXIF GPS je nepouzdan.
  - iOS vraća JPEG; kompresija ide bez biblioteke. Lokacija traži HTTPS; demo se izvodi u browseru, ne u instaliranoj PWA.
- [Granice opština i države: izvor podataka](issues/01-granice-opstina.md): **[istraživanje]**
  - 25 jedinica (ME-01–ME-25, uključujući Tuzi i Zetu); jedini ažuran izvor je OSM `admin_level=6` (ODbL, uz obaveznu atribuciju).
  - Dva naziva ispravljamo ručno (Prijestonica Cetinje, Ulcinj).
  - Granica države je poseban OSM poligon: opštine ne pokrivaju Skadarsko jezero ni more.
- [Ko je nadležan za koju vrstu problema u Podgorici](issues/02-nadleznost-podgorica.md): **[istraživanje]**
  - Sa izvorom: rasvjeta i semafori → Komunalne usluge; šahtovi i voda → ViK; otpad → Čistoća; kolovoz, trotoar i znakovi → Putevi / Sekretarijat za saobraćaj; zelenilo → Zelenilo.
  - Bez izvora: grafiti i napuštena vozila. CEDIS prima prijave kvarova samo telefonom. Pravila Podgorice ne važe automatski za Zetu i Tuzi.

- [Opseg demoa: opštine i scenario prezentacije](issues/08-opseg-demoa.md):
  - **[Ivana]** Samo Podgorica; demo je video od 1 min iz ugla građanina, bez QR koda i bez demoa uživo.
  - **[Claude]** Video snimamo kamerom i GPS-om na stvarnom problemu, a status mijenjamo u panelu van kadra.
  - ~~**[Claude]** `TEST_INBOX` je novi poštanski sandučić samo za demo~~ → **[Ivana], 3. 11.:** `TEST_INBOX` je Ivanin lični mejl (samo u `.env.local`/Vercel env).
- [Radni proces agenata i tima od utorka](issues/12-radni-proces.md):
  - **[Ivana]** Repo je na Ivaninom GitHubu, a tiketi za izradu u GitHub Issues. Ivana je jedini vlasnik migracija, a svi rade na jednom Supabase projektu.
  - **[Claude]** Grane i worktree po tiketu; četiri obavezna testa (bez Podgorice → odbija se; anonimna sesija u RLS-u); `CLAUDE.md` = `@AGENTS.md`.
  - Rizik: Vercel Hobby možda ne pravi preview-e za commitove kolega.
- [Vrste problema (taksonomija) za P0](issues/13-vrste-problema.md):
  - **[Claude]** 12 vrsta, od kojih 10 ima pravilo u Podgorici; `graffiti` i `other` („Drugi problem") idu u `routing`.
  - **[Claude]** Ozbiljnost se vidi samo u panelu; opasnost daje traku sa 112 i jedan red u dopisu.
  - **[Ivana]** Prag 0.6 je fiksan.
- [Domen i adresa pošiljaoca](issues/16-domen-i-posiljalac.md):
  - **[Ivana]** Vercel Hobby + kupljen domen + Resend; Auth mejlovi idu preko Resend SMTP-a, a rezerva je isključen `Confirm email`.
  - ~~**[Claude]** Slanje sa poddomena `mail.{domen}`~~; TryCloudflare je odbačen.
  - **Izmjena 3. 11. [Ivana]:** nema domena. Vercel Hobby radi na `*.vercel.app`; Resend šalje sa `onboarding@resend.dev` samo na `TEST_INBOX` (mejl vlasnika Resend naloga); `Confirm email` je isključen, a demo nalozi su unaprijed potvrđeni.
- [Pravila nadležnosti: oblik, izvori i slučaj bez pravila](issues/14-pravila-nadleznosti.md):
  - **[Claude]** Jedan nivo, tačno (vrsta, Podgorica), inače `routing`; tipovi izvora a/b/c; prave adrese institucija.
  - **[Claude]** Minimalni `/admin` je P0; putevi idu Sekretarijatu za saobraćaj uz kopiju Putevima.
  - **[Claude]** Seed tabela: 10 pravila i 8 institucija.
- [Rječnik domena i nazivi za korisnika](issues/09-rjecnik-i-nazivi.md):
  - **[Ivana]** „Podrška"/„Podržavam" (kod `like`); `category`, `institution`, `reporter`; nazivi statusa; „opština"; Fixit je brend.
  - **[Claude]** prijava / dopis / slanje su tri pojma. Napravljen je `GLOSSARY.md`.
- [Privatnost i moderacija javnih prijava](issues/11-privatnost-i-moderacija.md):
  - **[Ivana]** Dostavljanje podataka je podrazumijevano isključeno; prijava je javna odmah, a moderacija naknadna; označena fotografija je javna dok je administrator ne sakrije (a).
  - **[Claude]** Privatni bucket + potpisani URL-ovi; putanje fotografija ne sadrže korisnika; anonimne podrške ostaju na limitu od 30/h, bez CAPTCHA-e.
- [Životni ciklus prijave: statusi, prelazi, brojač dana i podrške](issues/10-zivotni-ciklus-prijave.md):
  - **[Ivana]** Javni status `routing`; preusmjeravanje zadržava prijavu i dobija novi dopis; kod se dodjeljuje pri slanju; limit od 10 važi za nacrte sa AI analizom.
  - **[Claude]** Zatvorena lista od 14 prelaza (FR-18); `closed_at`; dani se računaju po kalendaru Europe/Podgorica; najviše 3 fotografije po prijavi.
- [Tok prijave i budžet od 4 dodira](issues/15-tok-prijave.md):
  - **[Ivana]** Prijava na nalog prije kamere; ime je obavezno pri registraciji; AI radi paralelno sa pinom; jedan ekran pregleda; ručni tok je P0 (nakon 15 s); fotografisanje se ne broji.
  - **[Claude]** Srećni put ima 2 dodira, najduži 4; „Dodaj fotografiju" je na ekranu pregleda; mijenjaju se samo vrsta i opis.
- [Tehnički stack (Tech.md)](issues/17-tehnicki-stack.md):
  - **[Ivana]** shadcn preset `b2xaqzSRuK` i osnovni stack.
  - **[Claude]** Tačne verzije: Next.js se zaključava na zakrpljenu 16.4.x, a do tada nema deploy-a.
  - **[Claude]** Agent tok: `/api/agent/classify` + `/api/agent/prepare` (SSE) + server action `sendReport`.
  - **[Claude]** Leaflet + OSM + Nominatim `cnr-Latn` preko servera; Haiku 5.5 iz `ANTHROPIC_MODEL` (timeout 12 s, 0 ponovnih pokušaja).
- [Šema baze, RPC i RLS (DB.md)](issues/18-sema-baze.md):
  - **[Ivana]** Šemu piše Claude, a Ivana pregleda rizične tačke; uloge se dodjeljuju samo servisnim ključem; `is_demo` + `db:clear-demo`; samo Podgorica.
  - **[Claude]** 15 tabela, 22 RPC-a; javne tabele i Realtime nemaju ID korisnika; putanje fotografija su `<uuid>.jpg`; zaključavanje u dva koraka protiv duplog slanja.
  - **[Claude]** 10 rizičnih tačaka čeka Ivanin pregled.
- [Završna provjera i usaglašavanje dokumenata](issues/19-zavrsna-provjera.md):
  - **[Ivana]** Dokumenti su odobreni; brojač podrški uživo i anonimna podrška ostaju P0.
  - **[Ivana]** Opis prijave je javan, uz sliku; „Demo prijava" je oznaka, a demo podaci se brišu poslije ocjenjivanja; provjera „van Podgorice" je odmah na „Potvrdi lokaciju".
  - **[Claude]** Panel je P0, moderacija na `/admin` je P1, tri rizika iz 18 su prihvaćena.
  - Popravljeno je oko 57 nedosljednosti u dokumentima.
- [Odakle dolaze fotografije za demo prijave](issues/21-demo-fotografije.md):
  - **[Ivana]** Fotografije sa otvorenom licencom (Wikimedia Commons): 8 fotografija, po 2 za 4 vrste; iste služe i za tiket 20.
  - **[Claude]** Vrste su `pothole`, `street_light`, `illegal_dump`, `manhole`; preuzimanje je dio izrade.

## Not yet specified

- **Prompt za prepoznavanje i konačan tekst šablona dopisa.** Da li ih fiksiramo u dokumentima ili prepuštamo izradi uz pravila iz FR-10/FR-11? Čeka rječnik (09), vrste problema (13) i pravila (14).
- **Redoslijed P1 funkcija** ako P0 bude gotov do četvrtka. Vjerovatno se rješava u završnoj provjeri (19), kad bude jasno koliko P0 košta.
- **Model obavještenja (P1):** obavještenja u aplikaciji i mejl autoru pri promjeni statusa. Detalji tek kad P0 tok bude zaključan.
- **Kriterijumi prihvatanja po FR-u** u obliku koji agenti mogu provjeriti. Vjerovatno izlazi iz radnog procesa (12) i šeme (18).
- **Čišćenje napuštenih nacrta** i njihovih fotografija (predlog iz 10): da li je P0 ili kasnije.
- **Budžet i limiti troškova** (Anthropic API, Resend, Supabase) za nedjelju izrade i demo.

## Out of scope

- Izrada koda i podizanje infrastrukture (repo, Supabase i Vercel projekti, migracije, seed). To je izrada i počinje u utorak; dokumenti će sadržati spisak koraka.
- Razbijanje P0 na tikete za izradu. To je predaja posla nakon što se mapa završi, ne dio mape.
- Nativne iOS/Android aplikacije, push obavještenja, offline rad, video, SMS, više jezika.
- AI koji određuje nadležnost; automatsko prepoznavanje kategorije puta iz OSM-a.
- Slanje pravim institucijama, inbound mejl, integracije sa e-Upravom i sistemima institucija.
- Stvarna naplata licenci.
- Automatsko zamućivanje lica i tablica.
- Raspoređivanje prijava službama unutar institucije (P2).
