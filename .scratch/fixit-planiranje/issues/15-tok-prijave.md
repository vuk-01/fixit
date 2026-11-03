# 15 — Tok prijave i budžet od 4 dodira

Type: grilling
Status: resolved
Blocked by: 03, 04, 06
Mapa: [map.md](../map.md)

## Question

Kako izgleda `/prijavi` ekran po ekran, da građanin od fotografije do „Prijava poslata" stigne za < 60 s i ≤ 4 dodira? PRD redoslijed (lokacija → analiza → duplikat → pregled → podaci → slanje) to ne garantuje: FR-3 traži potvrdu pina **prije** analize, pa se AI čekanje i potvrda pina sabiraju umjesto da se preklapaju.

Detalji zavise od nalaza o kameri i GPS-u (06), mapi (03) i brzini modela (04). Prijedlog ispod pretpostavlja ono što je najvjerovatnije i biće ažuriran. Q1, Q2, Q5 i Q7 možeš odgovoriti već sada.

**Prijedlog srećnog puta** (dodiri se broje nakon što je fotografija napravljena):

| Korak | Šta građanin vidi | Dodir |
|---|---|---|
| 0 | (Ulogovan od ranije.) „Fotografiši" (u tom trenutku pokreće se i traženje GPS lokacije) → sistemska kamera → okidač | prije brojanja |
| 1 | Sistemsko „Use Photo" (iOS) / ✓ (većina Android kamera). Ovaj dodir ne možemo ukloniti. | 1 |
| 2 | Mapa sa pinom iz GPS-a + traka „Prepoznajem problem…" (AI već radi u pozadini) → **„Potvrdi lokaciju"** | 2 |
| 3 | „Određujem nadležnog…" → „Pripremam prijavu…" → ekran pregleda: vrsta (može se promijeniti), nadležna institucija, tekst prijave (može se mijenjati), prekidač „Dostavi moje ime i mejl" (isključen) → **„Pošalji prijavu"** | 3 |
| 4 | „Prijava poslata" + kod + link javne stranice + „Podijeli" | — |

Srećni put = **3 dodira**. Dodatni dodiri: pronađen duplikat (+1 izbor) ili pouzdanost < 0.6 (+1 izbor vrste), pa je i tada 4. Oba zajedno = 5. Pomjeranje pina je prevlačenje. Dozvole (lokacija, kamera) traže 1–4 dodira, ali samo prvi put.

*Tabela ažurirana nakon nalaza 06:* kamera iz browsera uvijek traži okidač + „Use Photo"/✓, na iOS-u i na Androidu.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Prijava se uloguje prije kamere**: FR-1 traži nalog za prijavu. Da li gost koji dodirne „Prijavi problem" prvo ide na `/uloguj-se`, pa nazad na kameru, tako da se prijava i registracija ne broje u 4 dodira (dešavaju se jednom, prije fotografisanja)?

➡️ Da. Prijava nakon fotografisanja bi probila i 60 s i 4 dodira.

**Tvoj odgovor:** Da

---

❓ **Q2 - AI analiza počinje odmah, paralelno sa potvrdom pina**: Da li mijenjamo FR-3/FR-5 tako da se fotografija otprema i AI prepoznavanje počinje **odmah nakon fotografisanja**, dok građanin potvrđuje pin? Nadležnost i provjera duplikata se rade tek nakon potvrde pina, jer zavise od lokacije.

➡️ Da. Prepoznavanje vrste ne zavisi od lokacije, a ovako se 8 s modela skriva iza vremena koje građanin ionako troši na pin. Ovo je najveća pojedinačna ušteda vremena u toku.

**Tvoj odgovor:** Da

---

❓ **Q3 - Vrsta, tekst i podaci na jednom ekranu**: Da li su pregled vrste (P0), pregled i izmjena teksta (FR-11) i izbor dostavljanja podataka na **istom** ekranu, sa jednim dugmetom „Pošalji prijavu", umjesto na tri koraka kako ih nabraja PRD §8?

➡️ Da. Tri odvojena ekrana su najmanje dva dodira više.

**Tvoj odgovor:** Da 

---

❓ **Q4 - Ime se traži samo ako je potrebno**: Ako građanin uključi dostavljanje podataka, a nema ime i prezime na nalogu (FR-11), da li se polja „Ime i prezime" pojavljuju na istom ekranu ispod prekidača, umjesto u posebnom koraku? Ime se tada pamti na nalogu za sljedeći put.

➡️ Da.

**Tvoj odgovor:** Kako je moguce da gradjanin nema ime i prezime na nalogu. To se mora uneti pri pravljenju naloga. 

---

❓ **Q5 - Ručni tok je P0, ne P1**: PRD stavlja „rezervni tok kad AI nije dostupan" u P1, ali FR-7 (ručni izbor vrste) je P0, pa je veći dio rezervnog toka ionako P0. Da li je u P0 i ovo: ako AI ne odgovori za 15 s ili vrati grešku, građanin bira vrstu ručno i dobija prazno polje za opis, a dopis se pravi iz istog šablona?

➡️ Da. Dodatni posao je samo jedno tekstualno polje, a štiti demo od pada API-ja ili sporog interneta na hotspotu.

**Tvoj odgovor:** Da

---

❓ **Q6 - Dva dugmeta i pin bez EXIF-a**: Nalaz 06 kaže da nijedan web API ne otkriva da li je fotografija iz kamere ili galerije. Na EXIF GPS se ne može osloniti: iOS ga briše iz fotografija kamere, a Android photo picker podrazumijevano. Da li važi sljedeće?
- Na prvom ekranu su dva dugmeta: „Fotografiši" (sa `capture`) i „Izaberi iz galerije" (bez njega).
- Kod galerije pin počinje na trenutnoj lokaciji telefona, ako je dostupna, a inače u centru Podgorice, i građanin ga pomjera ručno. EXIF se ne čita.

➡️ Da. Čitanje EXIF-a bi radilo samo ponekad, a to je gore nego da nikad ne radi.

**Tvoj odgovor:** Da

---

❓ **Q6b - Budžet od 4 dodira važi za ponovljenu prijavu, od okidača**: Da li cilj „≤ 4 dodira" mjerimo od okidača kamere (uključujući sistemsko „Use Photo"/✓) do „Pošalji prijavu", za korisnika koji je već dao dozvole? Prva prijava ima i 1–4 jednokratna dodira za dozvole.

➡️ Da. Tako srećni put ima 3 dodira i ostaje rezerva za duplikat ili ručni izbor vrste. Nije potrebno spajati „Potvrdi lokaciju" i „Pošalji".

**Tvoj odgovor:** Fotografisanje ili odabir slike ne ulazi u 4 dodira.

---

❓ **Q7 - Kako mjerimo 60 sekundi**: Da li je cilj definisan kao: od okidača kamere do ekrana „Prijava poslata", na srednjem telefonu, na 4G/hotspotu, srećnim putem, mjereno na generalnoj probi u četvrtak (tri pokušaja, sva tri ispod 60 s)?

➡️ Da.

**Tvoj odgovor:** Da, mjerenje vremena pocinje nakon sto je gradjanin poslao fotografiju.

## Answer

- **Q1 — Ulogovanje prije kamere:** da, gost iz „Prijavi problem" ide na `/uloguj-se?next=/prijavi`, pa nazad na početni ekran toka; ulogovanje se ne broji. **[Ivana]** Registracija obavezno traži ime, prezime, mejl i šifru (iz Q4). **[Ivana]** Ime i prezime su dva odvojena obavezna polja. **[Claude]**, jer dopis i panel koriste oba, a jedno polje se ne može pouzdano razdvojiti.
- **Q2 — AI počinje odmah, paralelno sa pinom:** da. Nacrt nastaje kad se otpremi prva fotografija, a analiza odmah kreće; nadležni i duplikat tek poslije potvrde pina i konačne vrste. **[Ivana]**
- **Q3 — Vrsta, tekst i podaci na jednom ekranu:** da, „Pregled prijave" sa jednim dugmetom „Pošalji prijavu". **[Ivana]** Građanin mijenja samo vrstu i polje „Opis problema"; ostatak dopisa je fiksni šablon, samo za čitanje pod „Prikaži cijeli tekst". **[Claude]**, jer slobodna izmjena cijelog dopisa ruši garancije iz FR-10 (npr. briše molbu za pogrešnu nadležnost), a na telefonu je i spora.
- **Q4 — Ime samo ako je potrebno:** ne važi, jer se ime i prezime unose pri registraciji, pa ih na ekranu pregleda nikad ne tražimo; uz uključen prekidač stoji samo red „Instituciji se dostavlja: {ime i prezime}, {mejl}". **[Ivana]**
- **Q5 — Ručni tok je P0:** da. Ako model ne odgovori za 15 s od početka analize ili vrati grešku, građanin bira vrstu i dobija prazno polje za opis, dopis iz istog šablona. **[Ivana]** Opis u ručnom toku nije obavezan (prazan opis se izostavlja iz dopisa), a zakašnjeli odgovor modela se zanemaruje. **[Claude]**, jer ručni tok treba da bude brz, a fotografije su ionako u prilogu.
- **Q6 — Dva dugmeta, pin bez EXIF-a:** da, „Fotografiši" (`capture`) i „Iz galerije"; EXIF se ne čita; pin kreće sa lokacije telefona ili iz centra Podgorice. **[Ivana]** Detalji: lokacija se traži na dodir bilo kojeg od dva dugmeta (`enableHighAccuracy: true`, `maximumAge: 60000`, `timeout: 10000`); pin je fiksiran u centru mape, a građanin pomjera mapu (prevlačenje, ne dodir); poruka za provjeru pina ako je preciznost lošija od 50 m ili je prva fotografija iz galerije. **[Claude]**, prema nalazu 06.
- **Q6b — Šta se broji u 4 dodira:** fotografisanje i izbor fotografija se ne broje, uključujući okidač i sistemsko „Use Photo"/✓. **[Ivana]** Posljedica: srećni put ima **2** obavezna dodira, najduži **4**. Ne broje se ni jednokratne dozvole, pomjeranje mape ni dobrovoljne izmjene (vrsta, opis, prekidač, dodavanje fotografija). **[Claude]**, jer budžet mjeri ono što tok traži od svakoga, a ne ono što građanin sam izabere.
- **Q7 — Kako mjerimo 60 s:** od trenutka kad je građanin poslao fotografiju (fotografija se iz kamere ili galerije vratila u aplikaciju) do ekrana „Prijava poslata"; srednji telefon, 4G/hotspot, srećni put, generalna proba u četvrtak, tri pokušaja ispod 60 s. **[Ivana]** Ručni tok ne mora stati u 60 s. **[Claude]**
- **Više fotografija (brief, tačka 3):** do **3** fotografije po prijavi; bez posebnog ekrana sa fotografijama. Iz galerije se odjednom bira do 3 (višak se odbacuje uz poruku); dodatne fotografije se dodaju na ekranu pregleda („Dodaj fotografiju" → „Fotografiši" / „Iz galerije"), a svaka ima „Ukloni". Modelu idu sve fotografije otpremljene do početka analize, u jednom pozivu; kasnije dodate idu samo u prilog i na javnu stranicu. **[Claude]**, usklađeno sa tekstom koji je tiket 10 upisao u FR-5: dodatni ekran „Dalje" bi bio obavezan dodir u svakoj prijavi i odložio bi analizu, a jedna fotografija je dovoljna za prepoznavanje vrste.

### Konačan tok ekran po ekran

Važi za ulogovanog građanina koji je već dao dozvole. „Dodir" = obavezan dodir koji se broji.

| # | Ekran | Šta građanin vidi | Šta radi sistem | Dodir |
|---|---|---|---|---|
| 0 | Početak `/prijavi` | „Fotografiši" (veliko), „Iz galerije", napomena „Izbjegavajte lica i registarske tablice na fotografiji.", „Odustani" | Na dodir dugmeta pokreće se traženje lokacije | ne broji se |
| 0a | Sistemska kamera / galerija | Okidač + „Use Photo"/✓, ili izbor 1–3 fotografije | — | ne broji se |
| — | **Start mjerenja 60 s** | Fotografija se vratila u aplikaciju | Kompresija (1600 px, bez EXIF-a), kreiranje nacrta, otprema u Storage, **početak analize** (jedan poziv modela) | — |
| 1 | Lokacija | Mapa sa pinom u centru, adresa ispod, sličica fotografije, traka „Prepoznajem problem…" → „Problem prepoznat: {vrsta}" ili „Prepoznavanje nije uspjelo. Vrstu ćete izabrati sami." | Analiza radi u pozadini; reverse geocoding kad se mapa smiri | **1:** „Potvrdi lokaciju" |
| 2 | Koraci agenta | „Određujem nadležnog…", „Provjeravam prijave u blizini…", „Pripremam prijavu…" (lista sa kvačicama) | Opština (van Podgorice: poruka iz FR-4 i povratak na mapu), čekanje analize ako nije gotova, nadležni za konačnu vrstu, duplikat, popunjavanje šablona | — |
| 2a | Izbor vrste (samo ako: nije komunalni problem, pouzdanost < 0.6, greška ili 15 s) | „Nismo sigurni šta je na fotografiji. Izaberite vrstu problema." + lista vrsta, uključujući „Nešto drugo" | Posle izbora: nadležni i duplikat za izabranu vrstu | **+1:** dodir na vrstu |
| 2b | Duplikat (samo ako postoji otvorena prijava iste vrste ≤ 50 m) | „U blizini već postoji prijava ovog problema": fotografija, vrsta, „{n} dana bez rješenja", „{n} podrški" | „Podrži postojeću" = podrška + brisanje nacrta i njegovih fotografija + odlazak na `/p/[code]` | **+1:** „Podrži postojeću" ili „Ipak pošalji novu" |
| 3 | Pregled prijave | Fotografije („Dodaj fotografiju", „Ukloni"), vrsta („Promijeni"), nadležna institucija (ili poruka iz FR-8), adresa, „Opis problema" (može se mijenjati), „Prikaži cijeli tekst", traka „Ako je neko u opasnosti, pozovite 112." ako je model označio opasnost, prekidač „Dostavi moje ime i mejl instituciji" (isključen), napomena da slanjem potvrđuje tačnost podataka | Promjena vrste ponovo određuje nadležnog i duplikat (bez novog poziva modela); duplikat tada samo kao obavještenje | **2:** „Pošalji prijavu" |
| 4 | Slanje | „Šaljem prijavu…" | Kod `FX-2026-xxxxx`, status `sent` (ili `routing`), slanje dopisa kroz `lib/email/send.ts` | — |
| 5 | **Kraj mjerenja:** „Prijava poslata" | Kod, „Pogledaj javnu stranicu", „Podijeli", „Nova prijava"; za `routing` poruka iz FR-8 | — | — |

**Zbir:** srećni put **2**; sa izborom vrste ili duplikatom **3**; sa oba **4**. Ako slanje ne uspije: „Slanje nije uspjelo. Pokušajte ponovo." + „Pokušaj ponovo" (prijava ostaje nacrt).

**Procjena vremena srećnog puta (nije izmjereno):** otprema ~1–2 s; analiza ≤ 8 s (cilj, tiket 20), skrivena iza potvrde pina (~5–10 s); koraci agenta ≤ 3 s; čitanje pregleda ~15–25 s; slanje ~1–2 s. Ukupno ~30–45 s.

**Tekstovi za `lib/constants.ts`** (pored onih u tabeli): „Lokacija nije dostupna. Pomjerite mapu tako da pin bude na mjestu problema." · „Lokacija je približna. Pomjerite mapu ako pin nije na mjestu problema." · „Pomjerite mapu tako da pin bude tamo gdje je fotografija napravljena." · „Možete dodati najviše 3 fotografije." · „Ovaj format fotografije nije podržan. Izaberite drugu fotografiju." · „Danas ste napravili 10 prijava, koliko je dnevno dozvoljeno. Pokušajte ponovo sutra." · „Instituciji se dostavlja: {ime i prezime}, {mejl}".

### Izmjene u dokumentima

- `PRD.md` §2: dodato „Kako mjerimo" (početak, kraj, šta se broji, uslovi mjerenja).
- `PRD.md` §4.1: prve dvije stavke (do 3 fotografije; pin koji se uvijek potvrđuje, start iz GPS-a ili centra Podgorice).
- `PRD.md` §4.2: ručni tok premješten iz P1 u P0, sa rokom od 15 s.
- `PRD.md` FR-1: obavezno ime i prezime pri registraciji; gost ide na `/uloguj-se` i nazad.
- `PRD.md` FR-2: kompresija bez EXIF-a, otprema odmah, nema ekrana sa fotografijama, „Dodaj fotografiju"/„Ukloni" na pregledu, poruka za HEIC.
- `PRD.md` FR-3: dva dugmeta, lokacija na dodir, pin u centru mape, centar Podgorice kao rezerva, poruke za preciznost i galeriju, obavezno „Potvrdi lokaciju".
- `PRD.md` FR-5: tekst „Fotografije" je upisao tiket 10 (zadržan); dodat pod-red „Redoslijed ekrana".
- `PRD.md` FR-7: ekran izbora vrste (jedan dodir) i ručni tok (15 s od početka analize, prazan neobavezan opis).
- `PRD.md` FR-11: prva rečenica, jedan ekran pregleda, mijenjaju se samo vrsta i opis. Rečenicu o imenu je već uklonio drugi tiket.
- `PRD.md` §8: redovi `/uloguj-se` i `/prijavi`.

### Za DB.md (tiket 18)

- `profiles`: `first_name text NOT NULL`, `last_name text NOT NULL` (trim, 1–50 znakova). Upisuje ih trigger na `auth.users` iz `raw_user_meta_data`, koje šalje `signUp({ options: { data } })`; bez njih se nalog građanina ne pravi. Službenici i administratori iz seed-a dobijaju imena u seed-u.
- `reports` u statusu `draft` nastaje prije lokacije i vrste: `location`, `municipality_id`, `category` su `NULL` dok je nacrt; `CHECK (status = 'draft' OR (location IS NOT NULL AND category IS NOT NULL))`. Klijent ne piše u `reports` (pravilo 4): nacrt pravi server ili `SECURITY DEFINER` RPC.
- `report_photos`: `report_id`, `position` (1–3, `UNIQUE (report_id, position)`), `storage_path`, `sent_to_model boolean`, `created_at`. Najviše 3 po prijavi (provjera u RPC-u ili triggeru). RLS: autor vidi fotografije svog nacrta; javnost prema pravilima iz tiketa 11.
- Storage: putanja `{user_id}/{report_id}/{uuid}.jpg`; politika dozvoljava otpremu samo pod sopstvenim `user_id` i samo dok je prijava `draft`.
- Polja rezultata analize na nacrtu: `ai_category`, `ai_confidence`, `description` (građanin ga mijenja), `category_source` (`ai` / `citizen`), `analysis_status` (`pending` / `done` / `failed` / `timed_out`).
- Server koraci / RPC: kreiranje nacrta; početak analize (provjera dnevnog ograničenja iz tiketa 10, Q11); potvrda lokacije (opština ili greška van Podgorice); određivanje nadležnog + najbliži duplikat za konačnu vrstu; „Podrži postojeću" (podrška + brisanje nacrta i fotografija, atomarno); slanje (kod, status `sent`/`routing`, dispatch).

### Za provjeru

1. **Model ne vidi uvijek sve fotografije.** Usklađeno sa tiketom 10: analiza kreće odmah, pa model vidi samo fotografije otpremljene do tada (iz kamere 1, iz galerije do 3 odjednom); kasnije dodate idu samo u prilog. Brief kaže „više slika u jednom pozivu": to važi samo za izbor iz galerije. Alternativa (ekran sa fotografijama i dugmetom „Dalje" prije analize) bi dodala obavezan dodir svakoj prijavi i odložila analizu, protivno tvom Q2.
2. **„Use Photo"/✓ se više ne broji** (tvoj Q6b), pa srećni put ima 2 dodira umjesto 3 iz prijedloga, a najduži 4. Ako želiš da se sistemski ✓ ipak broji, najduži put postaje 5.
3. **Na pregledu se mijenjaju samo vrsta i opis**, ne cijeli tekst dopisa. To sužava FR-11 („pregleda tekst prijave i po potrebi ga mijenja").
4. **„Podrži postojeću" briše nacrt i njegove fotografije**; fotografije se ne dodaju postojećoj prijavi.
5. **Rok od 15 s** (tvoj Q5) je duži od SDK timeout-a od 12 s koji preporučuje nalaz 04. Ostaje 15 s ukupno za građanina, a SDK timeout bira tiket 17.
6. **Demo je samo video** (brief, tačka 2), ali mjerenje 60 s ostaje na probi u četvrtak, kako si odgovorila u Q7. Video može biti i montiran, pa mjerenje važi za proizvod, ne za video.
7. Iskakanje dozvole za lokaciju dok se kamera zatvara (prva prijava) treba pogledati na pravom telefonu (nalaz 06, tačke 1 i 7).

### Novi tiketi / magla

- **Tiket 20:** izmjeriti latenciju i sa 3 slike u jednom pozivu, ne samo sa jednom.
- **Magla:** brisanje napuštenih nacrta i njihovih fotografija (npr. starijih od 24 h). Nije P0; Vercel Hobby cron radi jednom dnevno.
- **Magla:** izmjena imena i prezimena na nalogu. Ne postoji stranica profila; za P0 se ne radi.
- **Za rječnik (09):** „nacrt" (`draft`), „ručni tok" (izbor vrste i opisa bez AI-ja), „obavezni dodir" (dodir koji se broji u budžet).
