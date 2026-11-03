# 21 — Odakle dolaze fotografije za demo prijave

Type: grilling
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Ivana ne želi ručno dodavati slike za demo i traži da demo prijave imaju generisane fotografije problema (rupa na putu, rasvjeta itd.). Treba odlučiti odakle slike dolaze, gdje se čuvaju i kako se označavaju. Ista grupa slika može poslužiti i za mjerenje modela u tiketu 20.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Izvor slika**: Ja (Claude) ne mogu sam praviti fotografije. Mogu pisati kod i tražiti po internetu, ali ne generišem slike. Opcije:

- **(a) AI-generisane slike** preko servisa za generisanje slika (npr. OpenAI, Google ili Stability). Potrebni su nalog i API ključ tog servisa, novi servis koji nije u Tech.md (pravilo 8) i nekoliko centi po slici. Slike se generišu jednom i čuvaju u repou, pa aplikacija taj servis ne koristi pri radu.
- **(b) Fotografije sa otvorenom licencom** (Wikimedia Commons, licence CC0 ili CC-BY): stvarne fotografije rupa, rasvjete, deponija i ostalog. Ja ih sam nalazim i preuzimam, a autore navodim u jednom fajlu. Ne trebaju novi nalog, ključ ni novac, i to mogu odmah.
- **(c) Kombinacija:** (b) gdje nađem dobru fotografiju, (a) samo za vrste koje fale.

Za tebe je razlika u ovome: u (a) i (c) ti otvaraš nalog i daješ ključ još jednog servisa, a u (b) ne radiš ništa. Da li biramo **(b)**?

➡️ Da, (b). Upravo si tražila da ključeve odložimo, a (b) ne traži ni ključ ni novi servis. Slike su stvarne fotografije, pa u videu izgledaju uvjerljivije nego generisane, a ja ih pripremam bez tebe. Ako za neku vrstu ne nađem dobru fotografiju, javljam ti i tada biramo (c).

**Tvoj odgovor:** Da

---

❓ **Q2 - Jedna do dvije slike po vrsti, u repou**: Da li pravim oko 12–15 slika (bar jednu za svaku vrstu sa pravilom, plus grafiti i „Drugi problem"), smanjenih na 1600 px JPEG bez metapodataka? Čuvaju se u `scripts/demo-photos/` uz fajl sa autorima i licencama, a `pnpm db:seed-demo` ih otprema u privatni bucket.

➡️ Da.

**Tvoj odgovor:** Moze ukupno 8 slika, po 2 slike za jednu vrstu, ne moraju sve vrste biti imati slike za sad. Bitno je da imamo vrstu rupe na putu i dodaj slike u jos 3 vrste.

---

❓ **Q3 - Bez lica i tablica, i jasno označeno kao demo**: Da li biram samo slike bez prepoznatljivih lica i čitljivih tablica (tiket 11), a sve demo prijave nose oznaku „Demo prijava" (tiket 19, Q5) i brišu se sa `db:clear-demo`?

➡️ Da. Demo prijave su na stvarnim lokacijama u Podgorici i pripisane stvarnim institucijama, pa ne smiju izgledati kao prave prijave građana.

**Tvoj odgovor:** Da

---

❓ **Q4 - Iste slike služe i za mjerenje modela**: Da li istu grupu slika, uz 2–3 dodatne slike sa tekstom koji glumi instrukciju, koristim i za test u tiketu 20? Od tebe bi tada trebao samo API ključ, kad ga dodaš.

➡️ Da.

**Tvoj odgovor:** Da

---

## Answer

- **Q1 — Izvor:** (b), fotografije sa otvorenom licencom sa Wikimedia Commons, koje Claude nalazi i preuzima, bez novog servisa, ključa i troška **[Ivana]**. Dozvoljeni su CC0, javno dobro, CC BY i CC BY-SA, sa prednošću za CC0 i javno dobro **[Claude]**, jer za njih ne treba atribucija u aplikaciji. Za CC BY / BY-SA lista autora ide i u odjeljak „Demo fotografije" na `/privatnost` **[Claude]**, jer licenca traži da atribucija bude dostupna onome ko fotografiju vidi, ne samo u repou. Ako za neku vrstu nema dobre fotografije, Claude javlja Ivani prije nego što se bira (c).
- **Q2 — Broj:** ukupno **8 fotografija, po 2 za 4 vrste**; `pothole` je obavezna **[Ivana]**. Ostale tri su **`street_light`, `illegal_dump` i `manhole`** **[Claude]**: sve imaju pravilo u Podgorici, svaka ide drugoj instituciji (Komunalne usluge, Čistoća, ViK; uz Sekretarijat za saobraćaj za `pothole` to su četiri primaoca), a na fotografiji se lako prepoznaju, i za gledaoca videa i za mjerenje modela (Q4). Kod `street_light` biramo vidljivo oštećenu, oborenu ili polomljenu svjetiljku, ne samo ugašenu (ugašena lampa danju ne izgleda kao problem). Ako takve nema pod dozvoljenom licencom, zamjena je `greenery` (oboreno drvo), uz javljanje Ivani.
- **Q2 — Čuvanje:** `scripts/demo-photos/pothole-1.jpg` … `manhole-2.jpg`, 1600 px JPEG bez EXIF-a, i `scripts/demo-photos/CREDITS.md` sa autorima i licencama **[Claude]**, po preporuci iz Q2 (Ivanin odgovor mijenja samo broj fotografija).
- **Q2 — Demo prijave bez fotografije:** svaka fotografija pripada tačno jednoj demo prijavi i prikazuje njenu vrstu **[Claude]**. Zato je skup demo prijava u DB §12.4 preuređen: 8 prijava sa fotografijama (po 2 za svaku od četiri vrste, sa statusima i brojačima dana kao ranije) i 2 bez fotografije (`graffiti` u `routing`, `other` odbijena), sa tekstom „Demo prijava nema fotografiju." **[Claude]**. Fotografija se ne pozajmljuje od druge vrste, jer bi bila netačan prikaz, niti se ista fotografija stavlja u dvije prijave, jer bi to izgledalo kao duplikat; oznaka „Demo prijava" ostaje na svima. Ukupno ostaje ~10 demo prijava (PRD §4.4).
- **Q3 — Lica, tablice, oznaka:** samo fotografije bez prepoznatljivih lica i čitljivih tablica; sve demo prijave nose oznaku „Demo prijava" (tiket 19 Q5) i brišu se sa `pnpm db:clear-demo`, poslije ocjenjivanja **[Ivana]**.
- **Q4 — Mjerenje modela:** istih 8 fotografija, uz 2–3 dodatne sa tekstom koji glumi instrukciju, koristi tiket 20 **[Ivana]**; od Ivane treba samo API ključ.

### Izmjene u dokumentima

- `DB.md` §12: tabela grupa podataka (8 fotografija); §12.3 opis naloga službenika (`official-zelenilo` nema demo prijavu); §12.4 nova tabela demo prijava sa kolonom „Fotografija" (redovi 5–8 sada ponavljaju četiri vrste sa fotografijama), pravila za fotografije, `CREDITS.md` i licence, i izuzetak za demo prijave bez fotografije.
- `Tech.md` §3: `scripts/demo-photos/` (8 fotografija, 4 vrste, `CREDITS.md`).
- `PRD.md`: FR-25 (izvor fotografija i demo prijave bez fotografije); §8 `/privatnost` (odjeljak „Demo fotografije" ako ima CC BY / BY-SA).
- `GLOSSARY.md`: „Demo prijava" pominje fotografije sa otvorenom licencom i prijave bez fotografije.

### Za provjeru

- Ranija tabela demo prijava imala je po jednu prijavu za 10 vrsta; sada video na mapi pokazuje 6 vrsta (4 sa fotografijama, `graffiti` i `other`). Ako želiš više vrsta na mapi, dodaju se prijave bez fotografije, bez novih slika.
- Tiket 20 sa ovim skupom mjeri prepoznavanje samo za 4 vrste (plus slike sa instrukcijom); za ostale vrste mjerenje treba dodatne fotografije.
- Fotografije nisu iz Podgorice, a demo prijave stoje na stvarnim lokacijama u Podgorici; oznaka „Demo prijava" i natpis u videu (19 Q8) to čine poštenim prema žiriju.

### Novi tiketi / magla

- **Preuzimanje demo fotografija (izrada, ne planiranje):** naći na Wikimedia Commons po 2 fotografije za `pothole`, `street_light`, `illegal_dump` i `manhole` (CC0 / javno dobro prvo, zatim CC BY / BY-SA); provjeriti da nema prepoznatljivih lica ni čitljivih tablica; smanjiti na 1600 px po dužoj strani, JPEG, i ukloniti sve metapodatke (EXIF i GPS) bez nove zavisnosti (npr. kroz isti canvas postupak kao `lib/photos/compress.ts` ili alat koji već postoji na računaru), pa provjeriti da metapodataka zaista nema; upisati `scripts/demo-photos/CREDITS.md`; ako je ijedna CC BY / BY-SA, dodati odjeljak „Demo fotografije" na `/privatnost`. Javiti Ivani ako za neku vrstu nema dobre fotografije.
