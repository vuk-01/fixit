# 05 — Resend i Supabase Auth: slanje sa i bez domena

Type: research
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Šta tačno možemo slati **bez sopstvenog domena**, a šta traži domen? To se odnosi i na prijave institucijama (preko Resenda, uvijek na `TEST_INBOX`) i na mejlove za registraciju i potvrdu naloga (Supabase Auth).

Treba utvrditi:

1. Resend bez verifikovanog domena: sa koje adrese se šalje (`onboarding@resend.dev`?), na koje adrese je dozvoljeno slati (samo na mejl vlasnika naloga?), dnevni i mjesečni limiti besplatnog plana, veličina priloga (fotografija ~300–800 KB).
2. Resend sa domenom: koraci verifikacije (DNS zapisi), koliko traje, da li radi sa poddomenom.
3. Supabase Auth ugrađeni SMTP: limiti (broj mejlova na sat) i **da li šalje samo na adrese članova tima projekta**. Šta to znači za registraciju demo korisnika i žirija.
4. Opcije: custom SMTP (Resend SMTP) uz domen; isključena potvrda mejla (`Confirm email` off), uz posljedice po bezbjednost i po rutu `/auth/callback`; prevod Supabase mejl šablona na crnogorski.
5. Supabase anonimne sesije (FR-16): kako se uključuju, preporuke protiv zloupotrebe (CAPTCHA, rate limit), kako se ponašaju u RLS-u (`is_anonymous` claim).
6. Kako testovima garantovati da nijedan mejl ne ode van `TEST_INBOX` (mock Resend SDK-a, guard u `lib/email/send.ts`).

Odluke koje ovo čeka: Domen i adresa pošiljaoca (16), Tehnički stack (17).

Nalaze zapisati u `.scratch/fixit-planiranje/research/05-mejl-i-auth-mejlovi.md`.

## Answer

- **[istraživanje]** Resend bez domena šalje samo sa `onboarding@resend.dev` i samo na mejl vlasnika Resend naloga. Na druge adrese vraća 403. Prijave institucijama zato rade bez domena ako je `TEST_INBOX` = mejl vlasnika naloga.
- **[istraživanje]** Resend besplatni plan: 100 mejlova dnevno (resetuje se u ponoć UTC), 3.000 mjesečno, 10 zahtjeva u sekundi. Prilozi do 40 MB po mejlu nakon Base64, pa su fotografije od ~300–800 KB bez problema. `Idempotency-Key` sprečava duplo slanje.
- **[istraživanje]** Resend sa domenom traži SPF i DKIM zapise (TXT i MX/CNAME). Verifikacija obično traje oko 15 minuta, a propagacija DNS-a do 72 sata. Poddomen se preporučuje i verifikuje se posebno.
- **[istraživanje]** Ugrađeni Supabase mejl servis šalje **samo članovima tima organizacije** (ostalima vraća grešku „Email address not authorized”) i najviše 2 mejla na sat. Pošto je `Confirm email` podrazumijevano uključen, žiri ne može završiti registraciju bez custom SMTP-a.
- **[istraživanje]** Uz custom SMTP (Resend: `smtp.resend.com:465`, korisnik `resend`, lozinka = API ključ) Auth šalje na sve adrese, uz limit od 30 na sat koji se može podići. Za to je potreban verifikovan domen.
- **[istraživanje]** Od 3. juna 2026. novi Supabase projekti na besplatnom planu bez custom SMTP-a ne mogu mijenjati Auth šablone, pa ih ne mogu ni prevesti na crnogorski.
- **[istraživanje]** Kad je `Confirm email` isključen, `signUp` odmah vraća korisnika i sesiju, bez mejla. Tada se `/auth/callback` ne koristi pri registraciji, ali mejl korisnika ostaje nepotvrđen. Alternativa su demo nalozi napravljeni preko `auth.admin.createUser({ email_confirm: true })`.
- **[istraživanje]** Anonimni korisnici imaju ulogu `authenticated` i claim `is_anonymous`. Politike za kreiranje prijava i upload fotografija moraju eksplicitno tražiti `is_anonymous = false`. Limit je 30 anonimnih prijava na sat po IP-u, što je rizik ako je žiri na istom Wi‑Fi-ju. Supabase snažno preporučuje CAPTCHA (Turnstile ili hCaptcha), a automatskog čišćenja anonimnih korisnika nema.
- **[istraživanje]** Garancija za `TEST_INBOX`: samo `lib/email/send.ts` uvozi `resend`. Guard ne propušta kad nije siguran: sve osim `EMAIL_MODE=live` prepisuje `to` na `TEST_INBOX`, briše `cc`/`bcc` i baca grešku ako `TEST_INBOX` nedostaje. Testovi koriste `vi.mock('resend')` (SDK vraća `{ data, error }`) i lažni API ključ.
- **[istraživanje]** Preporuka (nije odluka): za demo domen nije neophodan. Dovoljni su isključen `Confirm email`, unaprijed potvrđeni nalozi za žiri i podignut limit za anonimne sesije. Domen treba samo za pravu potvrdu mejla, crnogorske Auth šablone i adresu na Fixit domenu.

[Nalazi](../research/05-mejl-i-auth-mejlovi.md)
