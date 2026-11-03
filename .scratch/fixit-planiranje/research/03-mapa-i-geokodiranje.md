# Istraživanje 03: mapa, tile-ovi i reverse geocoding za Crnu Goru

Tiket: [03-mapa-i-geokodiranje](../issues/03-mapa-i-geokodiranje.md)
Datum pristupa svim izvorima: **2. 11. 2026.** (osim gdje piše drugačije)

Ovo su činjenice iz primarnih izvora i nekoliko ručnih testova. Odluka se donosi u tiketima 15 (tok prijave) i 17 (tehnički stack). Preporuka je na kraju i nije odluka.

---

## 1. Biblioteke za mapu u Next.js-u

### Veličine i verzije (npm registry i bundlephobia, 2. 11. 2026.)

| Paket | Verzija (`latest`) | min | gzip | Peer zavisnosti |
|---|---|---|---|---|
| `leaflet` | 1.9.4 | 148,5 KB | **42,7 KB** | — |
| `react-leaflet` | 5.0.0 | 11,0 KB | 3,5 KB | `react ^19`, `react-dom ^19`, `leaflet ^1.9.0` |
| `leaflet.markercluster` | 1.5.3 | 34,1 KB | 8,7 KB | Leaflet ≥ 1.0 |
| `maplibre-gl` | 6.16.0 | 1.105 KB | **296 KB** | — |
| `react-map-gl` (`react-map-gl/maplibre`) | 8.1.3 | — | — | `maplibre-gl >= 1.13` |
| `@vis.gl/react-maplibre` | 8.1.3 | 19,8 KB | 6,9 KB | `maplibre-gl >= 4` |
| `supercluster` | 9.1.0 | 9,7 KB | 4,0 KB | — |

Izvori: https://bundlephobia.com/api/size?package=leaflet (i isti URL za ostale pakete), https://registry.npmjs.org/react-leaflet/latest, https://registry.npmjs.org/leaflet, https://registry.npmjs.org/@vis.gl/react-maplibre/latest, https://registry.npmjs.org/react-map-gl/latest

- Leaflet stack (Leaflet + react-leaflet) je oko **46 KB gzip**. MapLibre stack (maplibre-gl + omotač) je oko **300 KB gzip**, plus worker i stil koji se preuzimaju posebno. Za cilj „javna mapa ≤ 2 s na 4G" to je razlika od oko 250 KB JS-a koji telefon mora preuzeti i parsirati. (izvori iznad)
- Leaflet `latest` je i dalje **1.9.4** (iz maja 2023). `2.0.0-beta.1` je objavljen na npm baš 2. 11. 2026, a dokumentacija na leafletjs.com sada opisuje 2.0 beta API. `react-leaflet` 5 traži `leaflet ^1.9.0`, pa treba ostati na 1.9.x. Izvori: https://registry.npmjs.org/leaflet, https://leafletjs.com/reference.html
- `react-leaflet` 5 traži **React 19** (peer `react ^19.0.0`). Next.js App Router već radi na React 19, pa ovo nije problem, ali treba znati. Izvor: https://registry.npmjs.org/react-leaflet/latest
- MapLibre se uz React koristi preko `react-map-gl/maplibre` (`npm install react-map-gl maplibre-gl`). Za v6 uz bundler treba podesiti worker po MapLibre uputstvu. Izvor: https://visgl.github.io/react-map-gl/docs/get-started

### Telefon (360 px) i pomjeranje pina dodirom

- Leaflet `Marker` ima opciju `draggable` (podrazumijevano `false`) i `autoPan` (mapa se pomjera kad se marker dovuče do ivice). Na mapi su podrazumijevano uključeni `pinchZoom`, `dragging` i `tapHold` („iOS Safari ne okida contextmenu sam"). `tapTolerance` je 15 px. Izvor: https://leafletjs.com/reference.html (dokumentacija trenutno prikazuje 2.0.0-beta.1; ove opcije postoje i u 1.9)
- Za FR-3 („korisnik uvijek mora pomjeriti ili potvrditi pin") obje biblioteke imaju prevlačiv marker. Alternativa koja na telefonu radi pouzdanije je fiksni pin u centru ekrana: korisnik pomjera mapu ispod pina, a koordinata je centar mape. To je UX zapažanje, nije iz izvora.

### Klasterovanje markera

- Leaflet: `leaflet.markercluster` (8,7 KB gzip, traži Leaflet ≥ 1.0) ima `chunkedLoading`, da stranica ne zastane pri velikom broju markera. Izvor: https://github.com/Leaflet/Leaflet.markercluster
- MapLibre: klasterovanje je ugrađeno u GeoJSON izvor (`cluster: true`, `clusterRadius` podrazumijevano 50, `clusterMaxZoom`). Izvor: https://maplibre.org/maplibre-style-spec/sources/
- Za demo sa oko 10 prijava klasterovanje nije potrebno. Postaje važno tek sa stotinama markera (P1 mapa za panel).

### SSR ograničenja (Next.js App Router)

- I Leaflet i MapLibre rade samo u pregledaču. U Next.js-u se komponenta mape učitava sa `dynamic(() => import(...), { ssr: false })`. To radi **samo unutar Client Component-e** (`'use client'`). U Server Component-i Next.js javlja grešku. Izvor: https://nextjs.org/docs/app/guides/lazy-loading
- Posljedica: stranica `/` može biti Server Component koja renderuje okvir i podatke, a mapu učitava kao lazy klijentsku komponentu. To pomaže i cilju od 2 s.

---

## 2. Tile provajderi

| Provajder | Besplatno | Ključ | Komercijalna upotreba na besplatnom nivou | Atribucija | Izvor |
|---|---|---|---|---|---|
| **OSM standard** (`tile.openstreetmap.org`, raster) | da, bez limita u brojkama, „best-effort", **bez SLA** | ne | nije zabranjena, ali „komercijalni servisi … da budu svjesni da pristup može biti povučen u bilo kom trenutku" | obavezna, vidljiva (obično dolje desno), ne smije biti skrivena | https://operations.osmfoundation.org/policies/tiles/ |
| **OSM vector** (`vector.openstreetmap.org`) | da, posebna politika | ne | — | — | https://operations.osmfoundation.org/policies/vector/ (sažetak iz pretrage, stranica nije detaljno pročitana) |
| **OpenFreeMap** (vektor, OpenMapTiles šema) | da, „bez limita na broj prikaza i zahtjeva" | **ne**, bez registracije i kolačića | **da** („Yes" u FAQ) | obavezna; u MapLibre-u se dodaje automatski | https://openfreemap.org/ , https://openfreemap.org/quick_start/ |
| **CARTO basemaps** (Positron, Voyager, Dark Matter) | 5 M zahtjeva/mj. nekomercijalno, **1 M/mj. komercijalno** | **da, od septembra 2026.** (bez ključa raster ima vodeni žig) | da, do 1 M/mj. | OSM **i** CARTO, „prominent and conspicuous" | https://carto.com/legal/basemap-terms/ (ažurirano 29. 9. 2026.), https://github.com/CartoDB/basemap-styles |
| **MapTiler Cloud** Free | 5.000 sesija mape/mj., 100.000 API zahtjeva/mj. | da | nejasno: „za testiranje, PoC, prototip, ličnu ili nekomercijalnu upotrebu" | MapTiler logo obavezan | https://www.maptiler.com/cloud/pricing/ |
| **Stadia Maps** Free | 200.000 kredita/mj. | (stranica ne navodi) | **ne** | — | https://stadiamaps.com/pricing/ |
| **Mapbox** | 50.000 učitavanja GL JS mape/mj., 200.000 vektorskih / 750.000 rasterskih tile-ova | da | da (pay-as-you-go) | Mapbox | https://www.mapbox.com/pricing |
| **Protomaps** (PMTiles, sami hostujemo) | podaci besplatni (ODbL), plaćamo samo hosting | ne | da | OSM obavezan | https://docs.protomaps.com/basemaps/downloads |

Detalji OSM tile politike koji nas se tiču (https://operations.osmfoundation.org/policies/tiles/):
- Aplikacija mora slati jasan, jedinstven User-Agent. Generički podrazumijevani se blokiraju. Kod web aplikacije tile-ove traži pregledač, sa svojim User-Agent-om i **Referer-om**: ne smijemo postaviti restriktivan `Referrer-Policy` koji sprečava slanje Referer-a.
- Zabranjeno: `Cache-Control: no-cache` po defaultu, bulk preuzimanje, preuzimanje unaprijed i offline upotreba (bitno za PWA: service worker **ne smije** unaprijed keširati tile-ove sa OSM-a).
- „Pristup može biti blokiran bez najave."

Napomene:
- CARTO je do septembra 2026. radio bez ključa. Sada je ključ obavezan za besplatni pristup, a ključevi izdati prije 23. 9. 2026. imaju prelazni period do 30. 11. 2026. (https://carto.com/legal/basemap-terms/, odjeljak 3.f). Stari primjeri sa interneta bez ključa više ne važe.
- Protomaps: cijela planeta je oko 120 GB (z0–z15). Region se izvlači komandom `pmtiles extract`, a URL-ovi za preuzimanje se mijenjaju, pa se hotlinkovanje ne preporučuje (https://docs.protomaps.com/basemaps/downloads). Za hakaton je to previše posla.
- OpenFreeMap je vektorski. Uz Leaflet ide preko `@maplibre/maplibre-gl-leaflet`, ali to svejedno povlači cijeli `maplibre-gl` (https://openfreemap.org/quick_start/).

---

## 3. Reverse geocoding

### Nominatim (javna instanca OSMF-a)

Politika (https://operations.osmfoundation.org/policies/nominatim/):
- **Najviše 1 zahtjev u sekundi** („an absolute maximum").
- User-Agent ili Referer moraju identifikovati aplikaciju. „Stock User-Agents" iz HTTP biblioteka nisu dovoljni.
- „Rezultati moraju biti keširani na vašoj strani." Klijenti koji stalno šalju isti upit mogu biti blokirani.
- Atribucija obavezna.
- **Autocomplete zabranjen** („ne smijete ga implementirati na klijentu preko API-ja").
- „Aplikacije moraju moći da promijene servis na naš zahtjev u bilo kom trenutku." Periodični zahtjevi iz aplikacija smatraju se bulk geokodiranjem.
- Pristup može biti povučen, a politika se može mijenjati bez najave.

API (https://nominatim.org/release-docs/latest/api/Reverse/):
- `accept-language`: redoslijed jezika. **Podrazumijevano se uzima iz HTTP zaglavlja `Accept-Language`** koje šalje pregledač.
- `zoom` 0–18 (18 = zgrada, 17 = glavne i sporedne ulice), `namedetails=1` vraća sve nazive, `layer=address,poi` i `format=jsonv2`.

### Test: Podgorica, Pljevlja, Nikšić (2. 11. 2026.)

Pojedinačni zahtjevi ka `nominatim.openstreetmap.org/reverse` (`format=jsonv2&addressdetails=1&namedetails=1&zoom=18`), sa razmakom od najmanje 2 s i identifikujućim User-Agent-om. Ukupno 12 zahtjeva ka Nominatimu (10 reverse + 2 search za `namedetails`) i 2 ka Photonu.

| Tačka | `accept-language` | Rezultat (`road`, `quarter`, `country`) |
|---|---|---|
| 42.4411, 19.2627 (Trg nezavisnosti) | — (bez parametra i zaglavlja) | `Trg nezavisnosti`, `Stara varoš`, `Crna Gora / Црна Гора` |
| isto | **`sr-Latn`** | `Trg nezavisnosti`, **`Стара варош`** (ćirilica!), `Crna Gora` |
| isto | `sr-Latn,sr,en` | isto kao gore, **ćirilica** u `quarter` |
| isto | **`cnr-Latn`** | `Trg nezavisnosti`, `Stara varoš`, `Crna Gora` (sve latinica) |
| 42.4482, 19.2465 | — | `46, Dalmatinska`, `Crna Gora / Црна Гора` |
| isto | **`sr-Latn`** | `46, **Далматинска**` (ćirilica!) |
| 42.4304, 19.2470 | — | `Ksenije Cicvarić` |
| 43.3567, 19.3584 (Pljevlja) | — / `cnr-Latn` | `Vuka Kneževića`, `Potrlica`, `Pljevlja`, `Opština Pljevlja` (latinica) |
| 42.7731, 18.9445 (Nikšić) | `cnr-Latn` | samo `Nikšić, Opština Nikšić, 81400` (bez ulice na toj tački) |

Zašto `sr-Latn` daje ćirilicu: OSM objekti u Podgorici imaju `name` (latinica), `name:sr` (**ćirilica**), `name:cnr` i `name:cnr-Latn` (latinica), `name:cnr-Cyrl` (ćirilica). Oznaka `name:sr-Latn` uglavnom **ne postoji** (ulica Dalmatinska: `name:sr=Далматинска`, `name:cnr-Latn=Dalmatinska`, bez `name:sr-Latn`). Kad nema `sr-Latn`, Nominatim prelazi na `name:sr`, a to je ćirilica. Ovo je zaključak iz `namedetails` u testovima, ne iz dokumentacije.

Zaključci iz testa:
- **`accept-language=cnr-Latn`** daje dosljednu latinicu, a dobija se i čist naziv države „Crna Gora".
- **`sr-Latn` ne koristiti.** Pogoršava rezultat.
- Važna posljedica podrazumijevanja na zaglavlje: ako se Nominatim zove **sa klijenta**, pregledač na srpskom ili sa `sr` u jezičkim postavkama šalje `Accept-Language: sr…`, i korisnik može dobiti ćirilične nazive. Sa servera parametar kontrolišemo mi.
- Kvalitet za Podgoricu je dobar: ulica i kućni broj gdje postoje, uz poštanski broj, grad i opštinu (`county`: „Glavni grad Podgorica", „Opština Pljevlja"). Na nekim tačkama (Nikšić) nema ulice, pa adresa mora imati rezervu (npr. „u blizini …" ili samo naselje i opština uz koordinate).
- Polje `county` sadrži naziv opštine, ali po pravilu 1 iz AGENTS.md opština za nadležnost dolazi iz `resolve_jurisdiction` (PostGIS), ne iz geocodera. Adresa služi samo za prikaz.

### Transliteracija kao rezerva

Crnogorska ćirilica i latinica se poklapaju jedan-na-jedan (Љ→Lj, Њ→Nj, Џ→Dž, С́→Ś, З́→Ź), pa je konverzija skoro jednoznačna (https://en.wikipedia.org/wiki/Montenegrin_alphabet, sekundarni izvor). Funkcija od desetak redova koja ćirilicu u odgovoru pretvara u latinicu je jeftina zaštita ako neki objekat ima samo ćirilični `name`.

### Ostali geocoderi

| Servis | Besplatno | Uslovi bitni za nas | Izvor |
|---|---|---|---|
| **Photon** (`photon.komoot.io`) | da, „u razumnim granicama", bez garancija; prekomjerna upotreba se usporava ili banuje | `lang` i inače `Accept-Language` pa lokalni naziv; za reverse ima `lat`, `lon`, `radius`, `limit`, `layer`. **Test**: Dalmatinska (Podgorica) i Vuka Kneževića (Pljevlja) bez `lang` su došli **na latinici**; nema kućnog broja za Dalmatinsku 46 (vratio ulicu) | https://github.com/komoot/photon , https://github.com/komoot/photon/blob/master/docs/api-v1.md |
| **LocationIQ** Free | 5.000/dan, 2/s, 60/min | komercijalno uz link „Search by LocationIQ.com"; keširanje **najviše 48 h** (trajno čuvanje adrese u prijavi je upitno) | https://locationiq.com/pricing |
| **Mapbox** Geocoding | 100.000 „temporary"/mj. | **temporary rezultati se ne smiju keširati**; odgovori se smiju koristiti **samo uz Mapbox mapu**; srpski „ograničena pokrivenost", crnogorski se ne pominje | https://docs.mapbox.com/api/search/geocoding/ , https://www.mapbox.com/pricing |
| **Google** Geocoding | 10.000 događaja/mj., zatim 5 $/1.000 | atribucija „Google Maps"; trajno se smije čuvati samo place ID | https://developers.google.com/maps/billing-and-pricing/pricing , https://developers.google.com/maps/documentation/geocoding/policies |
| **Stadia** | reverse = 20 kredita (oko 10.000 zahtjeva od 200.000 kredita) | free nije za komercijalnu upotrebu | https://stadiamaps.com/pricing/ |

Mapbox i Google ispadaju zbog cijene, ograničenja keširanja i vezanosti za njihovu mapu, jer adresu trajno čuvamo u prijavi i šaljemo je u mejlu.

---

## 4. Server ili klijent za geokodiranje?

Argumenti za **server** (Next.js Route Handler ili Server Action):
- **Latinica:** sa servera fiksiramo `accept-language=cnr-Latn`. Sa klijenta bi se uzimalo zaglavlje pregledača (vidi test). Izvor: https://nominatim.org/release-docs/latest/api/Reverse/
- **User-Agent:** Nominatim traži identifikujući UA. Iz pregledača ne možemo postaviti svoj UA, šalje se samo Referer. Sa servera šaljemo npr. `Fixit/0.1 (+https://<domen>)`. Izvor: https://operations.osmfoundation.org/policies/nominatim/
- **Keširanje i 1 zahtjev/s:** politika traži keš na našoj strani i zamjenjivost servisa „u bilo kom trenutku". Server je jedno mjesto za keš (npr. po koordinatama zaokruženim na 4–5 decimala) i za promjenu provajdera bez novog deploy-a klijenta.
- **Ključevi:** ako se pređe na LocationIQ ili drugi servis sa ključem, ključ ostaje na serveru (pravilo 3 iz AGENTS.md).
- Geokodirati **samo jednom, kad korisnik potvrdi pin**, ne pri svakom pomjeranju. Pomjeranje sa geokodiranjem bi bilo upravo ono što politika zove „periodični zahtjevi" i liči na autocomplete.

Rizik koji nije provjeren: Vercel funkcije izlaze sa dijeljenih IP adresa. Ako Nominatim ograničava po IP-u, tuđi saobraćaj sa iste adrese može nam smetati. U tom slučaju rezerva je Photon ili LocationIQ iza istog server-endpointa.

**Tile-ovi** idu direktno iz pregledača (tako svi provajderi očekuju). Ključ za tile-ove (CARTO, MapTiler) je po prirodi javan, ali nije među tajnama iz pravila 3.

---

## Preporuka (nije odluka; odlučuje se u tiketima 15 i 17)

**Biblioteka:** `leaflet@1.9.4` + `react-leaflet@5`. Mapa je klijentska komponenta učitana sa `next/dynamic` i `ssr: false`. Oko 46 KB gzip naspram oko 300 KB za MapLibre, što je najsigurniji put do 2 s na 4G. Pin: prevlačiv `Marker` ili fiksni pin u centru, pa „Potvrdi lokaciju". Klasterovanje (`leaflet.markercluster`) tek za P1 panel ili kad bude stotine prijava.

**Tile-ovi:** za hakaton demo **OSM standard raster** (`tile.openstreetmap.org`): bez ključa i registracije, uz vidljivu atribuciju „© OpenStreetMap", bez restriktivnog `Referrer-Policy` i **bez keširanja tile-ova u service worker-u**. URL tile-a i atribuciju držati u jednoj konstanti, da se mogu zamijeniti bez diranja koda.
- *Rezerva / poslije demoa:* **CARTO Voyager/Positron raster** sa besplatnim ključem (1 M zahtjeva/mj. komercijalno, atribucija OSM + CARTO). Isti Leaflet kod, mijenja se samo URL. OSM politika eksplicitno upozorava komercijalne servise da pristup može biti povučen, a Fixit planira licence za institucije.
- *Ako zatreba vektorski izgled:* OpenFreeMap + MapLibre (bez ključa, komercijalno dozvoljeno), uz cijenu od oko 250 KB JS-a više.

**Geocoder:** **Nominatim sa našeg servera**: `GET /reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=cnr-Latn`, sopstveni User-Agent, poziv tek na potvrdu pina, rezultat sačuvan uz prijavu (i mali keš po zaokruženim koordinatama), uz ograničenje od 1 zahtjeva/s. Adresu sastaviti iz `road` + `house_number` + `city` (ne iz `display_name`), uz rezervu „naselje, opština + koordinate" kad ulice nema, i uz **transliteraciju ćirilice u latinicu** kao zaštitnu mrežu.
- *Rezerva:* **Photon** (`photon.komoot.io/reverse`, bez ključa, u testu vratio latinicu) iza istog server-endpointa. Druga rezerva je LocationIQ (ključ, 5.000/dan, ali keširanje najviše 48 h).
- **Ne koristiti** `accept-language=sr-Latn`. U Podgorici vraća ćirilicu.

**Šta treba upisati u `Tech.md` ako se prihvati:** `leaflet`, `react-leaflet` (nove zavisnosti, uz obrazloženje po pravilu 8), OSM tile URL + atribucija, Nominatim endpoint i parametri, server-only modul za geokodiranje (npr. `lib/geo/reverse.ts`).
