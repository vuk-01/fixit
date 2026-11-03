# 19 — Završna provjera i usaglašavanje dokumenata

Type: grilling
Status: resolved
Blocked by: 08, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18
Mapa: [map.md](../map.md)

## Question

Da li su `PRD.md`, `Tech.md`, `DB.md`, `AGENTS.md`, `UI.md` i `GLOSSARY.md` međusobno usaglašeni i dovoljni da agenti grade P0 bez pitanja? Ovo je dolazak na destinaciju mape.

Prije razrješenja prolazim kroz kontrolnu listu i upisujem nalaze ovdje; tvoj odgovor je „odobreno" ili spisak izmjena.

Kontrolna lista (dopunjava se tokom mape):
- [x] Svaki FR iz PRD-a ima odluku u Tech/DB ili je eksplicitno P1/P2. *Provjereno FR-1–FR-25; FR-19 je P1. P0 status FR-17 i anonimne podrške je u Q2/Q3.*
- [x] PRD §10 „Otvorena pitanja" je prazan ili sadrži samo stvari koje ne blokiraju P0. *Prepisan: 7 stavki, svaka sa rezervom ili rokom.*
- [x] PRD §9 „Plan po danima" odgovara stvarnom kritičnom putu (utorak počinje izradom, ne podizanjem dokumenata). *Utorak = Ivanin setup + migracije, kolege kreću čim su tipovi u `main`.*
- [x] FR-3, FR-5, FR-8, FR-15, FR-18, FR-23 izmijenjeni prema tiketima 10 i 15. *FR-3/FR-5 su već bili; FR-8 i FR-15 „podnošenje"; FR-18 14 redova; FR-23 dva pojma.*
- [x] Svi nazivi u PRD-u, DB-u i UI-ju se poklapaju sa `GLOSSARY.md` (npr. „Like" → naziv iz tiketa 09). *Nema „Like"/„lajk"; dopis, prijavilac, „Drugi problem", primalac/kopija ispravljeni.*
- [x] AGENTS.md tabela „Izvori istine" navodi i `UI.md` i `GLOSSARY.md` (trenutno `UI.md` nedostaje). *Već je bilo (tiket 12); dopunjeni opisi za `Tech.md` i `DB.md`.*
- [x] AGENTS.md sadrži radni proces iz tiketa 12. *Već je bilo; dodat red o demo nalozima.*
- [x] `Tech.md` navodi svaku dozvoljenu zavisnost (pravilo 8). *Skripte iz `scripts/` idu kroz Node 24, bez nove zavisnosti.*
- [x] `DB.md` ima šemu, RPC, RLS, storage, Realtime i seed. *Da; dodato obrazloženje za javno čitanje `institutions`.*
- [x] Nijedan dokument ne navodi instituciju u kontekstu prompta (pravilo 1). *PRD tabela vrsta i Tech §7 provjereni.*
- [x] Sav primjer teksta za korisnika je crnogorski, latinica, ijekavski. *Pretraga po ekavskim oblicima; jedini pogodak je namjerna lista u Tech §7.*
- [x] (iz 14) Guard u `lib/email/send.ts` preusmjerava i kopiju (`cc`) na `TEST_INBOX`; AGENTS.md test 1 to pokriva. *FR-12 i test 1: primalac i `cc`, „sve osim `live` = test", bez `TEST_INBOX` nema slanja.*
- [x] (iz 14) AGENTS.md pravilo 1 pominje da je ručno raspoređivanje od strane administratora jedini put do primaoca van tabele pravila. *Dodata rečenica (ručno raspoređivanje ili preusmjeravanje).*
- [x] (iz 16, 17) Imena env varijabli su ista u Tech.md (stack i odjeljak „Hosting, domen i mejl"). *Ista imena u Tech, AGENTS, PRD, DB; dodat `DEMO_PASSWORD`; opis `TEST_INBOX` usklađen sa 08 (namjensko sanduče).*
- [x] (iz 08) Plan po danima u PRD §9 je pomjeren, jer je planiranje ušlo u utorak.
- [x] (iz 08) Da li panel institucije i podrške uživo ostaju P0, iako ih video ne prikazuje. (11 predlaže da anonimna podrška pređe u P1, jer nema QR koda.) *→ Q2, Q3: panel, brojač uživo i anonimna podrška ostaju P0; moderacija na `/admin` je P1.*
- [x] (iz 09, 14) `GLOSSARY.md` dobija pojmove iz 14: pravilo nadležnosti, kopija (cc), izvor pravila, slabiji izvor, ručno raspoređivanje; i „Drugi problem" iz 13. *Urađeno u dopuni tiketa 09.*
- [x] (iz 09) PRD FR-23 i rječnik: „preusmjeravanje" = promjena primaoca nakon `not_competent`; prvi izbor iz `routing` = „ručno raspoređivanje". *FR-23, FR-18 (red 6), §3, §8 `/admin`; rječnik proširen i na preusmjeravanje iz `sent`/`acknowledged`/`in_progress` (kao FR-18 red 13).*
- [x] (iz 09) PRD FR-10, FR-11 i §1 koriste „dopis" gdje misle na tekst za instituciju; „autor" → „prijavilac" (§6, FR-16). *I §4.2, §6 Pouzdanost; „autor" uklonjen iz FR-5, FR-18 i §6.*
- [x] (iz 09) Šta građanin vidi kad je prijava u `routing` (ekran uspjeha kaže „Prijava poslata", a status „Određuje se nadležni"); izgled dugmeta nakon podrške („Podržano", bez povlačenja u P0). *→ Q8, upisano u FR-8 i FR-16.*
- [x] (iz 11) Tekst stranice `/privatnost`. *Zadatak za izradu u PRD §10 (Ivana pregleda prije predaje); pasus za `/uloguj-se` iz 11 Q7 upisan u PRD §6.*
- [x] (iz 10) FR-11 „Jedna prijava se može poslati samo jednom" se kosi sa preusmjeravanjem (novi dopis za istu prijavu); preformulisati u „jedan dopis jednom primaocu". *Sada: građanin podnosi jednom; jedan dopis jednom primaocu, uspješno najviše jednom; novi primalac = novi dopis.*
- [x] (iz 10) FR-6 kaže „fotografiju" (jednina), a prijava sada ima do 3 fotografije. *FR-6 (1–3 u jednom pozivu, oznaka ličnih podataka po fotografiji, `image_contains_instructions`), §4.1, `/p/[code]`.*
- [x] (iz 10, 15) PRD FR-2 ima ekavsko „posle"; proći cijeli PRD i ostale dokumente tražeći ekavicu i engleske riječi u tekstu za korisnika. *FR-2 je već imao „poslije"; ostatak čist.*
- [ ] (iz 17) Upisati tačnu zakrpljenu verziju Next.js 16.4.x u Tech.md čim izađe; do tada nema deploy-a. *Ne mogu provjeriti iz ove sesije; prebačeno u PRD §10 (ne blokira kostur).*
- [x] (iz 17) Poruka „van Podgorice" stiže tek nakon klasifikacije (do 15 s). Provjeriti da li lokaciju treba provjeriti odmah pri potvrdi pina, prije AI rezultata. *→ Q6: provjera na „Potvrdi lokaciju", Tech §6 i DB §8.5 usklađeni sa FR-5.*
- [x] (iz 17) Adresa ispod pina povećava broj Nominatim poziva u odnosu na nalaz 03; potvrditi keširanje i ograničenje (1/s). *Tech §8 već ima ~800 ms poslije `moveend`, 1/s, sačuvanu konačnu adresu; dodata rezerva „prvo se ukida adresa ispod pina".*
- [x] (iz 15, 10) FR-11 je sužen: građanin mijenja samo vrstu i opis, ne cijeli dopis. *Već u FR-11.*
- [x] (iz 18) Tech.md: dodati `scripts/`, `pnpm db:seed-demo` / `db:clear-demo`, `DEMO_PASSWORD`; uskladiti tekst o `sendReport` i admin klijentu sa DB.md. *§3, §4, §5, §6 (`classify`, `prepare`, `sendReport` kao niz iz DB §8.5), §10, §11.*
- [x] (iz 18) AGENTS.md: „razvoj samo sa demo nalozima" i pravilo `revoke`/`grant` za svaku funkciju. *Red u „Baza", zlatno pravilo 4; test 4 dobio poziv serverske funkcije.*
- [x] (iz 18) PRD FR-7 i tiket 15 koriste „Nešto drugo", a rječnik „Drugi problem". *FR-7 ispravljen; tiket 15 nije dokument izrade.*
- [x] (iz 18) Dvije različite poruke za dnevni limit; „sutra" → „sjutra". *U dokumentima je samo tekst iz PRD §6 („sjutra"); tekst iz tiketa 15 ne važi.*
- [x] (iz 18) PRD FR-18 ima 13 redova prelaza, a tiket 10 ih ima 14. *Dodat red 4 i kolona „#" kao u DB §8.4.*
- [x] (iz 18) PRD FR-5 „autor" → „prijavilac".
- [x] (iz 18) Institucije su javno čitljive u DB.md, što odstupa od tiketa 14 — uskladiti. *18 je kasniji i odgovara na razlog iz 14 (`notes`/`verified_by` su u `jurisdiction_rules`); obrazloženje u DB §9.*
- [x] (iz 10) Pojmove iz 10 (`closed_at`, „otvorena prijava", dan po kalendaru Europe/Podgorica) uskladiti sa `GLOSSARY.md`. *Nov pojam „zatvorena prijava"; brojač dana po kalendaru u Podgorici i do odbijanja; `closed_at` ostaje u DB-u (rječnik bez implementacije).*

## Nalazi završne provjere

*Pripremljeno 3. 11. 2026. Tiket ostaje otvoren dok ne odgovoriš na Q1–Q8.* Mehaničke ispravke (one koje imaju jedan tačan odgovor iz tiketa ili rječnika) su već unesene; odluke koje niko nije donio su pitanja Q2–Q8.

**Šta je ispravljeno, po dokumentu**

- **`PRD.md` (27 izmjena):** „dopis" umjesto „prijava" za tekst instituciji (§1, §4.2, FR-10, FR-11, §6 Pouzdanost); „prijavilac" umjesto „autor" (FR-5, FR-18, §6); „Drugi problem" u FR-7; FR-6 za 1–3 fotografije i oznaku ličnih podataka po fotografiji; FR-8 i FR-15 govore o podnošenju; FR-11: „samo jednom" preformulisano po tiketu 10, neuspjelo slanje ostavlja nacrt sa kodom, dopis ide i kopiji; FR-12 pokriva `cc`; FR-18 ima 14 numerisanih prelaza kao DB §8.4; FR-23 razdvaja ručno raspoređivanje (P0) i preusmjeravanje (P1); §6 dobio tekst pasusa za `/uloguj-se` (11 Q7); §8: `/p/[code]` (fotografije, adresa, „Zašto ova institucija?", dopis nije javan), `/panel` (filteri su P1), `/panel/prijave/[id]`; §9 pomjeren (izrada od danas, petak = snimanje); §10 sadrži samo stavke koje ne blokiraju; zaglavlje 0.2 i `UI.md`.
- **`GLOSSARY.md` (11 pojmova, 4 nova):** „podnošenje" i „broj prijave" su se kosili sa FR-24 i DB-om (kod se dodjeljuje pri prvom dodiru, a neuspjelo slanje ostavlja nacrt), pa su ispravljeni; „fotografija" (1–3); „brojač dana" (kalendarski dani u Podgorici, staje i pri odbijanju); „preusmjeravanje" prošireno kao u FR-18 red 13; „sakrivena prijava" pominje i fotografiju; „agent" u množini. Novi: zatvorena prijava, označena fotografija, dostavljanje podataka, ručni tok.
- **`Tech.md` (11 izmjena):** folder `scripts/` i napomena da `seed.sql` ne postoji; `app/prijavi/actions.ts` nosi i akcije za fotografije, „Odustani" i „Podrži postojeću"; §4 tačno nabraja šta radi admin klijent; §5 odlučeno: Server Action + RPC za fotografije; §6 `classify`/`prepare` imenuju RPC-ove, a `sendReport` je niz iz DB §8.5; §8 rezerva kad Nominatim odbija; §10 `DEMO_PASSWORD`; §11 `db:seed-demo` i `db:clear-demo`; `TEST_INBOX` je namjensko sanduče iz tiketa 08 (16 je pisao „Ivanin mejl"; tvoj odgovor u 08 Q5 ima prednost).
- **`AGENTS.md` (7 izmjena):** pravilo 1 (ručni izbor administratora je jedini drugi put do primaoca); pravilo 4 (`revoke`/`grant` na svakoj funkciji); red „razvoj samo sa demo nalozima"; test 1 (`cc`, „sve osim `live`", bez `TEST_INBOX` nema slanja); test 4 (poziv serverske funkcije); oštriji opisi `Tech.md` i `DB.md` u „Izvorima istine"; „dopis" u uvodu.
- **`DB.md` (1 izmjena):** obrazloženje zašto je `institutions` javno čitljiva (18 je kasniji od 14 i rješava njegov razlog). DB.md je bio referenca prema kojoj su ostali usklađeni.
- **`UI.md`:** bez izmjena; ništa se ne kosi.

**Šta sam uskladio sam, a vrijedi da vidiš**

- FR-23, tekst u vremenskoj liniji za ručno raspoređivanje: tiket 10 kaže „Proslijeđeno: {institucija}", a tiket 14 i rječnik „Nadležnog je odredio administrator Fixita". Spojio sam ih: oba teksta, jedan ispod drugog.
- Tech §6 `prepare`: adresa se sada uzima prije `update_draft` (kao u DB §8.5), ne paralelno sa nadležnošću.

**Šta ostaje otvoreno**

- Q2–Q8 ispod. Q2, Q3, Q4 i Q6 mijenjaju posao od danas (Q4 prije migracije 4); Q5, Q7 i Q8 su manji.
- Stavke u PRD §10 (domen, ponovna provjera mejlova, zakrpa Next.js-a, `TEST_INBOX`, preview za kolege, `/privatnost`, tiket 20): nijedna ne blokira kostur.
- Zakrpljenu verziju Next.js-a nisam mogao provjeriti iz ove sesije; nema deploy-a dok se ne upiše.
- Kad odgovoriš: Q3 „da" mijenja PRD §3, FR-16, §6, Tech §1, DB §13 i rječnik („anonimni korisnik" postaje P1); Q5 (b) „da" mijenja jedan red u AGENTS.md („Baza"); Q6 „da" dodaje jedan korak u Tech §6.

❓ **Q1 - Odobravaš dokumente kao osnovu za izradu**: Da li odobravaš dokumente u stanju opisanom u nalazima ispod (biće upisani), kao osnovu za izradu od utorka?

➡️ Da, uz izmjene koje navedeš.

**Tvoj odgovor:** Da

---

❓ **Q2 - Šta ostaje P0 iako ga video ne prikazuje**: P0 znači „mora raditi na demou", a demo je video iz ugla građanina (08). U videu se ne vide: panel institucije (§4.3, FR-20–22), brojač podrški koji raste uživo (FR-17, Realtime) i moderacija na `/admin` (lista označenih fotografija i sakrivanje, §8; u §4.4 nema P oznaku). Šta od toga gradimo do petka?

➡️ Panel (ulogovanje službenika, lista, promjena statusa uz poruku) ostaje **P0**, jer bez njega se status u sceni 3 videa ne može promijeniti van kadra, a i nosi priču o licenci. Brojač podrški **uživo** (FR-17) prelazi u **P1**: brojač se prikazuje pri učitavanju stranice; migracija 8 (`reports` u Realtime) ostaje, jer je jedan red, pa P1 dodaje samo pretplatu na klijentu. Moderacija na `/admin` prelazi u **P1**; RPC funkcije za sakrivanje ostaju u migraciji 6, a u hitnom slučaju Ivana postavlja `hidden_at` u Supabase Table Editoru (bez reda u `moderation_log`). Demo fotografije su ionako bez lica i tablica.

**Tvoj odgovor:** Zelim da se brojac podrski vidi u demo, npr. korisnik klikne na njega i poraste brojac.

---

❓ **Q3 - Anonimna podrška prelazi u P1**: Anonimne sesije su postojale zbog publike koja skenira QR kod; QR je izbačen, a video prikazuje građanina sa nalogom. Tiket 11 predlaže da podrška bez naloga pređe u P1. Da li u P0 podržava samo ulogovan građanin?

➡️ Da. U P0 gost koji dodirne „Podržavam" ide na `/uloguj-se?next=/p/[code]`. Šema se ne mijenja (`like_report` već prima i anonimnu sesiju), pa je P1 samo uključivanje Anonymous Sign-Ins i jedan poziv na klijentu. U P0 Anonymous Sign-Ins ostaje isključen, RLS test 4 i dalje provjerava anonimni (publishable) ključ, a dio testa sa anonimnom sesijom dolazi sa P1. Uklanja se rizik zloupotrebe iz §6 i posao oko anonimnih sesija u prvim danima.

**Tvoj odgovor:** Gradjanin moze da podrzi prijavu bez da bude ulogovan. 

---

❓ **Q4 - Opis prijave nije javan**: `DB.md` drži naslov, opis i ozbiljnost u `report_details`, koji javnost ne čita (rizična tačka 5 iz tiketa 18). PRD §8 i pasus o privatnosti (11 Q7) ga takođe ne navode kao javan, pa su dokumenti usklađeni, ali to niko nije izričito odlučio. Odluka treba prije migracije 4 (danas).

➡️ Da, opis ostaje nejavan. Javna stranica prikazuje fotografije, vrstu, adresu, status, nadležnu instituciju, brojač dana i podrške. Opis može sadržati lične podatke koje je građanin otkucao, a prijava se objavljuje bez prethodne moderacije (11 Q2). Opis vide prijavilac, službenik primaoca (u dopisu) i administrator.

**Tvoj odgovor:** Neka pise opis uz sliku.

---

❓ **Q5 - Demo prijave: oznaka i kad se brišu**: (a) Demo prijave imaju izmišljene, neutralne poruke koje se pripisuju stvarnim institucijama (Sekretarijat, Čistoća…) i upisane brojeve podrški (DB §12.4). Tiket 18 predlaže malu oznaku „Demo prijava"; nije u PRD-u, UI.md ni rječniku. (b) AGENTS.md kaže da se demo podaci brišu **prije predaje**; tada žiri koji otvori link vidi praznu mapu (18, „Za provjeru" 3d).

➡️ (a) Da: mala oznaka „Demo prijava" (shadcn `Badge`) na `/p/[code]` i u oblačiću markera za `is_demo = true`; rječnik dobija pojam „demo prijava". Vidi se i u videu, što je pošteno prema žiriju. (b) Demo podaci ostaju do kraja ocjenjivanja i brišu se poslije; red u AGENTS.md („Baza") se mijenja u „nakon ocjenjivanja".

**Tvoj odgovor:** Da

---

❓ **Q6 - Provjera „van Podgorice" odmah na „Potvrdi lokaciju"**: PRD FR-5 (korak 3) i tiket 15 određuju opštinu odmah poslije potvrde pina, prije čekanja analize. Tech.md §6 tu provjeru radi u ruti `prepare`, koja traži poznatu vrstu, pa građanin poruku iz FR-4 vidi tek kad analiza završi (do 15 s) ili kad ručno izabere vrstu (17, „Za provjeru" 4). Dokumenti se razilaze; koji redoslijed važi?

➡️ Provjera na „Potvrdi lokaciju", kao u PRD-u: klijent zove RPC `resolve_municipality(lat, lng)` (već ima grant `authenticated`, DB §8.2) i van Podgorice odmah prikazuje poruku iz FR-4 i ostaje na mapi. Šema se ne mijenja; Tech §6 dobija jedan korak, a provjera u `prepare` i trigger ostaju kao druga i treća brava.

**Tvoj odgovor:** Da

---

❓ **Q7 - Preostale rizične tačke iz tiketa 18 koje su izbor politike**: Tačke 5 i 8 su u Q4 i Q5, a tačka 9 je unesena u AGENTS.md. Ostaju tri prihvaćena rizika: (6) ako server padne poslije uspješnog slanja u Resendu, a prije `complete_dispatch`, ponovni pokušaj poslije 2 minuta šalje drugi mejl (u testnom režimu samo drugi mejl u `TEST_INBOX`); (7) svaka ispravka mejla institucije ili pravila je nova migracija koju radiš ti; (10) svaki građanin sa nalogom može otpremiti fajl u Storage i bez nacrta, pa zlonamjeran nalog može napuniti 1 GB Free plana.

➡️ Prihvatiti sva tri za hakaton, bez izmjena; prije pilota ih ponovo otvoriti (čišćenje fajlova bez reda u bazi je već u DB §14). Tačke 1–4 su tehničke posljedice zlatnih pravila i odobravaju se sa Q1.

**Tvoj odgovor:**

---

❓ **Q8 - Sitna stanja u UI-ju koja niko nije odlučio**: (a) Šta piše na dugmetu poslije podrške (povlačenje podrške je već van P0, FR-16)? (b) Prijava u `routing`: ekran uspjeha kaže „Prijava poslata", a javna stranica „Određuje se nadležni" (09, „Za provjeru"); da li je to jasno? (c) Ekran pregleda prikazuje stvarnu instituciju, a dopis u testnom režimu ide na `TEST_INBOX`; da li aplikacija treba oznaku „Testni režim" (14, magla)?

➡️ (a) „Podržano", onemogućeno dugme uz isti brojač. (b) Da, ostaje tako: naslov „Prijava poslata", ispod poruka iz FR-8, jer je građanin prijavu zaista podnio. (c) Bez oznake u aplikaciji u P0; u videu i prezentaciji jedan natpis da dopisi u demou idu na testno sanduče, ne institucijama.

**Tvoj odgovor:** Da

---

## Answer

- **Q1 — Odobrenje:** dokumenti su odobreni kao osnova za izradu, uz izmjene iz Q2–Q8 ispod **[Ivana]**. Tačke 1–4 iz tiketa 18 (tehničke posljedice zlatnih pravila) odobrene su time.
- **Q2 — Brojač podrški uživo:** FR-17 (Realtime) ostaje **P0** i prikazuje se u videu: građanin na demo prijavi dodirne „Podržavam" i brojač poraste **[Ivana]**. **Panel institucije** ostaje **P0** **[Claude]**, jer se bez njega status u sceni 3 videa ne može promijeniti van kadra, a panel nosi i priču o licenci. **Moderacija na `/admin`** (lista označenih fotografija, sakrivanje) prelazi u **P1** **[Claude]**: video je ne prikazuje, RPC-ovi za sakrivanje ostaju u migraciji 6, u hitnom slučaju Ivana postavlja `hidden_at` u Table Editoru (bez reda u `moderation_log`), a demo fotografije su bez lica i tablica (tiket 21 Q3).
- **Q3 — Anonimna podrška:** ostaje **P0**: građanin može podržati prijavu bez ulogovanja **[Ivana]**. Prijedlog iz tiketa 11 (P1) se ne primjenjuje. Dokumenti to već imaju (PRD §3, FR-16, §6; Tech §1; DB §13 „Anonymous Sign-Ins uključen"), pa izmjene nisu potrebne.
- **Q4 — Opis je javan:** opis problema se prikazuje uz fotografije na javnoj stranici **[Ivana]**. Kolona `description` prelazi iz `report_details` u `reports` **[Claude]**, a ne u javni pogled, jer DB §8.1 zabranjuje poglede (u Supabase-u zaobilaze RLS); `reports` time i dalje nema nijedan ID korisnika, a Realtime nosi samo javne kolone. **Naslov iz modela (`title`) ostaje nejavan** u `report_details`, a naslov javne stranice je naziv vrste i adresa **[Claude]**, jer građanin naslov ne vidi ni ne mijenja na pregledu (FR-11), a u ručnom toku ga nema. Ozbiljnost, pouzdanost, sirova vrsta modela i ostala AI polja ostaju nejavna. Ispod polja „Opis problema" na pregledu stoji „Opis je javan i vidi se uz fotografiju. Ne upisujte ime, broj telefona, mejl ni druge lične podatke." **[Claude]**, jer se prijava objavljuje bez prethodne moderacije (11 Q2), a ekran za moderaciju je P1 (Q2).
- **Q5 — Demo prijave:** (a) oznaka „Demo prijava" (shadcn `Badge`) na `/p/[code]` i u oblačiću markera; (b) demo podaci ostaju do kraja ocjenjivanja i brišu se poslije, ne prije predaje **[Ivana]**.
- **Q6 — Provjera „van Podgorice":** odmah na „Potvrdi lokaciju", preko RPC-a `resolve_municipality` sa sesijom građanina; van Podgorice poruka iz FR-4 i ostanak na mapi **[Ivana]**. Ako RPC ne odgovori (mreža), tok ide dalje, a odluku donosi `prepare` **[Claude]**, da kvar mreže ne zaključa građanina na mapi; `prepare` i trigger ostaju kao druga i treća brava.
- **Q7 — Rizici 6, 7 i 10 iz tiketa 18:** prihvaćeni za hakaton bez izmjena i ponovo se otvaraju prije pilota **[Claude]**, po preporuci: posljedice su ograničene na testno sanduče, Ivanin rad na migracijama i 1 GB Free plana, a ispravke traže posao koji nije P0. Upisani u DB §14.
- **Q8 — Sitna stanja u UI-ju:** (a) „Podržano", onemogućeno dugme uz isti brojač; (b) naslov „Prijava poslata" i u `routing`, sa porukom iz FR-8 ispod; (c) bez oznake „Testni režim" u aplikaciji u P0, a u videu i prezentaciji jedan natpis da dopisi u demou idu na testno sanduče **[Ivana]**.

### Izmjene u dokumentima

- `PRD.md`: §4.1 (javna stranica sa opisom); §4.4 (nova P1 stavka za moderaciju i rezerva preko Table Editora); FR-8 (ekran uspjeha u `routing`); FR-11 (napomena ispod opisa); FR-16 („Podržano"); FR-17 (P0 i u videu); FR-25 (oznaka „Demo prijava", brisanje poslije ocjenjivanja); §6 Privatnost (nova stavka „Opis je javan" sa tekstom napomene, moderacija P1, pasus za `/uloguj-se` sada navodi opis); §8 `/p/[code]` (naslov = vrsta i adresa, opis, oznaka) i `/admin` (moderacija P1); §9 (scena 4 sa dodirom na „Podržavam", natpis o testnom sandučetu, subota: demo podaci ostaju).
- `DB.md`: §1 (opis je u javnim podacima); §4.3 (`reports.description` sa CHECK-om; `report_details` bez `description`, napomena za `title`); §5 (tabela javno/privatno); §8.2 (`resolve_municipality` zove i klijent); §8.3 (`record_classification` i `begin_submission` pišu u `reports.description`; `set_report_hidden`/`set_photo_hidden`: ekran P1, rezerva preko Table Editora); §8.5 (korak 1a, provjera na „Potvrdi lokaciju"); §9 (napomena „Opis je javan"); §11 (Realtime nosi opis, nejavna kolona nikad u `reports`); §12.4 (oznaka „Demo prijava", opis demo prijava bez izmišljanja); §12.5 (brisanje tek poslije ocjenjivanja); §14 (prihvaćeni rizici).
- `Tech.md`: §6 (novi korak: provjera opštine na „Potvrdi lokaciju"; `prepare` tek za tačku u Podgorici); §9 (FR-17 je P0).
- `AGENTS.md`: „Baza": demo podaci se brišu poslije ocjenjivanja, ne prije predaje.
- `GLOSSARY.md`: novi pojmovi „Opis problema" i „Demo prijava"; „Prijava" navodi opis; „Podrška" navodi „Podržano".
- `UI.md`: bez izmjena.
- Istog dana je primijenjena i izmjena tiketa 16 (bez domena); vidi tiket 16, „Izmjena odluke (3. 11.)".

### Ostaje otvoreno

- Tačan broj zakrpljene verzije Next.js 16.4.x (PRD §10): bez njega nema prvog Vercel deploy-a.
- Ostale stavke PRD §10; nijedna ne blokira kostur.
