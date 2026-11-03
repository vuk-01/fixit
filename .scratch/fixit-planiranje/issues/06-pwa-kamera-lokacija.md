# 06 — PWA kamera, galerija i GPS na iOS-u i Androidu

Type: research
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Kako se u mobilnom browseru (iOS Safari, Android Chrome, kao web stranica i kao instalirana PWA) ponašaju fotografisanje, izbor iz galerije i lokacija? Od toga zavisi broj dodira i FR-2 / FR-3.

Treba utvrditi:

1. `<input type="file" accept="image/*" capture="environment">`: da li na iOS-u i Androidu otvara kameru direktno, i koliko dodira traži sistemski UI kamere („Use Photo" / „Koristi fotografiju" na iOS-u).
2. Da li uopšte možemo pouzdano razlikovati „napravljeno kamerom" od „izabrano iz galerije" (dva odvojena dugmeta/inputa?).
3. EXIF GPS u fajlu iz galerije: da li ga iOS/Android zadržavaju ili brišu pri izboru kroz file input. Ako ga zadržavaju, može li pin biti unaprijed postavljen iz EXIF-a.
4. HEIC na iOS-u: šta file input vraća (JPEG ili HEIC) i da li canvas može da ga obradi; preporučen način kompresije na klijentu (canvas / `createImageBitmap` / biblioteka) na najdužu stranicu od 1600 px, JPEG, uz brisanje EXIF-a.
5. Geolocation API: kad i kako se traži dozvola (koliko dodira prvi put), tačnost i vrijeme do prve lokacije (`enableHighAccuracy`, `maximumAge`), ponašanje u zatvorenom prostoru (bitno za demo u sali), HTTPS zahtjev.
6. Razlike kad je PWA instalirana na početni ekran (kamera, dozvole, iOS standalone ograničenja).

Odluke koje ovo čeka: Tok prijave i budžet od 4 dodira (15).

Nalaze zapisati u `.scratch/fixit-planiranje/research/06-pwa-kamera-lokacija.md`.

## Answer

- **[istraživanje]** `capture="environment"` otvara sistemsku kameru direktno i na iOS-u (WebKit `_showCamera`) i u Chrome-u za Android (`ACTION_IMAGE_CAPTURE`), bez izbora galerije. Važi i za instaliranu PWA, jer je put kroz kod isti.
- **[istraživanje]** Sistemska kamera troši **2 dodira** (okidač + „Use Photo" na iOS-u, okidač + ✓ na većini Android kamera). Na putanji kamere ostaju tačno 4 dodira samo ako se potvrda pina i slanje spoje u jedan dodir. Prvo korišćenje dodaje 1–4 jednokratna dodira za dozvole.
- **[istraživanje]** Web API ne govori da li je fajl iz kamere ili iz galerije, pa izvor pouzdano određuju samo **dva odvojena dugmeta/inputa** (sa `capture` i bez njega).
- **[istraživanje]** Na **EXIF GPS se ne može računati**: iOS ga uvijek briše za kameru, a za galeriju zavisi od korisnikovog „Options → Location" i nije potvrđeno. Android photo picker lokaciju podrazumijevano redigira, a Chrome je ne traži. Pin iz EXIF-a je u najboljem slučaju bonus.
- **[istraživanje]** iOS file input vraća **JPEG**: za kameru uvijek, a iz galerije se HEIC transkoduje (WebKit `main`). U `accept` ne stavljati `image/heic`. Chrome za Android **ne dekodira HEIC**, što je rijedak slučaj kod nekih Samsung telefona i za njega treba poruka greške.
- **[istraživanje]** Kompresija je moguća bez biblioteke: `createImageBitmap` (Safari 15+, Chrome 50+) → canvas do 1600 px → `toBlob('image/jpeg', 0.8)`. Canvas izbacuje EXIF.
- **[istraživanje]** Geolocation radi samo na **HTTPS-u**. Podrazumijevano je `maximumAge=0` i `timeout=Infinity`, pa ih treba zadati eksplicitno. Lokaciju tražiti na dodir „Fotografiši", paralelno sa kamerom. U zatvorenom prostoru očekivati slabiju tačnost; Androidova „približna" lokacija je oko 3 km² i neupotrebljiva za pin.
- **[istraživanje]** Za iOS standalone PWA na iOS-u 26 postoje prijave da geolokacija vraća `PERMISSION_DENIED` i da prompt ponovo iskače (niska pouzdanost). Preporuka je demo raditi u browseru i uvijek imati ručni pin. Na Androidu instalirana PWA dijeli dozvole sa Chrome-om.
- **[istraživanje]** Na probi u četvrtak na pravom telefonu treba provjeriti 9 stavki (brojanje dodira, crni ekran kamere poslije pozadine, HEIC/EXIF, vrijeme i tačnost GPS-a u sali). Spisak je u nalazima.

[Nalazi](../research/06-pwa-kamera-lokacija.md)
