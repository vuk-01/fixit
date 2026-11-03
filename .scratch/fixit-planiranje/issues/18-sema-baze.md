# 18 — Šema baze, RPC i RLS (DB.md)

Type: grilling
Status: resolved
Blocked by: 01, 09, 10, 11, 13, 14, 17
Mapa: [map.md](../map.md)

## Question

`DB.md` ima samo principe. Treba zapisati tabele, enume, RPC funkcije, RLS politike, storage, Realtime i seed, tako da vlasnik baze (tiket 12) u utorak napiše prve migracije bez pitanja.

Kad se blokade razriješe, ovdje upisujem **kompletan nacrt šeme** izveden iz odluka 09, 10, 11, 13 i 14. Tvoj posao tada je da pregledaš samo tačke koje označim kao rizične. Q1–Q3 možeš odgovoriti već sada.

Okvirni obim nacrta (za orijentaciju, ne kao odluka):
- tabele: `municipalities`, `institutions`, `categories` (ili enum), `jurisdiction_rules`, `profiles`, `officials` (veza službenik–institucija), `reports`, `report_private`, `letters`, `dispatches`, `report_events` (vremenska linija), `report_likes`, `agent_runs`;
- RPC: `resolve_municipality`, `resolve_jurisdiction`, `find_nearby_open_reports`, `like_report`, `set_report_status`, `next_report_code`;
- storage: privatni bucket za fotografije;
- Realtime: `like_count` na `reports`.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Nacrt šeme pišem ja, ti pregledaš rizične tačke**: Da li ti odgovara da kompletan nacrt pišem ja, iz već donesenih odluka, a ti pregledaš samo tačke koje označim kao „rizično" (one sa posljedicama za privatnost, bezbjednost ili koje je skupo mijenjati)?

➡️ Da. Šema je u najvećoj mjeri posljedica odluka iz tiketa 09–14; nema smisla da je kucaš ti.

**Tvoj odgovor:** Da

---

❓ **Q2 - Uloge se dodjeljuju samo servisnim ključem**: Da li je uloga (`citizen` / `official` / `admin`) kolona u `profiles` koju klijent ne može mijenjati (RLS + trigger), a službenike i administratore u P0 pravi seed skripta sa servisnim ključem?

➡️ Da (nefunkcionalni zahtjev „uloge se ne mogu mijenjati sa klijenta").

**Tvoj odgovor:** Da

---

❓ **Q3 - Demo podaci se brišu jednom komandom**: FR-25: da li su demo prijave označene sa `is_demo = true`, a brišu se jednom SQL funkcijom ili skriptom (`pnpm db:clear-demo`) koja briše i njihove fotografije iz storage-a?

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q4 - Tačka u državi, ali van opština**: Nalaz 01 kaže da poligoni opština ne pokrivaju Skadarsko jezero ni more, a granica države ih pokriva. Prijava sa obale ili sa jezera bi tako prošla FR-4, ali ne bi imala opštinu. Da li se takvoj tački dodjeljuje najbliža opština, ako je udaljena najviše 500 m, a dalje od toga prijava ide administratoru (`routing`)?

➡️ Da. 500 m pokriva obalu, šetališta i mostove, a ne dodjeljuje opštinu tačkama nasred jezera.

**Tvoj odgovor:** Ovako, predomsilila sam se. Zelim da trenutno prva verzija aplikacije radi samo za Podgoricu. Ne moras da razmisljas o drugim opstinama.

## Answer

*Napomena o procesu:* skill `wayfinder` nije mogao da se pokrene iz ove sesije (rezervisan je za ručno pokretanje), pa je tiket riješen po koracima iz koordinatorovog uputstva i [brief-a za talas 1](../wave1-brief.md); `domain-modeling` je korišćen kao kontrolna lista. Kompletan nacrt je u `DB.md` (sekcije 1–14).

- **Q1 [Ivana]** Da: nacrt šeme pišem ja iz odluka 09, 10, 11, 13, 14, 15 i 17, a ti pregledaš samo rizične tačke (ispod).
- **Q2 [Ivana]** Da: uloga je `profiles.role` (`citizen` / `official` / `admin`), klijent je ne može mijenjati (nema `UPDATE` politike + trigger koji odbija promjenu uloge sa korisničkim JWT-om), a službenike i administratora pravi seed skripta servisnim ključem. Dopuna **[Claude]**: trigger koji pravi profil pri registraciji uvijek upisuje `citizen` i nikad ne čita ulogu iz metapodataka registracije, jer te metapodatke piše sam korisnik.
- **Q3 [Ivana]** Da: demo prijave imaju `is_demo = true`, a `pnpm db:clear-demo` ih briše zajedno sa fotografijama iz Storage-a. Dopune **[Claude]**: `is_demo` prijava nasljeđuje od naloga (`profiles.is_demo`), pa ista komanda briše i probne prijave iz razvoja (tiket 12); brojač brojeva prijave se pri brisanju ne vraća, da kod iz videa nikad ne pokaže na drugu prijavu.
- **Q4 [Ivana]** Samo Podgorica: u `municipalities` je jedan red (ME-16, OSM rel. 2319360), bez granice države i bez pufera od 500 m; tačka van granice (i u Tuzima i Zeti) se odbija greškom `outside_area` (FR-4). Tvoj odgovor zamjenjuje preporuku o 500 m, pa pitanje o jezeru i moru otpada.

### Rizične tačke za Ivanin pregled

1. **Identitet je van svake javne i Realtime tabele.** [Claude] `reports`, `report_photos` i `report_events` nemaju nijedan ID korisnika; prijavilac je u `report_private`, podrške u `report_likes`, a ko je sakrio prijavu u `moderation_log`. U Realtime publikaciji je samo `reports`. *Zašto:* Postgres Changes pretplatniku šalje cijeli red (tiket 11). *Ako je pogrešno:* svako ko ima publishable ključ (on je u pregledaču) vidi ko je prijavio i ko je podržao, što krši FR „identitet nikad nije javan". Kasnije premještanje kolone iz `reports` je skupo, jer ga koriste sve politike.
2. **Putanja fotografije je `<uuid>.jpg`, ne `{user_id}/{report_id}/…`.** [Claude] Odluka za tiket 11 (i Tech.md) protiv prijedloga tiketa 15. *Zašto:* potpisani URL sadrži putanju i dijeli se javno, pa bi `{user_id}/` povezao sve prijave istog prijavioca; `{report_id}/` bi tražio nacrt prije otpreme i serijalizovao otpremu i analizu (15 Q2). Ono što je 15 htio (otprema samo za sebe) pokrivaju: politika otpreme samo za stalnog građanina, `owner_id` koji Storage sam upisuje, `unique` putanja i provjera u `begin_submission` da je svaki fajl otpremio baš prijavilac. *Ako je pogrešno:* bez provjere `owner_id` neko bi u svoj dopis mogao uvući tuđu fotografiju čiju je putanju vidio u javnom URL-u; to je zato u bazi, ne u kodu rute.
3. **`EXECUTE` na funkcijama.** [Claude] Svaka funkcija u migraciji ima eksplicitan `revoke … from public, anon, authenticated` i `grant` samo onome kome treba; serverske funkcije (`create_draft`, `begin_submission`, `start_dispatch`, `complete_dispatch`…) dobijaju grant samo za `service_role`. *Zašto:* Postgres podrazumijevano daje `EXECUTE` svima, a serverske funkcije primaju `p_user_id` od servera. *Ako je pogrešno* (zaboravljen `revoke`): bilo ko, i anonimna sesija, poziva te funkcije u tuđe ime, npr. označi prijavu kao poslatu bez mejla ili pravi nacrte drugima. Ovo je najlakše previdjeti; predlažem da RLS test (AGENTS.md test 4) doda pokušaj poziva jedne serverske funkcije anonimnom sesijom.
4. **Anonimna sesija.** [Claude] Nijedna tabela nema klijentsku `INSERT`/`UPDATE`/`DELETE` politiku; sva prava se izvode iz `profiles` preko `private.current_user_role()`, koja za anonimnu sesiju (i za nedostajući claim `is_anonymous`) vraća `null`. Jedina stvar koju anonimna sesija smije je `like_report`. *Zašto:* anonimna sesija ima ulogu `authenticated` (nalaz 05). *Ako je pogrešno:* anonimna sesija pravi prijave ili otprema fajlove, što FR-1 zabranjuje.
5. **Opis, naslov i ozbiljnost nisu javni.** [Claude] Nalaze se u `report_details`, koji čitaju prijavilac, službenik primaoca i administrator. *Zašto:* FR-6 (ozbiljnost samo u panelu), tiket 11 Q7 i PRD §8 ne navode opis kao javan, a opis može sadržati lične podatke koje je građanin otkucao. *Ako je pogrešno:* javna stranica prijave nema opis, samo fotografiju, vrstu, adresu i status. Ako želiš opis javno, to treba odlučiti prije migracije 4.
6. **Slanje dopisa u dva koraka, sa bravom.** [Claude] `start_dispatch` upisuje pokušaj `pending` prije poziva Resenda, a `complete_dispatch` tek poslije uspjeha mijenja status prijave. Najviše jedan `pending` po prijavi i najviše jedan uspjeh po dopisu (jedinstveni indeksi); `pending` stariji od 2 minuta se proglašava neuspjelim. *Zašto:* dvostruki dodir na „Pošalji prijavu" i pad funkcije između Resenda i baze. *Ako je pogrešno:* dupli mejl instituciji ili prijava zauvijek „u slanju". Preostali rizik: ako funkcija padne poslije uspješnog Resenda, a prije `complete_dispatch`, ponovni pokušaj poslije 2 minuta šalje drugi mejl; u `EMAIL_MODE=test` to je samo drugi mejl u `TEST_INBOX`.
7. **Referentni podaci su migracije, demo je skripta, `seed.sql` se ne koristi.** [Claude] Granica Podgorice, 8 institucija i 10 pravila idu u migracije 9 i 10; demo nalozi i prijave idu kroz `pnpm db:seed-demo` sa servisnim ključem. *Zašto:* nema lokalne baze; PRD kaže da se pravila u P0 mijenjaju migracijom; demo traži `auth.admin.createUser` i otpremu fotografija, što SQL ne može. *Posljedica:* svaka ispravka mejla institucije ili pravila je nova migracija koju radiš ti, ne izmjena fajla. Zato prije migracije 10 ponovo provjeri svih 8 adresa (14 Q9).
8. **Demo podaci.** [Claude] Demo prijave se upisuju direktno u konačnom stanju, sa unazad postavljenim datumima i događajima; `like_count` se upisuje direktno (bez redova u `report_likes`); prijavilac je poseban nalog `citizen-seed`, pa `citizen-video` može podržati svaku demo prijavu. Poruke institucija u istoriji su kratke i neutralne, bez rokova i obećanja. *Zašto:* video mora pokazati „14 dana bez rješenja" i „Riješeno za 6 dana" (08 Q4a), a stotine naloga za podrške nemaju smisla. *Ako je pogrešno:* video pripisuje izmišljene odgovore stvarnim institucijama (Sekretarijat, Čistoća…). Predlažem malu oznaku „Demo prijava" na javnoj stranici i mapi za `is_demo` (vidi „Za provjeru"). Takođe: nijedna demo prijava vrste koja se snima uživo ne smije biti bliže od 50 m mjestu snimanja, inače video dobija ekran duplikata.
9. **Tim radi samo sa demo nalozima.** [Claude] `create_draft` kopira `profiles.is_demo` u `reports.is_demo`; skripta pravi `dev-1`…`dev-3`, službenike i administratora sa `is_demo = true`. *Zašto:* jedna komanda (FR-25) treba da počisti i probne prijave iz razvoja na zajedničkom projektu (tiket 12). *Ako je pogrešno* (neko testira sa ličnim nalogom): njegove probne prijave ostaju javne na mapi i poslije `db:clear-demo`.
10. **Otprema fotografija nije vezana za nacrt.** [Claude] Svaki stalni građanin može otpremiti fajl (do 5 MB, samo JPEG) i bez nacrta, jer otprema i stvaranje nacrta teku paralelno. *Zašto:* 15 Q2 (analiza odmah). *Ako je pogrešno:* zlonamjeran nalog može puniti Storage (1 GB na Free planu), pa nove otpreme padaju. Za hakaton prihvaćeno; čišćenje fajlova bez reda u bazi je u DB.md §14 (van P0).

### Izmjene u dokumentima

- `DB.md`: zadržane i dopunjene sekcija 1 „Principi" (dopis više nije u `report_private`, nego u `letters`; identitet nikad u javnoj ni Realtime tabeli; anonimna sesija nije nalog; tabela prelaza živi u bazi; dan po `Europe/Podgorica`), pa dodate sekcije 2–14: ekstenzije i šeme; 16 enuma; 15 tabela sa kolonama, CHECK ograničenjima i indeksima (`municipalities`, `institutions`, `jurisdiction_rules`, `profiles`, `reports`, `report_details`, `report_private`, `report_photos`, `report_events`, `report_likes`, `report_code_counters`, `letters`, `dispatches`, `agent_runs`, `moderation_log`); tabela „javno i privatno"; 7 triggera; pomoćne funkcije u šemi `private`; 22 RPC funkcije sa grantom, provjerama i mapiranjem svih 14 prelaza iz tiketa 10; RLS po tabeli; Storage (privatni bucket, putanja i obrazloženje 11 vs 15, potpisani URL-ovi); Realtime (samo `reports`); seed (granica Podgorice, institucije i pravila iz tiketa 14, demo nalozi, 10 demo prijava, `db:clear-demo`); redoslijed 10 migracija za Supabase CLI 3.0.0 sa `--remote`; šta je van P0.
- Ostali dokumenti nisu dirani; potrebne izmjene su ispod.

### Za provjeru

Nedosljednosti koje treba da ispravi tiket 19 (ili vlasnik dokumenta):

1. **Tech.md §3 i §11:** nema foldera `scripts/` (`seed-demo.ts`, `clear-demo.ts`, `demo-photos/`), a red `supabase/ seed (oblik određuje DB.md)` treba da kaže da `seed.sql` ne postoji (referentni podaci su migracije). U tabelu skripti dodati `db:seed-demo` i `db:clear-demo` (npr. `node --env-file=.env.local scripts/seed-demo.ts`; Node 24 izvršava TypeScript bez nove zavisnosti, ali samo bez `@/` aliasa i bez sintakse koja nije samo tip, pa to provjeriti pri prvom pokretanju). **Tech.md §10:** nova varijabla `DEMO_PASSWORD` (server, samo `.env.local`).
2. **Tech.md §4** kaže da admin klijent služi i za „upis rezultata agenta"; po DB.md admin klijent poziva serverske RPC funkcije (`create_draft`, `record_classification`, `update_draft`, `begin_submission`, `start_dispatch`, `complete_dispatch`) i direktno piše samo u `agent_runs`. **Tech.md §5** („kroz Server Action ili RPC"): odluka je Server Action koja sesijom korisnika zove `add_report_photo`/`remove_report_photo`, pa admin klijentom briše fajl. **Tech.md §6 `sendReport`:** opisati niz `begin_submission` → `start_dispatch` → `lib/email/send.ts` → `complete_dispatch`; provjera da fotografije postoje i da ih je otpremio prijavilac je sada u `begin_submission`, u bazi.
3. **AGENTS.md (vlasnik tiket 12):** (a) „za razvoj i probe koristi samo demo naloge iz `pnpm db:seed-demo`" (rizična tačka 9); (b) uz zlatno pravilo 4: „svaka nova funkcija ima eksplicitan `revoke`/`grant`" (rizična tačka 3); (c) test 4 može dodati poziv serverske funkcije anonimnom sesijom; (d) „Demo podaci se prije predaje brišu": provjeriti da li baš prije predaje, jer žiri tada vidi praznu mapu.
4. **„Nešto drugo" vs „Drugi problem":** PRD FR-7 i tabela toka u tiketu 15 (red 2a) još kažu „Nešto drugo"; GLOSSARY i tiket 13 kažu „Drugi problem".
5. **Dva teksta za dnevno ograničenje:** PRD §6 „Dostigli ste dnevno ograničenje od 10 prijava. Pokušajte ponovo sjutra." i tiket 15 „Danas ste napravili 10 prijava, koliko je dnevno dozvoljeno. Pokušajte ponovo sutra." („sutra" nije crnogorski oblik). Predlažem tekst iz PRD-a.
6. **Opis nije javan** (rizična tačka 5): PRD §8 `/p/[code]` ga ne navodi i DB.md ga drži u `report_details`. Ako treba javno, odluka prije migracije 4.
7. **Oznaka „Demo prijava"** (rizična tačka 8): prijedlog [Claude] da javna stranica i marker na mapi za `is_demo` imaju malu oznaku; nije u PRD-u, UI.md ni GLOSSARY.md.
8. **Tiket 14 vs DB.md:** 14 je predložio da `institutions` čita samo administrator; DB.md ih otvara za čitanje svima, jer naziv institucije treba na javnoj stranici i mapi, a tabela ima samo javne institucionalne podatke. `jurisdiction_rules` ostaje samo za administratora, a javnost dobija `get_jurisdiction_source` bez `notes` i `verified_by`.
9. **Prijedlozi iz drugih tiketa koje DB.md zamjenjuje:** tiket 15 „Za DB.md" (putanja `{user_id}/{report_id}/…`, otprema „samo dok je prijava `draft`"); tiket 10 (`is_hidden`, nazivi `mark_report_submitted`/`mark_report_routed`) → `hidden_at` + generisana `is_hidden`, `begin_submission`/`start_dispatch`/`complete_dispatch`; tiket 08 (`sent_at`/`resolved_at` na prijavi) → `submitted_at`/`closed_at` na `reports` i `letters.sent_at`; tiket 11 (`hidden_by` na prijavi i fotografiji) → `moderation_log`; nalaz 01 (`db push --include-seed`) se ne koristi.
10. **PRD FR-18** ima 13 redova prelaza, a tiket 10 i DB.md 14 (red 4: `draft → draft` kad slanje ne uspije). Sadržajno se ne kosi (FR-11 to kaže riječima); može se dodati red radi usklađenosti numeracije.
11. **PRD FR-5** „Nacrt vidi samo njegov autor" → „prijavilac" (već na listi tiketa 09).
