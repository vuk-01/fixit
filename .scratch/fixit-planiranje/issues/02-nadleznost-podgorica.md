# 02 — Ko je nadležan za koju vrstu problema u Podgorici (sa izvorima)

Type: research
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Za svaku kandidat-vrstu komunalnog problema: koja institucija je nadležna **u Glavnom gradu Podgorici**, prema kom zvaničnom izvoru, i koja je njena javna kontakt adresa? Za vrste kod kojih je nadležnost ista u cijeloj zemlji (npr. elektroinfrastruktura, državni putevi), zabilježiti i to.

Kandidat-vrste (lista nije konačna; konačnu bira tiket 13):
rupa / oštećenje kolovoza, otvoren ili oštećen šaht (atmosferska vs. fekalna kanalizacija vs. ostali vlasnici), grafiti, divlja deponija, prepun ili oštećen kontejner, neispravna javna rasvjeta, oštećen trotoar, oštećen ili oboren saobraćajni znak, neispravan semafor, oboreno drvo / neodržavano javno zelenilo, curenje vode / pukla cijev, napušteno vozilo, oštećen mobilijar (klupe, igrališta), oštećen ili opasan elektro-ormar / stub.

Za svaku vrstu navesti:

1. Instituciju (tačan zvanični naziv) i tip (sekretarijat Glavnog grada, gradsko preduzeće, državni organ, javno preduzeće…).
2. **Izvor**: URL zvaničnog dokumenta ili stranice (odluka Skupštine Glavnog grada, statut ili djelatnost preduzeća, Službeni list, zvanični sajt), uz kratak citat i datum provjere. Ako izvor nije pronađen, napisati „nije potvrđeno" i nikako ne pogađati.
3. Javni kontakt mejl i izvor za njega.
4. Gdje je nadležnost podijeljena ili zavisi od nečega što ne znamo iz fotografije i lokacije (npr. lokalni vs. državni put, vlasnik šahta), i ko je u tom slučaju prirodan „koordinator".
5. Kratko: kako postojeće rješenje Glavnog grada (npr. aplikacija/servis za prijave) raspoređuje iste vrste. To je dobra provjera.

Ovo je osnova za pravilo „svako pravilo ima izvor". Činjenice bez izvora se ne smiju naći u tabeli pravila.

Odluke koje ovo čeka: Vrste problema (13), Pravila nadležnosti (14).

Nalaze zapisati u `.scratch/fixit-planiranje/research/02-nadleznost-podgorica.md`, kao tabelu spremnu da postane seed za `jurisdiction_rules`.

## Answer

- **[istraživanje]** U Podgorici posao obavljaju gradska preduzeća, a sekretarijati vrše nadzor i izdaju naloge. „Putevi" održavaju opštinske puteve, trotoare i vertikalnu signalizaciju „po dobijenim nalozima i rješenjima" Sekretarijata za saobraćaj (Program 2026, Odluka Skupštine 02-016/20-442).
- **[istraživanje]** Najčvršći izvor je za javnu rasvjetu i semafore: „Komunalne usluge" d.o.o., uz namjenski mejl `dispecer@komunalneusluge.me` („Prijava kvara rada javne rasvjete i svjetlosne signalizacije"), objavljen na podgorica.me.
- **[istraživanje]** ViK održava i fekalnu i atmosfersku kanalizaciju, kao i vodovod. Razdvajanje šahtova na fekalne i atmosferske zato u Podgorici ne mijenja primaoca. Ostali vlasnici šahtova (TK kanalizacija kod „Komunalnih usluga", CEDIS, operateri) ne vide se sa fotografije.
- **[istraživanje]** Divlja deponija i prepun kontejner idu „Čistoći", što potvrđuju i njena online forma za nelegalne deponije i aplikacija Kasper. Javno zelenilo i drveće, kao i parkovski i dječji mobilijar, idu „Zelenilu". Izuzetak su površine ispred zgrada, za koje su nadležne skupštine etažnih vlasnika.
- **[istraživanje]** Za grafite i napuštena vozila nije pronađen akt Glavnog grada, pa je nadležnost „nije potvrđeno". Preporuka je da se izbace iz MVP-a.
- **[istraživanje]** Državni putevi pripadaju Upravi za saobraćaj (data.gov.me), ali njen mejl nije potvrđen. Za razlikovanje opštinskog i državnog puta potreban je sloj kategorizacije puteva.
- **[istraživanje]** CEDIS je nadležan za distributivnu mrežu u cijeloj zemlji, ali kvarove prima samo telefonom (020 622 773). `korisnik@cedis.me` izričito isključuje kvarove.
- **[istraživanje]** Prirodan koordinator i rezervni primalac je Služba za građane: zvanično prosljeđuje zahtjeve o nadležnosti u roku od 48h. Na sajtu ipak stoji samo lični mejl rukovodioca. Komunalna policija ima komunalni nadzor nad gotovo svim oblastima.
- **[istraživanje]** Portal „Građanski servis" (`gradjanski.podgorica.me`), koji linkuju „Komunalne usluge", nije radio 2026-11-02. Njegovo rutiranje je nepotvrđeno i treba ga ponovo provjeriti.

[Nalazi](../research/02-nadleznost-podgorica.md)
