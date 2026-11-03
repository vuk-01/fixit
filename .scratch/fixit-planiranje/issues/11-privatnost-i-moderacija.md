# 11 — Privatnost i moderacija javnih prijava

Type: grilling
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Prijave su javne odmah, a fotografije mogu sadržati lica i tablice. Treba odlučiti šta je javno, kad i ko šta vidi, uključujući otvoreno pitanje iz PRD §10 o dostavljanju podataka. Zakon o zaštiti podataka o ličnosti važi.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Dostavljanje podataka je isključeno dok ga građanin ne uključi**: PRD §10 ostavlja otvoreno da li je dostavljanje imena, prezimena i mejla instituciji podrazumijevano uključeno. Da li je **isključeno** (prekidač „Dostavi moje ime i mejl instituciji", podrazumijevano isključen)?

➡️ Da. Saglasnost po zakonu mora biti aktivna radnja, a ovako je i put bez dodatnih dodira (ostaje isključeno) najbrži.

**Tvoj odgovor:** Da

---

❓ **Q2 - Prijava je javna odmah po slanju**: Da li se poslata prijava odmah pojavljuje na javnoj mapi, a administrator je naknadno može sakriti (moderacija poslije, ne prije)?

➡️ Da. Prethodno odobravanje bi zahtijevalo dežurnog administratora i ubilo bi demo trenutak sa QR kodom.

**Tvoj odgovor:** Prijava je javna nakon slanja. Nema QR code i demo je samo video koji cemo prikazati.

---

❓ **Q3 - Fotografija sa licima ili tablicama nije javna dok je administrator ne pregleda**: AI vraća oznaku „vidljivi lični podaci" (FR-6). Opcije:
(a) fotografija je javna, a administrator je može sakriti;
(b) javna stranica prikazuje zamjensku sliku („Fotografija čeka pregled") dok administrator ne odobri, dok je institucija u dopisu dobija normalno;
(c) takva fotografija nikad nije javna.
Da li biramo **(b)**?

➡️ Da, (b). Zamućivanje je van scope-a, a CSS zamućenje ne štiti ništa jer se original svejedno učitava. Institucija fotografiju treba vidjeti, a javnost ne mora.

**Tvoj odgovor:** nek bude odgovor a

---

❓ **Q4 - Fotografije se ne služe iz javnog bucketa**: Iz Q3 slijedi da javni bucket ne može zaustaviti fotografiju koja čeka pregled. Da li fotografije čuvamo u **privatnom** bucketu, a javna stranica dobija potpisani URL samo za fotografije koje nisu označene ni sakrivene? (Tehnički detalj se zaključava u tiketu 18; ovdje se pita samo princip.)

➡️ Da.

**Tvoj odgovor:**

---

❓ **Q5 - Ko vidi identitet prijavioca**: Da li je pravilo ovakvo?
- **Javnost i drugi građani:** nikad ne vide ko je prijavio niti ko je podržao.
- **Službenik:** vidi ime i mejl samo ako je građanin uključio dostavljanje (Q1), i to samo u dopisu.
- **Administrator:** vidi nalog prijavioca (zbog zloupotreba), ali ne i ko je podržao.

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q6 - Metapodaci fotografije se brišu**: Da li se pri kompresiji na klijentu brišu svi EXIF metapodaci (uključujući GPS i model telefona), tako da ni javna ni poslata fotografija ne nosi ništa osim slike? Lokaciju čuvamo samo iz potvrđenog pina.

➡️ Da. Kompresija preko canvasa to radi sama.

**Tvoj odgovor:** Da

---

❓ **Q7 - Kratko obavještenje o privatnosti bez dodatnog dodira**: Da li na `/uloguj-se` stoji jedan pasus („Šta javno vidi drugi, a šta ne") sa linkom na kratku stranicu „Privatnost", bez checkbox-a, a pri prvom fotografisanju napomena „Izbjegavajte lica i registarske tablice na fotografiji"?

➡️ Da. Ne dodaje dodire, a pokriva osnovnu transparentnost za demo i žiri.

**Tvoj odgovor:** Da

---

❓ **Q8 - Zloupotreba anonimnih podrški je prihvaćen rizik**: Anonimni korisnik može obrisati kolačiće i podržati prijavu ponovo. Da li to za hakaton prihvatamo kao poznat rizik (bez CAPTCHA-e), uz ograničenje broja anonimnih sesija po IP-u ako Supabase to nudi bez dodatnog posla?

➡️ Da. CAPTCHA bi usporila QR trenutak u demou.

**Tvoj odgovor:** Ne postoji QR u demo, QR smo totalno izbrisali iz plana app i demo-a.

---

## Answer

- **Q1 — Dostavljanje podataka isključeno dok ga građanin ne uključi:** da; prekidač „Dostavi moje ime i mejl instituciji", podrazumijevano isključen. **[Ivana]** Dopuna: prekidač je isključen pri **svakoj** prijavi i izbor se ne pamti sa prethodne prijave. **[Claude]**, jer bi pamćenje izbora u praksi značilo „podrazumijevano uključeno" za svaku sljedeću prijavu. Ime se više ne traži na tom ekranu, jer je obavezno pri registraciji (odluka iz brief-a, 15 Q4).
- **Q2 — Prijava je javna odmah po slanju:** da, javna je čim je poslata; moderacija je naknadna (administrator može sakriti), bez odobravanja unaprijed. **[Ivana]** Razlog za naknadnu moderaciju više nije QR trenutak, nego to što nemamo dežurnog administratora, a video pokazuje prijavu na javnoj stranici odmah po slanju.
- **Q3 — Fotografija sa licima ili tablicama:** (a), označena fotografija je javna, a administrator je može sakriti. **[Ivana]** Dopune **[Claude]**, da (a) bude upotrebljivo: (1) sakriva se pojedinačna fotografija ili cijela prijava, jer prijava može imati više fotografija (brief, tačka 3); (2) na javnoj stranici sakrivenu fotografiju zamjenjuje tekst „Fotografija je uklonjena radi zaštite privatnosti"; (3) `/admin` ima listu označenih fotografija; (4) na ekranu pregleda, ako je fotografija označena, stoji napomena „Na fotografiji su možda vidljiva lica ili tablice. Fotografija će biti javna." bez dodatnog dodira, da građanin zna prije slanja i može ukloniti ili ponovo napraviti fotografiju.
- **Q4 — Privatni bucket:** da, fotografije su u **privatnom** bucket-u, a javne stranice dobijaju kratkotrajne potpisane URL-ove sa servera, samo za fotografije koje nisu sakrivene, iz prijava koje nisu `draft` ni sakrivene. Putanja fajla je nasumična (npr. `<uuid fotografije>.jpg`) i **ne sadrži ID korisnika**. **[Claude]**, jer: uz (a) javni bucket jeste moguć, ali sakrivanje onda znači brisanje ili premještanje originala, a keš CDN-a i sačuvani javni URL-ovi mogu i dalje služiti fotografiju; kod privatnog bucket-a sakrivanje je samo oznaka u bazi, djeluje odmah za nove prikaze, original ostaje za instituciju i administratora, a potpisani URL ističe sam. Cijena je to što URL-ove pravi server, ali javna mapa i `/p/[code]` se ionako renderuju na serveru. Nasumična putanja je potrebna i kod potpisanih URL-ova, jer potpisani URL sadrži putanju: putanja `<auth.uid()>/…` iz nalaza 07 bi javno povezivala sve prijave istog prijavioca, što krši Q5.
- **Q5 — Ko vidi identitet:** da: javnost nikad ne vidi prijavioca ni ko je podržao; službenik vidi ime i mejl samo uz saglasnost i samo u dopisu; administrator vidi nalog prijavioca, ali ne i ko je podržao. **[Ivana]** Dopune **[Claude]**, jer slijede iz istog pravila: u javnoj vremenskoj liniji poruku službenika potpisuje institucija, ne ime službenika; tekst dopisa nije javan (javna stranica ga ne prikazuje, kao što već stoji u PRD §8); pravilo važi i za Realtime (vidi „Za DB.md").
- **Q6 — Brisanje metapodataka:** da; canvas kompresija briše sav EXIF, original se ne otprema, lokacija samo iz potvrđenog pina. **[Ivana]**
- **Q7 — Kratko obavještenje bez dodatnog dodira:** da; pasus na `/uloguj-se` sa linkom na `/privatnost`, bez checkbox-a, i napomena pri prvom fotografisanju. **[Ivana]** Prijedlog teksta **[Claude]** (ide u `lib/constants.ts`): pasus „Javno se vide fotografija, vrsta problema, lokacija, status i broj podrški. Vaše ime, mejl i nalog nijesu javni, kao ni to ko je podržao prijavu. Instituciji dostavljamo vaše ime i mejl samo ako to sami uključite pri slanju prijave." + link „Više o privatnosti"; napomena ispod dugmeta za fotografisanje: „Izbjegavajte lica i registarske tablice na fotografiji." Napomena je tekst, ne dijalog, pa ne traži dodir.
- **Q8 — Zloupotreba anonimnih podrški:** prihvaćen rizik za hakaton, bez CAPTCHA-e u P0; važi Supabase limit od 30 anonimnih prijavljivanja na sat po IP-u, koji **ne podižemo**; CAPTCHA (Cloudflare Turnstile, nevidljiva) uvodi se prije pilota. **[Claude]**, jer bez QR-a nema publike koja bi udarila u limit, pa podrazumijevani limit samo pomaže, a CAPTCHA bi se, po nalazu 05, uključila i za registraciju i prijavu (sve forme šalju `captchaToken`), uz novu zavisnost i rizik da pokvari snimanje videa, za korist koju demo ne pokazuje. Ostale zaštite koje već postoje: jedna podrška po prijavi po sesiji, autor ne podržava svoju prijavu, podrška samo za otvorene prijave. Napomena: odgovor „nema QR-a" ne mijenja samu odluku, samo razlog i preporuku iz nalaza 05 da se limit podigne prije demoa (to više ne važi).

### Izmjene u dokumentima

- `PRD.md` §3, red „Administrator platforme": moderacija = sakrivanje prijava i pojedinačnih fotografija.
- `PRD.md` FR-11: prekidač „Dostavi moje ime i mejl instituciji", podrazumijevano isključen pri svakoj prijavi; uklonjena rečenica o unosu imena prije slanja (ime je obavezno pri registraciji, brief tačka 4).
- `PRD.md` §6 „Privatnost": zamijenjena jedna rečenica sekcijom sa odlukama Q1–Q8 (javno odmah, ko vidi identitet, fotografije sa ličnim podacima i sakrivanje, privatni bucket, EXIF, obavještenje, URL-ovi i logovi, zloupotreba podrški).
- `PRD.md` §8: nova javna ruta `/privatnost`; red `/admin` dopunjen listom označenih fotografija i sakrivanjem.
- `PRD.md` §10: zatvoreno pitanje o podrazumijevanom dostavljanju podataka (odgovor je u FR-11).

### Za DB.md (tiket 18)

- **Storage:** privatni bucket (npr. `report-photos`), `allowed_mime_types = image/jpeg`, mali `file_size_limit`. `INSERT` politika: samo `authenticated` sa `is_anonymous is false`; bez javnog `SELECT`. Putanja `<uuid>.jpg` bez ID-a korisnika; vlasništvo preko `storage.objects.owner_id` i tabele fotografija. Ovo mijenja preporuku iz nalaza 07 (`<auth.uid()>/<uuid>.jpg`). Treba odlučiti kako upload politika ograničava korisnika bez foldera po `uid` (npr. samo `owner_id = auth.uid()` za čitanje vlastitih fotografija u nacrtu).
- **Fotografije:** tabela fotografija prijave (npr. `report_photos`: `report_id`, `storage_path`, `position`, `has_personal_data`, `hidden_at`, `hidden_by`). Oznaka ličnih podataka je **po fotografiji**, ne samo po prijavi.
- **Prijava:** `reports.hidden_at` / `hidden_by` (ili ekvivalent); sakrivena prijava se ne vraća u javnim upitima, prijedlozima duplikata (FR-9) ni javnoj statistici.
- **Potpisani URL-ovi:** izdaje ih samo server (admin klijent), poslije provjere da prijava nije `draft` ni sakrivena i da fotografija nije sakrivena; za službenika (samo svoja institucija) i administratora i za sakrivene. Trajanje npr. 1 sat; `createSignedUrls` za listu na mapi.
- **Identitet van javnih podataka:** javno čitljiva tabela ili pogled ne smije sadržati `reporter_id` ni ID-jeve korisnika iz podrški. Pažnja na Realtime (FR-17): ako se javnost pretplati na `reports` ili `report_likes`, događaji nose cijeli red, pa `reporter_id` i `user_id` ne smiju biti u onome što javnost čita. Predlog: `reporter_id` u `report_private`, brojač podrški kao kolona koju ažurira trigger, a Realtime na tu kolonu ili na Broadcast. `report_likes` čita samo vlasnik reda (da zna da je već podržao).
- **„Da li je moja":** javna stranica mora znati da autor ne može podržati svoju prijavu, bez otkrivanja `reporter_id` (npr. RPC `is_my_report(code)` ili provjera u RPC-u za podršku).
- **Saglasnost:** `share_contact boolean not null default false` po prijavi (u `report_private` ili uz dopis); ime i mejl ulaze u tekst dopisa tek pri slanju. Službenik ne čita `profiles`.
- **Vremenska linija:** javni događaj nosi instituciju, ne ime službenika.
- **Anonimni korisnici:** Supabase ih ne briše sam; ako se kasnije doda SQL za brisanje starijih od 30 dana, podrške ne smiju nestati kaskadno (inače brojači padaju). Za hakaton čišćenje ne raditi.
- **Logovi:** `agent_runs` ne čuva ime, mejl ni sliku (samo putanju ili ID fotografije).

### Za provjeru

- **(a) je slabije od (b) u pravnom smislu.** Javno objavljivanje fotografije na kojoj se prepoznaje lice ili tablica je obrada ličnih podataka trećih lica, a ovdje se oslanjamo samo na naknadno sakrivanje. Za hakaton sa demo podacima je prihvatljivo; prije pilota sa pravim građanima vrijedi ponovo razmotriti (b) ili zamućivanje. Privatni bucket iz Q4 ostavlja prelaz na (b) jeftinim (samo pravilo kad server izdaje URL).
- **Demo fotografije:** seed prijave i fotografija u videu ne smiju imati prepoznatljiva lica ni čitljive tablice, jer video prikazuje javnu mapu i javnu stranicu (tiket 08).
- **Oznaka po fotografiji:** uz više fotografija u jednom pozivu modela, šema iz nalaza 04 (`visible_personal_data` po prijavi) treba da vrati oznaku po fotografiji (npr. listu indeksa). Ako ostane po prijavi, označavaju se sve fotografije te prijave. FR-6 to još ne kaže; pripada tiketu 15 ili 20 (mjerenje modela).
- **Nepotvrđen mejl:** ako se „Confirm email" isključi (nalaz 05), instituciji se uz saglasnost može dostaviti tuđi mejl. To je odluka tiketa o auth-u, ali utiče na tačnost podataka iz FR-11.
- **Rok čuvanja i brisanje naloga** nijesu odlučeni; stranica `/privatnost` za sada nudi samo kontakt mejl za zahtjeve za uklanjanje. Ne pisati konkretne članove zakona ni rokove na toj stranici (pravilo 7).
- **Brisanje EXIF-a** provjeriti EXIF čitačem na oba telefona (nalaz 06 to označava kao „srednja" pouzdanost). Ako se ikad doda konverzija HEIC-a na serveru, i ona mora brisati metapodatke.
- **Terminologija:** u novom tekstu koristim „podrška/podržati" (tiket 09, Q1), dok ostatak PRD-a još kaže „lajk".

### Novi tiketi / magla

- **Da li je anonimna podrška još P0?** Bez QR-a i bez demoa uživo, anonimne sesije više nemaju razlog u demou (video prikazuje samo perspektivu građanina sa nalogom). Prijedlog za tiket 08/10: prebaciti anonimnu podršku u P1 i time ukloniti cijeli rizik iz Q8 i posao oko `is_anonymous` politika za P0.
- **Pojmovi za GLOSSARY.md (tiket 09):** „sakrivena prijava", „sakrivena fotografija", „označena fotografija" (vidljivi lični podaci), „dostavljanje podataka" / „saglasnost za dostavljanje".
- **Tekst stranice `/privatnost`:** mali zadatak za izradu (sadržaj po PRD §8), uz provjeru Ivane prije predaje.
