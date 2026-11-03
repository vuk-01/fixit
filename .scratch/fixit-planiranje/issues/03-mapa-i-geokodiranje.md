# 03 — Mapa, tile-ovi i reverse geocoding za Crnu Goru

Type: research
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Kojom bibliotekom i kojim servisima prikazujemo mapu (javna mapa, pin za lokaciju, panel) i pretvaramo koordinate u adresu (P0 „Adresa lokacije u prijavi"), tako da je besplatno ili jeftino za hakaton, dozvoljeno uslovima korišćenja i dovoljno brzo (javna mapa ≤ 2 s na 4G)?

Treba utvrditi:

1. Biblioteke za React/Next.js: Leaflet (react-leaflet) vs. MapLibre GL (react-map-gl ili sl.). Veličina bundle-a, rad na telefonu od 360 px, pomjeranje pina dodirom, klasterovanje markera, SSR ograničenja.
2. Tile provajderi: OSM standardni tile-ovi (usage policy: da li smijemo za javnu aplikaciju i demo), MapTiler, Stadia, Carto, Mapbox, Protomaps. Besplatni limiti, potreban ključ, atribucija.
3. Reverse geocoding: Nominatim (policy, 1 zahtjev/s, User-Agent, keširanje), Photon, LocationIQ, Mapbox, Google. **Kvalitet adresa u Podgorici** i da li odgovor može biti **na latinici** (OSM u Crnoj Gori često ima ćirilične ili miješane nazive: `accept-language=sr-Latn`, `name:sr-Latn`, transliteracija kao rezerva?).
4. Da li geokodiranje mora ići preko našeg servera (ključevi, keširanje, User-Agent) ili smije sa klijenta.
5. Preporuka: jedna kombinacija biblioteke, tile-ova i geocodera, uz obrazloženje i rezervu.

Odluke koje ovo čeka: Tok prijave (15), Tehnički stack (17).

Nalaze zapisati u `.scratch/fixit-planiranje/research/03-mapa-i-geokodiranje.md`.

## Answer

- **[istraživanje]** Leaflet 1.9.4 + react-leaflet 5 je oko 46 KB gzip, a maplibre-gl 6 oko 296 KB gzip. Za cilj ≤ 2 s na 4G Leaflet je znatno lakši. react-leaflet 5 traži React 19 i `leaflet ^1.9`.
- **[istraživanje]** Obje biblioteke rade samo u pregledaču. U Next.js-u se mapa učitava sa `next/dynamic` i `ssr: false`, što radi samo unutar Client Component-e.
- **[istraživanje]** OSM standardni tile-ovi su dozvoljeni bez ključa, uz vidljivu atribuciju i Referer, ali bez SLA, bez offline ili unaprijed keširanja (PWA service worker ne smije keširati tile-ove), a pristup komercijalnim servisima „može biti povučen u bilo kom trenutku".
- **[istraživanje]** CARTO od septembra 2026. traži API ključ (1 M zahtjeva/mj. besplatno komercijalno). OpenFreeMap je bez ključa i bez limita, komercijalno dozvoljen, ali vektorski (traži MapLibre). MapTiler i Stadia free nisu jasno ili uopšte za komercijalnu upotrebu.
- **[istraživanje]** Nominatim politika: najviše 1 zahtjev/s, identifikujući User-Agent, obavezan keš na našoj strani, zabranjen autocomplete, servis mora biti zamjenjiv u bilo kom trenutku.
- **[istraživanje]** Test u Podgorici: `accept-language=sr-Latn` vraća **ćirilicu** („Стара варош", „Далматинска"), jer OSM ima `name:sr` na ćirilici, a `name:sr-Latn` uglavnom nema. `accept-language=cnr-Latn` vraća dosljednu latinicu. Bez parametra Nominatim uzima `Accept-Language` pregledača.
- **[istraživanje]** Zato geokodiranje treba ići preko našeg servera: fiksni `cnr-Latn`, sopstveni User-Agent, keš i zamjena provajdera na jednom mjestu. Poziv ide samo na potvrdu pina. Ćirilica se može transliterisati jedan-na-jedan kao rezerva.
- **[istraživanje]** Photon (komoot) je u testu vratio latinicu bez ključa i dobra je rezerva. Mapbox geocoding ne dozvoljava keširanje temporary rezultata i traži Mapbox mapu, a Google košta 5 $/1.000 poslije 10.000/mj. Oba ispadaju.
- **[istraživanje]** Preporuka (nije odluka): Leaflet + react-leaflet, OSM raster za demo (CARTO raster sa ključem kao rezerva), Nominatim sa servera sa `cnr-Latn` (Photon kao rezerva).

[Nalazi](../research/03-mapa-i-geokodiranje.md)
