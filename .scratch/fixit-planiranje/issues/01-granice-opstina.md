# 01 — Granice opština i države: izvor podataka

Type: research
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Odakle uzimamo poligone **trenutnih** opština Crne Gore i granicu države, za PostGIS (`resolve_municipality`, FR-4 „lokacija van Crne Gore", FR-5)?

Treba utvrditi:

1. Koliko opština Crna Gora ima danas i koje su novije (npr. Tuzi, Zeta, Petnjica, Gusinje). Da li Glavni grad Podgorica još ima gradske opštine unutar sebe, i da li ih tretiramo zasebno.
2. Koji izvori postoje (OSM `admin_level`, geoBoundaries, GADM, Monstat / Uprava za katastar, HDX…), koliko su ažurni (da li sadrže Zetu i Tuzi kao zasebne opštine), u kom formatu i pod kojom licencom (potrebna atribucija?).
3. Nazivi opština na latinici (OSM često ima ćirilicu ili miješano).
4. Preporučen način uvoza u Supabase/PostGIS (GeoJSON → SQL u migraciji ili seed skripti, pojednostavljivanje geometrije, veličina fajla).
5. Odakle granica države za FR-4: unija opština ili poseban poligon.

Odluke koje ovo čeka: Šema baze (18), seed.

Nalaze zapisati u `.scratch/fixit-planiranje/research/01-granice-opstina.md`.

## Answer

- **[istraživanje]** Crna Gora ima 25 jedinica: 23 opštine + Glavni grad Podgorica + Prijestonica Cetinje, sa ISO 3166-2 kodovima ME-01…ME-25. Najnovije su Petnjica, Gusinje, Tuzi (2018) i Zeta (2022, sjedište Golubovci).
- **[istraživanje]** Tuzi i Golubovci (sada Zeta), bivše gradske opštine Podgorice, sada su samostalne opštine. Podgoricu tretirati kao jednu jedinicu. Da zakon više ne predviđa nijednu gradsku opštinu nije potvrđeno iz teksta zakona.
- **[istraživanje]** OSM (`admin_level=6`) je jedini pronađeni ažuran izvor: svih 25, uključujući Tuzi i Zetu, sa `ISO3166-2` i latiničnim `name`/`name:sr-Latn`. Licenca je ODbL i atribucija „© OpenStreetMap contributors" je obavezna.
- **[istraživanje]** geoBoundaries (2017, 23 jedinice, nema Tuzi ni Zete) i GADM 4.1 (21 jedinica, samo za nekomercijalnu upotrebu) su zastarjeli. Na HDX-u nema zvaničnog COD-AB skupa. Geoportal Uprave za nekretnine nema javno preuzimanje granica (nije potvrđeno; „sva prava zadržana").
- **[istraživanje]** Nazive treba ručno ispraviti: OSM ima „Prijestolnica Cetinje" (zvanično „Prijestonica") i dvojezični `name` za Ulcinj.
- **[istraživanje]** OSM opštine ne pokrivaju Skadarsko jezero ni more, što Monstat potvrđuje za službene površine. Poligon države iz OSM-a (rel. 53296) pokriva i jezero i teritorijalno more. Unija opština zato nije dobra granica za FR-4.
- **[istraživanje]** Veličina: 25 nepojednostavljenih poligona ≈ 1,9 MB GeoJSON-a (≈ 71 000 tačaka), država ≈ 310 KB. Uštedu od pojednostavljivanja nisam izmjerio.
- **[istraživanje]** Supabase: PostGIS ide u šemu `extensions`. `supabase/seed.sql` se izvršava na `db reset`, a na hosted projekat ide sa `db push --include-seed`.
- **[istraživanje]** Preporuka (nije odluka): OSM kao izvor, nazivi i ISO kodovi ručno u seed-u, geometrija kroz seed (`ST_GeomFromGeoJSON` + `ST_MakeValid` + GIST), poseban OSM poligon države za FR-4, najbliža opština kao rezerva za FR-5 kad je tačka na jezeru ili obali.

[Nalazi](../research/01-granice-opstina.md)
