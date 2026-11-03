# 01 — Granice opština i države: nalazi istraživanja

Tiket: [01-granice-opstina.md](../issues/01-granice-opstina.md)
Datum istraživanja: 2. 11. 2026. Svi linkovi su pristupljeni tog datuma, osim gdje piše drugačije.
Pravilo: ono što nije potvrđeno izvorom označeno je sa **nije potvrđeno**.

---

## 1. Koliko opština Crna Gora ima danas

**Ukupno 25 jedinica lokalne samouprave prvog nivoa:** 23 opštine, plus Glavni grad Podgorica i Prijestonica Cetinje. Najnovija je Opština Zeta, osnovana 2022.
- Izvor: UK Government, *Montenegro Toponymic Factfile* (© Crown Copyright 2025), sekcija „Administrative structure": „Montenegro is divided into 25 first-order administrative divisions: 23 of these are opština (municipalities); Podgorica is termed Glavni grad Podgorica …, and Prijestonica Cetinje … The newest administrative division, Opština Zeta, was created in 2022." — https://assets.publishing.service.gov.uk/media/69285cf3b3b9afff34e9615a/Montenegro_Toponymic_factfile.pdf (pristupljeno 2. 11. 2026)
- Isti dokument navodi svih 25 jedinica sa ISO 3166-2 kodovima ME-01 … ME-25 (tabela u nastavku).
- Nezavisna potvrda: OpenStreetMap trenutno ima tačno 25 relacija `boundary=administrative` + `admin_level=6` unutar Crne Gore, sa istim ISO 3166-2 kodovima (Overpass upit, `timestamp_osm_base` 2026-11-02T21:27:36Z) — https://overpass-api.de/api/interpreter (pristupljeno 2. 11. 2026)

**Novije opštine:**

| Opština | Šta znamo | Izvor |
|---|---|---|
| Petnjica (ME-23) | Postoji kao opština. Godina osnivanja: **nije potvrđeno** primarnim izvorom. | Factfile (gore) |
| Gusinje (ME-22) | Postoji kao opština. Godina osnivanja: **nije potvrđeno** primarnim izvorom. | Factfile (gore) |
| Tuzi (ME-24) | Bivša Gradska opština Tuzi (u sastavu Podgorice) postala samostalna opština 1. 9. 2018. | RSE, 3. 9. 2018 — https://www.slobodnaevropa.org/a/samostalna-opština-tuzi-nakon-20-godina-obećanja/29468172.html (pristupljeno 2. 11. 2026) |
| Zeta (ME-25), sjedište Golubovci | Osnovana izmjenama Zakona o teritorijalnoj organizaciji 2022. Odluka Skupštine o imenovanju prve OIK Zeta poziva se na Zakon („Sl. list CG", br. 54/11 … 3/20 i **92/22**) i objavljena je u „Sl. listu CG" br. 104/22 od 22. 9. 2022. Tačan datum stupanja izmjena na snagu (po pretrazi 22. 8. 2022): **nije potvrđeno** (nisam uspio pročitati tekst dokumenta Skupštine). | DIK — https://www.dik.co.me/images/ZETA/Odluke/Odluka-o-imenovanju-Opstinske-izborne-komisije-Zeta.pdf (pristupljeno 2. 11. 2026); Factfile (gore) |

**Napomena o službenim podacima:** Statistički godišnjak 2020 (Monstat, podaci Uprave za nekretnine, stanje decembar 2018) navodi 24 opštine i u fusnoti: „Za novoformiranu Opštinu Tuzi nije utvrđena precizna granica i površina je uključena u površinu Glavnog grada Podgorice." — https://monstat.org/uploads/files/publikacije/godisnjak%202020/1.pdf (pristupljeno 2. 11. 2026). Da li danas postoji službeno utvrđena granica Tuzi i Zete u državnom registru: **nije potvrđeno**. Godišnjak 2023 (https://monstat.org/uploads/files/publikacije/godisnjak%202023/1.pdf) se nije dao pročitati kao tekst; godišnjaci 2024 i 2025 na istoj putanji vraćaju 404.

### Glavni grad Podgorica i gradske opštine

- Obje poznate jedinice unutar Glavnog grada su izdvojene u samostalne opštine: Tuzi 2018 (RSE, gore) i Golubovci → Opština Zeta 2022 (Factfile, DIK, gore). Zvanični sajt Golubovaca danas glasi „Opština Zeta – Zvanična stranica" — https://golubovci.me/ (pristupljeno 2. 11. 2026).
- OSM unutar Crne Gore nema nijednu relaciju `admin_level=7` (nivo između opštine i naselja); ispod nivoa 6 postoje samo naselja/mjesne zajednice na `admin_level=8` (Overpass, gore).
- Da li po važećem zakonu u Glavnom gradu danas postoji ijedna gradska opština / „opština u okviru Glavnog grada": **nije potvrđeno** iz teksta zakona (prečišćeni tekst Zakona o teritorijalnoj organizaciji i Statut Glavnog grada nisam uspio pročitati). Svi pronađeni izvori ukazuju da ih nema.

---

## 2. Izvori poligona

| Izvor | Ažurnost / sadrži Tuzi i Zetu? | Format | Licenca | Izvor tvrdnje |
|---|---|---|---|---|
| **OpenStreetMap** (`boundary=administrative`, `admin_level=6`) | Ažuran (podaci od 2. 11. 2026). Ima svih 25, uključujući **Opština Tuzi** (rel. 10141812) i **Opština Zeta** (rel. 10147976). | Relacije; izvoz u GeoJSON preko Overpass-a ili npr. polygons.openstreetmap.fr | ODbL 1.0; obavezna atribucija „© OpenStreetMap contributors" i navođenje da su podaci pod ODbL | Overpass (gore); https://www.openstreetmap.org/copyright (pristupljeno 2. 11. 2026) |
| **geoBoundaries** (gbOpen MNE) | Zastario: `boundaryYearRepresented` 2017, ADM1 ima **23** jedinice — nema Tuzi ni Zete (ima Gusinje i Petnjicu). Izvor im je OSM (Wambacher). | GeoJSON, TopoJSON, SHP (+ pojednostavljena verzija) | ODbL 1.0 (jer je izveden iz OSM-a) | API: https://www.geoboundaries.org/api/current/gbOpen/MNE/ALL/ ; fajl: https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MNE/ADM1/geoBoundaries-MNE-ADM1_simplified.geojson (pristupljeno 2. 11. 2026) |
| **GADM 4.1** | Zastario: nivo 1 ima **21** jedinicu — nema Petnjice, Gusinja, Tuzi ni Zete. Nazivi oštećeni („BijeloPolje", „Nikšic"). Nivo 2 za MNE ne postoji (404). | GeoJSON, GPKG, SHP | Samo akademska i nekomercijalna upotreba; „Redistribution or commercial use is not allowed without prior permission." | https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_MNE_1.json ; https://gadm.org/license.html (pristupljeno 2. 11. 2026) |
| **HDX** | Nema zvaničnog COD-AB skupa za Crnu Goru. Postoje (a) ogledalo geoBoundaries (2017) i (b) Kontur „Administrative Division with Aggregated Population" (verzije 2022-04-07 i 2023-06-28), izveden iz OSM-a. Da li Kontur sadrži Zetu: **nije potvrđeno** (nisam preuzimao). | GeoJSON / GPKG | ODbL | https://data.humdata.org/api/3/action/package_search?q=montenegro%20administrative%20boundaries (pristupljeno 2. 11. 2026) |
| **Monstat** | Objavljuje tabele (površine, broj opština), ne GIS granice. Podaci o teritoriji potiču od Uprave za nekretnine. | PDF | — | Godišnjak 2020 (gore) |
| **Uprava za nekretnine / Uprava za katastar (Geoportal CG)** | Na https://geoportal.co.me/ i stranici uputstva nisam našao preuzimanje ni WFS sloj sa granicama opština. Footer: „Copyright © 2008 - 2018 Uprava za nekretnine. Sva prava zadržana!" Postojanje javnog WFS/preuzimanja i uslovi korišćenja: **nije potvrđeno**. | — | **nije potvrđeno** (sva prava zadržana) | https://geoportal.co.me/ ; https://geoportal.co.me/geoportal/uputstvo.html (pristupljeno 2. 11. 2026) |

**ODbL obaveze** (sažetak licence): atribucija pri svakoj javnoj upotrebi baze i radova izvedenih iz nje; ako javno koristimo *prilagođenu* bazu (npr. naša tabela opština izvedena iz OSM-a), moramo je ponuditi pod ODbL (share-alike). — https://opendatacommons.org/licenses/odbl/summary/ (pristupljeno 2. 11. 2026). Sažetak nema pravnu snagu; mjerodavan je pun tekst ODbL 1.0.

---

## 3. Nazivi na latinici

- U OSM-u za crnogorske opštine tag `name` je već na latinici za svih 25, a postoji i `name:sr-Latn` za svih 25 (Overpass, gore). `name:me` ne postoji ni za jednu.
- Odstupanja od službenih naziva koja treba ručno ispraviti u seed-u:
  - OSM `name` za Ulcinj je dvojezičan: „Opština Ulcinj - Komuna e Ulqinit"; `name:sr-Latn` je „Opština Ulcinj" (Overpass, gore).
  - OSM koristi „**Prijestolnica** Cetinje", a zvanični sajt i Factfile koriste „**Prijestonica** Cetinje" — https://www.cetinje.me/ (naslov stranice „Prijestonica Cetinje", pristupljeno 2. 11. 2026); Factfile (gore).
- Službeni nazivi i kodovi (Factfile, gore; ISO kodovi se poklapaju sa OSM tagom `ISO3166-2`):

| ISO 3166-2 | Pun naziv | Kratki naziv | OSM rel. |
|---|---|---|---|
| ME-01 | Opština Andrijevica | Andrijevica | 2319358 |
| ME-02 | Opština Bar | Bar | 2319526 |
| ME-03 | Opština Berane | Berane | 2319359 |
| ME-04 | Opština Bijelo Polje | Bijelo Polje | 2319527 |
| ME-05 | Opština Budva | Budva | 2319528 |
| ME-06 | Prijestonica Cetinje | Cetinje | 2319529 |
| ME-07 | Opština Danilovgrad | Danilovgrad | 2319530 |
| ME-08 | Opština Herceg Novi | Herceg Novi | 2187901 |
| ME-09 | Opština Kolašin | Kolašin | 2319531 |
| ME-10 | Opština Kotor | Kotor | 2319532 |
| ME-11 | Opština Mojkovac | Mojkovac | 2319533 |
| ME-12 | Opština Nikšić | Nikšić | 2319534 |
| ME-13 | Opština Plav | Plav | 2317882 |
| ME-14 | Opština Pljevlja | Pljevlja | 2319535 |
| ME-15 | Opština Plužine | Plužine | 2319536 |
| ME-16 | Glavni grad Podgorica | Podgorica | 2319360 |
| ME-17 | Opština Rožaje | Rožaje | 2317936 |
| ME-18 | Opština Šavnik | Šavnik | 2319539 |
| ME-19 | Opština Tivat | Tivat | 2319537 |
| ME-20 | Opština Ulcinj | Ulcinj | 2319538 |
| ME-21 | Opština Žabljak | Žabljak | 2319540 |
| ME-22 | Opština Gusinje | Gusinje | 7460668 |
| ME-23 | Opština Petnjica | Petnjica | 7463938 |
| ME-24 | Opština Tuzi | Tuzi | 10141812 |
| ME-25 | Opština Zeta | Zeta (sjedište Golubovci) | 10147976 |

---

## 4. Provjera OSM geometrije (vlastito mjerenje)

Preuzeo sam pune (nepojednostavljene) poligone svih 25 opština i države (OSM rel. 53296) sa https://polygons.openstreetmap.fr/get_geojson.py?id=…&params=0 (pristupljeno 2. 11. 2026) i provjerio ih jednostavnom skriptom (približna površina, test „tačka u poligonu"). Ovo su moja mjerenja, ne podaci izdavača.

- **Veličina:** 25 opština ≈ 1,9 MB GeoJSON-a, ≈ 71 000 tačaka ukupno (najveći: Bar ≈ 7 500, Pljevlja ≈ 6 000, Herceg Novi ≈ 5 400 tačaka). Poligon države ≈ 310 KB, ≈ 13 300 tačaka.
- **Površine:** zbir opština ≈ 13 630 km²; poligon države ≈ 16 100 km².
- **Država u OSM-u uključuje more:** tačke 3 km i 15 km od obale Budve su unutar poligona države, ali ni u jednoj opštini. Dakle OSM relacija države obuhvata teritorijalno more, a opštine prate obalu.
- **Skadarsko jezero nije u opštinama:** tačka u sredini crnogorskog dijela jezera je u državi, ali ni u jednoj opštini (najbliža granica opštine ≈ 4,9 km). Ovo je u skladu sa Monstatom: „Razlika ukupne površine Crne Gore i zbira površina po opštinama predstavlja površinu Skadarskog jezera" (Godišnjak 2020, gore).
- Bokokotorski zaliv (kod Kotora), Plavsko jezero, centar Podgorice, Golubovci i Tuzi padaju u očekivane opštine.
- Tačke koje sam odabrao kao „plaže" (Slovenska plaža, Velika plaža) i „luka Bar" pale su van svih opština, 150–2 400 m od granice. Moje koordinate su možda bile u vodi, pa ovo **nije potvrđeno** kao greška podataka. Zaključak važi ipak: tačka na samoj obali (GPS greška, mol, plaža) može pasti van poligona opštine.
- Da li se OSM granice Tuzi i Zete poklapaju sa službenim granicama: **nije potvrđeno** (službeni sloj nije javno dostupan, vidi Geoportal gore).

---

## 5. Uvoz u Supabase/PostGIS

- PostGIS na Supabase-u se uključuje u posebnu šemu: `create extension postgis with schema "extensions";` uz upozorenje da se ne instalira u `public` (izlaže `spatial_ref_sys` kroz Data API). Primjer prostornog indeksa koristi `GIST`. — https://supabase.com/docs/guides/database/extensions/postgis (pristupljeno 2. 11. 2026). Supabase vodič ne opisuje uvoz GeoJSON-a ni shp2pgsql.
- Seed: podrazumijevano `supabase/seed.sql`, dodatne putanje kroz `[db.seed] sql_paths` u `config.toml`. Seed se izvršava pri prvom `supabase start` i pri svakom `supabase db reset`, nakon migracija. — https://supabase.com/docs/guides/local-development/seeding-your-database (pristupljeno 2. 11. 2026)
- Na udaljeni (hosted) projekat seed ide sa `supabase db push --include-seed` („Include seed data from your config"). — https://supabase.com/docs/reference/cli/supabase-db-push (pristupljeno 2. 11. 2026)
- Ograničenje veličine seed/migracionog SQL fajla na Supabase-u: **nije potvrđeno** (dokumentacija ga ne navodi).
- Pojednostavljivanje: koliko se fajl smanjuje za datu toleranciju (`ST_SimplifyPreserveTopology` ili sl.) **nije izmjereno**. Opšte pravilo: pojednostavljivanje pojedinačnih poligona otvara rupe/preklapanja između susjednih opština. Topološki alati (npr. mapshaper) to izbjegavaju, ali to je nova (dev) zavisnost koja nije u Tech.md.

---

## 6. Granica države za FR-4

Mogućnosti:
1. **Unija opština** (`ST_Union` nad tabelom opština) — ne obuhvata Skadarsko jezero ni more (mjerenje gore, Monstat). Prijava sa obale jezera, mola ili plaže mogla bi biti pogrešno odbijena kao „van Crne Gore".
2. **Poseban poligon države iz OSM-a** (rel. 53296, `admin_level=2`, `ISO3166-1=ME`) — obuhvata kopno, Skadarsko jezero (crnogorski dio) i teritorijalno more; ≈ 310 KB nepojednostavljen. Ista licenca (ODbL) i isti izvor kao opštine.
3. **geoBoundaries ADM0** — iz 2017, OSM/Wambacher, ≈ 13 886 km² (`meanAreaSqKM` iz API-ja), što ukazuje da je odsječen po obali. Kako je obrađeno Skadarsko jezero: **nije potvrđeno**.

---

## Preporuka

*Ovo je preporuka istraživača, ne odluka. Odluku donosi tim kroz šemu baze (18) i seed.*

1. **Izvor:** OSM, `admin_level=6`, 25 relacija iz tabele u sekciji 3. Jedini pronađeni izvor koji je ažuran (ima Tuzi i Zetu) i ima licencu koja dozvoljava našu upotrebu. geoBoundaries i GADM ne koristiti (zastarjeli; GADM zabranjuje komercijalnu upotrebu).
2. **Podgorica** kao jedna jedinica (ME-16). Gradske opštine ne modelovati.
3. **Nazive** ne preuzimati iz OSM-a automatski. Upisati ručno u seed iz tabele u sekciji 3 (kratki naziv za UI, `iso_code` kao stabilan ključ). Ispraviti „Prijestolnica" → „Prijestonica" i dvojezični naziv Ulcinja.
4. **Uvoz:** jednokratna skripta van aplikacije (Overpass ili polygons.openstreetmap.fr → GeoJSON) generiše SQL sa `ST_Multi(ST_MakeValid(ST_GeomFromGeoJSON(...)))`, SRID 4326, i GIST indeksom. Kolona ide u šemu kroz migraciju; podaci kroz `supabase/seed.sql` (ili poseban fajl u `[db.seed] sql_paths`), da migracije ostanu male. Zabilježiti datum OSM snimka i ID relacija u komentaru seed fajla. Pojednostavljivanje izmjeriti prije odluke. ~2 MB nepojednostavljeno je vjerovatno prihvatljivo za seed (nije potvrđeno).
5. **FR-4:** poseban poligon države iz OSM-a (rel. 53296), ne unija opština.
6. **FR-5 rezerva:** ako je tačka u državi a ni u jednoj opštini (jezero, more, obala), uzeti najbližu opštinu (`ORDER BY geom <-> point LIMIT 1`, uz razuman prag udaljenosti) ili prijavu poslati administratoru. Prag je odluka tima.
7. **Atribucija:** dodati „© OpenStreetMap contributors" (ODbL) na mapu i na stranicu o projektu. Share-alike za izvedenu tabelu opština imati na umu ako se ona ikad javno objavi.
