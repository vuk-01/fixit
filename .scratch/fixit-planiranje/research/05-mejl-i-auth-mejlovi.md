# 05 — Resend i Supabase Auth: slanje sa i bez domena (nalazi)

Tiket: [05-mejl-i-auth-mejlovi.md](../issues/05-mejl-i-auth-mejlovi.md)
Svi izvori su pristupljeni **2026-11-02**. Korišćeni su samo primarni izvori (dokumentacija i changelog Resenda i Supabase-a). Gdje je nešto moj zaključak, a ne citat iz izvora, to je označeno kao **[zaključak]**.

## Kratak odgovor

- **Prijave institucijama (Resend) rade bez domena**, pod uslovom da je `TEST_INBOX` isti mejl kao mejl vlasnika Resend naloga. Šalje se sa `onboarding@resend.dev`.
- **Registracija sa potvrdom mejla ne radi bez domena** za bilo koga van Supabase tima: ugrađeni Supabase servis šalje samo članovima tima projekta, i to najviše 2 mejla na sat. Resend SMTP bez domena ne pomaže, jer i on šalje samo na mejl vlasnika naloga.
- Bez domena, demo registracija radi samo ako se isključi `Confirm email` ili ako se demo nalozi naprave unaprijed i odmah potvrde.

---

## 1. Resend bez verifikovanog domena

| Činjenica | Izvor |
|---|---|
| Domen `resend.dev` je „only available for testing purposes”. Sa njega se može slati samo na mejl adresu vezanu za Resend nalog. Na druge adrese API vraća grešku: „You can only send testing emails to your own email address (…)”. Za druge primaoce treba verifikovati sopstveni domen i promijeniti `from`. | https://resend.com/docs/knowledge-base/403-error-resend-dev-domain |
| Zvanični primjer koristi `from: 'Acme <onboarding@resend.dev>'`, što znači da je dozvoljeno ime za prikaz uz `onboarding@resend.dev`. Ista strana kaže da `onboarding@resend.dev` služi samo za testiranje, a ne za produkciju. | https://resend.com/docs/send-with-nodejs |
| Format polja `from`: `"Name <email@example.com>"`. | https://resend.com/docs/api-reference/emails/send-email |
| Adrese za testiranje bez rizika: `delivered@resend.dev`, `bounced@resend.dev`, `complained@resend.dev`, `suppressed@resend.dev`. Većina podržava `+` oznaku (npr. `delivered+user1@resend.dev`). | https://resend.com/docs/knowledge-base/what-email-addresses-to-use-for-testing |
| Besplatni plan: **100 mejlova dnevno**, **3.000 mjesečno**, 3 domena, čuvanje podataka 30 dana. | https://resend.com/pricing |
| Dnevna kvota se računa po UTC kalendarskom danu i resetuje se u ponoć UTC. Kada se pređe, API vraća HTTP 429 sa `daily_quota_exceeded` ili `monthly_quota_exceeded`. Zaglavlje `x-resend-daily-quota` dobijaju samo korisnici besplatnog plana. | https://resend.com/docs/api-reference/rate-limit |
| API limit: „10 requests per second per team” (podrazumijevano). | https://resend.com/docs/api-reference/rate-limit |
| Prilozi: najviše **40 MB po mejlu, nakon Base64 kodiranja**. Prilog se zadaje kao `content` (buffer ili Base64) ili kao `path` (URL na kojem je fajl hostovan), uz `filename` i opciono `content_type`. Fotografije od ~300–800 KB su daleko ispod limita, čak i kad ih je više u jednom mejlu (Base64 povećava veličinu za oko 33%). **[zaključak]** | https://resend.com/docs/api-reference/emails/send-email |
| Zaglavlje `Idempotency-Key` sprečava dupla slanja. Ključ važi 24 sata, a najveća dužina je 256 znakova. Ovo je korisno za FR-11 („jedna prijava se može poslati samo jednom”). **[zaključak o primjeni]** | https://resend.com/docs/api-reference/emails/send-email |
| Node SDK „returns `{ data, error }` instead of throwing”. Greške se provjeravaju preko `error`, a `try/catch` služi samo za mrežne greške. | https://resend.com/docs/send-with-nodejs |

**Šta to znači za Fixit [zaključak]:**
- U `EMAIL_MODE=test` (FR-12) svi mejlovi idu na `TEST_INBOX`. Ako je `TEST_INBOX` = mejl vlasnika Resend naloga, prijave institucijama rade **bez domena**, sa fotografijama u prilogu.
- Pošiljalac će biti `Fixit <onboarding@resend.dev>`, a ne „adresa platforme Fixit” na sopstvenom domenu (FR-11). Za demo je to prihvatljivo, ali tekst potpisa („kontakt mejl i sajt”) ne smije navoditi adresu koja ne postoji.
- Dodatna sigurnosna mreža: bez verifikovanog domena **sam Resend odbija** slanje na bilo koju adresu osim vlasnikove. Čak i ako guard u kodu zakaže, mejl ne može stići instituciji (vidi pravilo 2 u AGENTS.md).
- 100 mejlova dnevno je dovoljno za hakaton, ali automatizovani testovi ne smiju trošiti kvotu (vidi odjeljak 6).

## 2. Resend sa domenom

| Činjenica | Izvor |
|---|---|
| Resend šalje sa domena koji je vaš („not a shared or public domain”). Nakon verifikacije može se slati sa bilo koje adrese na tom domenu. | https://resend.com/docs/dashboard/domains/introduction |
| DNS: „Provide the DKIM and SPF configurations (`TXT` and `MX` or `CNAME` records) to your DNS provider”. Zapisi moraju tačno odgovarati onima koje Resend generiše (kartica **Records**). DMARC je poseban, kasniji korak. | https://resend.com/docs/add-a-domain |
| Return-Path podrazumijevano ide na poddomen `send.` (npr. `send.example.com`). | https://resend.com/docs/add-a-domain |
| Trajanje: domen se „often verify within 15 minutes”, ali propagacija DNS-a može trajati „up to 72 hours”. Ako verifikacija ne prođe za 72 sata, postoji dugme „Restart verification”. | https://resend.com/docs/add-a-domain |
| Poddomen se **preporučuje** (npr. `updates.example.com`, `notifications.example.com`). Svaki poddomen se dodaje i verifikuje posebno. | https://resend.com/docs/dashboard/domains/introduction, https://resend.com/docs/add-a-domain |

**[zaključak]** Domen treba kupiti i dodati najkasnije dan prije demoa, jer su 15 minuta uobičajeni slučaj, a 72 sata najgori. Poddomen tipa `mail.<domen>` radi i preporučuje se.

## 3. Supabase Auth: ugrađeni mejl servis

| Činjenica | Izvor |
|---|---|
| Ugrađeni servis „is not meant for production use”. Ograničenja: „Send messages only to pre-authorized addresses”, „Significant rate-limits that can change over time”, „No SLA guarantee”. | https://supabase.com/docs/guides/auth/auth-smtp |
| **Šalje samo članovima tima projekta.** Bez custom SMTP-a, Auth odbija slanje na adrese van tima organizacije, uz grešku „Email address not authorized”. Tim se uređuje u kartici **Team** u podešavanjima organizacije. | https://supabase.com/docs/guides/auth/auth-smtp |
| Limit: „2 messages per hour”. Na strani o limitima stoji „2 emails per hour with the built-in email provider”, a limit se može mijenjati samo uz custom SMTP ili Send Email hook. | https://supabase.com/docs/guides/auth/auth-smtp, https://supabase.com/docs/guides/auth/rate-limits |
| Na hostovanim projektima `Confirm email` je **uključen podrazumijevano**. | https://supabase.com/docs/guides/auth/passwords |
| **Prevod šablona:** od **3. juna 2026.** novi projekti na besplatnom planu koji koriste ugrađeni mejl servis „will no longer be able to modify their auth email templates”. Projekti napravljeni prije 3. juna 2026. zadržavaju mogućnost. Na besplatnom planu, uz sopstveni SMTP, šabloni se i dalje mogu slobodno mijenjati. | https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier |

**Šta to znači za registraciju demo korisnika i žirija [zaključak]:**
- Ako je `Confirm email` uključen i nema custom SMTP-a, član žirija koji se registruje **ne dobija mejl za potvrdu**, pa ne može da se uloguje i napravi prijavu (FR-1). Isto važi za reset lozinke.
- I za članove tima važe 2 mejla na sat za cio projekat, što nije dovoljno ni za probu demoa.
- Ako je Supabase projekat napravljen poslije 3. juna 2026. na besplatnom planu, šabloni ostaju na engleskom dok se ne uključi custom SMTP. To se kosi sa pravilom 6 iz AGENTS.md (sav tekst za korisnika na crnogorskom).

## 4. Opcije za Auth mejlove

### 4a. Custom SMTP preko Resenda (traži domen)
| Činjenica | Izvor |
|---|---|
| Podešavanja: host `smtp.resend.com`, port `465`, korisnik `resend`, lozinka = Resend API ključ. Preduslov je „A verified domain”. Polja Sender email i Sender name su obavezna. | https://resend.com/docs/send-with-supabase-smtp |
| Uz custom SMTP, Auth „will send messages to all addresses”. Limit tada postaje 30 poruka na sat i može se povećati na stranici Rate Limits. | https://supabase.com/docs/guides/auth/auth-smtp |
| Resend je prvi na Supabase-ovoj listi provajdera koji rade sa Auth-om. | https://supabase.com/docs/guides/auth/auth-smtp |
| Isključiti praćenje linkova (link tracking) kod SMTP provajdera, jer može pokvariti linkove za potvrdu. Linkovi su jednokratni, pa ih skeneri mejlova mogu „potrošiti”. | https://supabase.com/docs/guides/deployment/going-into-prod |

**[zaključak]** Resend SMTP **bez domena** nema smisla, jer bi i Auth mejlovi stizali samo vlasniku Resend naloga. Mejlovi za potvrdu idu na stvarne adrese korisnika, pa na njih **ne važi** `EMAIL_MODE=test`. To nije kršenje pravila 2, koje se odnosi na mejlove institucijama, ali to treba eksplicitno zapisati.

### 4b. Send Email hook (alternativa SMTP-u)
- „The Send Email Hook replaces Supabase's built-in email sending.” Dokumentacija ima primjer sa Resendom i odjeljak o internacionalizaciji šablona. — https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
- **[zaključak]** I ovdje Resend traži domen za slanje na tuđe adrese, pa hook ne zaobilazi problem domena. Samo daje punu kontrolu nad tekstom mejla.

### 4c. Isključen `Confirm email`
| Činjenica | Izvor |
|---|---|
| „If Confirm email is enabled, a `user` is returned but `session` is null.” „If Confirm email is disabled, both a `user` and a `session` are returned.” | https://supabase.com/docs/reference/dart/auth-signup (isto ponašanje opisuje JS referenca: https://supabase.com/docs/reference/javascript/auth-signup) |
| „The PKCE flow cannot be used when autoconfirm is enabled.” | https://supabase.com/docs/reference/javascript/auth-signup |
| Potvrda preko servera: šablon vodi na `{{ .SiteURL }}/auth/confirm?token_hash=…&type=…`, a ruta poziva `supabase.auth.verifyOtp({ type, token_hash })`. | https://supabase.com/docs/guides/auth/passwords |

**Posljedice [zaključak]:**
- Registracija odmah vraća sesiju, pa korisnik (i žiri) može odmah da pravi prijave. Nikakav mejl se ne šalje i domen nije potreban.
- Ruta `/auth/callback` (PRD, „Povratak iz linka za potvrdu mejla”) **se ne koristi pri registraciji**. Može ostati za kasnije uključivanje potvrde ili reset lozinke, koji takođe traži slanje mejla. Napomena: Supabase primjeri koriste ime `/auth/confirm` (sa `token_hash`), a PRD koristi `/auth/callback`. Ime treba uskladiti kad se ruta implementira.
- Bezbjednost: niko ne potvrđuje da je mejl zaista korisnikov. Neko se može registrovati tuđim mejlom. Po FR-11, uz saglasnost, ime i **nepotvrđen** mejl se šalju instituciji. U test režimu to završava u `TEST_INBOX`, ali u produkciji bi institucija dobila lažne podatke. Takođe raste rizik od masovnog pravljenja naloga (ublažava se CAPTCHA-om i limitom „30 requests per 5 minutes” po IP-u za sign-up — https://supabase.com/docs/guides/auth/rate-limits).

### 4d. Unaprijed napravljeni demo nalozi
- `auth.admin.createUser` ima primjer „Auto-confirm the user's email” sa `email_confirm: true`. Poziva se samo na serveru, sa `service_role` ključem. — https://supabase.com/docs/reference/javascript/auth-admin-createuser
- **[zaključak]** Na ovaj način se mogu napraviti nalozi za žiri (npr. skriptom za seed) čak i dok je `Confirm email` uključen. Žiri tada ne prolazi kroz registraciju, nego samo kroz prijavu.

### 4e. Prevod šablona na crnogorski
- Šabloni: Confirm sign up, Invite user, Magic link/OTP, Change email address, Reset password, Reauthentication. Varijable: `{{ .ConfirmationURL }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`. Na hostovanim projektima se uređuju na strani Email Templates ili preko Management API-ja, a lokalno u `supabase/config.toml`. — https://supabase.com/docs/guides/auth/auth-email-templates
- Ograničenje za nove besplatne projekte bez custom SMTP-a: vidi odjeljak 3 (changelog od 3. juna 2026).

## 5. Anonimne sesije (FR-16)

| Činjenica | Izvor |
|---|---|
| Uključuju se opcijom „Enable Anonymous Sign-Ins” u podešavanjima Auth provajdera, a poziv je `supabase.auth.signInAnonymously()`. | https://supabase.com/docs/guides/auth/auth-anonymous |
| „It is strongly recommended to enable invisible CAPTCHA or Cloudflare Turnstile to prevent abuse for anonymous sign-ins.” Limit po IP-u je **30 zahtjeva na sat** i može se promijeniti u dashboardu. | https://supabase.com/docs/guides/auth/auth-anonymous, https://supabase.com/docs/guides/auth/rate-limits |
| CAPTCHA: podržani su hCaptcha i Cloudflare Turnstile. Uključuje se u Auth protection podešavanjima, a token se šalje kao `options: { captchaToken }`. `signInAnonymously` takođe prima `options: { captchaToken }`. | https://supabase.com/docs/guides/auth/auth-captcha, https://supabase.com/docs/reference/javascript/auth-signinanonymously |
| CAPTCHA štiti signup, sign-in i reset lozinke. | https://supabase.com/docs/guides/deployment/going-into-prod |
| JWT anonimnog korisnika ima claim `is_anonymous`. Primjer politike: `with check ((select (auth.jwt()->>'is_anonymous')::boolean) is false)`. | https://supabase.com/docs/guides/auth/auth-anonymous |
| „An anonymous user assumes the `authenticated` role like a permanent user.” | https://supabase.com/docs/guides/auth/auth-anonymous |
| Pretvaranje u stalni nalog: `updateUser()` za mejl/telefon, `linkIdentity()` za OAuth. | https://supabase.com/docs/guides/auth/auth-anonymous |
| „Automatic cleanup of anonymous users is currently not available.” Dokumentacija daje SQL koji briše anonimne korisnike starije od 30 dana. | https://supabase.com/docs/guides/auth/auth-anonymous |

**Šta to znači za Fixit [zaključak]:**
- Svaka RLS politika napisana `to authenticated` važi **i za anonimne korisnike**. Sve što FR-1 zabranjuje anonimnima (pravljenje prijava, upload fotografija u storage, RPC za slanje) mora eksplicitno provjeravati `is_anonymous is false`, uključujući i RPC funkcije i storage politike. Lajkovi (FR-16) treba da dozvole oba tipa korisnika.
- Ako je `Confirm email` isključen, anonimni korisnik koji pozove `updateUser({ email, password })` postaje stalni korisnik. To treba provjeriti prije nego što se omogući takav put registracije. Inače registracija ide preko `signUp`, koji pravi novog korisnika, pa lajkovi iz anonimne sesije ostaju na starom anonimnom korisniku.
- **Rizik na demou:** limit od 30 anonimnih prijava na sat po IP-u. Ako je žiri u istoj sali na istom Wi‑Fi-ju (isti javni IP), više od 30 novih anonimnih sesija za sat vremena dobiće grešku. Prije demoa treba podići limit u dashboardu.
- Ako se CAPTCHA uključi, važi za signup, sign-in i anonimno logovanje, pa sve forme moraju slati `captchaToken`. To je dodatni posao. Za hakaton je razumno odložiti CAPTCHA i osloniti se na limite po IP-u, ali to treba zapisati kao poznat rizik.

## 6. Garancija da nijedan mejl ne ode van `TEST_INBOX`

Izvori za ponašanje SDK-a: https://resend.com/docs/send-with-nodejs i https://resend.com/docs/knowledge-base/403-error-resend-dev-domain. Ostatak je **[zaključak]**, odnosno prijedlog dizajna:

1. **Jedna tačka slanja:** samo `lib/email/send.ts` uvozi `resend` (pravilo 2). Pravilo se može provjeriti ESLint-om (`no-restricted-imports` za `resend` svuda osim u tom fajlu) ili jednostavnim testom koji grep-uje kod.
2. **Guard koji ne propušta kad nije siguran (fail closed):** `send.ts` čita `EMAIL_MODE`. Sve što nije tačno `'live'` (uključujući prazno i nepoznato) tretira se kao `test`, pa se `to` **zamjenjuje** sa `[TEST_INBOX]`, a `cc`/`bcc` se brišu. Ako `TEST_INBOX` nije postavljen, funkcija baca grešku i ne šalje ništa. Prava adresa institucije može se upisati u tijelo ili predmet mejla (npr. „[TEST → komunalna@…]”), radi provjere na demou.
3. **Test sa mockom:** `vi.mock('resend')` (ili `jest.mock`) zamjenjuje `Resend.emails.send` lažnom funkcijom. Test zove `send.ts` sa adresom institucije i provjerava da je mock pozvan **samo** sa `to: [TEST_INBOX]`, bez `cc`/`bcc`. Drugi test provjerava da nedostajući `EMAIL_MODE` znači test režim. Treći provjerava grešku kad `TEST_INBOX` nedostaje. Mock vraća `{ data, error }`, kao pravi SDK, da bi se testirala i grana sa greškom (FR-11: „prijava ostaje neposlata”).
4. **U testovima nema pravog ključa:** `RESEND_API_KEY` u test okruženju je lažna vrijednost, pa ni slučajan poziv bez mocka ne može poslati mejl.
5. **Mreža ispod svega:** dok nema verifikovanog domena, Resend sam odbija slanje na tuđe adrese (403). Kad se domen doda, ta zaštita nestaje, pa guard iz tačke 2 postaje jedina zaštita.
6. Za ručne end-to-end probe bez trošenja vlasnikovog sandučeta može se koristiti `delivered@resend.dev` (sa `onboarding@resend.dev` se može slati i na tu adresu, kako pokazuje zvanični primjer). Te probe ipak troše dnevnu kvotu od 100 mejlova.

---

## Preporuka (prijedlog, ne odluka)

> Ovo je preporuka istraživača. Odluke 16 (domen i adresa pošiljaoca) i 17 (tehnički stack) donosi tim.

1. **Za demo domen nije neophodan**, uz sljedeće uslove:
   - `TEST_INBOX` = mejl vlasnika Resend naloga, a pošiljalac je `Fixit <onboarding@resend.dev>`;
   - u Supabase Auth se **isključi `Confirm email`**, a za žiri se dodatno naprave unaprijed potvrđeni demo nalozi (`auth.admin.createUser` sa `email_confirm: true`), kao rezerva;
   - prije demoa se podigne limit za anonimno logovanje (30 na sat po IP-u).
2. **Ako tim želi „pravu” registraciju sa potvrdom, crnogorske Auth šablone i adresu Fixit domena**, potreban je domen (dovoljan je poddomen, npr. `mail.<domen>`) i Resend SMTP u Supabase-u. Domen treba dodati **najkasnije 1–3 dana prije demoa**, zbog mogućih 72 sata propagacije DNS-a.
3. Bez obzira na domen: guard u `lib/email/send.ts` neka ne propušta kad nije siguran (fail closed) i ima testove sa mockovanim Resend SDK-om. Sve „ne-anonimne” RLS i storage politike neka eksplicitno provjeravaju `is_anonymous`.
4. Provjeriti datum pravljenja Supabase projekta. Ako je poslije 3. juna 2026. na besplatnom planu, Auth šabloni se ne mogu prevesti bez custom SMTP-a. Tada je isključivanje `Confirm email` i dodatni razlog da korisnik ne vidi mejl na engleskom.
