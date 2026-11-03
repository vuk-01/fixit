# 02 — Nadležnost po vrsti problema u Glavnom gradu Podgorici (nalazi)

Tiket: [02-nadleznost-podgorica](../issues/02-nadleznost-podgorica.md)
Datum provjere svih izvora: **2026-11-02** (osim ako nije drugačije navedeno).
Metod: čitani su zvanični sajt Glavnog grada (podgorica.me — stranice organa i privrednih društava, gdje je opis poslova preuzet iz akta o organizaciji lokalne uprave), zvanični sajtovi gradskih preduzeća, Programi obavljanja komunalnih djelatnosti „Puteva" d.o.o. (dokumenti Glavnog grada), sajt CEDIS-a i državni portal data.gov.me. Gdje izvor nije pronađen piše **„nije potvrđeno"**.

## Ključni zaključak u jednoj rečenici

U Podgorici je izvršilac posla za većinu vrsta problema **gradsko preduzeće** (Putevi, Komunalne usluge, Vodovod i kanalizacija, Čistoća, Zelenilo), dok **sekretarijat** (Sekretarijat za saobraćaj, Sekretarijat za komunalne poslove) vrši upravni nadzor i izdaje naloge; **Služba komunalne policije** vrši komunalni nadzor nad gotovo svim tim oblastima, a **Služba za građane** je zvanično zadužena da prima zahtjeve o nadležnosti i prosljeđuje ih nadležnima u roku od 48 sati.

## Institucije i kontakti (izvor za svaki kontakt)

| Institucija (zvaničan naziv) | Tip | Javni mejl | Izvor mejla | Telefon (sa istog izvora) |
|---|---|---|---|---|
| Sekretarijat za saobraćaj | organ uprave Glavnog grada | `saobracaj@podgorica.me` | https://podgorica.me/sekretarijat-za-saobracaj/ | 020 235 185 |
| Sekretarijat za komunalne poslove | organ uprave Glavnog grada | `sekretarijat.kps@podgorica.me` | https://podgorica.me/sekretarijat-za-komunalne-poslove/ | +382 20 235 184 |
| Služba komunalne policije | posebna služba Glavnog grada | `pgkompolicija@t-com.me` | https://podgorica.me/sluzba-komunalne-policije/ | +382 67 002 005 |
| Uprava za inspekcijske poslove | organ uprave Glavnog grada | `uip@podgorica.me` | https://podgorica.me/uprava-za-inspekcijske-poslove/ | dežurne službe +382 67 245 799 |
| Služba za građane | stručna služba Glavnog grada | samo lični mejl rukovodioca (`vladislav.dajkovic@podgorica.me`) — **nije institucionalna adresa** | https://podgorica.me/sluzba-za-gradjane/ | +382 20 482 052 |
| „Putevi" d.o.o. Podgorica | gradsko privredno društvo (osnivač Glavni grad) | `putevi@t-com.me` | https://podgorica.me/putevi-d-o-o/ ; i Program 2026, str. 3 | +382 20 279 311 |
| „Komunalne usluge" d.o.o. Podgorica | gradsko privredno društvo | `dispecer@komunalneusluge.me` (označeno: „Prijava kvara rada javne rasvjete i svjetlosne signalizacije"); opšti `kudoo@t-com.me` | https://podgorica.me/komunalne-usluge-d-o-o/ ; https://www.komunalneusluge.me/ | 020/623-927 (prijava kvarova) |
| „Vodovod i kanalizacija" d.o.o. Podgorica | gradsko privredno društvo | `info@vikpg.me` | https://podgorica.me/vodovod-i-kanalizacija-d-o-o/ ; https://www.vikpg.me/o-nama/djelatnost.html | +382 20 440 300 |
| „Čistoća" d.o.o. Podgorica | gradsko privredno društvo | `cistocapg@t-com.me` (i `cistocadoo@t-com.me`) | https://podgorica.me/cistoca-d-o-o/ ; https://www.cistoca.me/kontakt | dispečeri (poslije 16h) 067/20 77 20 |
| „Zelenilo" d.o.o. Podgorica | gradsko privredno društvo | `zelenilo@t-com.me` | https://podgorica.me/zelenilo-d-o-o/ ; https://www.zelenilo.me/ | Zelena linija 020/220-220 |
| „Deponija" d.o.o. Podgorica | gradsko privredno društvo | `info@deponija.me` | https://podgorica.me/deponija-d-o-o/ | +382 20 625 046 |
| Crnogorski elektrodistributivni sistem (CEDIS) d.o.o. | državno/javno preduzeće (operator distributivnog sistema) | `info@cedis.me` (opšti). Za kvarove **nema mejla** — `korisnik@cedis.me` izričito isključuje kvarove | https://cedis.me/kontakt/ | dežurni za Podgoricu, Danilovgrad, Cetinje, Tuzi, Zetu: 020 622 773 (00–24h) |
| Uprava za saobraćaj | državni organ uprave | **nije potvrđeno** (gov.me nije bio dostupan 2026-11-02) | — | nije potvrđeno |

Napomena o mejlovima: mnoge gradske firme koriste `@t-com.me` adrese, a ne domen preduzeća. To su adrese objavljene na zvaničnom sajtu Glavnog grada, ali prije produkcije treba potvrditi da su aktivne i da ih preduzeće želi za prijave. Na cistoca.me jedan link u zaglavlju ima grešku (`citocapg@…`), dok tekst i podgorica.me navode `cistocapg@t-com.me`.

## Tabela: vrsta problema → nadležni (kandidat za seed `jurisdiction_rules`)

Legenda „Snaga izvora": **čvrst** = zvaničan izvor izričito pokriva tu vrstu; **djelimičan** = izvor pokriva oblast, ali ne baš tu vrstu ili postoji podijeljena nadležnost; **nema** = nije potvrđeno.

| Vrsta problema | Institucija (zvaničan naziv) | Tip | Nivo | Izvor URL | Citat | Javni mejl + izvor | Datum provjere | Napomena / snaga izvora |
|---|---|---|---|---|---|---|---|---|
| Rupa / oštećenje kolovoza (opštinski i nekategorisani put) | „Putevi" d.o.o. Podgorica (izvršilac); Sekretarijat za saobraćaj (nalogodavac, upravni nadzor) | gradsko preduzeće; organ uprave | opština | https://putevi.me/wp-content/uploads/2026/01/Program-obavlj.-kom.-djelatnosti-za-2026.-god.-Putevi-doo.pdf (str. 2 i 10); https://podgorica.me/sekretarijat-za-saobracaj/ | „Društvu su povjereni poslovi tekućeg održavanja opštinskih i nekategorisanih putnih pravaca … asfaltiranje puteva, održavanje ulica, bulevara, drumova…"; „…dobijenim nalozima i rješenjima od strane resornog Sekretarijata za saobraćaj" | `putevi@t-com.me` (podgorica.me/putevi-d-o-o); `saobracaj@podgorica.me` (podgorica.me/sekretarijat-za-saobracaj) | 2026-11-02 | **čvrst** za opštinske puteve. Pravni osnov: Odluka Skupštine br. 02-016/20-442 od 15. 5. 2020. (saglasnost na ugovor o povjeravanju). Koordinator: Sekretarijat za saobraćaj. |
| Rupa / oštećenje kolovoza (državni put — magistralni/regionalni) | Uprava za saobraćaj | državni organ uprave | država | https://data.gov.me/en/dataset/geojson-cesta | „upravljanje, razvoj, gradnju, rekonstrukciju, održavanje i zaštitu državnih puteva Crne Gore" | **nije potvrđeno** | 2026-11-02 | **djelimičan**: nadležnost potvrđena, mejl ne. Treba podatak o kategoriji puta (vidi „Zavisi od nepoznatog"). |
| Oštećen trotoar | „Putevi" d.o.o. Podgorica; Sekretarijat za saobraćaj | gradsko preduzeće; organ uprave | opština | Program 2026 (gore), str. 2 | „obnavljanje postojećih i izrada novih trotoarskih površina" | kao za rupu | 2026-11-02 | **čvrst**. Može se spojiti sa „oštećenje puta/trotoara". |
| Oštećen ili oboren saobraćajni znak (opštinski put) | „Putevi" d.o.o. Podgorica; Sekretarijat za saobraćaj | gradsko preduzeće; organ uprave | opština | Program 2026, str. 2 | „postavljanje saobraćajnih znakova i ostale putne opreme (vertikalna signalizacija)" | kao za rupu | 2026-11-02 | **čvrst** za opštinske puteve. Na državnom putu: Uprava za saobraćaj (izvor je samo novinski članak RSE — **nije potvrđeno** primarnim izvorom). |
| Neispravan semafor | „Komunalne usluge" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.komunalneusluge.me/ ; https://podgorica.me/komunalne-usluge-d-o-o/ | „Osnivač je povjerio obavljanje komunalnih djelatnosti … održavanje svjetlosne signalizacije"; „50 Semaforizovanih raskrsnica" | `dispecer@komunalneusluge.me` — „Prijava kvara rada javne rasvjete i svjetlosne signalizacije" (podgorica.me/komunalne-usluge-d-o-o) | 2026-11-02 | **čvrst**. Nije potvrđeno ko održava semafore na državnim putevima kroz grad. |
| Neispravna javna rasvjeta | „Komunalne usluge" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.komunalneusluge.me/ ; https://podgorica.me/komunalne-usluge-d-o-o/ | „Osnovna djelatnost … je održavanje javne rasvjete i svjetlosne signalizacije" | `dispecer@komunalneusluge.me` (isto kao gore) | 2026-11-02 | **najčvršći izvor u cijeloj listi**: postoji namjenski mejl za prijavu kvara objavljen na sajtu Glavnog grada. |
| Otvoren/oštećen šaht — fekalna kanalizacija | „Vodovod i kanalizacija" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.vikpg.me/o-nama/djelatnost.html | „održavanje kanalizacionog sistema i sistema za atmosferske vode" | `info@vikpg.me` (podgorica.me/vodovod-i-kanalizacija-d-o-o) | 2026-11-02 | **čvrst** ako je šaht kanalizacioni. |
| Otvoren/oštećen šaht — atmosferska kanalizacija | „Vodovod i kanalizacija" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.vikpg.me/o-nama/djelatnost.html | „sakupljanje i transport komunalnih i atmosferskih voda sa područja Glavnog grada" | `info@vikpg.me` | 2026-11-02 | **čvrst**. U Podgorici fekalna i atmosferska kanalizacija idu istom preduzeću, pa razlika među njima ne mijenja primaoca. |
| Otvoren/oštećen šaht — ostali vlasnici | TK kablovska kanalizacija: „Komunalne usluge" d.o.o.; elektro: CEDIS; ostali (telekom operateri) — **nije potvrđeno** | razno | opština/država | https://www.komunalneusluge.me/ | „održavanje kablovske kanalizacije" | vidi tabelu institucija | 2026-11-02 | **djelimičan**: vlasnik se ne vidi pouzdano sa fotografije. Vidi „Zavisi od nepoznatog". |
| Curenje vode / pukla cijev | „Vodovod i kanalizacija" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.vikpg.me/o-nama/djelatnost.html | „održavanje vodovodnog sistema na teritoriji Glavnog grada" | `info@vikpg.me`; sajt ima i formu „Prijavite kvar ili grešku na mreži" | 2026-11-02 | **čvrst** za javnu mrežu. Kućne instalacije iza vodomjera nisu u nadležnosti (opšte pravilo, ovdje **nije potvrđeno** izvorom). |
| Divlja deponija | „Čistoća" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.cistoca.me/servisi/usluge/javna-higijena ; https://www.cistoca.me/servisi/online-servisi/prijava-nelegalne-deponije | „Uklanjanje nepropisno odloženog otpada – intervencija na mjestima gdje je otpad odložen van predviđenih mjesta i kontejnera" | `cistocapg@t-com.me` (podgorica.me/cistoca-d-o-o) | 2026-11-02 | **čvrst**. Čistoća ima sopstvenu online formu „Prijava nelegalne deponije". Sekretarijat za komunalne poslove vodi „popis neuređenih odlagališta"; Komunalna policija nadzire „javne čistoće". Napomena: deponija na privatnom zemljištu — **nije potvrđeno** ko postupa. |
| Prepun ili oštećen kontejner | „Čistoća" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.cistoca.me/o-nama | „sakupljanje, transport i odlaganje komunalnog otpada za potrebe korisnika usluga" | `cistocapg@t-com.me` | 2026-11-02 | **čvrst** za „prepun / neodvezen otpad" (i aplikacija Kasper prima baš to). **Djelimičan** za „oštećen kontejner": održavanje posuda je navedeno samo kao usluga „za potrebe trećih lica". |
| Oboreno drvo / neodržavano javno zelenilo | „Zelenilo" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.zelenilo.me/djelatnosti | „Orezivanje drveća, žbunja i žive ograde neophodno je za … stvaranje sigurnih uslova za … učesnike u saobraćaju"; održavanje „u parkovima, na dječijim igralištima, duž saobraćajnica" | `zelenilo@t-com.me` (podgorica.me/zelenilo-d-o-o); Zelena linija 020/220-220 (zelenilo.me) | 2026-11-02 | **čvrst** za javne zelene površine. Izuzetak: površine ispred stambenih zgrada — po Zelenilu nadležne su skupštine etažnih vlasnika. Hitne intervencije (drvo palo na put ili vozilo) — **nije potvrđeno**. |
| Oštećen mobilijar (klupe, dječja igrališta) u parku/na zelenoj površini | „Zelenilo" d.o.o. Podgorica | gradsko preduzeće | opština | https://www.zelenilo.me/djelatnosti | „Održavanje staza i dječijeg i parkovskog mobilijara" | `zelenilo@t-com.me` | 2026-11-02 | **djelimičan**: mobilijar van zelenih površina nije pokriven. Sportski tereni na otvorenom: „Putevi" („održavanje sportskih objekata na otvorenom", Program 2026). Mobilijar u školskim dvorištima, ispred zgrada i sl. — **nije potvrđeno**. |
| Oštećen ili opasan elektro-ormar / stub (distributivna mreža) | Crnogorski elektrodistributivni sistem (CEDIS) | državno/javno preduzeće | država | https://cedis.me/kontakt/ ; https://cedis.me/osnovna-djelatnost/ | „Osnovna djelatnost CEDIS-a je distribucija električne energije"; „…prijaviti kvar na distributivnoj mreži" | **nema mejla za kvarove**; `info@cedis.me` je opšta adresa (cedis.me/kontakt) | 2026-11-02 | **djelimičan**: nadležnost je jasna, ali za kvarove CEDIS daje samo telefon (020 622 773, 00–24h). Stub ili ormar **javne rasvjete** pripada „Komunalnim uslugama"; ormar telekom operatera — **nije potvrđeno**. Sa fotografije se ne razlikuju pouzdano. Nadležnost je ista u cijeloj zemlji (CEDIS), regionalni dežurni brojevi se razlikuju. |
| Grafiti | **nije potvrđeno** | — | — | — | Nije pronađen akt Glavnog grada (npr. Odluka o komunalnom redu) koji uređuje uklanjanje grafita. | — | 2026-11-02 | **nema**. Komunalna policija ima opšti komunalni nadzor nad javnim površinama, ali ne pominje grafite. Grafit na privatnoj fasadi je vjerovatno stvar vlasnika (**nije potvrđeno**). |
| Napušteno vozilo | **nije potvrđeno** za Podgoricu | — | opština (po zakonu) | https://uom.me/wp-content/uploads/2025/11/Analiza_havarisana-vozila-i-namijenjena-za-dalju-prodaju_nov.25.pdf | Zakon o bezbjednosti saobraćaja na putevima, čl. 9 st. 1 t. 10: opštine vrše „uklanjanje dotrajalih i napuštenih vozila, u skladu sa zakonom" | — | 2026-11-02 | **nema** za Podgoricu: Odluka Glavnog grada o komunalnom redu nije pronađena. Kandidati po opisima poslova: Služba komunalne policije (komunalni red, „parkiranja na javnim parkiralištima") i Uprava za inspekcijske poslove (povjereni poslovi „premještanja vozila"). Parking servis upravlja samo parkiralištima i garažama. Analiza Zajednice opština kaže da opštine uglavnom nisu detaljno uredile postupanje. |

## Nadzor i koordinacija (kome ide prijava kad nije jasno)

- **Služba komunalne policije** vrši „komunalni nadzor i održavanje komunalnog reda u oblastima: snabdijevanja vodom; … odvođenja otpadnih i atmosferskih voda; … javne čistoće; … uređivanja i održavanja … parkova, zelenih i drugih javnih površina; održavanja ulica, saobraćajnica i drugih javnih površina i javne rasvjete; izgradnje, održavanja i korišćenja lokalnih puteva, saobraćajnih oznaka i signalizacije…" (https://podgorica.me/sluzba-komunalne-policije/). Pokriva gotovo sve gornje vrste, ali kao **nadzor**, ne kao izvršilac popravke.
- **Uprava za inspekcijske poslove** ima inspekcijski nadzor nad istim oblastima: javna čistoća, javna rasvjeta, opštinski i nekategorisani putevi i ulice, saobraćajne oznake i signalizacija, atmosferske vode (https://podgorica.me/uprava-za-inspekcijske-poslove/).
- **Služba za građane** zvanično prima „zahtjeve građana i drugih subjekata za informacije o nadležnosti … njihovo proslijeđivanje nadležnim organima i službama i dostavljanje povratne informacije podnosiocu zahtjeva u roku od 48 sati" (https://podgorica.me/sluzba-za-gradjane/). Opisom poslova je to prirodan **koordinator / rezervni primalac** za Podgoricu. Problem je što na sajtu stoji samo lični mejl rukovodioca, pa institucionalnu adresu treba potvrditi.
- **Sekretarijat za saobraćaj** vrši „upravni nadzor, poslove ostvarivanja prava osnivača" u „Parking servisu" i „Putevima". **Sekretarijat za komunalne poslove** to radi za ViK, Čistoću, Komunalne usluge, Zelenilo, Deponiju i druge (stranice sekretarijata na podgorica.me).

## Slučajevi gdje nadležnost zavisi od nečega što ne znamo iz fotografije i lokacije

1. **Kategorija puta (opštinski/nekategorisani vs. državni magistralni/regionalni).** Utiče na rupe, trotoare i saobraćajne znakove. Fotografija to ne pokazuje. Lokacija može da pokaže, ali samo ako imamo sloj kategorizacije puteva. Mogući izvor je skup podataka Uprave za saobraćaj na data.gov.me („geojson cesta"); da li sadrži kategorije **nije potvrđeno**. Koordinator: Sekretarijat za saobraćaj (za opštinske), Uprava za saobraćaj (za državne).
2. **Vlasnik šahta.** ViK pokriva i fekalnu i atmosfersku kanalizaciju, pa u Podgorici ta razlika ne mijenja primaoca. Ostaju TK šahtovi („Komunalne usluge" održavaju kablovsku kanalizaciju), elektro šahtovi (CEDIS) i šahtovi telekom operatera. Natpis na poklopcu (npr. „ViK", „PTT") je jedini trag sa fotografije. To je podatak koji model smije pročitati, ali nadležnost i dalje mora doći iz pravila. Koordinator: Komunalna policija (nadzor) ili Služba za građane (prosljeđivanje).
3. **Elektro-ormar ili stub: distributivna mreža, javna rasvjeta ili telekom.** CEDIS, „Komunalne usluge" ili operater. Sa fotografije se ne razlikuje pouzdano.
4. **Javna površina vs. površina ispred zgrade vs. privatno zemljište.** Za zelenilo, mobilijar i deponije. Prema Zelenilu, „Prostori ispred stambenih zgrada su površine posebne namjene, a za uređivanje i održavanje istih nadležne su Skupštine etažnih vlasnika" (https://www.zelenilo.me/).
5. **Mobilijar: park/zelena površina (Zelenilo) vs. sportski teren na otvorenom (Putevi) vs. ostalo.**
6. **Granica Glavnog grada.** Tuzi (od 2018) i Zeta (od 2022) su posebne opštine. „Putevi" ipak održavaju puteve u Zeti po sporazumu sa Opštinom Zeta (Program 2026, str. 2: Sporazum br. 01-018/25-4029/1 od 27. 6. 2025). ViK održava vodovod u Tuzima, a „Komunalne usluge" imaju odjeljenje za javnu rasvjetu na teritoriji Opštine Zeta. Za ove dvije opštine pravila Podgorice **ne treba** automatski primjenjivati; to je posebna provjera, van ovog tiketa.

## Kako postojeća rješenja u Podgorici raspoređuju prijave (provjera)

- **Kasper** (aplikacija na https://podgorica.me/mobilne-aplikacije/): „Građanin može da prijavi lokaciju u gradu na kojoj nije otklonjen otpad"; nosioci su „Čistoća" i „Deponija". Pokriva samo otpad i deponije, što se slaže sa redovima „divlja deponija" i „prepun kontejner" iznad.
- **Čistoća** ima sopstvenu online formu „Prijava nelegalne deponije" (cistoca.me), što potvrđuje rutiranje deponija ka Čistoći.
- **Komunalne usluge** imaju namjenski mejl i telefon za „prijavu kvara rada javne rasvjete i svjetlosne signalizacije", što potvrđuje rutiranje rasvjete i semafora.
- **ViK** ima formu „Prijavite kvar ili grešku na mreži" (vikpg.me), a **Zelenilo** „Zelenu liniju" 020/220-220.
- **„Građanski servis"**: sajt Komunalnih usluga linkuje portal `https://gradjanski.podgorica.me/` uz tekst „Problem koji se tiče našeg preduzeća možete prijaviti elektronskim putem preko ovog portala". Na dan provjere (2026-11-02) domen se **nije razrješavao** (DNS greška). Wayback Machine ima snimak od 2026-06-08, ali sadržaj nije bilo moguće pročitati. Kategorije i rutiranje ovog portala su **nepotvrđeni**. Vrijedi ga ponovo provjeriti: ako radi, to je najbolja provjera ove tabele.
- Gradski portal za prijavu svih vrsta problema (kao što je npr. Gradsko oko) **nije pronađen** na podgorica.me. Na listi mobilnih aplikacija je samo Kasper (otpad) i „Moje drvo" (zelenilo, bez opisa prijava).

## Preporuka (preporuka, ne odluka — odluke donose tiketi 13 i 14)

**Kategorije sa čvrstim izvorom (spremne za seed, uz ponovnu provjeru mejla):**
- Neispravna javna rasvjeta → „Komunalne usluge" (`dispecer@komunalneusluge.me`)
- Neispravan semafor → „Komunalne usluge" (isti mejl). Može se spojiti sa rasvjetom u „rasvjeta i semafori" jer je primalac isti.
- Curenje vode / pukla cijev → ViK
- Šaht (kanalizacioni i atmosferski) → ViK. Razdvajanje fekalno/atmosfersko **nije potrebno** u Podgorici.
- Divlja deponija → Čistoća
- Prepun kontejner / neodvezen otpad → Čistoća
- Oštećenje kolovoza (rupa) i oštećen trotoar → „Putevi" + Sekretarijat za saobraćaj. Mogu se spojiti u jednu vrstu „oštećen put ili trotoar".
- Oštećen/oboren saobraćajni znak → „Putevi" + Sekretarijat za saobraćaj
- Oboreno drvo / neodržavano javno zelenilo → Zelenilo

**Otvoreno pitanje za tiket 14:** da li prijava za puteve ide izvršiocu („Putevi", koji radi po nalogu) ili nalogodavcu (Sekretarijat za saobraćaj). Izvori kažu da „Putevi" radi „po dobijenim nalozima i rješenjima" Sekretarijata, pa je Sekretarijat formalno prirodniji primalac, uz kopiju „Putevima".

**Spojiti ili suziti:**
- Oštećen mobilijar → suziti na „mobilijar u parku / na igralištu" (Zelenilo) ili spojiti sa „javno zelenilo".
- Šaht ostalih vlasnika i elektro-ormar/stub → ne uvoditi kao posebnu vrstu u MVP-u. Ako ostanu, rutirati na administratora ili koordinatora (FR-8 fallback), jer se vlasnik ne vidi sa fotografije. CEDIS za kvarove ionako daje samo telefon.

**Izbaciti iz MVP-a (nema izvora za Podgoricu):**
- Grafiti
- Napušteno vozilo

**Rezervni primalac / koordinator za Podgoricu:** Služba za građane (zvanično prosljeđuje u roku od 48h). Potrebna je institucionalna mejl adresa jer je objavljena samo lična. Alternativa sa institucionalnom adresom je Služba komunalne policije (`pgkompolicija@t-com.me`), ali ona je nadzorni organ, ne služba za prosljeđivanje.

**Prije seeda:** ponovo provjeriti sve mejlove (posebno `@t-com.me` adrese), naći mejl Uprave za saobraćaj i provjeriti da li `gradjanski.podgorica.me` ponovo radi.

## Izvori (svi provjereni 2026-11-02)

- Glavni grad — Sekretarijat za saobraćaj: https://podgorica.me/sekretarijat-za-saobracaj/
- Glavni grad — Sekretarijat za komunalne poslove: https://podgorica.me/sekretarijat-za-komunalne-poslove/
- Glavni grad — Služba komunalne policije: https://podgorica.me/sluzba-komunalne-policije/
- Glavni grad — Uprava za inspekcijske poslove: https://podgorica.me/uprava-za-inspekcijske-poslove/
- Glavni grad — Služba za građane: https://podgorica.me/sluzba-za-gradjane/
- Glavni grad — stranice privrednih društava: https://podgorica.me/putevi-d-o-o/ , https://podgorica.me/komunalne-usluge-d-o-o/ , https://podgorica.me/vodovod-i-kanalizacija-d-o-o/ , https://podgorica.me/cistoca-d-o-o/ , https://podgorica.me/zelenilo-d-o-o/ , https://podgorica.me/deponija-d-o-o/ , https://podgorica.me/parking-servis-podgorica-d-o-o/
- Glavni grad — Mobilne aplikacije (Kasper): https://podgorica.me/mobilne-aplikacije/
- „Putevi" — Program obavljanja komunalnih djelatnosti za 2026. (Glavni grad, br. 14820, 8. 12. 2025): https://putevi.me/wp-content/uploads/2026/01/Program-obavlj.-kom.-djelatnosti-za-2026.-god.-Putevi-doo.pdf
- „Putevi" — Program za 2024. (isti sadržaj povjerenih poslova): https://putevi.me/wp-content/uploads/2024/05/Program-obavljanja-komunalnih-djelatnosti-za-2024.-godinu-Putevi-d.o.o.-Podgorica-.pdf
- „Komunalne usluge": https://www.komunalneusluge.me/ , https://komunalneusluge.podgorica.me/
- ViK: https://www.vikpg.me/o-nama/djelatnost.html
- Čistoća: https://www.cistoca.me/o-nama , https://www.cistoca.me/kontakt , https://www.cistoca.me/servisi/usluge/javna-higijena , https://www.cistoca.me/servisi/online-servisi/prijava-nelegalne-deponije
- Zelenilo: https://www.zelenilo.me/ , https://www.zelenilo.me/djelatnosti
- CEDIS: https://cedis.me/kontakt/ , https://cedis.me/osnovna-djelatnost/
- Uprava za saobraćaj (data.gov.me): https://data.gov.me/en/dataset/geojson-cesta
- Zajednica opština CG — Analiza o havarisanim/napuštenim vozilima (nov. 2025): https://uom.me/wp-content/uploads/2025/11/Analiza_havarisana-vozila-i-namijenjena-za-dalju-prodaju_nov.25.pdf
- Nedostupno na dan provjere: https://gradjanski.podgorica.me/ (DNS), https://www.gov.me/uprava-za-saobracaj (konekcija odbijena)
