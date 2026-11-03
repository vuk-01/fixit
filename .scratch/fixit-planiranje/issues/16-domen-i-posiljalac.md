# 16 — Domen i adresa pošiljaoca

Type: grilling
Status: resolved
Blocked by: 05
Mapa: [map.md](../map.md)

## Question

PRD §10 ostavlja otvoreno pitanje domena. Domen utiče na tri stvari: adresu sa koje Resend šalje dopis, mejlove za registraciju (Supabase Auth) i URL koji se pokazuje u demou i na QR kodu. Nalaz 05 kaže šta tačno radi bez domena. Pitanja Q1, Q2 i Q4 možeš odgovoriti već sada.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Kupujemo domen odmah**: Da li kupujemo domen danas ili sjutra (verifikacija DNS-a za Resend može trajati), npr. `.me` (domen Crne Gore) ili sličan? Upiši ime ako ga imaš na umu i ko ga plaća.

➡️ Ne kupujemo ga obavezno, ali bi lijepo bilo. *(Preporuka ažurirana nakon nalaza 05.)* Demo radi i bez domena:
- dopisi idu sa `Fixit <onboarding@resend.dev>` na `TEST_INBOX`, koji mora biti mejl vlasnika Resend naloga;
- registracija radi kad je `Confirm email` isključen (vidi Q3).

Domen donosi tri stvari:
- pošiljaoca na Fixit domenu;
- pravu potvrdu mejla i Auth mejlove na crnogorskom (od 3. 6. 2026. novi besplatni Supabase projekti bez custom SMTP-a ne mogu mijenjati šablone);
- ljepši URL na QR kodu umjesto `*.vercel.app`.

Ako ga kupujemo, onda danas ili sjutra, jer propagacija DNS-a može trajati do 72 h. Najbolje je koristiti poddomen za slanje.

**Tvoj odgovor:** Mislili smo da koristimo Vercel za hostovanje. A za mejl Resend.

---

❓ **Q2 - Pošiljalac i adresa za odgovor**: Da li dopis šalje „Fixit prijave <prijave@{domen}>", a `reply-to` je kontakt adresa tima (u testu = `TEST_INBOX`)?

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q3 - Mejlovi za registraciju**: (Zavisi od 05.) Opcije:
(a) Supabase Auth šalje preko Resend SMTP-a sa našeg domena, a šabloni su prevedeni na crnogorski;
(b) potvrda mejla je isključena za hakaton i nalog radi odmah, bez mejla.
Da li biramo (a) ako domen bude verifikovan do srijede, a (b) kao rezervu?

➡️ Da. *(Preporuka ažurirana nakon nalaza 05.)* Nalaz potvrđuje da ugrađeni SMTP šalje samo članovima tima i najviše 2 mejla na sat. Zato je (b) obavezna dok domen nije verifikovan. Uz to unaprijed pravimo potvrđene demo naloge (`auth.admin.createUser({ email_confirm: true })`).

**Tvoj odgovor:** Da, takodje htjela bih da hostujem aplikaciju na Vercelu (platicu domen). Da li je to moguce ako imamo agenta koji ce da radi u pozadini po zahtjevu?

---

❓ **Q4 - Nalozi na servisima**: Na čije ime otvaramo naloge (Vercel, Supabase, Anthropic, Resend, domen) i ko drži ključeve? Ključevi se dijele samo preko Vercel env varijabli i lokalnog `.env.local` (nikad u repou ni u chatu).

➡️ Na tvoje ime ili tim nalog, a ti dodaješ članove tima. Upiši ako je drugačije.

**Tvoj odgovor:** Da

---

## Answer

*Izmijenjeno 3. 11.: domen se ne kupuje. Sve što se ispod odnosi na `{domen}`, `mail.{domen}`, Supabase SMTP i Auth šablone zamjenjuje sekcija [„Izmjena odluke (3. 11.)"](#izmjena-odluke-3-11) na kraju tiketa.*

- **Q1 — Domen:** kupujemo sopstveni domen; plaća ga Ivana **[Ivana]** (njen kasniji odgovor u Q3 „hostujem na Vercelu (platiću domen)" zamjenjuje TryCloudflare iz Q1). Ime još nije izabrano, pa je kupovina korak za Ivanu (dolje). Kupuje se **danas (uto 3. 11.)** **[Claude]**, jer verifikacija DNS-a može trajati do 72 h, a video se snima u petak. Za mejl ostaje Resend **[Ivana]**.
- **Q1 — Zašto ne TryCloudflare:** Quick Tunnel nije hosting, nego privremena `trycloudflare.com` adresa koja se mijenja pri svakom pokretanju i radi samo dok `cloudflared` radi na nečijem računaru; Cloudflare ga namjenjuje testiranju, bez garancije dostupnosti, i ne podržava Server-Sent Events, koje agent tok koristi **[Claude]**, jer javna mapa i linkovi u mejlovima institucijama moraju raditi i kad je laptop ugašen.
- **Q2 — Pošiljalac i reply-to:** dopis šalje „Fixit prijave", a `reply-to` je kontakt adresa tima, u testu `TEST_INBOX` **[Ivana]**. Tačna adresa je `prijave@mail.{domen}`, ne `prijave@{domen}` **[Claude]**, jer Resend preporučuje poseban poddomen za slanje, a verifikovana adresa mora biti na verifikovanom (pod)domenu.
- **Q2 — Kontakt adresa u potpisu:** potpis navodi istu adresu kao `reply-to` (postojeće sanduče koje Ivana odredi) i `https://{domen}`; na domenu ne otvaramo sanduče za hakaton **[Claude]**, jer potpis ne smije navoditi adresu koja ne prima poštu (nalaz 05).
- **Q3 — Auth mejlovi:** (a) Resend SMTP sa `mail.{domen}` i šabloni na crnogorskom ako je sve provjereno do srijede 4. 11. uveče, a (b) isključen `Confirm email` kao rezerva; demo nalozi se u oba slučaja prave unaprijed potvrđeni **[Ivana]**. Auth pošiljalac je `Fixit <nalog@mail.{domen}>` **[Claude]**, da se Auth mejlovi razlikuju od dopisa institucijama.
- **Q3 — Hosting na Vercelu:** Vercel (Hobby) sa kupljenim domenom **[Ivana]**.
- **Q3 — Ivanino pitanje („da li je moguće ako imamo agenta koji radi u pozadini po zahtjevu"):** **Da.** AI agent u Fixitu nije pozadinski proces koji stalno radi, nego serverska funkcija (Route Handler) koju pokreće zahtjev građanina kad pošalje fotografiju. Jedan prolaz traje oko 10 s (≤ 8 s prepoznavanje + ≤ 3 s tekst), funkcija ima `maxDuration = 60`, a nalaz 07 daje strop od 300 s na Hobby planu. Ne treba stalno upaljen server, red čekanja ni worker **[Claude]**, prema nalazu 07.
- **Q4 — Nalozi i ključevi:** svi nalozi (Vercel, Supabase, Anthropic, Resend, domen) su na Ivaninom ličnom nalogu, ona dodaje članove tima; ključevi samo u Vercel env varijablama i `.env.local` **[Ivana]**. Vercel Hobby nema članove tima, pa Vercel projekat i env varijable vidi samo Ivana, a ostali rade lokalno i preko push-a na GitHub **[Claude]**, jer Hobby nema timsku saradnju (nalaz 07).
- **Q4 — Odvojeni Resend ključevi:** jedan ključ za aplikaciju (`RESEND_API_KEY`), drugi samo za Supabase SMTP, oba sa pravom samo slanja **[Claude]**, da zamjena jednog ključa ne obori drugi tok.

### Koraci za Ivanu

*Zamijenjeno 3. 11. kraćom verzijom bez domena (sekcija „Izmjena odluke (3. 11.)"). Ovi koraci ostaju samo kao zapis za kasniji pilot.*

Redom; `{domen}` zamijeni izabranim imenom.

1. **Kupi domen (danas).** Kratko ime, latinica bez dijakritika, npr. na `.me`. Ako ga Vercel prodaje, najjednostavnije je kupiti ga kroz Vercel (Domains → Buy), jer se DNS tada vodi na jednom mjestu i domen se sam vezuje za projekat. Ako ne, bilo koji registrar je u redu.
2. **Dodaj domen u Vercel.** Projekat → Settings → Domains → Add `{domen}`, prihvati i `www.{domen}` sa preusmjerenjem na `{domen}`. Ako domen nije kupljen na Vercelu, kod registrara dodaj tačno one zapise koje Vercel prikaže (A zapis za `@`, CNAME za `www`). Sačekaj status „Valid Configuration".
3. **Postavi `NEXT_PUBLIC_SITE_URL=https://{domen}`** u Vercel env varijablama (Production) i uradi redeploy (izmjena važi tek za novi deploy).
4. **Dodaj poddomen u Resend.** Resend → Domains → Add Domain → `mail.{domen}` (region EU ako je ponuđen). Na kartici **Records** su DKIM (TXT) i SPF (MX i TXT na `send.mail`) zapisi: prepiši ih **tačno** u DNS (Vercel → Domains → `{domen}` → DNS Records, ili kod registrara). Klikni Verify. Obično 15 min, najviše 72 h.
5. **Opciono, DMARC:** TXT zapis `_dmarc.{domen}` = `v=DMARC1; p=none;` (manje šanse da mejl završi u spamu).
6. **U Resendu isključi Click tracking i Open tracking** za `mail.{domen}`, jer praćenje linkova može pokvariti jednokratne linkove za potvrdu naloga.
7. **Napravi dva Resend API ključa sa pravom samo slanja** (Sending access, ograničeno na `mail.{domen}`): jedan za aplikaciju (`RESEND_API_KEY` na Vercelu i u `.env.local`), drugi za Supabase SMTP. Ključ se ne lijepi u chat ni u repo.
8. **Supabase custom SMTP.** Authentication → Emails → SMTP Settings → Enable custom SMTP: host `smtp.resend.com`, port `465`, username `resend`, password = drugi Resend ključ, sender email `nalog@mail.{domen}`, sender name `Fixit`. Zatim u Authentication → Rate Limits provjeri limit za mejlove (počinje od 30 na sat) i podigni ga ako treba za probe.
9. **Prevedi Auth šablone na crnogorski** (latinica, ijekavica): Authentication → Emails → Templates: Confirm signup, Invite user, Magic link, Change email address, Reset password, Reauthentication. Prevedi i naslov (subject) i tijelo; ne diraj `{{ .ConfirmationURL }}` i ostale promjenljive. Tekst šablona čuvamo i u repou da ne zavisi samo od dashboarda.
10. **Supabase URL Configuration.** Site URL `https://{domen}`; Redirect URLs: `https://{domen}/**`, `http://localhost:3000/**` i obrazac za preview adrese na `vercel.app`.
11. **Proba do srijede 4. 11. uveče.** Registruj se sa adrese koja **nije** u Supabase timu, potvrdi nalog preko linka iz mejla i probaj reset lozinke. Ako sve radi na crnogorskom → uključi `Confirm email` (opcija a). Ako ne → ostavi `Confirm email` isključen (opcija b). U oba slučaja napravi unaprijed potvrđene demo naloge.
12. **`EMAIL_MODE=test` se ne mijenja.** Provjeri da je na Vercelu (Production, Preview, Development) i u `.env.local` postavljeno `EMAIL_MODE=test` i `TEST_INBOX` = tvoj mejl. Nakon verifikacije domena Resend više sam ne blokira tuđe adrese, pa je guard u `lib/email/send.ts` jedina zaštita: nikad ne postavljaj `live`.
13. **Tek kad je `mail.{domen}` verifikovan**, promijeni `EMAIL_FROM` sa `Fixit <onboarding@resend.dev>` na `Fixit prijave <prijave@mail.{domen}>` i postavi `EMAIL_REPLY_TO` na kontakt adresu tima. Redeploy.

### Izmjene u dokumentima

- `Tech.md`: dodat odjeljak `## Hosting, domen i mejl` na kraju (hosting na Vercelu i zašto ne TryCloudflare, agent kao funkcija po zahtjevu, Resend poddomen i pošiljaoci, `EMAIL_MODE`, registracija a/b, Auth URL podešavanja, env varijable, nalozi). Prve tri linije (Next.js, Supabase, Resend) nijesu dirane; njih mijenja tiket 17.
- `PRD.md` FR-11: dodata adresa pošiljaoca `Fixit prijave <prijave@mail.{domen}>` i `reply-to`; potpis precizira da je kontakt mejl ista adresa kao `reply-to`, a sajt `https://{domen}`.
- `PRD.md` §10: pitanje „Domen" zamijenjeno stavkom „Ime domena" (hosting na Vercelu, domen kupuje Ivana, upućivanje na Tech.md).

### Za DB.md (tiket 18)

- Nema novih tabela ni kolona iz ovog tiketa. Adrese pošiljaoca i `reply-to` su env varijable, ne podaci u bazi.
- Ako se demo nalozi prave seed skriptom, ona koristi `auth.admin.createUser({ email_confirm: true })` (admin klijent, samo server), a ne direktan insert u `auth.users`.

### Za provjeru

- **Proširenje Q2:** prihvatila si `prijave@{domen}`, a u odluci stoji `prijave@mail.{domen}` zbog poddomena za slanje. Ako želiš adresu na glavnom domenu, u Resend se dodaje `{domen}` umjesto `mail.{domen}` (Return-Path i dalje ide na `send.{domen}`).
- **Kontakt adresa tima:** koje postojeće sanduče je `reply-to` i potpis? Ako želiš `kontakt@{domen}`, treba prosljeđivanje pošte (MX zapisi) i to je dodatni posao; za hakaton predlažem tvoj postojeći mejl.
- **Vercel Hobby i tim:** članovi tima ne mogu u Vercel projekat, a preview deploy-i su podrazumijevano zaštićeni Vercel prijavom, pa ih ostali možda neće moći otvoriti. Opcije: ostali testiraju lokalno, ili isključiš Deployment Protection za preview (tada preview link vidi svako ko ga ima).
- **Hobby je „samo za nekomercijalnu ličnu upotrebu"**; za hakaton je to u redu, ali ne i za kasniju upotrebu sa institucijama.
- **Env varijable:** predložene su `EMAIL_FROM`, `EMAIL_REPLY_TO` i `NEXT_PUBLIC_SITE_URL`; ako tiket 17 da drugačiji spisak, treba ih uskladiti.
- **QR:** pitanje pominje URL na QR kodu, ali QR je izbačen (odluka u wave1 briefu); domen se sada vidi samo u videu i u linkovima u mejlovima.

### Novi tiketi / magla

- Tekst Auth šablona na crnogorskom (6 šablona, naslov i tijelo) i mjesto u repou gdje se čuvaju (npr. `supabase/templates/`). Mali zadatak za izradu, ne za planiranje.

## Izmjena odluke (3. 11.)

Ivana je 3. 11. odlučila: hosting na **Vercel Hobby, besplatno, bez kupljenog domena**; aplikacija radi na produkcionom `*.vercel.app` URL-u; Resend šalje samo na testno sanduče; dovoljno je da radi nekoliko dana i za snimanje videa **[Ivana]**. Ovo zamjenjuje „kupujemo sopstveni domen; plaća ga Ivana" (Q1, Q3) i sve što je iz toga slijedilo: poddomen za slanje, Supabase SMTP, Auth šablone na crnogorskom i korake 1–13. Ostaje: Vercel Hobby, zašto ne TryCloudflare, agent kao funkcija po zahtjevu, nalozi na Ivaninom imenu (Q4) i `EMAIL_MODE=test`.

`{projekat}` ispod je ime Vercel projekta; tačan produkcioni URL Ivana upisuje kad napravi projekat.

**Šta se mijenja** (nalaz 05):

- **Pošiljalac dopisa:** `Fixit <onboarding@resend.dev>` **[Claude]**, jer Resend bez verifikovanog domena šalje samo sa `resend.dev`, a ime za prikaz („Fixit") je dozvoljeno (nalaz 05 §1). Zamjenjuje `Fixit prijave <prijave@mail.{domen}>` iz Q2.
- **Primalac:** sa `onboarding@resend.dev` Resend šalje samo na mejl vlasnika Resend naloga. Zato je `TEST_INBOX` namjensko demo sanduče iz tiketa 08, a Resend nalog se otvara baš tim sandučetom **[Claude]**. Resend sam odbija svakog drugog primaoca (403), što je dodatna brava; guard u `lib/email/send.ts` i test 1 iz AGENTS.md ipak ostaju **[Claude]**, jer zaštita ne smije zavisiti od podešavanja Resend naloga (dovoljno je da neko kasnije doda domen).
- **`reply-to` i kontakt u potpisu:** isto demo sanduče (`EMAIL_REPLY_TO` = `TEST_INBOX`); sajt u potpisu je produkcioni URL `https://{projekat}.vercel.app` **[Claude]**, jer potpis ne smije navoditi adresu koja ne prima poštu (nalaz 05). Zamjenjuje `https://{domen}` iz Q2.
- **Registracija (Supabase Auth):** ugrađeni Supabase mejl servis šalje samo članovima tima organizacije, najviše 2 mejla na sat (nalaz 05 §3), pa je **`Confirm email` isključen** za hakaton: opcija (a) iz Q3 otpada, važi (b) **[Claude]**. Demo nalozi se prave unaprijed potvrđeni, `auth.admin.createUser({ email_confirm: true })` (`pnpm db:seed-demo`, DB.md §12.3).
- **Auth mejlovi:** Supabase ne šalje nijedan Auth mejl, pa Auth šabloni ne trebaju; reset lozinke nije u P0, a ruta `/auth/callback` se u P0 ne pravi **[Claude]**. Pošiljalac `nalog@…` i drugi Resend ključ za SMTP (Q4) otpadaju; ostaje jedan ključ, `RESEND_API_KEY`, sa pravom samo slanja.
- **Posljedica isključene potvrde:** niko ne provjerava da je mejl zaista korisnikov (nalaz 05 §4c), pa uz dostavljanje podataka dopis nosi nepotvrđen mejl. U testnom režimu dopis ionako završava u `TEST_INBOX`; prihvaćeno za hakaton, a prije pilota idu domen, custom SMTP i uključena potvrda **[Claude]**.
- **Supabase URL Configuration:** Site URL `https://{projekat}.vercel.app`; Redirect URLs `https://{projekat}.vercel.app/**`, obrazac za preview adrese `https://*-{vercel-nalog}.vercel.app/**` i `http://localhost:3000/**` **[Claude]**.
- **Magla iz ovog tiketa** („Tekst Auth šablona na crnogorskom") otpada.

### Koraci za Ivanu (bez domena)

Zamjenjuju korake 1–13 iznad.

1. **Demo sanduče:** napravi namjensko sanduče tima samo za Fixit demo (tiket 08), npr. novi Gmail nalog, ne „temp-mail".
2. **Resend:** otvori Resend nalog baš tim sandučetom. Napravi jedan API ključ sa pravom samo slanja (`RESEND_API_KEY`). Domen se ne dodaje. Ključ se ne lijepi u chat ni u repo.
3. **Vercel:** napravi projekat (Hobby, tvoj lični nalog, repo na tvom ličnom GitHub nalogu) i zapiši produkcioni URL iz Settings → Domains (`https://{projekat}.vercel.app`). Otvori ga u privatnom prozoru i provjeri da ne traži Vercel prijavu.
4. **Env varijable** na Vercelu (Production, Preview, Development) i u `.env.local`: `EMAIL_MODE=test`, `TEST_INBOX` = demo sanduče, `EMAIL_REPLY_TO` = isto sanduče, `EMAIL_FROM=Fixit <onboarding@resend.dev>`, `NEXT_PUBLIC_SITE_URL=https://{projekat}.vercel.app`, `RESEND_API_KEY`. Zatim redeploy. Nikad `live`.
5. **Supabase Auth:** Authentication → Sign In / Providers → Email: isključi `Confirm email`; uključi Anonymous Sign-Ins (podrška bez naloga, FR-16).
6. **Supabase URL Configuration:** Site URL i Redirect URLs kao gore.
7. **Demo nalozi:** poslije migracija pokreni `pnpm db:seed-demo`; nalozi nastaju već potvrđeni.
8. **Proba:** na produkcionom URL-u registruj nalog sa adrese koja nije u Supabase timu: mora biti odmah ulogovan, bez mejla. Ne pravi prijave sa njim i obriši ga poslije (Authentication → Users). Zatim jedan dopis sa demo naloga mora stići u demo sanduče, sa pošiljaocem `Fixit <onboarding@resend.dev>`.

### Izmjene u dokumentima (3. 11.)

- `Tech.md`: sekcija preimenovana u `## Hosting i mejl` i prepisana (bez domena, poddomena i SMTP-a; `onboarding@resend.dev`; `Confirm email` isključen; URL Configuration sa `vercel.app`; tabela env varijabli; „Kasnije, za pilot"); reference u zaglavlju, §1 i §10 preimenovane; §3 bez `auth/callback/route.ts`.
- `PRD.md`: FR-11 (pošiljalac i potpis), FR-12 (referenca), §8 (`/auth/callback` nije u P0), §9 utorak (bez koraka za domen) i srijeda (proba registracije bez mejla), §10 (stavka o domenu uklonjena; šabloni Auth mejlova uklonjeni iz stavke o `/privatnost`; ostaje stavka da `TEST_INBOX` / `EMAIL_REPLY_TO` upisuje Ivana).
- `DB.md` §13: `Confirm email` isključen umjesto „po odluci iz Tech.md"; §12.3: napomena da u P0 nema Auth mejlova.
- `AGENTS.md`, `UI.md`, `GLOSSARY.md`: bez ostataka (pretraga za `domen`, `mail.{`, `nalog@`, `SMTP`).

## Izmjena odluke 2 (3. 11.)

- **[Ivana]** Resend, Vercel i GitHub su na Ivaninom ličnom mejlu. `TEST_INBOX` i `EMAIL_REPLY_TO` su taj mejl (vidi tiket 08, „Izmjena odluke"). U koraku 1 checkliste umjesto novog sandučeta koristi se lični mejl.
