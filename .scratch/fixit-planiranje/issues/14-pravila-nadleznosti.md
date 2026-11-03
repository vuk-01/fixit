# 14 — Pravila nadležnosti: oblik, izvori i slučaj bez pravila

Type: grilling
Status: resolved
Blocked by: 02, 08
Mapa: [map.md](../map.md)

## Question

Kako izgleda jedno pravilo u `jurisdiction_rules`, šta se računa kao izvor, kako `resolve_jurisdiction` bira pravilo i šta se dešava kad pravila nema? Ovo je srce zlatnog pravila 1.

Nalaz o nadležnosti u Podgorici (02) može promijeniti Q2 i Q6. Ostala pitanja možeš odgovoriti već sada.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Polja pravila**: Da li pravilo ima ova polja: `category`, `municipality_id` (prazno = važi za cijelu zemlju), `institution_id`, `source_url`, `source_title`, `source_excerpt` (kratak citat), `verified_at`, `verified_by`, `notes`? Bez `source_url` ili `source_title` pravilo ne može postojati (`NOT NULL` + `CHECK`).

➡️ Da.

**Tvoj odgovor:**

---

❓ **Q2 - Dva nivoa: opštinsko pa nacionalno pravilo**: PRD kaže „vrsta + opština, sa opštim pravilom kao rezervom". Da li je redoslijed:
1. pravilo za (vrsta, opština);
2. pravilo za (vrsta, cijela zemlja), npr. elektroinfrastruktura ili državni organ;
3. nema pravila → `routing`, prijava ide administratoru.

Bez „sve ostalo u ovoj opštini ide sekretarijatu X".

➡️ Da. „Opšte pravilo" znači nacionalno pravilo za istu vrstu, ne rezervu za bilo koju vrstu. Rezerva „sve ide sekretarijatu" bi bila skriveno nagađanje.

**Tvoj odgovor:**

---

❓ **Q3 - Šta se računa kao izvor**: Da li je izvor jedno od:
(a) zvanični dokument (odluka, statut, Službeni list) ili zvanična stranica institucije, sa URL-om i citatom;
(b) pisana potvrda institucije (mejl), uz datum i ime;
(c) telefonska potvrda, uz datum, ime i napomenu „telefonom".
A ništa drugo (članci, forumi, „svi znaju") se ne računa?

➡️ Da. (c) dozvoljavamo samo zato što je rok kratak; takvo pravilo se u adminu vidi kao „slabiji izvor".

**Tvoj odgovor:**

---

❓ **Q4 - Prave javne adrese institucija u tabeli**: Da li u `institutions` upisujemo **prave javne mejl adrese** (sa izvorom), znajući da `EMAIL_MODE=test` i test iz tiketa 12 garantuju da nijedan mejl ne ide na njih? Alternativa: lažne adrese `@example.invalid` kao dodatni sloj zaštite.

➡️ Da, prave adrese. Na pregledu prijave građanin i žiri vide „Šalje se: Sekretarijat… (adresa)", što je ubjedljivije. Zaštita je guard u `lib/email/send.ts`, a ne lažni podaci. Ako ti je sigurnije sa lažnim adresama, napiši „lažne".

**Tvoj odgovor:**

---

❓ **Q5 - Minimalni administratorski red čekanja je P0**: FR-8 šalje prijave bez pravila administratoru, a `/admin` u PRD-u nema prioritet. Da li je u P0 minimalna stranica `/admin`: lista prijava u `routing`, izbor institucije i dugme „Pošalji dopis"? CRUD institucija i pravila ostaje P1, a do tada se mijenja seed-om ili migracijom.

➡️ Da. Bez toga prijava bez pravila zauvijek visi, a to je tok koji će žiri lako izazvati (npr. fotografija iz druge opštine).

**Tvoj odgovor:**

---

❓ **Q6 - Nejasna nadležnost se rješava pravilom, ne AI-jem**: Za vrste gdje nadležnost zavisi od nečega što ne znamo (npr. vlasnik šahta, lokalni ili državni put), da li pravilo upućuje na instituciju koju izvor imenuje kao koordinatora ili najčešćeg vlasnika, a dopis ionako sadrži molbu „ako niste nadležni, obavijestite nas"?

➡️ Da. Konkretan koordinator za svaku takvu vrstu dopisujem iz nalaza 02.

**Tvoj odgovor:**

---

❓ **Q7 - Građanin vidi zašto je izabrana ta institucija**: Da li na ekranu pregleda i na javnoj stranici stoji mali link „Zašto ova institucija?" koji otvara izvor pravila?

➡️ Da. Nema dodatnog dodira u glavnom toku, a odmah pokazuje razliku od „AI je pogodio".

**Tvoj odgovor:**

---

*Pitanja Q8–Q10 su dodata nakon [nalaza 02](../research/02-nadleznost-podgorica.md).*

❓ **Q8 - Kome idu putevi: Sekretarijatu za saobraćaj, uz kopiju Putevima**: Putevi d.o.o. izvodi radove na kolovozu, trotoarima i znakovima, ali po nalogu Sekretarijata za saobraćaj Glavnog grada. Izvori daju prednost Sekretarijatu kao naručiocu radova. Da li pravilo dobija **jednog primaoca** (Sekretarijat) i **opcionu kopiju** (`cc_institution_id` = Putevi)? To bi značilo da dopis može imati kopiju, pa šema dobija i to polje.

➡️ Da. Organ koji izdaje nalog je onaj koji „odlučuje", a Putevi dobijaju kopiju kako bi mogli odmah reagovati. Ako želiš da šema ostane jednostavnija (bez kopija), napiši „samo Putevi" ili „samo Sekretarijat".

**Tvoj odgovor:**

---

❓ **Q9 - Javne adrese na `@t-com.me` provjeravamo prije seed-a**: Većina gradskih preduzeća objavljuje adrese na `@t-com.me`, a ne na svom domenu. Izvori su zvanični, ali adrese mogu biti zastarjele. Da li se prije unosa u seed svaka adresa još jednom provjerava na zvaničnom sajtu, uz `verified_at`, a adresa bez izvora ostaje prazna (institucija tada nema mejl i ide u `routing`)?

➡️ Da.

**Tvoj odgovor:**

---

❓ **Q10 - Služba za građane nije rezervni primalac**: Služba za građane Glavnog grada je zvanično dužna da u roku od 48 sati proslijedi pitanja o nadležnosti, ali je jedina objavljena adresa lična adresa njenog šefa. Da li **ne pravimo** pravilo koje prijave bez nadležnog šalje toj službi, nego one i dalje idu našem administratoru (`routing`)?

➡️ Da. Lična adresa službenika ne smije biti u tabeli, a rezerva „šalji nekome ko će proslijediti" je skriveno nagađanje. Ovo potvrđuje odgovor na Q2.

**Tvoj odgovor:**

---

## Answer

Sva pitanja su ostala bez odgovora, pa su sve odluke **[Claude]**, usklađene sa odlukom „samo Podgorica" (brief, tačka 1; tiket 18 Q4) i nalazom 02.

- **Q1 — Polja pravila:** Da, uz tri izmjene. Polja: `category`, `municipality_id` (**NOT NULL**), `institution_id`, `cc_institution_id` (nullable, vidi Q8), `source_type` (vidi Q3), `source_url`, `source_title` (NOT NULL), `source_excerpt`, `verified_at` (NOT NULL), `verified_by`, `notes`. `UNIQUE (category, municipality_id)`, pa jednoj kombinaciji odgovara najviše jedno pravilo. `source_url` je obavezan (`CHECK`) za zvanične dokumente i stranice, a za pisanu ili telefonsku potvrdu ga nema; tada `notes` mora sadržati datum, kanal i ko je potvrdio. **[Claude]** jer potvrda mejlom ili telefonom nema URL, pa bi doslovno „bez `source_url` nema pravila" isključilo izvore (b) i (c) iz Q3.
  - **`municipality_id` ostaje, ali kao NOT NULL** **[Claude]**: kolona košta ništa, a kasnije uvođenje druge opštine je samo novi red; značenje „NULL = cijela zemlja" ne uvodimo jer u P0 ne postoji nijedno nacionalno pravilo sa potvrđenim mejlom (Uprava za saobraćaj bez mejla, CEDIS bez mejla za kvarove), pa bi to bio netestiran put. Kasnije je `DROP NOT NULL` jeftina migracija koja ništa ne lomi.
- **Q2 — Nivoi:** U P0 je **jedan nivo**: tačno pravilo za (vrsta, Podgorica) ili `routing`. Nema nacionalnog nivoa i nema rezerve „sve ostalo ide sekretarijatu X". **[Claude]** jer aplikacija u P0 radi samo za Podgoricu (FR-4 odbija lokacije van nje), pa nacionalni nivo nema šta da pokrije; zabrana „rezerve za sve" ostaje kako je preporučeno.
  - `resolve_jurisdiction(category, municipality_id)` je deterministička: vraća `matched` (pravilo, primalac, kopija), `no_rule` ili `no_email` (pravilo postoji, ali primalac nema provjeren mejl, vidi Q9). `no_rule` i `no_email` → status `routing` (tiket 10 Q1). Nema rangiranja ni AI-ja: `UNIQUE` garantuje najviše jedan pogodak.
  - Pravilo se razrješava za **konačnu** vrstu: ako građanin na pregledu promijeni vrstu, nadležni se ponovo razrješava prije slanja.
- **Q3 — Šta je izvor:** Da: (a) zvanični dokument ili zvanična stranica institucije, (b) pisana potvrda institucije, (c) telefonska potvrda; ništa drugo. Čuva se kao `source_type` (`official_document`, `official_page`, `written_confirmation`, `phone_confirmation`). (c) se u adminu i na „Zašto ova institucija?" prikazuje kao „slabiji izvor (potvrda telefonom)". **[Claude]** jer je to preporuka i ne kosi se ni sa jednom odlukom. Sva pravila u P0 seed-u su tipa (a).
- **Q4 — Prave adrese:** Da, prave javne institucionalne adrese sa izvorom; zaštita je guard u `lib/email/send.ts` i `EMAIL_MODE=test` (zlatno pravilo 2). **[Claude]** jer je adresa na ekranu pregleda dio „vidi se kome ide" priče, a lažni podaci ne bi štitili ništa što guard već ne štiti. Guard mora preusmjeriti i **kopiju** (Q8), ne samo primaoca.
- **Q5 — Minimalni `/admin` je P0:** Da. `/admin` u P0: lista prijava u `routing`, izbor institucije (samo one sa provjerenim mejlom), dugme „Pošalji dopis" → isti šablon i ista `lib/email/send.ts`, status `sent`, u vremenskoj liniji „Nadležnog je odredio administrator Fixita". Lista `not_competent` dolazi sa dugmetom u panelu (P1, tiket 10 Q4). CRUD institucija i pravila je P1; do tada izmjene idu migracijom ili seed-om. Ručni izbor administratora **ne stvara pravilo**. **[Claude]** jer bez ovoga prijava za grafite ili „nešto drugo" zauvijek visi; ručni izbor je odluka čovjeka, ne AI-ja, pa ne krši zlatno pravilo 1.
- **Q6 — Nejasna nadležnost rješava pravilo:** Da. Pravilo upućuje na instituciju koju izvor imenuje kao koordinatora ili najčešćeg vlasnika, a dopis već sadrži molbu „ako niste nadležni, obavijestite nas" (FR-11). Iz nalaza 02: putevi, trotoari i znakovi → Sekretarijat za saobraćaj (nalogodavac za opštinske i nekategorisane puteve; za državni put u gradu ne pogađamo, Sekretarijat dobija dopis i molbu iz FR-11); šaht → ViK (u Podgorici održava i fekalnu i atmosfersku mrežu, TK i elektro šahtovi su rjeđi); prepun kontejner → Čistoća; zelenilo → Zelenilo (izuzetak „ispred zgrade" pokriva molba iz FR-11). Natpis na poklopcu šahta (npr. „PTT") model smije pročitati kao podatak za opis, ali on **ne mijenja** primaoca. **[Claude]** jer je to preporuka, a nalaz 02 daje konkretne koordinatore.
- **Q7 — „Zašto ova institucija?":** Da, P0, na ekranu pregleda i na javnoj stranici prijave. Mali link otvara donji panel: naziv institucije (i kopije), naslov izvora, kratak citat, link ka izvoru, „Provjereno: {datum}", a za (c) oznaka „slabiji izvor". Za prijavu koju je rasporedio administrator piše „Nadležnog je ručno odredio administrator Fixita." Nema dodatnog dodira u glavnom toku. **[Claude]** jer je to jeftina komponenta koja u videu pokazuje razliku od „AI je pogodio". Labele idu u `lib/constants.ts`.
- **Q8 — Putevi: Sekretarijat + kopija Putevima:** Da. Za `pothole`, `sidewalk` i `traffic_sign` primalac je Sekretarijat za saobraćaj, kopija „Putevi" d.o.o. Šema dobija `cc_institution_id` na pravilu (i snimak na prijavi). Prijavu u panelu vidi samo primalac. Ako kopija nema mejl, dopis ide bez kopije (nije razlog za `routing`). **[Claude]** jer izvor kaže da Putevi rade „po dobijenim nalozima i rješenjima" Sekretarijata.
- **Q9 — Provjera adresa prije seed-a:** Da. Prije seed-a svaka adresa se još jednom provjerava na zvaničnom sajtu; `institutions` čuva `email`, `email_source_url`, `email_verified_at`. Adresa bez izvora ostaje prazna, pa pravilo koje upućuje na takvu instituciju vraća `no_email` → `routing`. **[Claude]** jer su `@t-com.me` adrese zvanično objavljene, ali mogu biti zastarjele.
- **Q10 — Služba za građane nije rezervni primalac:** Da. Nema pravila ni rezerve prema Službi za građane (objavljena je samo lična adresa službenika, koja ne ide u tabelu), a ni prema Komunalnoj policiji. Prijave bez pravila idu našem administratoru (`routing`). **[Claude]** jer bi rezerva „pošalji nekome ko će proslijediti" bila skriveno nagađanje, što potvrđuje Q2.

### Tabela pravila za seed (Glavni grad Podgorica)

Sve iz [nalaza 02](../research/02-nadleznost-podgorica.md), provjereno **2026-11-02**. `verified_at` se ažurira na datum ponovne provjere prije seed-a (Q9). Slugovi su iz tiketa 13 Q1. Ništa nije dodato izvan nalaza.

| category | Primalac (`institution_id`) | Kopija (`cc_institution_id`) | source_type | source_url | source_title | source_excerpt | verified_at |
|---|---|---|---|---|---|---|---|
| `pothole` | Sekretarijat za saobraćaj | „Putevi" d.o.o. Podgorica | official_document | https://putevi.me/wp-content/uploads/2026/01/Program-obavlj.-kom.-djelatnosti-za-2026.-god.-Putevi-doo.pdf | Program obavljanja komunalnih djelatnosti „Puteva" d.o.o. za 2026. godinu (Glavni grad, br. 14820, 8. 12. 2025), str. 2 i 10 | „Društvu su povjereni poslovi tekućeg održavanja opštinskih i nekategorisanih putnih pravaca … asfaltiranje puteva, održavanje ulica, bulevara, drumova…"; „…dobijenim nalozima i rješenjima od strane resornog Sekretarijata za saobraćaj" | 2026-11-02 |
| `sidewalk` | Sekretarijat za saobraćaj | „Putevi" d.o.o. Podgorica | official_document | isti Program 2026 | isti, str. 2 (i str. 10 za nalog Sekretarijata) | „obnavljanje postojećih i izrada novih trotoarskih površina" | 2026-11-02 |
| `traffic_sign` | Sekretarijat za saobraćaj | „Putevi" d.o.o. Podgorica | official_document | isti Program 2026 | isti, str. 2 (i str. 10) | „postavljanje saobraćajnih znakova i ostale putne opreme (vertikalna signalizacija)" | 2026-11-02 |
| `street_light` | „Komunalne usluge" d.o.o. Podgorica | — | official_page | https://podgorica.me/komunalne-usluge-d-o-o/ (i https://www.komunalneusluge.me/) | Glavni grad Podgorica — „Komunalne usluge" d.o.o. | „Osnovna djelatnost … je održavanje javne rasvjete i svjetlosne signalizacije" | 2026-11-02 |
| `traffic_light` | „Komunalne usluge" d.o.o. Podgorica | — | official_page | https://podgorica.me/komunalne-usluge-d-o-o/ (i https://www.komunalneusluge.me/) | Glavni grad Podgorica — „Komunalne usluge" d.o.o. | „Osnivač je povjerio obavljanje komunalnih djelatnosti … održavanje svjetlosne signalizacije" | 2026-11-02 |
| `manhole` | „Vodovod i kanalizacija" d.o.o. Podgorica | — | official_page | https://www.vikpg.me/o-nama/djelatnost.html | „Vodovod i kanalizacija" d.o.o. Podgorica — Djelatnost | „održavanje kanalizacionog sistema i sistema za atmosferske vode" | 2026-11-02 |
| `water_leak` | „Vodovod i kanalizacija" d.o.o. Podgorica | — | official_page | https://www.vikpg.me/o-nama/djelatnost.html | „Vodovod i kanalizacija" d.o.o. Podgorica — Djelatnost | „održavanje vodovodnog sistema na teritoriji Glavnog grada" | 2026-11-02 |
| `illegal_dump` | „Čistoća" d.o.o. Podgorica | — | official_page | https://www.cistoca.me/servisi/usluge/javna-higijena | „Čistoća" d.o.o. Podgorica — Javna higijena | „Uklanjanje nepropisno odloženog otpada – intervencija na mjestima gdje je otpad odložen van predviđenih mjesta i kontejnera" | 2026-11-02 |
| `waste_container` | „Čistoća" d.o.o. Podgorica | — | official_page | https://www.cistoca.me/o-nama | „Čistoća" d.o.o. Podgorica — O nama | „sakupljanje, transport i odlaganje komunalnog otpada za potrebe korisnika usluga" | 2026-11-02 |
| `greenery` | „Zelenilo" d.o.o. Podgorica | — | official_page | https://www.zelenilo.me/djelatnosti | „Zelenilo" d.o.o. Podgorica — Djelatnosti | „Orezivanje drveća, žbunja i žive ograde neophodno je za … stvaranje sigurnih uslova za … učesnike u saobraćaju"; održavanje „u parkovima, na dječijim igralištima, duž saobraćajnica" | 2026-11-02 |
| `graffiti` | **bez pravila** → `routing` | — | — | — | — | izvor nije pronađen (nalaz 02) | — |
| `other` | **bez pravila** → `routing` | — | — | — | — | namjerno (tiket 13 Q2) | — |

`verified_by` za sve: „nalaz 02" dok ne prođe ponovna provjera, zatim ime osobe iz tima koja je provjerila.

**Institucije za seed** (mejl + izvor mejla, provjereno 2026-11-02):

| Institucija (zvaničan naziv) | `email` | `email_source_url` | Uloga u P0 |
|---|---|---|---|
| Sekretarijat za saobraćaj (Glavni grad Podgorica) | `saobracaj@podgorica.me` | https://podgorica.me/sekretarijat-za-saobracaj/ | primalac (putevi) |
| „Putevi" d.o.o. Podgorica | `putevi@t-com.me` | https://podgorica.me/putevi-d-o-o/ (i Program 2026, str. 3) | kopija (putevi) |
| „Komunalne usluge" d.o.o. Podgorica | `dispecer@komunalneusluge.me` (na izvoru označen: „Prijava kvara rada javne rasvjete i svjetlosne signalizacije") | https://podgorica.me/komunalne-usluge-d-o-o/ | primalac |
| „Vodovod i kanalizacija" d.o.o. Podgorica | `info@vikpg.me` | https://podgorica.me/vodovod-i-kanalizacija-d-o-o/ | primalac |
| „Čistoća" d.o.o. Podgorica | `cistocapg@t-com.me` | https://podgorica.me/cistoca-d-o-o/ (cistoca.me/kontakt; link u zaglavlju tog sajta ima grešku `citocapg@…`) | primalac |
| „Zelenilo" d.o.o. Podgorica | `zelenilo@t-com.me` | https://podgorica.me/zelenilo-d-o-o/ | primalac |
| Služba komunalne policije (Glavni grad Podgorica) | `pgkompolicija@t-com.me` | https://podgorica.me/sluzba-komunalne-policije/ | bez pravila; samo izbor administratora u `/admin` |
| Uprava za inspekcijske poslove (Glavni grad Podgorica) | `uip@podgorica.me` | https://podgorica.me/uprava-za-inspekcijske-poslove/ | bez pravila; samo izbor administratora u `/admin` |

Ne ulaze u seed: Služba za građane (samo lična adresa, Q10), Uprava za saobraćaj (mejl nije potvrđen; ne treba bez nacionalnog nivoa), CEDIS (nema mejla za kvarove; vrsta izbačena u tiketu 13), „Deponija" d.o.o. (nijedna vrsta ne upućuje na nju). Zadnja dva reda u tabeli institucija su **[Claude]**: nadzorni organi sa institucionalnom adresom, da administrator ima stvarne opcije za grafite i „nešto drugo", bez pravila koje bi to nagađalo.

### Izmjene u dokumentima

- `PRD.md` FR-8 (§5.2): prepisan — tačno pravilo za (vrsta, opština), bez rezerve; bez pravila ili bez provjerenog mejla → `routing` i administrator; poruka građaninu.
- `PRD.md` §4.4: dodata stavka **P0** „Minimalna administratorska stranica `/admin`"; CRUD ostaje P1.
- `PRD.md` §8, red `/admin`: dodato **P0** (lista `routing`, izbor institucije, „Pošalji dopis") i **P1** (lista `not_competent`); tekst o moderaciji iz drugog tiketa ostavljen netaknut.
- `PRD.md` nova podsekcija **„Pravila nadležnosti"** u §5.2 (odmah iza „Vrste problema (P0)"): oblik pravila, vrste izvora, nejasna nadležnost, kopija za puteve, mejl adrese, „Zašto ova institucija?", bez rezervnog primaoca, izmjene samo migracijom.
- `PRD.md` §10: otvorenom pitanju o provjeri nadležnosti dodato da su pravila odlučena i da ostaje ponovna provjera mejlova.

### Za DB.md (tiket 18)

- `jurisdiction_rules`: kolone iz Q1; `municipality_id NOT NULL` FK; `UNIQUE (category, municipality_id)`; `source_type` enum; `CHECK (source_type IN ('written_confirmation','phone_confirmation') OR source_url IS NOT NULL)`; `CHECK (source_type IN ('official_document','official_page') OR notes IS NOT NULL)`; `cc_institution_id` nullable FK, `CHECK (cc_institution_id <> institution_id)`.
- `institutions`: `email` nullable, `email_source_url`, `email_verified_at`; `CHECK (email IS NULL OR email_source_url IS NOT NULL)`.
- `reports`: snimak u trenutku slanja — `institution_id`, `cc_institution_id`, `jurisdiction_rule_id` (NULL kad je administrator rasporedio ručno) i razlog rutiranja (`no_rule` / `no_email`) za `routing`.
- `resolve_jurisdiction(category, municipality_id)` → `(outcome, rule_id, institution_id, cc_institution_id)`; `SECURITY DEFINER`, bez ikakvog rangiranja.
- RLS: `jurisdiction_rules` i `institutions` čita i piše samo administrator (P0 piše samo migracija/seed). Javnosti treba uži prikaz (npr. view ili RPC za „Zašto ova institucija?") samo sa: naziv institucije i kopije, `source_type`, `source_title`, `source_url`, `source_excerpt`, `verified_at` — **bez** `notes` i `verified_by`, jer `notes` za (b)/(c) sadrži ime osobe iz institucije.

### Za provjeru

- **Ponovna provjera mejlova prije seed-a (Q9):** svih 8 adresa iz tabele institucija, posebno `@t-com.me`; i da li `https://gradjanski.podgorica.me/` ponovo radi (nalaz 02 kaže da bi to bila najbolja provjera tabele).
- **Citati za rasvjetu i semafor:** nalaz 02 za oba reda navodi dva URL-a (komunalneusluge.me i podgorica.me) bez razdvajanja koji citat je sa kog. Prije seed-a potvrdi sa kog URL-a je citat i upiši samo taj kao `source_url`.
- **Q1 proširuje tvoju preporuku:** `source_url` nije obavezan za potvrde mejlom/telefonom (inače (b) i (c) iz Q3 ne bi mogli postojati); umjesto toga je obavezan `notes`.
- **Q5:** administrator ručno bira instituciju u `/admin`. To je odluka čovjeka, ne AI-ja, ali je to jedini put do nadležnog mimo tabele pravila. Ako želiš da zlatno pravilo 1 to izričito kaže, treba dopuna u AGENTS.md (tiket 12).
- **Guard u `lib/email/send.ts` mora preusmjeriti i `cc`** (Q8) na `TEST_INBOX`. Prenesi to testu iz tiketa 12.
- **Testni režim na ekranu:** građanin vidi „Šalje se: Sekretarijat za saobraćaj (saobracaj@podgorica.me)", a mejl ide na `TEST_INBOX`. Za video je to u redu; za bilo koje korišćenje van hakatona treba vidljiva oznaka testnog režima (vidi magla ispod).
- Tabela zavisi od konačnih slugova iz tiketa 13 Q1 (u trenutku pisanja nije bila odgovorena).

### Novi tiketi / magla

- **Magla:** oznaka „Testni režim" u UI-ju dok je `EMAIL_MODE=test` (ekran pregleda, ekran uspjeha, javna stranica) — kandidat za tiket 15 ili 16.
- **Magla (P1+):** kategorizacija puteva (opštinski vs. državni) iz `data.gov.me` „geojson cesta" i mejl Uprave za saobraćaj; tek tada nacionalni nivo pravila (`municipality_id` NULL) ima smisla.
- **Za rječnik (tiket 09):** pojmovi „pravilo nadležnosti", „primalac", „kopija", „izvor pravila", „slabiji izvor", „ručno raspoređivanje".
