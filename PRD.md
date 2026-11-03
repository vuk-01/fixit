# PRD — Fixit

> Radni naziv: **Fixit** 
> Verzija dokumenta: 0.2 · Datum: 3. novembar 2026. · Rok izrade: subota, 7. novembar 2026.
> Povezani dokumenti: `Tech.md`, `DB.md`, `AGENTS.md`, `UI.md`, `GLOSSARY.md` (rječnik pojmova i naziva u UI-ju).

---

## 1. Pregled projekta

Rupe na putevima, otvoreni šahtovi, grafiti, divlje deponije i neispravna rasvjeta u Crnoj Gori često nedjeljama ostaju neriješeni. Glavni razlog nije nedostatak volje da se problem prijavi, već to što građanin ne zna **ko je nadležan**. Problem zato završi kao objava na društvenim mrežama (npr. Instagram stranica „Podgorički vremeplov") umjesto kao zvanična prijava nadležnoj instituciji.

**Fixit** je mobilna web aplikacija (PWA) u kojoj građanin samo fotografiše problem, a AI agent:

1. sa fotografije prepoznaje vrstu problema,
2. iz lokacije (GPS telefona uz dozvolu korisnika ili mjesto koje sam označi na mapi) određuje opštinu, a iz **provjerene tabele pravila** određuje nadležnu instituciju (AI ne pogađa nadležnost),
3. sastavlja formalni dopis nadležnoj instituciji i, nakon što građanin potvrdi prijavu, šalje ga mejlom.

Sve prijave su na javnoj mapi sa brojačem dana otkad je prijava poslata. Drugi građani mogu podržati postojeću prijavu umjesto da prave novu, pa se pritisak na nadležne sabira na jednom mjestu. Institucije dobijaju panel za upravljanje prijavama.

**Pozicioniranje:** „AI agent na strani građanina", a ne još jedna gradska aplikacija za prijavu. Postojeća rješenja (Kasper u Podgorici, Gradsko oko u Hrvatskoj, eCitizen u BiH) vode gradovi i pokrivaju samo svoju nadležnost. Naše rješenje je zamišljeno da radi u svim opštinama i za sve institucije: opštine, komunalna preduzeća, upravljače puteva i vlasnike infrastrukture.

**Opseg prve verzije:** prva verzija (hakaton) radi **samo na teritoriji Glavnog grada Podgorice** (bez opština Tuzi i Zeta). Granica i pravila nadležnosti postoje samo za Podgoricu; ostale opštine dolaze kasnije.

**Model naplate:** građani koriste besplatno, uvijek. Institucije plaćaju godišnju licencu za panel (mapa prijava, raspoređivanje službama, statusi, analitika) i jednokratnu naknadu za uvođenje. Prvi novac realno dolazi iz grantova (Fond za inovacije, EU programi). Put: besplatna aplikacija → pilot sa jednom opštinom 6 mjeseci → licenca → ostale opštine → region.

## 2. Glavni cilj

**Proizvodni cilj:** građanin od fotografije do poslate formalne prijave nadležnoj instituciji stiže za manje od 60 sekundi i najviše 4 dodira nakon fotografisanja, bez potrebe da zna ko je nadležan.

Kako mjerimo (tok ekran po ekran je u FR-1 do FR-11 i u §8, `/prijavi`):
- **Početak:** trenutak kad je građanin poslao fotografiju, tj. kad se fotografija iz kamere (sistemsko „Use Photo"/✓) ili iz galerije vrati u aplikaciju. Fotografisanje i izbor fotografija (dugme „Fotografiši" / „Iz galerije", okidač, „Use Photo"/✓, izbor u galeriji, kasnije „Dodaj fotografiju") se ne broje ni u vrijeme ni u dodire.
- **Kraj:** ekran „Prijava poslata".
- **Dodiri:** broje se obavezni dodiri od početka do „Pošalji prijavu", uključujući dodire u sistemskim prozorima. Ne broje se: ulogovanje i registracija (dešavaju se prije kamere), jednokratne dozvole za kameru i lokaciju (prva prijava), pomjeranje mape ispod pina (prevlačenje) i dobrovoljne izmjene (promjena vrste, izmjena opisa, prekidač za dostavljanje podataka). Srećni put ima 2 dodira („Potvrdi lokaciju", „Pošalji prijavu"); izbor vrste (AI nije siguran) i pronađen duplikat dodaju po 1, pa i najduži put ima 4.
- **Uslovi:** srednji telefon, 4G ili hotspot, srećni put, već date dozvole; mjeri se na generalnoj probi u četvrtak, tri pokušaja, sva tri ispod 60 s. Ručni tok (AI nije odgovorio) ne mora stati u 60 s.


## 3. Korisničke uloge

| Uloga | Ko je | Šta može |
|---|---|---|
| **Gost** | Neulogovan posjetilac | Pregled javne mape, javne stranice prijave i javne statistike. |
| **Anonimni korisnik** | Korisnik koji je dodirnuo „Podržavam" bez naloga (Supabase anonimna sesija) | Podrška postojećoj prijavi (jednom po prijavi). Ne može pravljenje novih prijava. |
| **Građanin** | Korisnik ulogovan mejlom i šifrom | Pravljenje prijava, pregled i izmjena prijave prije slanja, podrške, „Moje prijave", obavještenja o promjeni statusa. |
| **Službenik institucije** | Zaposleni u instituciji kojoj je administrator platforme dodijelio nalog | Panel: prijave svoje institucije, promjena statusa, komentar građaninu, označavanje „nije naša nadležnost", analitika svoje institucije. |
| **Administrator platforme** | Naš tim | Upravljanje institucijama i tabelom pravila nadležnosti, nalozima službenika, ručno raspoređivanje i preusmjeravanje prijava, moderacija (sakrivanje prijava i pojedinačnih fotografija, npr. sa licima ili tablicama; vidi §6 Privatnost). |

## 4. Funkcije u scope-u

Prioriteti: **P0** = mora raditi na demou; **P1** = radimo ako P0 bude gotov do četvrtka; **P2** = samo ako ostane vremena.

### 4.1 Aplikacija za građane
- **P0** Fotografisanje problema kamerom telefona (PWA, `input capture="environment"`), uz mogućnost izbora postojeće fotografije; do 3 fotografije po prijavi.
- **P0** Lokacija: pin na mapi koji građanin uvijek potvrđuje; početni položaj je GPS uređaja, a kad GPS nije dostupan, centar Podgorice.
- **P0** Prikaz koraka agenta uživo („Prepoznajem problem…", „Određujem nadležnog…", „Pripremam prijavu…").
- **P0** Pregled prepoznate vrste problema sa mogućnošću ručne korekcije.
- **P0** Pregled, izmjena i potvrda prijave prije slanja.
- **P0** Javna mapa svih prijava sa bojom po statusu i brojačem dana od kako je prijava poslata.
- **P0** Javna stranica prijave sa fotografijama i opisom, statusom, nadležnom institucijom, brojačem dana i dugmetom „Podržavam".
- **P0** Podrška postojećoj prijavi, brojač podrški se osvježava uživo.
- **P0** Prijedlog postojeće prijave iste vrste u blizini (do 50 m) prije slanja nove.
- **P0** Odjava: „Odjavi se" u meniju zaglavlja za svaki ulogovan nalog (građanin, službenik, administrator), jer tim i video koriste više naloga na istim uređajima (tiket 22 Q7).
- **P1** „Moje prijave" sa statusima i vremenskom linijom.
- **P1** Obavještenja u aplikaciji i mejlom kad institucija promijeni status.
- **P2** Instalacija PWA na početni ekran (manifest, ikone).

### 4.2 AI agent
- **P0** Prepoznavanje vrste problema sa fotografije (Claude vision, strukturisan JSON).
- **P0** Određivanje opštine iz lokacije (PostGIS) i nadležne institucije iz tabele pravila (deterministički, bez AI-ja).
- **P0** Generisanje dopisa iz šablona (AI daje samo opis problema) i, nakon što građanin pošalje prijavu, slanje dopisa mejlom (Resend).
- **P0** Testni režim: svi mejlovi idu isključivo na testni inbox.
- **P0** Adresa lokacije (reverse geocoding) u prijavi.
- **P0** Ručni tok kad AI nije dostupan (nema odgovora za 15 s ili greška): ručni izbor vrste i ručni unos opisa, dopis iz istog šablona (FR-7).

### 4.3 Panel za institucije
- **P0** Ulogovanje službenika (mejl + lozinka), lista prijava svoje institucije.
- **P0** Promjena statusa prijave uz opcionu poruku građaninu.
- **P1** Mapa prijava institucije, filteri, sortiranje po broju podrški i danima.
- **P1** Označavanje „Nije naša nadležnost" uz obrazloženje (prijava ide administratoru na preusmjeravanje).
- **P1** Analitika: broj prijava po statusu i vrsti, prosječno vrijeme do rješenja.
- **P2** Raspoređivanje prijava službama unutar institucije.

### 4.4 Administracija i demo
- **P0** Seed podaci (sve samo za Glavni grad Podgoricu): granica Podgorice, institucije, pravila nadležnosti, ~10 demo prijava u Podgorici, demo nalozi. Dio demo prijava ima unazad postavljene datume i istoriju statusa (npr. „14 dana bez rješenja", „Riješeno za 6 dana"), da bi video mogao pokazati kako se prijava razvija. Demo nalozi i demo prijave postoje unaprijed: nalozi od prvog dana (tim se njima uloguje, a služe i za video), prijave čim je seed za njih gotov. Prikazuju se iste prijave na probi, u videu i na ocjenjivanju, bez brisanja i ponovnog seed-a (tiket 22 Q1, Q4; `DB.md` §12). Registracija novog naloga radi (FR-1), ali se u videu ne prikazuje.
- **P0** Video od 1 minuta za prezentaciju (vidi §9): prikazuje samo perspektivu građanina, i to kako se pravi jedna prijava i šta se s njom dalje dešava. Detaljan plan snimanja Ivana daje posebno; tiketi za izradu prave aplikaciju koja radi, ne video (tiket 22 Q4).
- **P0** Minimalna administratorska stranica `/admin`: lista prijava u `routing`, izbor institucije (samo one sa provjerenim mejlom) i dugme „Pošalji dopis" (isti šablon i isto slanje kao FR-11; status prelazi u `sent`).
- **P1** Moderacija na `/admin`: pregled označenih fotografija i sakrivanje fotografije ili prijave (tiket 19 Q2). Do tada, u hitnom slučaju, Ivana sakriva prijavu ili fotografiju u Supabase Table Editoru (`hidden_at`).
- **P1** Admin stranica za institucije i pravila nadležnosti (CRUD).
- **P1** Javna statistika po instituciji (prosječno vrijeme reakcije), ključni argument za EU priču.

## 5. Funkcionalni zahtjevi

### 5.1 Prijava problema
- **FR-1** Građanin mora biti ulogovan mejlom i šifrom da bi napravio prijavu. Pri registraciji na `/uloguj-se` obavezno unosi **ime, prezime**, mejl i šifru; bez imena i prezimena nalog građanina ne može nastati. Gost koji dodirne „Prijavi problem" prvo ide na `/uloguj-se`, a nakon ulogovanja (ili registracije) vraća se na `/prijavi`, prije kamere. Zato se ulogovanje ne računa u cilj iz §2. Anonimni korisnici ne mogu praviti prijave.
- **FR-2** Svaka fotografija se na klijentu prvo kompresuje (najduža stranica do 1600 px, JPEG, bez EXIF metapodataka) i otprema direktno u Storage čim je izabrana, u pozadini. Nema posebnog ekrana sa fotografijama: poslije kamere ili galerije građanin odmah dolazi na ekran lokacije. Broj fotografija i šta od njih vidi model je u FR-5 („Fotografije"); dodatne fotografije se dodaju na ekranu pregleda (FR-11), dugmetom „Dodaj fotografiju" koje nudi „Fotografiši" i „Iz galerije", a svaka sličica ima „Ukloni" (najmanje jedna mora ostati). Fotografiju koju browser ne može otvoriti (npr. HEIC na Androidu) odbijamo porukom „Ovaj format fotografije nije podržan. Izaberite drugu fotografiju."
- **FR-3** Na početnom ekranu `/prijavi` su dva dugmeta: „Fotografiši" (`capture="environment"`) i „Iz galerije" (bez `capture`); izvor fotografije određuje dugme, ne heuristika, a EXIF GPS se ne čita. Dodir na bilo koje od njih odmah pokreće i traženje lokacije uređaja (`enableHighAccuracy: true`, `maximumAge: 60000`, `timeout: 10000`), paralelno sa kamerom ili galerijom. Na ekranu lokacije pin stoji u centru mape, a građanin pomjera mapu ispod njega. Početni položaj je lokacija uređaja ako je stigla, a inače centar Podgorice uz poruku „Lokacija nije dostupna. Pomjerite mapu tako da pin bude na mjestu problema." Ako je preciznost lošija od 50 m, ili ako je prva fotografija iz galerije, prikazuje se poruka da građanin provjeri i pomjeri pin. Ispod mape je adresa (reverse geocoding). Građanin uvijek mora potvrditi pin dodirom „Potvrdi lokaciju".
- **FR-4** Lokacija van granice Glavnog grada Podgorice (uključujući Tuzi i Zetu) se odbija uz jasnu poruku, npr. „Fixit za sada radi samo na teritoriji Glavnog grada Podgorice. Izaberite lokaciju u Podgorici."
- **FR-5** Prijava u statusu `draft` (nacrt) nastaje kad se otpremi prva fotografija, jer prepoznavanje vrste počinje odmah, paralelno sa potvrdom lokacije. Nacrt vidi samo njegov prijavilac: nije javan, nema kod i ne ulazi ni u jedan brojač. Nakon potvrde lokacije sistem određuje opštinu iz lokacije (FR-4). Građanin nacrt može napustiti; tada se briše zajedno sa fotografijama. Nakon slanja građanin prijavu više ne mijenja.
  - **Fotografije:** prijava ima od 1 do 3 fotografije. Modelu idu sve fotografije otpremljene do početka analize, u jednom pozivu (jedna prijava = jedan poziv modela). Fotografije dodate kasnije (dugme „Dodaj fotografiju", do „Pošalji prijavu") idu u prilog dopisa i na javnu stranicu, ali ne pokreću novi poziv modela. Iz galerije se odjednom može izabrati do 3 fotografije; višak se odbacuje uz poruku „Možete dodati najviše 3 fotografije.". Dodavanje fotografija je opciono i ne ulazi u budžet od 4 dodira.
  - **Redoslijed ekrana:** (1) „Fotografiši" / „Iz galerije" → kamera ili galerija; (2) ekran lokacije sa trakom „Prepoznajem problem…" (analiza već radi) → „Potvrdi lokaciju"; (3) koraci agenta bez dodira: sistem određuje opštinu (FR-4), čeka rezultat analize ako još nije stigao, i prikazuje „Određujem nadležnog…", „Provjeravam prijave u blizini…", „Pripremam prijavu…"; (4) samo ako je potrebno, izbor vrste (FR-7); zatim se za konačnu vrstu određuje nadležni (FR-8) i traži duplikat (FR-9), pa (5) samo ako postoji duplikat, ekran duplikata; (6) ekran pregleda (FR-11) → „Pošalji prijavu"; (7) „Prijava poslata" sa kodom, linkom javne stranice, „Podijeli" i „Nova prijava". Ako građanin na ekranu pregleda promijeni vrstu, nadležni i duplikat se ponovo određuju bez novog poziva modela; pronađen duplikat se tada prikazuje kao obavještenje na istom ekranu, bez dodatnog obaveznog dodira. „Odustani" je dostupno na svakom koraku i briše nacrt.

### 5.2 Agent
- **FR-6** Agent šalje modelu fotografije prijave (1–3, sve u jednom pozivu; FR-5) i dobija strukturisan rezultat: da li je komunalni problem, vrsta, pouzdanost, naslov, opis, ozbiljnost, neposredna opasnost, na kojim fotografijama su vidljivi lični podaci (lica ili tablice; oznaka je po fotografiji, §6 Privatnost) i da li tekst na fotografiji pokušava da da uputstvo (to je podatak, nikad instrukcija). Vrsta je jedan od slugova iz „Vrste problema (P0)" ispod. Ozbiljnost (`low` = estetski problem, ne ometa korišćenje; `medium` = ometa korišćenje ili će se pogoršati; `high` = ozbiljno ometa korišćenje ili može izazvati štetu) prikazuje se samo u panelu institucije; ne ide u dopis i ne prikazuje se javno. Neposredna opasnost (rizik po život ili zdravlje ljudi upravo sada, npr. otvoren šaht na prolazu, drvo ili znak pao na kolovoz, ugašen semafor na raskrsnici) građaninu na ekranu pregleda prikazuje traku „Ako je neko u opasnosti, pozovite 112." (bez dodira, ne blokira slanje), a u dopis dodaje red iz FR-11. U ručnom toku ozbiljnost ostaje prazna, a neposredna opasnost je `false`.
- **FR-7** Ako fotografija nije komunalni problem ili je pouzdanost ispod 0.6, korisnik bira vrstu ručno: poseban ekran „Nismo sigurni šta je na fotografiji. Izaberite vrstu problema." sa listom svih vrsta (uključujući „Drugi problem"), gdje jedan dodir na vrstu bira vrstu i vodi dalje. Opis koji je dao model ostaje. **Ručni tok (P0):** ako model ne odgovori u roku od 15 s od početka analize, ili vrati grešku, traka na ekranu lokacije glasi „Prepoznavanje nije uspjelo. Vrstu ćete izabrati sami.", građanin nakon potvrde lokacije bira vrstu na ekranu za izbor vrste, a na ekranu pregleda dobija prazno polje „Opis problema" (nije obavezno; ako ostane prazno, red opisa se izostavlja iz dopisa). Dopis se pravi iz istog šablona (FR-10). Zakašnjeli odgovor modela se zanemaruje. Prag 0.6 je fiksan (jedna konstanta u `lib/constants.ts`) i ne podešava se ručno, ni na generalnoj probi.
- **FR-8** Nadležna institucija se određuje isključivo iz tabele `jurisdiction_rules`, deterministički, za par (konačna vrsta, opština): postoji najviše jedno pravilo za taj par i nema rezervnog pravila (ni nacionalnog, ni „sve ostalo ide instituciji X"). Pravilo daje primaoca i, opciono, instituciju u kopiji (vidi „Pravila nadležnosti" ispod). Ako pravilo ne postoji, ili primalac nema provjerenu mejl adresu, prijava prelazi u `routing` i ide administratoru, a građanin dobija poruku: „Za ovu vrstu problema još nemamo provjerenog nadležnog. Administrator Fixita će ručno odrediti nadležnu instituciju i proslijediti prijavu." Ekran uspjeha i tada ima naslov „Prijava poslata", jer je građanin prijavu podnio, a ova poruka stoji ispod naslova (tiket 19 Q8). Prijava u `routing` je podnesena u smislu životnog ciklusa: dobija kod (FR-24), javna je na mapi i može se podržati, a brojač dana teče od podnošenja (FR-15). Kad administrator ručno rasporedi prijavu (izabere instituciju) i dopis bude uspješno poslat, prijava prelazi u `sent` (FR-23).
- **FR-9** Kad su poznati vrsta i potvrđena lokacija, a prije ekrana pregleda, sistem traži otvorene prijave (FR-18) iste vrste u krugu od 50 m od pina, bez sakrivenih. Ako ih ima, prikazuje najbližu (fotografija, status, brojač dana, broj podrški) uz dva dugmeta: „Podrži postojeću" i „Ipak pošalji novu". „Podrži postojeću" dodaje podršku postojećoj prijavi (FR-16), briše nacrt sa fotografijama i vodi na javnu stranicu postojeće prijave. Ako je najbliža prijava građaninova, umjesto „Podrži postojeću" piše „Ovaj problem ste već prijavili." uz link na tu prijavu. Ako građanin na ekranu pregleda promijeni vrstu, provjera se ponavlja za novu vrstu.
- **FR-10** Dopis (građaninu u UI-ju prikazan kao „tekst prijave", vidi `GLOSSARY.md`) se pravi iz fiksnog šablona na crnogorskom jeziku, latinicom, ijekavski, formalnim stilom. AI daje samo opis onoga što se vidi na fotografijama, a sistem popunjava sva ostala polja. Dopis ne smije sadržati izmišljene propise, rokove ni činjenice koje nisu u podacima.
- **FR-11** Prije slanja građanin na **jednom ekranu** („Pregled prijave") vidi fotografije (uz „Dodaj fotografiju" i „Ukloni", FR-2), vrstu (uz „Promijeni"), nadležnu instituciju (ili poruku iz FR-8), adresu i opis. Mijenja samo vrstu i polje „Opis problema"; ispod polja stoji napomena da je opis javan (§6 Privatnost). Ostatak dopisa je fiksni šablon (FR-10) i vidi se samo za čitanje pod „Prikaži cijeli tekst". Pregled prikazuje dopis prije nego što prijava dobije broj (FR-24), pa na mjestu broja prijave (u naslovu i nazivima priloga), datuma i vremena prijave i broja ranijih prijava piše „dodjeljuje se pri slanju"; pravi podaci se upisuju tek u dopis koji se šalje (tiket 22 Q5). Na istom ekranu je prekidač „Dostavi moje ime i mejl instituciji“, koji je **podrazumijevano isključen** pri svakoj prijavi (saglasnost je aktivna radnja i ne pamti se sa prethodne prijave). Ime i prezime se unose pri registraciji, pa se ovdje ne traže. Kad građanin klikne „Pošalji prijavu“, potvrđuje da su podaci tačni i da prijava može biti poslata nadležnoj instituciji. Sistem zatim šalje dopis mejlom primaocu (i kopiji, ako je pravilo ima, FR-8) sa adrese `Fixit <onboarding@resend.dev>` (bez sopstvenog domena Resend šalje samo sa nje i samo na mejl vlasnika naloga, a to je `TEST_INBOX`), uz `reply-to` na kontakt adresu tima, što je u hakatonu Ivanin lični mejl, isti kao `TEST_INBOX` (Tech.md, „Hosting i mejl"). Mejl sadrži:
  - **naslov:** `Prijava komunalnog problema br. {broj prijave} – {vrsta problema}, {lokacija}`;
  - **uvod:** obraćanje „Poštovani“ i informaciju da je prijava zaprimljena putem platforme Fixit i da je, prema vrsti problema i lokaciji, primalac nadležna institucija;
  - **podatke o prijavi:** vrsta problema, opis, lokacija sa koordinatama i linkom ka mapi, datum i vrijeme prijave; samo ako ih ima, red „Ranije prijave iste vrste na ovoj lokaciji (do 50 m): {n}" (sve ranije poslate prijave, uključujući riješene i odbijene, bez sakrivenih) i, samo ako ih ima, red „Broj građana koji su podržali prijavu: {n}" (podrške postoje tek kod dopisa poslatog iz `routing` ili nakon preusmjeravanja); ako je model označio neposrednu opasnost (FR-6), i red „Na fotografiji je uočena moguća neposredna opasnost.";
  - **prilog:** sve fotografije prijave (1–3, FR-5), JPEG, nazvane `{broj prijave}-1.jpg`, `{broj prijave}-2.jpg`…;
  - **zahtjev za postupanje:** molba da institucija razmotri prijavu i preduzme mjere iz svoje nadležnosti;
  - **pogrešna nadležnost:** molba da institucija obavijesti Fixit ako prijava nije u njenoj nadležnosti, kako bi bila proslijeđena odgovarajućoj instituciji;
  - **podaci o prijaviocu:** samo ako je građanin izabrao dostavljanje podataka, tekst „Prijavu je podnio korisnik platforme Fixit, koji je dao saglasnost da se njegovi podaci dostave instituciji: {ime i prezime}, {mejl adresa}.“;
  - **potpis:** „S poštovanjem, Tim Fixit“, uz kontakt mejl (ista adresa kao `reply-to`) i sajt (produkcioni URL `https://{projekat}.vercel.app`, `NEXT_PUBLIC_SITE_URL`).

  Ako građanin izabere dostavljanje podataka, njegovo ime, prezime i mejl adresa automatski se uključuju u mejl, bez posebnog zahtjeva institucije. Ako to ne izabere, mejl ne sadrži njegove lične podatke. Nakon uspješnog slanja dopisa prijava prelazi u status `sent` (bez pravila nadležnosti u `routing`, bez mejla, FR-8). Građanin prijavu podnosi samo jednom; jedan dopis ide jednom primaocu i uspješno se šalje najviše jednom, a novi primalac (ručno raspoređivanje ili preusmjeravanje, FR-23) dobija novi dopis za istu prijavu. Ako slanje dopisa ne uspije, prijava ostaje nacrt (zadržava kod, FR-24) i građanin može pokušati ponovo.

- **FR-12** Kad je `EMAIL_MODE=test`, svi mejlovi institucijama idu isključivo na `TEST_INBOX`, bez obzira na adresu primaoca i kopije (`cc`). Ovo je podrazumijevani režim; sve osim tačno `live` znači test (Tech.md, „Hosting i mejl").
- **FR-13** Svaki korak agenta se bilježi (`agent_runs`): korak, model, trajanje, ishod, greška.

#### Vrste problema (P0)

Vrsta problema (u kodu `category`) određuje prompt, provjeru duplikata (FR-9) i pravilo nadležnosti (FR-8). Izvor istine za slug, naziv i opis je `lib/constants.ts`; baza ima istu listu (vidi `DB.md`). Lista je zasnovana na nalazu o nadležnosti u Podgorici (tiket 13, istraživanje 02).

| slug | Naziv u UI-ju | Šta obuhvata (opis za prompt) | Pravilo u Podgorici |
|---|---|---|---|
| `pothole` | Oštećen kolovoz / rupa na putu | rupa, udarna rupa ili oštećen asfalt na kolovozu | da |
| `sidewalk` | Oštećen trotoar | razlomljeno, uleglo ili oštećeno popločanje trotoara ili pješačke staze | da |
| `traffic_sign` | Oštećen ili oboren saobraćajni znak | oštećen, oboren, savijen ili nečitljiv saobraćajni znak | da |
| `street_light` | Neispravna javna rasvjeta | ugašena, oštećena ili oborena ulična svjetiljka javne rasvjete | da |
| `traffic_light` | Neispravan semafor | ugašen, neispravan ili oštećen semafor | da |
| `manhole` | Otvoren ili oštećen šaht | otvoren, polomljen ili ulegao poklopac šahta ili slivnika, ili poklopac nedostaje | da |
| `water_leak` | Curenje vode / pukla cijev | voda koja curi ili izbija iz zemlje, kolovoza ili cijevi; pukla cijev | da |
| `illegal_dump` | Divlja deponija / odbačen otpad | otpad, šut ili kabasti otpad odbačen van kontejnera na javnoj ili neizgrađenoj površini | da |
| `waste_container` | Prepun kontejner / otpad oko kontejnera | prepun kontejner ili otpad nagomilan oko kontejnera | da |
| `greenery` | Oboreno drvo / neodržavano zelenilo | oboreno ili polomljeno drvo, opasne grane, zarasla ili neodržavana javna zelena površina | da |
| `graffiti` | Grafiti | grafiti ili ispisane poruke na zidovima i objektima | ne |
| `other` | Drugi problem | komunalni problem koji ne odgovara nijednoj vrsti iznad | ne (namjerno) |

- Vrsta bez pravila (`graffiti`, `other`) ide u `routing`: prijava ide administratoru, a građanin dobija poruku da će prijava biti proslijeđena ručno (FR-8). Nadležnog za vrstu nikad ne bira AI.
- Opisi i nazivi vrsta **ne pominju nijednu instituciju** (zlatno pravilo 1); ko prima dopis piše samo u `jurisdiction_rules`.
- Problemi koji nisu na listi (npr. napušteno vozilo, elektro-ormar ili stub, klupe i igrališta, oštećen kontejner) prepoznaju se kao `other`. Ako fotografija nije komunalni problem, model vraća `other` uz `is_municipal_problem = false`, pa građanin bira vrstu ručno (FR-7).
- Jedna prijava ima jednu vrstu. Sve fotografije prijave prikazuju isti problem; ako se vidi više problema, model bira najistaknutiji.
- Kad građanin ručno promijeni vrstu, sistem ponovo određuje nadležnu instituciju i ponovo provjerava duplikate. AI-jeva prvobitna vrsta i pouzdanost se čuvaju odvojeno od konačne vrste (nisu javne).
- Nova vrsta se dodaje migracijom i redom u `lib/constants.ts`, nikad samo u promptu.

#### Pravila nadležnosti

Pravilo u `jurisdiction_rules` je jedini izvor nadležnosti (zlatno pravilo 1). Odluke i seed tabela: tiket 14, istraživanje 02.

- **Oblik:** jedno pravilo = (vrsta, opština) → primalac i, opciono, institucija u kopiji. U prvoj verziji sva pravila su za Glavni grad Podgoricu; opština je obavezna (nema nacionalnih pravila).
- **Izvor je obavezan:** naslov izvora, datum provjere i vrsta izvora: (a) zvanični dokument ili zvanična stranica institucije, sa URL-om i kratkim citatom; (b) pisana potvrda institucije; (c) telefonska potvrda, koja se prikazuje kao „slabiji izvor". Članci, forumi i „svi znaju" nisu izvor. Sva pravila u seed-u su tipa (a).
- **Nejasna nadležnost** (vlasnik šahta, opštinski ili državni put, površina ispred zgrade) rješava se pravilom koje upućuje na instituciju koju izvor imenuje kao koordinatora ili najčešćeg vlasnika; dopis ionako traži da institucija javi ako nije nadležna (FR-11). AI nikad ne mijenja primaoca, ni na osnovu natpisa na fotografiji.
- **Putevi:** za `pothole`, `sidewalk` i `traffic_sign` primalac je Sekretarijat za saobraćaj Glavnog grada (izdaje naloge), a „Putevi" d.o.o. dobija kopiju dopisa. Prijavu u panelu vidi samo primalac.
- **Mejl adrese institucija** su prave javne institucionalne adrese, svaka sa izvorom i datumom provjere, i provjeravaju se ponovo prije seed-a. Lične adrese službenika se ne unose. Institucija bez provjerene adrese ne prima dopise (prijava ide u `routing`). Zaštita od slanja pravim institucijama je `EMAIL_MODE=test` (FR-12), koji preusmjerava i primaoca i kopiju.
- **„Zašto ova institucija?"**: mali link na ekranu pregleda i na javnoj stranici prijave otvara naziv institucije (i kopije), naslov izvora, citat, link ka izvoru i „Provjereno: {datum}". Za prijavu koju je rasporedio administrator piše „Nadležnog je ručno odredio administrator Fixita." Ne dodaje dodir u glavnom toku.
- **Nema rezervnog primaoca:** ni Služba za građane ni Komunalna policija ne primaju automatski prijave bez pravila; one idu administratoru (`routing`), koji instituciju bira ručno na `/admin`. Ručni izbor ne stvara novo pravilo.
- **Izmjene pravila** u P0 idu samo kroz migraciju ili seed; administratorski CRUD je P1.

### 5.3 Mapa, podrške i statusi
- **FR-14** Javna mapa prikazuje sve prijave osim `draft` i sakrivenih, sa bojom i ikonom po statusu i nazivom statusa tekstom; boje (tokeni iz preseta) i ikone su u tabeli u `UI.md` (tiket 22 Q10).
- **FR-15** Brojač dana se računa od `submitted_at` (podnošenje: trenutak kad je prijava otišla u `sent` ili u `routing`), a ne od slanja kasnijih dopisa. Broj dana {n} je razlika kalendarskih dana po vremenu u Podgorici (`Europe/Podgorica`). Tekst po statusu:
  - otvorena prijava (`routing`, `sent`, `acknowledged`, `in_progress`, `not_competent`): „{n} dana bez rješenja" (do danas); za n = 0 „Prijavljeno danas";
  - `resolved`: „Riješeno za {n} dana" (do `closed_at`); za n = 0 „Riješeno istog dana";
  - `rejected`: „Odbijeno nakon {n} dana" (do `closed_at`); za n = 0 „Odbijeno istog dana". Brojač zatvorene prijave stoji.
  - Oblik riječi: „dan" za brojeve koji se završavaju na 1, osim 11 („1 dan", „21 dan"), inače „dana" („2 dana", „11 dana", „14 dana").
  - Ako administrator ponovo otvori zatvorenu prijavu, `closed_at` se briše, a brojač nastavlja od `submitted_at`.
- **FR-16** Svaki građanin i anonimni korisnik može podržati tuđu otvorenu prijavu (FR-18) koja nije sakrivena, jednom. Prijavilac ne može podržati svoju prijavu; službenici i administratori ne podržavaju prijave. Podrška se u P0 ne može povući: poslije podrške dugme glasi „Podržano" i onemogućeno je, uz isti brojač (tiket 19 Q8). Kad se prijava zatvori, broj podrški ostaje vidljiv, a umjesto dugmeta piše „Prijava je zatvorena". Preusmjeravanje ne briše podrške (FR-23). Korisnik bez naloga ne mora da se uloguje: anonimna sesija se kreira tek kad dodirne „Podržavam“ na javnoj stranici prijave, a jedna podrška po prijavi važi za tu sesiju. Brojač glasi „1 podrška“, „2–4 podrške“, „5 i više podrški“ (gramatički oblik po broju, vidi `GLOSSARY.md`); u kodu pojam ostaje `like` (`report_likes`, `like_count`).
- **FR-17** Brojač podrški se osvježava uživo na mapi i na stranici prijave (Supabase Realtime). Ostaje P0 i prikazuje se u videu (tiket 19 Q2).
- **FR-18** Statusi: `draft` → `sent` → `acknowledged` → `in_progress` → `resolved`, uz `routing` (nema pravila, čeka administratora, FR-8), `not_competent` (institucija nije nadležna) i `rejected` (neosnovana ili duplikat). Svih osam vrijednosti postoji u enum-u od prvog dana (i `not_competent`, iako je njegovo dugme P1). Svaka promjena statusa, svaki poslat dopis, svako ručno raspoređivanje i svako preusmjeravanje upisuje se u vremensku liniju prijave, uz to da li je promjenu napravila institucija ili tim Fixit (ne ime osobe).
  - **Otvorena prijava:** status `routing`, `sent`, `acknowledged`, `in_progress` ili `not_competent`. **Zatvorena:** `resolved` ili `rejected`. Samo otvorena i nesakrivena prijava se može podržati (FR-16) i nuditi kao duplikat (FR-9). Sakrivanje (moderacija) nije status, nego posebna oznaka.
  - **Ko smije koji prelaz** (sve što nije u tabeli je zabranjeno; sprovodi ga baza kroz RPC, klijent nikad ne piše status direktno). Numeracija je ista kao u tiketu 10 i `DB.md` §8.4:

    | # | Iz | U | Ko | Uslov |
    |---|---|---|---|---|
    | 1 | — | `draft` | građanin | ulogovan, nije anonimna sesija, ispod dnevnog ograničenja (§6) |
    | 2 | `draft` | (obrisan) | prijavilac | „Odustani", napušten nacrt ili „Podrži postojeću" (FR-9) |
    | 3 | `draft` | `sent` | sistem, na „Pošalji prijavu" prijavioca | pravilo postoji, primalac ima mejl, dopis uspješno poslat |
    | 4 | `draft` | `draft` | sistem | slanje dopisa nije uspjelo; kod ostaje, prijava nije podnesena (FR-11, FR-24) |
    | 5 | `draft` | `routing` | sistem, na „Pošalji prijavu" prijavioca | nema pravila ili primalac nema mejl (FR-8) |
    | 6 | `routing` | `sent` (ručno raspoređivanje) | administrator (P0) | izabrana institucija, dopis uspješno poslat |
    | 7 | `sent` | `acknowledged` | sistem | službenik nadležne institucije prvi put otvori prijavu (FR-22) |
    | 8 | `sent`, `acknowledged` | `in_progress` | službenik nadležne institucije, administrator | poruka opciona |
    | 9 | `sent`, `acknowledged`, `in_progress` | `resolved` | službenik nadležne institucije, administrator | poruka opciona |
    | 10 | `sent`, `acknowledged`, `in_progress` | `rejected` | službenik nadležne institucije, administrator | poruka obavezna |
    | 11 | `routing`, `not_competent` | `rejected` | administrator | poruka obavezna (npr. nije komunalni problem) |
    | 12 | `sent`, `acknowledged`, `in_progress` | `not_competent` | službenik nadležne institucije (dugme P1), administrator | obrazloženje obavezno |
    | 13 | `not_competent`, `sent`, `acknowledged`, `in_progress` | `sent` (preusmjeravanje) | administrator (P1) | nova institucija različita od trenutne, novi dopis uspješno poslat (FR-23) |
    | 14 | `resolved`, `rejected` | `in_progress` | administrator | poruka obavezna; `closed_at` se briše |

    Građanin nakon slanja ne mijenja ništa. Službenik ne može vratiti prijavu u raniji status niti ponovo otvoriti zatvorenu; to radi administrator. Administrator status mijenja i u ime institucije koja je odgovorila mejlom (inbound mejl je van scope-a); vremenska linija tada kaže „Tim Fixit".
  - **Osvježavanje:** status na javnoj stranici se u P0 osvježava ponovnim učitavanjem, bez Realtime-a (FR-17 važi samo za brojač podrški). Realtime za status je P1.
  - Nazivi statusa u UI-ju (vidi `GLOSSARY.md`): `draft` „Nacrt" (nikad javno) · `routing` „Određuje se nadležni" · `sent` „Poslata" · `acknowledged` „Primljena" · `in_progress` „U radu" · `resolved` „Riješena" · `not_competent` javno „Preusmjerava se", u panelu „Nije naša nadležnost" · `rejected` „Odbijena". Javni naziv za `not_competent` ne smije zvučati kao da je problem zatvoren. Status se uvijek prikazuje tekstom, ne samo bojom.
- **FR-19** Pri promjeni statusa prijavilac i korisnici koji su podržali prijavu, a imaju nalog, dobijaju obavještenje u aplikaciji; prijavilac dobija i mejl (P1).

### 5.4 Panel institucije
- **FR-20** Službenik vidi samo prijave svoje institucije.
- **FR-21** Službenik mijenja status i opciono ostavlja poruku koja je javno vidljiva u vremenskoj liniji.
- **FR-22** Kad službenik nadležne institucije prvi put otvori prijavu u panelu, a prijava je u statusu `sent`, status automatski prelazi u `acknowledged` („Primljena"). Otvaranje od strane administratora ne mijenja status.
- **FR-23** Status `not_competent` postoji u šemi od P0, a dugme „Nije naša nadležnost" u panelu i administratorski tok preusmjeravanja su P1. Službenik uz `not_competent` obavezno upisuje obrazloženje, a prijava se pojavljuje administratoru na `/admin`. Dva administratorova izbora primaoca (pojmovi iz `GLOSSARY.md`): **ručno raspoređivanje** je prvi izbor institucije za prijavu u `routing` (P0, prelaz 6), a **preusmjeravanje** je izbor nove institucije za prijavu koju je dosadašnji primalac označio sa `not_competent`, ili iz `sent`/`acknowledged`/`in_progress` kad administrator primijeti grešku (P1, prelaz 13). Oba zadržavaju **istu prijavu**: isti kod, fotografije, podrške i brojač dana; nijedno ne stvara pravilo nadležnosti. Prijava dobija nadležnu instituciju i **novi dopis** (šablon iz FR-11, za novog primaoca), status postaje `sent`, a u vremenskoj liniji piše „Preusmjereno: {stara institucija} → {nova institucija}" (kod ručnog raspoređivanja: „Proslijeđeno: {institucija}", uz napomenu „Nadležnog je odredio administrator Fixita."). Prethodna institucija od tada ne vidi prijavu u panelu. Ako je pravilo bilo pogrešno, administrator ga mijenja posebno (u P0 migracijom).

### 5.5 Demo
- **FR-24** Svaka poslata prijava ima kratak javni kod `FX-{godina}-{broj}`, npr. `FX-2026-00142`: godina slanja (po vremenu u Podgorici) i petocifren redni broj koji svake godine kreće od `00001`. Kod se dodjeljuje pri prvom pritisku na „Pošalji prijavu" (jer je u naslovu dopisa), a ne pri kreiranju nacrta, pa napušteni nacrti ne troše brojeve. Ako slanje dopisa ne uspije, nacrt zadržava kod za ponovni pokušaj. Kod se nikad ne mijenja, ni pri preusmjeravanju. Rupe u nizu (nacrt kome slanje nije uspjelo, pa je napušten) su moguće i nisu greška. Demo prijave dobijaju kod iz istog brojača.
- **FR-25** Demo prijave su označene (`is_demo`) i mogu se obrisati jednom komandom. U UI-ju nose malu oznaku „Demo prijava" (shadcn `Badge`) na `/p/[code]` i u oblačiću markera na mapi. Demo prijava je i svaka prijava napravljena sa demo naloga, uključujući pravu prijavu koju `citizen-video` napravi u videu: i ona ide samo na `TEST_INBOX`, ne instituciji, pa je oznaka poštena (tiket 22 Q3). Demo podaci ostaju do kraja ocjenjivanja i brišu se tek poslije njega, ne prije predaje (tiket 19 Q5). Demo prijave imaju fotografije sa otvorenom licencom (Wikimedia Commons, autori u `scripts/demo-photos/CREDITS.md`); demo prijave vrsta za koje nema demo fotografije prikazuju se bez fotografije (tiket 21, `DB.md` §12.4).

## 6. Nefunkcionalni zahtjevi

- **Performanse:** prepoznavanje vrste ≤ 8 s od otpreme fotografije; tekst prijave prikazan ≤ 3 s nakon prepoznavanja; javna mapa učitana ≤ 2 s na 4G mreži.
- **Mobile-first:** sve stranice za građane rade na ekranu širine 360 px; panel institucije je prilagođen desktopu, ali upotrebljiv na tabletu.
- **Jezik:** cijeli korisnički interfejs i prijave su na crnogorskom, latinicom, ijekavski. Identifikatori u kodu i bazi su na engleskom.
- **Bezbjednost:** RLS uključen na svakoj tabeli; servisni ključ Supabase-a i API ključevi postoje samo na serveru; uloge se ne mogu mijenjati sa klijenta; ograničenje od 10 prijava dnevno po korisniku. Ograničenje se računa po nacrtima za koje je pokrenuta AI analiza (i napuštenim, jer je trošak poziva modela već nastao), po kalendarskom danu u Podgorici, i provjerava se prije poziva modela. Jedanaesti pokušaj dobija poruku „Dostigli ste dnevno ograničenje od 10 prijava. Pokušajte ponovo sjutra."
- **Privatnost** (odluke iz tiketa 11). Poštuje se Zakon o zaštiti podataka o ličnosti.
  - **Javno odmah:** prijava je javna čim je poslata (nije `draft`); moderacija je naknadna, nema odobravanja unaprijed.
  - **Ko vidi identitet:** javnost i drugi građani nikad ne vide ko je prijavio niti ko je podržao prijavu. Službenik vidi ime, prezime i mejl prijavioca samo ako je građanin uključio dostavljanje (FR-11), i to samo u dopisu. Administrator u aplikaciji vidi nalog prijavioca (zbog zloupotreba), ali ne i ko je podržao prijavu. U javnoj vremenskoj liniji poruke službenika potpisuje institucija, ne ime službenika. Tekst dopisa nije javan.
  - **Opis je javan** (tiket 19 Q4): opis problema (prijedlog modela, koji građanin mijenja na pregledu, FR-11) prikazuje se uz fotografije na javnoj stranici. Ozbiljnost, naslov iz modela, pouzdanost i ostali podaci modela nisu javni. Pošto se prijava objavljuje bez prethodne moderacije, ispod polja „Opis problema" na ekranu pregleda stoji napomena „Opis je javan i vidi se uz fotografiju. Ne upisujte ime, broj telefona, mejl ni druge lične podatke." (bez dodira). Server iz opisa modela uklanja URL-ove, mejl adrese i brojeve telefona (Tech.md §7).
  - **Fotografije sa ličnim podacima:** model označava fotografije na kojima su vidljiva lica ili registarske tablice (FR-6). Označena fotografija je javna, a administrator je može sakriti (ekran za moderaciju na `/admin` je P1, §4.4); sakriva se pojedinačna fotografija ili cijela prijava. Sakrivena fotografija na javnoj stranici se zamjenjuje tekstom „Fotografija je uklonjena radi zaštite privatnosti“; sakrivena prijava nestaje sa mape, iz prijedloga duplikata i sa javne stranice. Primalac i prijavilac i dalje vide sakrivene fotografije i prijave. Na ekranu pregleda prije slanja, ako je fotografija označena, stoji napomena „Na fotografiji su možda vidljiva lica ili tablice. Fotografija će biti javna.“ (bez dodatnog dodira).
  - **Skladištenje fotografija:** fotografije su u privatnom bucket-u. Server izdaje kratkotrajne potpisane URL-ove samo za fotografije koje nisu sakrivene, iz prijava koje nisu `draft` ni sakrivene; službenik i administrator dobijaju URL-ove preko servera. Putanja fajla je nasumična i ne sadrži ID korisnika.
  - **Metapodaci:** kompresija na klijentu (canvas) briše sve EXIF podatke, uključujući GPS i model telefona. Original se nikad ne otprema; lokacija se čuva samo iz potvrđenog pina.
  - **Obavještenje:** na `/uloguj-se` stoji jedan pasus o tome šta je javno, sa linkom „Više o privatnosti" na stranicu `/privatnost`, bez checkbox-a. Tekst pasusa (tiket 11, dopuna iz tiketa 19 Q4): „Javno se vide fotografija, vrsta i opis problema, lokacija, status i broj podrški. Vaše ime, mejl i nalog nijesu javni, kao ni to ko je podržao prijavu. Instituciji dostavljamo vaše ime i mejl samo ako to sami uključite pri slanju prijave.“ Na početnom ekranu `/prijavi`, pri svakoj prijavi, ispod dugmadi „Fotografiši" i „Iz galerije" stoji jedan kratak red „Izbjegavajte lica i registarske tablice na fotografiji.“ (bez pamćenja po nalogu; tiket 22 Q11).
  - **Bez ličnih podataka u URL-ovima i logovima:** URL-ovi sadrže samo javni kod prijave i nasumične ID-jeve; u `agent_runs` i Vercel logovima nema imena, mejla ni sadržaja fotografija.
  - **Zloupotreba podrški:** anonimni korisnik može obrisati kolačiće i ponovo podržati prijavu; to je prihvaćen rizik. Važi Supabase limit od 30 anonimnih prijavljivanja na sat po IP-u (ne podižemo ga), jedna podrška po prijavi po sesiji i podrška samo za otvorene prijave. CAPTCHA (Cloudflare Turnstile) nije u P0; uvodi se prije pilota.
- **Pouzdanost:** ako Claude API ne odgovori, građanin nastavlja ručnim tokom (izbor vrste i unos opisa), a dopis se pravi iz istog šablona; ako slanje dopisa ne uspije, prijava ostaje nacrt uz mogućnost ponovnog pokušaja.
- **Bezbjednost slanja:** testni režim je podrazumijevan; slanje pravim institucijama zahtijeva eksplicitno `EMAIL_MODE=live`, što se tokom hakatona ne koristi.
- **Pristupačnost:** kontrast WCAG AA, dugmad najmanje 44 × 44 px, statusi se ne razlikuju samo bojom (i ikonom/tekstom).
- **Troškovi:** jedna prijava = jedan poziv modela; fotografije se smanjuju prije slanja modelu.
- **Opservabilnost:** greške agenta i slanja su vidljive u `agent_runs` i u Vercel logovima.

## 7. Šta NIJE u scope-u

- Nativne iOS/Android aplikacije (samo PWA).
- AI koji određuje nadležnost (nadležnost je isključivo u tabeli pravila).
- Automatsko prepoznavanje kategorije puta (lokalni / državni / autoput) iz OSM-a; na hakatonu se pravila vežu za vrstu i opštinu.
- Slanje prijava pravim institucijama tokom razvoja i hakatona.
- Automatska obrada odgovora institucija stiglih mejlom (inbound mejl).
- Integracija sa informacionim sistemima institucija i e-Upravom.
- Stvarna naplata licenci (cjenovnik postoji samo kao opis za pitch).
- Push obavještenja na telefon (samo obavještenja u aplikaciji i mejl).
- Automatsko zamućivanje lica i tablica (samo označavanje i ručno sakrivanje).
- Offline rad, video prijave, SMS, više jezika.
- Raspoređivanje službama unutar institucije (P2, samo ako ostane vremena).

## 8. Predložene stranice

Zaglavlje svih stranica: ulogovan nalog (ne anonimna sesija) ima meni sa „Odjavi se" (P0), koje vodi na `/` (§4.1, tiket 22 Q7).

### Javne
| Ruta | Namjena |
|---|---|
| `/` | Javna mapa prijava, istaknuto dugme „Prijavi problem". |
| `/p/[code]` | Javna stranica prijave: naslov stranice je naziv vrste i adresa (naslov iz modela nije javan), nesakrivene fotografije, opis problema uz fotografije (tiket 19 Q4), status, nadležna institucija (uz „Zašto ova institucija?", §5.2), brojač dana, dugme „Podržavam", brojač podrški uživo, vremenska linija, dugme „Podijeli" (link), oznaka „Demo prijava" za demo prijave (FR-25). Dopis nije javan. |
| `/statistika` | Javna statistika po instituciji (P1). |
| `/uloguj-se` | Registracija (obavezno ime, prezime, mejl i šifra) i ulogovanje mejlom i šifrom. Prima `next`, pa gost iz „Prijavi problem" poslije ulogovanja ide nazad na `/prijavi` (FR-1). |
| `/auth/callback` | Povratak iz linka za potvrdu mejla. **Nije u P0:** `Confirm email` je isključen i Supabase ne šalje Auth mejlove (Tech.md, „Hosting i mejl"). |
| `/privatnost` | Kratka stranica o privatnosti: koji se podaci prikupljaju, šta je javno, šta se i kad dostavlja instituciji, kako se traži uklanjanje fotografije ili prijave (kontakt mejl tima); odjeljak „Demo fotografije" sa autorima i licencama, jer je `street_light-2.jpg` pod CC BY 4.0 (autor „ŠJů, Wikimedia Commons", fotografija izmijenjena; `scripts/demo-photos/CREDITS.md`, tiket 21). |

### Građanin
| Ruta | Namjena |
|---|---|
| `/prijavi` | Tok prijave (FR-5, „Redoslijed ekrana"): „Fotografiši" / „Iz galerije" → kamera ili galerija (ne broji se) → lokacija, dok AI već prepoznaje vrstu (**dodir 1:** „Potvrdi lokaciju") → koraci agenta (bez dodira) → izbor vrste, samo ako AI nije siguran ili nije odgovorio (+1) → duplikat, samo ako postoji (+1) → pregled prijave: fotografije, vrsta, nadležni, opis i prekidač za dostavljanje podataka na jednom ekranu (**dodir 2:** „Pošalji prijavu") → „Prijava poslata" sa kodom, linkom javne stranice i „Podijeli". Srećni put: 2 dodira; najduži: 4. Neulogovan korisnik prvo ide na `/uloguj-se`. |
| `/moje-prijave` | Lista vlastitih prijava sa statusima (P1). |
| `/obavjestenja` | Obavještenja o promjenama statusa (P1). |

### Institucija
| Ruta | Namjena |
|---|---|
| `/panel` | Lista prijava institucije (P0); filteri i sortiranje su P1 (§4.3). |
| `/panel/prijave/[id]` | Detalji prijave (uključujući ozbiljnost, FR-6), dopis upućen instituciji, promjena statusa uz poruku (FR-21); prvo otvaranje mijenja `sent` u `acknowledged` (FR-22). |
| `/panel/mapa` | Mapa prijava institucije (P1). |
| `/panel/analitika` | Analitika institucije (P1). |

### Administrator
| Ruta | Namjena |
|---|---|
| `/admin` | **P0:** lista prijava u `routing` (bez nadležnog), izbor institucije i dugme „Pošalji dopis" (ručno raspoređivanje; vidi „Pravila nadležnosti" u §5.2). **P1:** prijave označene kao `not_competent`; pregled fotografija sa vidljivim licima ili tablicama i sakrivanje fotografije ili cijele prijave (moderacija, §4.4 i §6 Privatnost; tiket 19 Q2). |
| `/admin/institucije` | CRUD institucija (P1). |
| `/admin/pravila` | CRUD pravila nadležnosti (P1). |
| `/admin/korisnici` | Nalozi službenika (P1; do tada preko seed skripte). |

## 9. Plan izrade do 7. novembra

| Dan | Cilj |
|---|---|
| Pon 2. 11. | Planiranje (tiketi 01–18). |
| Uto 3. 11. | Planiranje se završava ujutru (tiket 19), izrada počinje istog dana. **Ivana:** Resend nalog otvoren njenim ličnim mejlom (to je `TEST_INBOX`), bez domena (Tech.md, „Hosting i mejl"; koraci u tiketu 16), repo i `shadcn init`, Supabase projekat (`Confirm email` isključen), migracije 1–10 (šema, granica Podgorice, institucije i pravila; `DB.md` §13), prvo pokretanje `pnpm db:seed-demo` (demo nalozi; tim se od tada uloguje njima), Vercel projekat (produkcioni `vercel.app` URL u `NEXT_PUBLIC_SITE_URL` i u Supabase URL Configuration). **Ostali, čim su migracije i tipovi u `main`:** kostur toka prijave (kamera, kompresija, otprema, mapa sa pinom), auth (`/uloguj-se`), javna mapa. Mjerenje modela (tiket 20). |
| Sri 4. 11. | Agent tok (`classify`, `prepare`, `sendReport`) do mejla sa fotografijama u prilogu na `TEST_INBOX`; panel: lista i promjena statusa; `/admin` ručno raspoređivanje; javna stranica prijave i podrške. Do večeri proba registracije na produkcionom URL-u: nov nalog je odmah ulogovan, bez mejla (Tech.md, „Registracija"). |
| Čet 5. 11. | Kompletan P0 od fotografije do promjene statusa na javnoj stranici; demo prijave već postoje (drugo pokretanje `pnpm db:seed-demo` čim je seed za prijave gotov, najkasnije danas; poslije toga bez `db:clear-demo` i bez ponovnog seed-a, tiket 22 Q4); generalna proba: mjerenje 60 s (§2) i probno snimanje cijelog scenarija videa na telefonu, na Vercel adresi (HTTPS), uz spisak provjera iz nalaza 06. Probne prijave ostaju na mapi, pa se proba ne radi na mjestu snimanja za vrstu koja se snima (inače bi u petak iskočio ekran duplikata). P1 tek kad P0 radi. |
| Pet 6. 11. | Zamrzavanje funkcija; snimanje i montaža videa od 1 minuta (scenario ispod). |
| Sub 7. 11. | Predaja i prezentacija; video je dio prezentacije. Demo podaci ostaju do kraja ocjenjivanja (`pnpm db:clear-demo` tek poslije, FR-25). |

**Demo je samo video.** Nema demoa uživo, QR koda ni probe na hotspotu. Video traje 1 minut, snima se u petak i prikazuje **samo perspektivu građanina**: kako se pravi jedna prijava i tok koraka poslije nje. Demo nalozi i demo prijave su napravljeni unaprijed i u videu se prikazuju iste prijave; ništa se prije snimanja ne briše. Registracija novog naloga radi, ali se u videu ne prikazuje. Scenarij ispod je okvirni: detaljan plan snimanja Ivana daje posebno, a tiketi za izradu prave samo aplikaciju koja radi (tiket 22 Q4).

1. Građanin na ulici u Podgorici fotografiše stvaran problem kamerom telefona; lokacija se uzima iz GPS-a i potvrđuje se pin.
2. Koraci agenta uživo, prepoznata vrsta, nadležna institucija iz tabele pravila, pregled prijave i „Pošalji prijavu"; ekran uspjeha sa kodom prijave. Prijava je sa demo naloga `citizen-video`, pa nosi oznaku „Demo prijava" (FR-25).
3. Javna stranica te prijave: status, nadležna institucija, brojač dana; zatim promjena statusa (npr. „u radu" sa porukom institucije u vremenskoj liniji). Službenik mijenja status u panelu van kadra.
4. Javna mapa sa demo prijavama: boje statusa, brojači dana, podrške i primjer riješene prijave; građanin otvori jednu demo prijavu, dodirne „Podržavam" i brojač podrški poraste za 1 (FR-16, FR-17; tiket 19 Q2). Demo prijave nose oznaku „Demo prijava".

Pravila snimanja: snima se ekran telefona u browseru (ne instalirana PWA), na Vercel adresi, uz `EMAIL_MODE=test`. U videu i u prezentaciji stoji jedan natpis da dopisi u demou idu na testno sanduče, ne institucijama; u aplikaciji u P0 nema oznake „Testni režim" (tiket 19 Q8). Rezovi između scena su dozvoljeni, ali se tok slanja (koraci 1–2) ne ubrzava bez vidljive oznake, jer video pokazuje stvarnu brzinu aplikacije.

## 10. Otvorena pitanja

Nijedno ne blokira izradu P0; svako ima rezervu ili rok.

- Ponovna provjera svih 8 mejl adresa institucija prije migracije 10 (`DB.md` §12.2). Pravila su odlučena (tiket 14, „Pravila nadležnosti" u §5.2); adresa koja se ne potvrdi ostaje prazna, pa ta vrsta ide u `routing`.
- `TEST_INBOX` (ujedno `EMAIL_REPLY_TO`) je Ivanin lični mejl; upisan je samo u `.env.local` i Vercel env, nikad u repo (Tech.md, „Hosting i mejl").
- Da li Vercel Hobby pravi preview deploy za commit kolege (AGENTS.md, „Radni proces"): provjerava se prvog dana. Rezerva (tiket 22 Q8): kolege provjeravaju na računaru, na `localhost`-u, gdje pregledač dozvoljava kameru i lokaciju, a na telefonu tek kad Ivana spoji PR u `main` i on se deploy-uje (Tech.md, „Hosting").
- Tekst stranice `/privatnost` (sadržaj iz §8): zadatak za izradu; Ivana ga pregleda prije predaje. Bez članova zakona i rokova (pravilo 7).
- Mjerenje brzine i ijekavice modela (tiket 20): potvrđuje `claude-haiku-5-5` ili prebacuje na `claude-sonnet-5-5` promjenom `ANTHROPIC_MODEL`, bez izmjene koda.