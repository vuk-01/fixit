# 06 — PWA kamera, galerija i GPS na iOS-u i Androidu (nalazi)

Tiket: [06-pwa-kamera-lokacija.md](../issues/06-pwa-kamera-lokacija.md) · Datum istraživanja: 2026-11-02 · Svi izvori pristupljeni 2026-11-02.

**Oznake pouzdanosti:** **visoka** = potvrđeno specifikacijom, zvaničnom dokumentacijom ili izvornim kodom browsera; **srednja** = zvanični izvor ostavlja prostor za odstupanje ili se oslanjamo na izjavu inženjera u bug trackeru; **niska** = samo sekundarni izvori (blogovi, forumi), često zastarjeli ili kontradiktorni.

Gdje se oslanjam na izvorni kod browsera (WebKit `main`, Chromium `main`), to je stanje *trenutne* grane koda. Verzija iOS-a ili Chrome-a na telefonu može biti starija, pa sve što utiče na broj dodira treba potvrditi na pravom telefonu (vidi „Provjeriti na probi u četvrtak").

---

## 1. `<input type="file" accept="image/*" capture="environment">`

### Šta kaže specifikacija
- `capture` je samo **nagovještaj**: browser „SHOULD" otvoriti picker za direktno snimanje; vrijednosti `user`/`environment` biraju kameru. Ako tip u `accept` nema odgovarajući način snimanja, browser se ponaša kao da `capture` ne postoji. — [W3C HTML Media Capture](https://w3c.github.io/html-media-capture/) (**visoka**)
- Ista specifikacija upozorava implementatore da ne propuštaju osjetljive metapodatke, npr. lokaciju u EXIF-u. — isto (**visoka**)
- Podrška za `capture`: Chrome za Android od verzije 25, Safari na iOS-u od verzije 10. — [MDN browser-compat-data, html/elements/input.json](https://github.com/mdn/browser-compat-data/blob/main/html/elements/input.json) (**visoka**); [MDN: capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture)

### iOS (Safari i standalone)
- Kad input ima `capture` i uređaj ima kameru, WebKit **odmah otvara sistemsku kameru** (`UIImagePickerController`, izvor `Camera`), bez menija. Vrijednost `environment` bira zadnju kameru. — [WebKit `WKFileUploadPanel.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/forms/WKFileUploadPanel.mm) (`_shouldMediaCaptureOpenMediaDevice` → `_showCamera`) (**visoka**)
- WebKit kameri postavlja `_setRequiresPickingConfirmation:YES`. Zato posle okidanja korisnik vidi ekran „Retake / Use Photo" („Ponovo / Koristi fotografiju"). **Kamera troši 2 dodira: okidač + „Use Photo".** — isti fajl, `_showCamera` (**visoka** za kod, ekran treba vizuelno potvrditi)
- Fotografija iz kamere se vraća kao `UIImage`, pa je WebKit ponovo kodira u JPEG kvaliteta 0.8 pod imenom `image.jpg`. U kodu stoji komentar „FIXME: Should EXIF data be maintained?". Fajl stiže u punoj rezoluciji, kao JPEG, **bez GPS-a**. — isti fajl, `_uploadItemForJPEGRepresentationOfImage` (**visoka**)
- Bez `capture`, WebKit prikazuje meni sa stavkama „Photo Library", „Take Photo" i „Choose File" (lokalizovano). To je **jedan dodir više** prije galerije. — isti fajl, `contextMenuInteraction:configurationForMenuAtLocation:` (**visoka**)

### Android (Chrome)
- Kad input ima `capture` i `image/*`, Chromium **odmah pokreće `MediaStore.ACTION_IMAGE_CAPTURE`**, tj. sistemsku kameru, bez izbora galerije. — [Chromium `SelectFileDialog.java`](https://chromium.googlesource.com/chromium/src/+/main/ui/android/java/src/org/chromium/ui/base/SelectFileDialog.java) („if the |capture| parameter is set … we should just launch the appropriate intent") (**visoka**); [web.dev: Capturing an image from the user](https://web.dev/articles/media-capturing-images) („on Android … the user will no longer have the option of choosing an existing picture")
- Ako Chrome kao Android aplikacija još nema sistemsku dozvolu `CAMERA`, prvo se pojavljuje Androidov dijalog za dozvolu (**+1 dodir, samo prvi put**). Ako korisnik odbije, a input ima `capture`, izbor se prekida i ne vraća se fajl. — isti fajl (`missingPermissions`, `if (mCapture) { onFileNotSelected(); }`) (**visoka**)
- Broj dodira unutar kamere zavisi od aplikacije za kameru, jer svaki proizvođač ima svoju. Uobičajeno je okidač + potvrda (✓ / „OK"), dakle **2 dodira**, ali to nije standardizovano. (**niska**, provjeriti na telefonu)

---

## 2. Možemo li razlikovati „kamera" od „galerija"?

- **Ne postoji web API** koji kaže odakle je fajl došao. `File` ima samo `name`, `type`, `size` i `lastModified`. Specifikacija `capture` ne definiše nikakav signal o izvoru. — [W3C HTML Media Capture](https://w3c.github.io/html-media-capture/) (**visoka**)
- Postoje heuristike: na iOS-u fajl iz kamere uvijek dobija ime `image.jpg` (vidi gore), a `lastModified` je blizu „sada". One su krhke i mogu se promijeniti u novoj verziji iOS-a. (**srednja** za ime na iOS-u iz koda, **niska** kao pravilo)
- **Pouzdan način su dva odvojena inputa i dva dugmeta:**
  - „Fotografiši": `capture="environment"`. Na oba sistema otvara samo kameru, pa znamo da je fotografija nova i lokacija se uzima iz Geolocation API-ja.
  - „Iz galerije": bez `capture`. Na iOS-u ovaj meni i dalje nudi i „Take Photo". Fotografiju koja stigne ovim putem tretiramo kao galerijsku, pa korisnik ručno postavlja pin, kao što traži FR-3.

---

## 3. EXIF GPS u fajlu iz galerije

### iOS
- **Kamera kroz file input:** GPS se uvijek briše, jer WebKit ponovo kodira `UIImage` u JPEG. — [WebKit bug 263192](https://bugs.webkit.org/show_bug.cgi?id=263192) (status REOPENED; Aditya Keerthi, 2023-10-23: konverzija u JPEG briše EXIF) + kod iznad (**visoka**)
- **Galerija:** iOS 16.4 je počeo da briše GPS iz fotografija poslatih kroz file input. Bug je zatvoren kao „CONFIGURATION CHANGED" uz objašnjenje da od iOS-a 17 picker ima meni „Options" u kojem korisnik bira da li dijeli lokaciju. — [WebKit bug 257534](https://bugs.webkit.org/show_bug.cgi?id=257534) (**srednja**)
- Apple (WWDC23) kaže da su u PHPickeru „by default, all image metadata are included", a da korisnik kroz „Options" može ukloniti lokaciju. WebKit galeriju otvara kroz `PHPickerViewController`, pa se ovo odnosi i na Safari. — [WWDC23 „Embed the Photos Picker in your app"](https://developer.apple.com/videos/play/wwdc2023/10107/) + `WKFileUploadPanel.mm` `_showPhotoPicker` (**srednja**)
- Galerijska fotografija prolazi kroz transkodovanje u JPEG (vidi tačku 4). Nijedan primarni izvor ne potvrđuje da GPS preživi taj korak u Safariju na iOS-u 17/18/26. Sekundarni izvori su kontradiktorni ([HN 2022](https://news.ycombinator.com/item?id=32288069), [WebKit bug 207088](https://bugs.webkit.org/show_bug.cgi?id=207088)). **Zaključak: ne možemo računati na EXIF GPS na iOS-u** (**niska** da je prisutan, **mora se provjeriti na telefonu**).

### Android (Chrome)
- Na Androidu 13 i novijem Chrome za `image/*` bez `capture` otvara **sistemski Android Media/Photo Picker** (`ACTION_GET_CONTENT` → `com.google.android.photopicker` / `providers.media.module`) i ne traži lokacijske metapodatke. — [Chromium `SelectFileDialog.java`](https://chromium.googlesource.com/chromium/src/+/main/ui/android/java/src/org/chromium/ui/base/SelectFileDialog.java) (`preferAndroidMediaPicker`, `showAndroidMediaPickerViaGetContent`) (**visoka**)
- U Android photo pickeru je lokacija **podrazumijevano redigovana** („The default value is false, meaning location metadata is redacted by default"). Aplikacija je može tražiti samo eksplicitno, a korisnik i tada može odbiti. Chrome je ne traži. — [Android: PickVisualMediaRequest.Builder.setLocationMetadataAccessRequested](https://developer.android.com/reference/kotlin/androidx/photopicker/activity/PickVisualMediaRequest.Builder) (**visoka** za picker, **srednja** da isto važi kad se picker pokreće preko `GET_CONTENT`)
- I izvan pickera, uz scoped storage, sistem „hides location information by default". Za originalni EXIF potrebna je dozvola `ACCESS_MEDIA_LOCATION`, a Chrome je ne koristi u ovom toku. — [Android: Access media files – Location where media was captured](https://developer.android.com/training/data-storage/shared/media) (**visoka**)
- **Zaključak:** ni na Androidu ne računamo na EXIF GPS iz galerije.

### Može li pin biti unaprijed postavljen iz EXIF-a?
- Tehnički može: ako GPS ipak stigne u EXIF-u, pročitamo ga prije kompresije, jer canvas briše EXIF. To je u praksi rijetko i nepouzdano, pa vrijedi samo kao „bonus". Pin uvijek mora biti potvrđen (FR-3). Čitanje EXIF-a traži mali parser ili biblioteku, a to je nova zavisnost i po pravilu 8 iz `AGENTS.md` traži obrazloženje u PR-u.

---

## 4. HEIC na iOS-u i kompresija na klijentu

### Šta file input vraća na iOS-u
- **Kamera:** uvijek JPEG (`image.jpg`, kvalitet 0.8). — `WKFileUploadPanel.mm` (**visoka**)
- **Galerija:** način rada pickera određuje podešavanje `PhotoPickerPrefersOriginalImageFormat`. U WebKit `main` grani je `defaultValue: false`, pa picker radi u režimu `PHPickerConfigurationAssetRepresentationModeCompatible`, odnosno **HEIC se transkoduje u JPEG**. — [WebKit `UnifiedWebPreferences.yaml`](https://github.com/WebKit/WebKit/blob/main/Source/WTF/Scripts/Preferences/UnifiedWebPreferences.yaml), `WKFileUploadPanel.mm` `_preferredAssetRepresentationMode` (**visoka** za trenutni kod)
- Istorija nije bila pravolinijska. Commit „Avoid transcoding images on file inputs unless the set of image types is explicitly restricted" je uveo vraćanje originala za `image/*`, a kasniji commit („Unable to upload photos to Adobe Express") je podrazumijevanu vrijednost vratio na `false`. Neke verzije iOS-a su zato možda vraćale HEIC. — [WebKit commit 02a5c28](https://github.com/WebKit/WebKit/commit/02a5c284178e4c4c9184cf721954243d59678a03), [WebKit commit 5b0e147](https://github.com/WebKit/WebKit/commit/5b0e147c095567387a080a2da87c79f95ed04744) (**srednja**)
- Na forumu se prijavljuje da Safari 17+ vraća `.heic` kad `accept` eksplicitno sadrži `image/heic`. — [Apple Developer Forums 743049](https://developer.apple.com/forums/thread/743049) (**niska**). **Praktično pravilo: ne stavljati `image/heic` u `accept`.**
- Safari na iOS-u 17+ svakako zna da dekodira HEIC. Ako HEIC i stigne, canvas ga može obraditi. — [WebKit: Features in Safari 17.0](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/), [caniuse: HEIF](https://caniuse.com/heif) (**visoka**)

### Android
- **Chrome za Android ne dekodira HEIC/HEIF.** — [caniuse: HEIF](https://caniuse.com/heif) (**visoka**). Neki telefoni (npr. Samsung sa uključenim „High efficiency pictures") čuvaju fotografije kao HEIC. Takav fajl iz galerije ne može se nacrtati na canvas, pa treba jasna poruka greške ili konverzija na serveru. (**srednja**, provjeriti ako bude Samsung na probi)

### Preporučena kompresija (1600 px, JPEG, bez EXIF-a)
- `createImageBitmap(file)`: Chrome 50+, Safari 15+. Opcija `imageOrientation` postoji od Chrome-a 52 i Safarija 15, vrijednost `from-image` od Chrome-a 112 i Safarija 16. — [MDN BCD api/_globals/createImageBitmap.json](https://github.com/mdn/browser-compat-data/blob/main/api/_globals/createImageBitmap.json) (**visoka**). `OffscreenCanvas` i `convertToBlob` postoje od Safarija 16.4. — [MDN BCD api/OffscreenCanvas.json](https://github.com/mdn/browser-compat-data/blob/main/api/OffscreenCanvas.json) (**visoka**)
- `canvas.toBlob(cb, 'image/jpeg', q)`: kvalitet se zadaje kao broj od 0.0 do 1.0, a za nepodržan tip se vraća PNG. — [WHATWG HTML: canvas toBlob](https://html.spec.whatwg.org/multipage/canvas.html) (**visoka**). Canvas sadrži samo piksele, pa novi JPEG nema EXIF/GPS iz originala. To je uobičajeno ponašanje browsera, ali ga ovdje nisam našao eksplicitno navedeno u specifikaciji (**srednja**, provjeriti jednim EXIF čitačem na probi).
- Predloženi postupak, bez nove zavisnosti:
  1. `createImageBitmap(file, { imageOrientation: 'from-image' })`, a ako ne uspije, rezervni put je `<img>` + `decode()`.
  2. Izračunati faktor tako da najduža strana bude najviše 1600 px.
  3. `drawImage` na canvas tih dimenzija.
  4. `toBlob('image/jpeg', ~0.8)`.
  5. Osloboditi memoriju: `bitmap.close()` i `canvas.width = 0`.

  Biblioteka (npr. `browser-image-compression`) nije potrebna. Ako se ipak doda, pravilo 8 traži obrazloženje.
- Orijentacija: od 2020. browseri podrazumijevano poštuju EXIF orijentaciju (`image-orientation: from-image`). Okrenute fotografije svejedno treba provjeriti na oba telefona. (**srednja**)

---

## 5. Geolocation API

- **HTTPS je obavezan.** Iz nesigurnog konteksta se dobija `PERMISSION_DENIED`. Lokalni razvoj na telefonu zato traži HTTPS tunel ili deploy preview; `http://192.168…` neće raditi. — [W3C Geolocation](https://www.w3.org/TR/geolocation/) §6.5, §10.1 (**visoka**)
- **Opcije i podrazumijevane vrijednosti:** `enableHighAccuracy=false` (`true` je samo nagovještaj i „can result in slower response times"), `maximumAge=0` (bez keša), `timeout=Infinity`. Vrijeme čekanja na dozvolu se ne računa u `timeout`. Dok je stranica skrivena, zahtjev čeka. — [W3C Geolocation](https://www.w3.org/TR/geolocation/) §6.5–6.6, §7; [MDN getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition) (**visoka**)
- **Dozvola:** potrebna je „express permission". Prompt se pojavljuje pri prvom pozivu `getCurrentPosition` i specifikacija ne zahtijeva korisnički gest. Specifikacija preporučuje da dozvola traje jednu sesiju. — [W3C Geolocation](https://www.w3.org/TR/geolocation/) §3.4, §11 (**visoka**)
- **Broj dodira za dozvolu prvi put:**
  - **iOS Safari:** 1 dodir („Allow"). Prijavljeno je da iOS ponovo pita poslije osvježavanja stranice. — [w3c/geolocation-api #139](https://github.com/w3c/geolocation-api/issues/139) (**niska**/srednja). Ako je `Settings → Privacy → Location Services → Safari Websites` na „Never", prompt se ne pojavljuje. Ako je „Precise Location" isključen, lokacija je samo približna. — [Apple: Location Services & Privacy](https://support.apple.com/en-us/HT207056), [Apple: Turn Location Services on or off](https://support.apple.com/en-us/102647) (**visoka**)
  - **Android Chrome:** 1 dodir na prompt Chrome-a za sajt. Ako Chrome kao aplikacija nema Android dozvolu za lokaciju, dolazi još i sistemski dijalog (preciznost i trajanje, 1–2 dodira). Ako korisnik izabere „približnu" lokaciju, tačnost je „within about 3 square kilometers", što je beskorisno za pin. Precizna lokacija je „usually within about 50 meters … sometimes … a few meters". — [Android: Location permissions – Accuracy](https://developer.android.com/develop/sensors-and-location/location/permissions) (**visoka** za tačnost; tačne labele u Chrome promptu **niska**, provjeriti)
  - Chrome-ove „one-time" dozvole („Allow this time") su lansirane za desktop (Chrome 116). Za mobilni Chrome blog kaže da je promptovi nisu promijenjeni. — [Chrome for Developers: One-time permissions](https://developer.chrome.com/blog/one-time-permissions) (**srednja**)
- **Tačnost i vrijeme u zatvorenom prostoru (sala):** GPS signal u zgradi je slab. Lokaciju tada daju Wi-Fi i bazne stanice, pa očekujemo `accuracy` od nekoliko desetina do nekoliko stotina metara. Prvi fiks sa `enableHighAccuracy: true` može trajati više sekundi ili isteći. Nisam našao primarni izvor sa konkretnim brojevima za web (**niska**), pa se mora izmjeriti na probi.
- **Praktični parametri (prijedlog):**
  - Pokrenuti `getCurrentPosition` **odmah na dodir „Fotografiši"**, paralelno sa kamerom. Tako se fiks traži dok korisnik slika, a ne posle.
  - Parametri: `{ enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 }`.
  - Opciono `watchPosition` dok je ekran sa pinom otvoren, uz zaustavljanje kad je `accuracy` ispod približno 50 m.
  - Ako je `accuracy` veći od približno 150 m ili stigne greška, pin se postavlja na centar opštine ili mape i korisnik ga pomjera (FR-3).

---

## 6. Instalirana PWA (standalone)

### iOS
- Od iOS-a 26 svaki sajt dodat na početni ekran podrazumijevano se otvara kao web aplikacija, i bez manifesta. Storage nije dijeljen sa Safarijem; od iOS-a 17.2 se kopiraju samo kolačići za prijavu. — [firt.dev: iOS PWA Compatibility](https://firt.dev/notes/pwa-ios/) (ažurirano 13. 10. 2026; sekundarni, ali specijalizovan izvor) (**srednja**)
- **Lokacija u standalone modu je problematična:** na iOS-u 26 se prijavljuje da instalirana PWA dobija `PERMISSION_DENIED` iako Safari na istom telefonu radi. Prijavljuje se i da prompt povremeno ponovo iskače, kao i da `navigator.permissions` vraća `denied` iako `getCurrentPosition` uspije. Apple nije odgovorio. — [Apple Developer Forums 804381](https://developer.apple.com/forums/thread/804381) (**niska**, ali relevantno za demo). **Ne oslanjati se na Permissions API na iOS-u; uvijek imati ručni pin.**
- **Kamera kroz file input u standalone modu:** isti kod (`WKFileUploadPanel`) radi i u standalone modu. Ranije verzije iOS-a (11–13) imale su bugove sa crnim ekranom kamere poslije vraćanja aplikacije iz pozadine. — [WebKit bugovi 178123](https://bugs.webkit.org/show_bug.cgi?id=178123), [202884](https://bugs.webkit.org/show_bug.cgi?id=202884), [206219](https://bugs.webkit.org/show_bug.cgi?id=206219) (**niska** za današnje stanje). Na probi treba isprobati i scenario sa aplikacijom vraćenom iz pozadine.

### Android
- Instalirana PWA (WebAPK) koristi Chrome-ov profil, a dozvole i dalje vodi Chrome: korisnik vidi Chrome-ove promptove i mijenja ih u Chrome podešavanjima. Dozvola data u browseru zato važi i u instaliranoj aplikaciji. — [web.dev: WebAPKs on Android](https://web.dev/articles/webapks) (stariji članak) (**srednja**)
- File input i kamera idu istim `SelectFileDialog` putem kao u browseru. — [Chromium `SelectFileDialog.java`](https://chromium.googlesource.com/chromium/src/+/main/ui/android/java/src/org/chromium/ui/base/SelectFileDialog.java) (**visoka** za kod)

---

## Tabela po platformama

| | iOS Safari | iOS standalone PWA | Android Chrome | Android instalirana PWA (WebAPK) |
|---|---|---|---|---|
| `capture="environment"` otvara kameru direktno | Da (**visoka**) | Da, isti kod; istorijski bugovi sa crnim ekranom (**niska**) | Da, `ACTION_IMAGE_CAPTURE` (**visoka**) | Da, isti kod (**visoka**) |
| Dodiri unutar kamere | 2: okidač + „Use Photo" (**visoka**) | 2 (**visoka**) | Obično 2: okidač + ✓, zavisi od OEM kamere (**niska**) | Isto kao Chrome (**niska**) |
| Jednokratna dozvola za kameru | Nije potrebna za file input (provjeriti) | Isto (provjeriti) | Android `CAMERA` za Chrome ako nije data: +1 (**visoka**) | Isto (**srednja**) |
| Galerija (input bez `capture`) | Meni → „Photo Library" → izbor: 3 dodira (**visoka** za meni) | Isto | Android 13+: sistemski picker bez opcije kamere → izbor: 2 dodira (**visoka**) | Isto (**visoka**) |
| Format iz galerije | JPEG (HEIC se transkoduje) u WebKit `main` (**visoka**/srednja za starije iOS) | Isto | Original; HEIC moguć na nekim telefonima, Chrome ga ne dekodira (**visoka**) | Isto |
| EXIF GPS iz kamere | Ne, uvijek obrisan (**visoka**) | Ne | Nepoznato, zavisi od aplikacije kamere (**niska**) | Isto |
| EXIF GPS iz galerije | Možda, ako „Options → Location" ostane uključen (**niska**) | Isto | Ne, redigovano podrazumijevano (**visoka**/srednja) | Isto |
| Geolocation prompt prvi put | 1 dodir (**visoka**) | 1+; prijave o odbijanju bez prompta na iOS-u 26 (**niska**) | 1 (sajt) + 0–2 (Android dozvola za Chrome) (**srednja**) | Dijeli dozvolu sa Chrome-om (**srednja**) |
| Trajanje dozvole za lokaciju | Kratko; ponovno pitanje poslije reload-a prijavljeno (**niska**) | Nepouzdano (**niska**) | Trajno dok se ne ukine (**srednja**) | Isto kao Chrome (**srednja**) |
| HTTPS obavezan | Da (**visoka**) | Da | Da | Da |

---

## Implikacije za budžet od 4 dodira

Broj dodira na putanji „kamera" kad su dozvole već date:

| # | Dodir | Napomena |
|---|---|---|
| 1 | „Fotografiši" (naše dugme / label za input) | File picker zahtijeva korisnički gest, pa ne može da se otvori sam od sebe |
| 2 | Okidač u sistemskoj kameri | Sistemski UI, ne kontrolišemo ga |
| 3 | „Use Photo" / ✓ | Sistemski UI, ne kontrolišemo ga |
| 4 | Potvrda pina | FR-3: „Korisnik uvijek mora pomjeriti ili potvrditi pin" |
| 5 | „Pošalji" | Ako je odvojen korak |

- **Sistemska kamera troši 2 od 4 dodira i to ne možemo promijeniti** kroz file input. Budžet od 4 je dostižan samo ako se **potvrda pina i slanje spoje u jedan dodir** (npr. „Potvrdi i pošalji"), ili ako se „Pošalji" ne broji u budžet. Ta odluka pripada tiketu 15.
- Prvo korišćenje dodaje **1–4 jednokratna dodira za dozvole**: lokacija na iOS-u 1; na Androidu sajt 1 plus sistem 0–2; Android `CAMERA` za Chrome 0–1. Predlog je da budžet od 4 važi za „drugu i svaku sledeću prijavu", a da se prvo pokretanje mjeri posebno.
- Putanja „galerija" je duža: iOS 3 dodira do fotografije, Android 2, plus ručno postavljanje pina i potvrda. To je izvan budžeta od 4, ali FR-3 i ne očekuje isti tok.
- Alternativa bez sistemskog UI-ja je `getUserMedia` + sopstveni okidač (1 dodir za snimanje umjesto 2). Ona traži još jednu dozvolu (kamera po sajtu), više koda i više rizika na iOS standalone. Ovdje je nisam detaljno istraživao.

---

## Provjeriti na probi u četvrtak (pravi telefon, HTTPS deploy)

1. iOS Safari i iOS početni ekran: dugme sa `capture="environment"` otvara zadnju kameru direktno; izbrojati dodire do povratka u aplikaciju. Da li se pojavljuje sistemsko pitanje za kameru prvi put?
2. Android Chrome i instalirana PWA: ista provjera; zapisati proizvođača i aplikaciju kamere i postoji li ekran sa ✓.
3. iOS: kamera, zatim aplikacija u pozadinu, pa nazad, pa ponovo kamera: da li je ekran crn?
4. Iz galerije na oba telefona: zapisati `file.type`, `file.name` i `file.size`; provjeriti da li je HEIC i ima li EXIF GPS (privremeni log, ne u produkciju).
5. Poslije kompresije (canvas → JPEG): provjeriti da nema EXIF-a, da je orijentacija ispravna (fotografija uspravno i položeno) i da je najduža strana 1600 px.
6. Geolocation u sali: izmjeriti vrijeme do prvog rezultata i `accuracy` sa `enableHighAccuracy: true`, hladno (poslije restarta) i toplo. Pokušati kraj prozora i u sredini sale.
7. iOS početni ekran: da li se prompt za lokaciju pojavljuje, da li se pamti poslije zatvaranja aplikacije i šta vraća `navigator.permissions.query({name:'geolocation'})`.
8. Android: šta se dešava ako je izabrana „približna" lokacija (`accuracy` u km) i da li UI to jasno hendluje.
9. Samsung ili drugi telefon sa HEIC podešavanjem, ako bude dostupan: poruka greške za HEIC u Chrome-u.

---

## Preporuka (prijedlog, ne odluka)

> Ovo je preporuka istraživanja. Odluku donosi tiket 15 (tok prijave i budžet dodira).

1. **Dva dugmeta:** „Fotografiši" (`accept="image/*" capture="environment"`) kao primarno, veliko dugme, i „Iz galerije" (`accept="image/jpeg,image/png,image/webp,image/*"`, bez `image/heic` i bez `capture`) kao sekundarno. Izvor fotografije određuje dugme, a ne heuristika.
2. **Lokacija se traži paralelno sa kamerom:** `getCurrentPosition` se pokreće na dodir „Fotografiši", pa je fiks često spreman kad se korisnik vrati iz kamere. Ne oslanjati se na EXIF GPS ni na jednoj platformi; EXIF koristiti samo kao „bonus" za galeriju ako bez nove zavisnosti ispadne jednostavno.
3. **Pin se uvijek prikazuje** (FR-3). Kad je `accuracy` dobar, pin je na GPS lokaciji i jedan dodir potvrđuje. Kad je loš ili lokacija nije dostupna, pin je na centru mape ili opštine i korisnik ga pomjera. Spojiti „potvrdi pin" i „pošalji/analiziraj" u jedan dodir da bi putanja kamere ostala na 4 dodira.
4. **Kompresija** nativnim API-jima (`createImageBitmap` → canvas → `toBlob('image/jpeg', 0.8)`, najduža strana 1600 px), bez biblioteke. Za fajlove koje Chrome za Android ne može dekodirati (HEIC) prikazati jasnu poruku na crnogorskom.
5. **Demo:** pokazati ga u **Safariju i Chrome-u kao browseru**, a ne kao instaliranu iOS PWA, zbog prijavljenih problema sa lokacijom u standalone modu na iOS-u 26. Prije demoa unaprijed dati dozvole za lokaciju i kameru na demo telefonima i provjeriti „Precise Location".
6. Lokalni razvoj na telefonu raditi preko HTTPS-a (deploy preview ili tunel), jer Geolocation ne radi na `http://` LAN adresi.
