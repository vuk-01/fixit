# 08 — Opseg demoa: opštine i scenario prezentacije

Type: grilling
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Šta tačno pokazujemo u subotu i za koje opštine pravila moraju biti provjerena? Od ovoga zavisi koliko pravila istražujemo, šta ide u seed i šta mora biti robusno.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Provjerena pravila samo za Podgoricu**: PRD kaže „minimum Podgorica". Da li provjerena pravila nadležnosti (sa izvorom) pravimo **samo za Glavni grad Podgoricu**, a granice unosimo za sve opštine, tako da prijava iz druge opštine radi tehnički, ali po FR-8 ide administratoru („biće proslijeđena ručno")?

➡️ Da. Samo Podgorica dobija pravila. Druga opština bi udvostručila istraživanje, a demo se ionako dešava u jednom gradu. Granice svih opština ipak unosimo, jer bez njih FR-4/FR-5 ne rade.

**Tvoj odgovor:** da

---

❓ **Q2 - Glavni put demoa: galerija + pin, kamera kao dodatak**: Demo je vjerovatno u sali, gdje je GPS loš i nema rupe na putu ispred bine. Opcije:
(a) uživo kamerom u sali (fotografišemo odštampanu fotografiju ili ekran);
(b) uživo, fotografija iz galerije telefona + pin na poznatoj lokaciji u Podgorici;
(c) samo snimljen video.
Da li je glavni put **(b)**, kratko pokazujemo (a) ako stignemo, a (c) je rezerva (PRD već traži snimak za petak)?

➡️ Da: (b) kao glavni put, (c) kao obavezna rezerva. (b) ne zavisi od GPS-a ni svjetla u sali, a fotografije unaprijed biramo tako da AI sigurno prepozna vrstu.

**Tvoj odgovor:** Rad aplikacije cemo prikazati kroz video koji cemo napraviti u petak. To je dio prezentacije. Video traje 1 minut.

---

❓ **Q3 - Publika podržava prijavu uživo preko QR koda**: Da li u demo uključujemo trenutak kad publika skenira QR kod javne stranice upravo poslate prijave i dodirne „Podrži" (ili kako god dugme nazovemo u tiketu 09), a brojač na platnu raste uživo (FR-16, FR-17, anonimne sesije)?

➡️ Da. To je najjači trenutak demoa i pokazuje tri P0 stvari odjednom: javnu stranicu, anonimnu podršku i Realtime. Mora raditi na hotspotu.

**Tvoj odgovor:** Ne, kako sam vec odgovorila u prethodnom pitanju. Demo ce biti prikazan kroz video koji prikazuje rad aplikacije.

---

❓ **Q4 - Dva uređaja: telefon građanina i laptop službenika**: Da li demo pokazuje i drugu stranu: službenik na laptopu otvara prijavu (status automatski prelazi u „primljena", FR-22) i mijenja ga u „u radu" sa porukom, a to se vidi na javnoj stranici na telefonu?

➡️ Da. Bez panela priča o modelu naplate (licenca za institucije) visi u vazduhu. Status na telefonu se osvježava ponovnim učitavanjem; za uživo bi trebao Realtime i za statuse, a to nije P0.

**Tvoj odgovor:** Demo treba da pokazuje samo ugao gradjanina, jer je on glavni korisnik.

---

❓ **Q5 - Testni inbox se prikazuje u demou**: Da li je `TEST_INBOX` zajednički mejl tima koji tokom demoa otvaramo da pokažemo kako izgleda formalna prijava institucija (naslov, tekst, fotografija u prilogu)? Čiji mejl je to?

➡️ Da, zajednički mejl tima (npr. tvoj ili namjenski Gmail). Upiši adresu ako je već znaš. Napomena: bez sopstvenog domena Resend vjerovatno smije slati samo na mejl vlasnika naloga (provjerava se u tiketu 05), pa je praktično da `TEST_INBOX` bude baš taj mejl.

**Tvoj odgovor:**
Da li moze da se napravi jednokratni mejl na koji bi stizali mejlovi tokom demo-a?
---

❓ **Q6 - Ko izvodi demo i na kojim uređajima**: Na kom telefonu (iOS ili Android) i kom browseru radimo generalnu probu u četvrtak i demo u subotu? To određuje na čemu testiramo kameru, GPS i PWA.

➡️ Jedan Android (Chrome) i jedan iPhone (Safari), a demo izvodimo na onom na kojem proba u četvrtak prođe bez greške. Upiši koje telefone tim ima.

*Dopuna nakon nalaza 06:*
- Demo izvodimo u browseru, ne kao PWA instaliranu na početni ekran. Ima prijava da lokacija na iOS-u 26 ne radi u instaliranoj aplikaciji.
- Lokacija radi samo preko HTTPS-a, pa telefon testiramo na Vercel preview-u, a ne na lokalnoj `http://` adresi.
- Spisak od 9 provjera za probu u četvrtak nalazi se u [nalazima 06](../research/06-pwa-kamera-lokacija.md).

**Tvoj odgovor:** Demo ce biti prikazan kroz video, treba da se prikaze slucaj kako korisnik slika problem, salje prijavu, i citav tok odvijanja dalje. Nema uzivo demo, samo video koji cemo prikazati.

---

## Answer

- **Q1 — Opština:** samo Glavni grad Podgorica: samo njena granica (ME-16, OSM rel. 2319360) i samo njena pravila; lokacija van Podgorice (i u Tuzima i Zeti) se odbija uz jasnu poruku. **[Ivana]** (njen kasniji odgovor u 18 Q4 poništava „da" iz Q1 o granicama svih opština; vidi brief, tačka 1).
- **Q2 — Glavni put demoa:** samo video od 1 minuta, snimljen u petak, kao dio prezentacije; nema demoa uživo ni rezerve uživo. **[Ivana]**
- **Q2a — Kamera ili galerija u videu:** glavni put je kamera + GPS na ulici, kod stvarnog problema u Podgorici. **[Claude]** jer napolju GPS radi, a to je P0 put iz FR-3 (problem sale sa lošim GPS-om više ne postoji).
- **Q3 — QR i podrška publike uživo:** ne; QR kod je izbačen iz aplikacije i plana demoa. **[Ivana]**
- **Q4 — Dva uređaja:** ne; video prikazuje samo ugao građanina. Razvoj prijave (promjena statusa) vidi se na javnoj stranici prijave, a službenik mijenja status u panelu van kadra. **[Ivana]** (dio „van kadra" je **[Claude]**, jer bez toga nema „toka odvijanja dalje" koji Ivana traži u Q6).
- **Q4a — Kako video pokazuje razvoj kroz vrijeme:** seed demo prijave u Podgorici sa unazad postavljenim datumima i istorijom statusa („14 dana bez rješenja", „Riješeno za 6 dana", lajkovi), uz novu prijavu snimljenu uživo. **[Claude]** jer nova prijava za 1 minut ne može stvarno ostariti.
- **Q5 — `TEST_INBOX`:** da, pravi se novo, namjensko sanduče samo za Fixit demo (npr. novi Gmail nalog tima), ali **ne** privremeni „temp-mail" servis. **[Ivana]** (ideja) + **[Claude]** (izbor) jer privremena sanduča ističu, javno su čitljiva, često odbijaju priloge, a Resend nalog mora ostati vezan za mejl koji tim kontroliše. Po nalazima 05, dok nema domena `TEST_INBOX` mora biti **mejl vlasnika Resend naloga**, pa se Resend nalog otvara baš sa tim novim sandučetom. Kad Ivana kupi i verifikuje domen (tiket 16), `TEST_INBOX` može biti bilo koja adresa, ali ostaje isto sanduče; tada guard u `lib/email/send.ts` postaje jedina zaštita (nalazi 05, §6.5). Isto sanduče je i `reply-to` u test režimu (16 Q2). Adresu upisuje Ivana kad je napravi.
- **Q5a — Da li se inbox prikazuje u videu:** ne obavezno; najviše kratak kadar dopisa koji je otišao „u ime građanina", ako stane u minut. **[Claude]** jer je ugao samo građanina, a dopis je dokaz da prijava stvarno odlazi.
- **Q6 — Uređaj i način:** nema demoa uživo; snima se ekran jednog telefona u browseru (ne instalirana PWA), na Vercel adresi preko HTTPS-a, uz `EMAIL_MODE=test`. Koristi se telefon na kojem probno snimanje u četvrtak prođe spisak provjera iz nalaza 06. **[Ivana]** (samo video) + **[Claude]** (telefon i način snimanja, jer Ivana nije navela telefone).
- **Q6a — Montaža:** rezovi između scena su dozvoljeni, ali se tok slanja (fotografija → „Pošalji prijavu") ne ubrzava bez vidljive oznake. **[Claude]** jer video tvrdi cilj „manje od 60 s", pa mora pokazivati stvarnu brzinu.

### Izmjene u dokumentima

- `PRD.md` §1: dodat pasus „Opseg prve verzije" (samo Glavni grad Podgorica, bez Tuzi i Zete); pozicioniranje „radi u svim opštinama" preformulisano u viziju („zamišljeno da radi").
- `PRD.md` §4.4: seed je samo za Podgoricu, a dio demo prijava ima unazad postavljene datume i istoriju statusa; dodata P0 stavka „Video od 1 minuta".
- `PRD.md` FR-4: lokacija van Glavnog grada Podgorice se odbija, uz tekst poruke na crnogorskom.
- `PRD.md` §9: plan po danima (četvrtak = probno snimanje scenarija na Vercel adresi; petak = snimanje i montaža videa; subota = predaja i prezentacija), uz scenario videa u 4 koraka i pravila snimanja. Uklonjeni proba na hotspotu i „snimak demoa kao rezerva".
- `PRD.md` §10: pitanje o provjeri nadležnosti suženo na Podgoricu.

### Za DB.md (tiket 18)

- Tabela opština/granica: jedan red, Glavni grad Podgorica (ME-16, OSM rel. 2319360, uz atribuciju ODbL). Granica države i ostale 24 jedinice se ne seed-uju.
- Funkcija za određivanje opštine vraća `null` van Podgorice, pa se prijava odbija prije `draft`-a (FR-4); pitanje 18 Q4 (tačke na jezeru/moru, 500 m) otpada.
- `jurisdiction_rules`: samo pravila za Podgoricu; nivo „nacionalnog/opšteg pravila" nije potreban za P0 (FR-8 tekst o „opštem pravilu kao rezervi" usklađuje tiket 14). Bez pravila → administrator.
- Seed ~10 demo prijava (`is_demo = true`), sve u Podgorici, sa unazad postavljenim `sent_at` / `resolved_at`, redovima u istoriji statusa (vremenska linija sa porukama institucije) i brojem lajkova; seed mora moći postaviti `like_count` ili ubaciti lajkove bez anonimnih sesija.
- Demo nalozi: građanin za snimanje videa (potvrđen, sa imenom i prezimenom) i službenik bar jedne institucije koja se pojavljuje u videu.

### Za provjeru

- **Q1 je u suprotnosti sa 18 Q4:** u Q1 si prihvatila granice svih opština, a u 18 Q4 si rekla samo Podgorica. Primijenio sam kasniji odgovor. Posljedica: prijava iz Tuzi i Golubovaca (Zeta) se odbija iako su to „okolina Podgorice".
- **P0 je definisan kao „mora raditi na demou".** Pošto je demo samo video iz ugla građanina, panel institucije (§4.3) i lajkovi uživo (FR-17) se ne vide u videu. Ostavio sam ih kao P0 (panel je potreban da se status promijeni van kadra i za priču o licenci), ali vrijedi provjeriti u završnoj provjeri (19) da li nešto prelazi u P1.
- **Q5:** odluka „novo namjensko sanduče, ne temp-mail" je moja dopuna tvog pitanja. Ako je Resend nalog već otvoren tvojim ličnim mejlom, treba ili novi Resend nalog sa novim sandučetom, ili `TEST_INBOX` = tvoj mejl dok domen ne bude verifikovan.
- **Q5a / Q6a:** kratak kadar dopisa u inboxu i pravilo „bez ubrzavanja bez oznake" su moji prijedlozi; slobodno ih promijeni pri montaži.
- Datumi u §9 za ponedjeljak i utorak nijesu mijenjani (osim teksta o seed-u), iako je planiranje prešlo u utorak.

### Novi tiketi / magla

- **Scenario i tekst videa** (koji stvarni problem, koja ulica, ko snima, natpisi na ekranu, muzika/naracija): magla za četvrtak; nije potreban poseban tiket ako ga radi osoba koja snima.
- **Brojač dana za prijavu poslatu danas** („0 dana"? „Poslato danas"?): nova prijava u videu to prikazuje; prijedlog za tiket 09/10.
- **Domen i `TEST_INBOX`:** tiket 16 treba upisati konačnu adresu sandučeta i redoslijed (prvo sanduče → Resend nalog → domen).

## Izmjena odluke (3. 11.)

- **[Ivana]** `TEST_INBOX` je Ivanin lični mejl, a ne posebno demo sanduče (zamjenjuje odgovor na Q5 iz Answer-a). Resend nalog je otvoren tim mejlom. Adresa se upisuje samo u `.env.local` i u Vercel env, a u videu se zamućuje. Izmijenjen je Tech.md, odjeljak „Hosting i mejl".
