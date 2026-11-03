# 22 — Nejasnoće iz nacrta tiketa za izradu

Type: grilling
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Nacrt tiketa za izradu ([build-issues.md](../build-issues.md), 17 tiketa) je otkrio 12 mjesta gdje dokumenti nisu dovoljno precizni za agenta. Stavka 1 (`TEST_INBOX`) je već ispravljena prema tvojoj odluci: PRD i DB.md sada kažu da je to tvoj lični mejl. Ostalih 11 su pitanja ispod. Kad odgovoriš, upisujem odgovore u dokumente i pravim GitHub Issues.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Jedna seed skripta, dva načina rada**: PRD §9 pokreće `pnpm db:seed-demo` u utorak (demo nalozi) i u četvrtak (demo prijave), a DB.md opisuje jednu skriptu koja odbija da radi ako već postoji demo prijava. Da li skripta ima dva načina rada?
- `pnpm db:seed-demo -- --accounts`: pravi samo naloge koji ne postoje (utorak);
- `pnpm db:seed-demo`: pravi i demo prijave, i to samo ako nijedna ne postoji (četvrtak).

➡️ Da. Kolege dobijaju naloge prvog dana, a demo prijave se ne dupliraju.

**Tvoj odgovor:** Kad napravimo app, potrebno je da vec budu napravljeni neki demo nalozi preko kojih mi mozemo da se ulogujemo. ti nalozi ce sluziti i za demo video. Potrebno je par naloga, cisto radi prikaza aplikacije.

---

❓ **Q2 - Datumi demo prijava se računaju od fiksnog dana snimanja**: Demo prijave imaju „stare" datume (npr. poslata prije 14 dana). Da li skripta računa unazad od fiksnog datuma snimanja, petka 6. 11. 2026, a ne od trenutka pokretanja?

➡️ Da. Tako brojači dana u videu izgledaju tačno kako je planirano, bez obzira kad je seed pokrenut.

**Tvoj odgovor:** Da

---

❓ **Q3 - Prijava snimljena u videu ima oznaku „Demo prijava"**: Nalog `citizen-video` je demo nalog, pa i prava prijava snimljena u videu dobija oznaku „Demo prijava" i briše se sa `db:clear-demo`. Da li je to u redu?

➡️ Da. Oznaka je poštena, jer i ta prijava ide samo na testni mejl, a ne instituciji. Natpis u videu to ionako objašnjava.

**Tvoj odgovor:** Da

---

❓ **Q4 - Redoslijed u četvrtak: proba → brisanje → seed**: Probne prijave sa generalne probe u četvrtak bi ostale otvorene i u petak bi dale ekran „postoji slična prijava". Da li je redoslijed u četvrtak uveče ovakav?
1. generalna proba;
2. `pnpm db:clear-demo`, koje briše i probne prijave, jer tim radi samo sa demo nalozima;
3. `pnpm db:seed-demo`;
4. u petak snimanje na čistim podacima.

➡️ Da. Ne treba nova funkcija za brisanje pojedinačne prijave.

**Tvoj odgovor:** Zelim da imamo vec unapred par demo naloga i par demo prijava. Pokazivacemo iste prijave, nije potrebno nikakvo brisanje ni nista. Takodje potrebna je opcija da se novi acc moze napraviti ali to nece biti prikazano u demo videu, to samo treba ovako da radi. Takodje u demo videu zelim da prikazem kako se jedna prijava pravi i tok koraka dalje. To me pitaj ako nesto nije jasno. Ovo cu posebno negdje etaljno objasniti. Za sad nije potrebno da ti pravis nikakav demo video, samo app koja radi.

---

❓ **Q5 - Pregled dopisa prije slanja ima privremena polja**: Na ekranu pregleda „Prikaži cijeli tekst" prikazuje dopis prije nego što prijava dobije broj, datum i broj ranijih prijava. Da li pregled na tim mjestima piše „dodjeljuje se pri slanju", a pravi podaci se upisuju tek u poslati dopis?

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q6 - Šablon dopisa kao čista funkcija, dijeljena sa seed-om i testovima**: Seed skripta i testovi ne mogu uvesti `report-letter.ts`, jer taj fajl ima `import 'server-only'`. Da li se sam šablon izdvaja u `lib/email/letter-template.ts`, bez `server-only` i bez aliasa `@/`, a koriste ga i server, i seed, i testovi? U Vitest-u se `server-only` mockuje.

➡️ Da. Isti šablon na sva tri mjesta znači da demo dopisi izgledaju isto kao pravi.

**Tvoj odgovor:** Da

---

❓ **Q7 - Dugme „Odjavi se" je P0**: Nijedan dokument ne pominje odjavu, a tim i video koriste više naloga na istim uređajima. Da li dodajemo jednostavno „Odjavi se" u meni zaglavlja?

➡️ Da. To je posao od par minuta, a bez toga se nalozi mijenjaju brisanjem kolačića.

**Tvoj odgovor:** Da

---

❓ **Q8 - Ako kolege ne dobiju Vercel preview**: Kamera i GPS na telefonu traže HTTPS, a besplatni Vercel možda neće praviti preview za commitove kolega. Da li je rezerva ovakva?
- Kolege testiraju na računaru, na `localhost`-u, gdje browser dozvoljava kameru i lokaciju.
- Na telefonu se testira tek kad ti spojiš PR u `main` i on se deploy-uje.
- Prvog dana provjeravamo da li preview za kolege uopšte radi.

➡️ Da.

**Tvoj odgovor:** 

---

❓ **Q9 - Photon nije u P0**: Tech.md pominje Photon kao rezervu za adresu, ako Nominatim odbija zahtjeve. Da li ga pravimo tek ako Nominatim stvarno počne da odbija, a ne unaprijed?

➡️ Da.

**Tvoj odgovor:**

---

❓ **Q10 - Boje i ikone statusa iz preseta**: FR-14 traži boju po statusu, a UI.md kaže da boje dolaze iz preseta. Da li važi ova tabela? Boje su tokeni iz preseta, a ikone iz biblioteke koju preset već koristi (lucide).

| Status | Boja (token) | Ikona |
|---|---|---|
| `routing` Određuje se nadležni | `muted` | `CircleHelp` |
| `sent` Poslata | `chart-1` | `Send` |
| `acknowledged` Primljena | `chart-2` | `Eye` |
| `in_progress` U radu | `chart-3` | `Wrench` |
| `resolved` Riješena | `chart-4` | `CircleCheck` |
| `not_competent` Preusmjerava se | `muted` | `ArrowLeftRight` |
| `rejected` Odbijena | `destructive` | `CircleX` |

Status se uvijek prikazuje i tekstom, ne samo bojom (pristupačnost, PRD §6).

➡️ Da. Tačne nijanse zavise od preseta, pa ih provjeravamo kad bude inicijalizovan.

**Tvoj odgovor:** Da

---

❓ **Q11 - Napomena o licima stoji na svakoj prijavi**: Napomena „Izbjegavajte lica i registarske tablice na fotografiji." treba da stoji „pri prvom fotografisanju". Da li je prikazujemo na početnom ekranu `/prijavi` svaki put, kao jedan kratak red?

➡️ Da. Ne treba pamćenje po nalogu, a jedan red ne smeta.

**Tvoj odgovor:** Da

---

## Answer

- **Q1** [Ivana] Demo nalozi postoje čim postoji aplikacija (prvo pokretanje seed-a u utorak, odmah poslije migracije 10); njima se tim uloguje i isti služe za video. `pnpm db:seed-demo` ima jedan način rada, bez `--accounts`: pravi samo naloge koji nedostaju, a demo prijave samo ako `citizen-seed` još nema nijednu. Spisak naloga iz `DB.md` §12.3 ostaje.
- **Q2** [Ivana] Da: datumi demo prijava se računaju unazad od petka 6. 11. 2026. (`Europe/Podgorica`), ne od trenutka pokretanja. [Claude] dopuna: vrijeme koje bi palo u budućnost (red 6, „danas") pomjera se na nekoliko minuta prije pokretanja, pa u bazi nema datuma iz budućnosti, a „Riješeno istog dana" ostaje tačno.
- **Q3** [Ivana] Da: prijava snimljena u videu sa `citizen-video` je `is_demo` i nosi oznaku „Demo prijava"; briše je `db:clear-demo` tek poslije ocjenjivanja.
- **Q4** [Ivana] Demo nalozi i demo prijave su napravljeni unaprijed; na probi, u videu i na ocjenjivanju se prikazuju iste prijave, bez brisanja i bez ponovnog seed-a (nema četvrtka „proba → `db:clear-demo` → `db:seed-demo`"). Registracija novog naloga radi, ali se u videu ne prikazuje. Video pokazuje kako se pravi jedna prijava i tok koraka poslije nje; detaljan plan snimanja Ivana daje posebno, a tiketi za izradu prave samo aplikaciju koja radi. [Claude] posljedica: pošto probne prijave ostaju, proba se ne radi na mjestu snimanja za vrstu koja se snima.
- **Q5** [Ivana] Da: pregled dopisa na mjestu broja prijave, datuma i vremena prijave i broja ranijih prijava piše „dodjeljuje se pri slanju"; pravi podaci idu tek u poslati dopis.
- **Q6** [Ivana] Da: šablon je čista funkcija `lib/email/letter-template.ts` (bez `server-only`, bez `@/`, bez uvoza vrijednosti), koju koriste server, seed i testovi; `server-only` je u Vitest-u mockovan za sve testove (`setupFiles`).
- **Q7** [Ivana] Da: „Odjavi se" u meniju zaglavlja je P0, za svaki nalog koji nije anoniman.
- **Q8** [Claude] Preporuka: prvog dana se provjerava da li Vercel Hobby pravi preview za commit kolege; ako ne, kolege provjeravaju na računaru na `localhost`-u (kamera i lokacija tamo rade), a na telefonu tek kad Ivana spoji PR u `main` i on se deploy-uje.
- **Q9** [Claude] Preporuka: Photon nije u P0; pravi se tek ako Nominatim stvarno počne da odbija zahtjeve.
- **Q10** [Ivana] Da: tabela boja (tokeni iz preseta) i lucide ikona po statusu je u `UI.md`; status se uvijek prikazuje i tekstom; nijanse se provjeravaju poslije `init`-a.
- **Q11** [Ivana] Da: napomena „Izbjegavajte lica i registarske tablice na fotografiji." stoji kao jedan red na početnom ekranu `/prijavi` pri svakoj prijavi, bez pamćenja po nalogu.

### Otvoreno

- **Probne prijave iz razvoja ostaju na mapi.** Pošto se prije videa ništa ne briše (Q4), sve prijave koje tim napravi sa `dev-*` i `citizen-video` naloga (i probne sa generalne probe) ostaju javne na mapi u videu i na ocjenjivanju, sa oznakom „Demo prijava". Ako ih ne želiš na mapi, rezerva bez nove funkcije je sakrivanje (`hidden_at`) u Supabase Table Editoru (PRD §4.4); brisanje i ponovni seed su isključeni. Ivana, javi da li je to u redu ili kako želiš da se riješi; do tada dokumenti ne propisuju ništa.

### Izmjene u dokumentima

- `DB.md` §12 (uvod: demo podaci unaprijed, jedan način rada seed-a, bez brisanja do ocjenjivanja); §12.3 (`citizen-video` i oznaka, preskakanje postojećih naloga, registracija ostaje otvorena); §12.4 (`letters` iz `letter-template.ts`, fiksni datum 6. 11. 2026. i pomjeranje budućih vremena, oznaka za prijave demo naloga, proba van mjesta snimanja, novo pravilo protiv udvostručavanja umjesto „odbija ako postoji `is_demo`", atribucija `street_light-2.jpg`); §12.5 (ne pokreće se prije probe ni snimanja; `--accounts` je samo opcija `db:clear-demo`).
- `Tech.md` §3 (`email/letter-template.ts`, izuzetak od `server-only`); §4 (odjava); §6 (korak `letter` sa „dodjeljuje se pri slanju", konačni dopis u `sendReport`); §8 (markeri → `UI.md`, Photon nije u P0); §11 (`db:seed-demo` jedan način rada, uvoz iz `lib/` u skripte sa `.ts`); §12 (`server-only` mock u `setupFiles`); „Hosting" (provjera na telefonu bez preview-a).
- `PRD.md` §4.1 (odjava P0); §4.4 (demo podaci unaprijed, registracija se ne prikazuje u videu, plan snimanja daje Ivana); FR-11 (privremena polja u pregledu); FR-14 (boja, ikona i tekst, `UI.md`); FR-25 (oznaka za prijave demo naloga i prijavu iz videa); §6 (napomena o licima pri svakoj prijavi); §8 (zaglavlje sa „Odjavi se", `/privatnost` sa atribucijom); §9 (Uto i Čet bez brisanja, proba van mjesta snimanja, okvirni scenarij, oznaka na prijavi iz videa); §10 (rezerva bez preview-a).
- `UI.md`: nova sekcija „Status colours and icons".
- `AGENTS.md`: „Tiketi, grane, PR" (rezerva bez preview-a); „Baza (Supabase)" (brisanje tek poslije ocjenjivanja, seed se smije ponoviti); obavezni test 3 (`letter-template.ts`, „dodjeljuje se pri slanju") i napomena o `server-only` mocku; definicija „gotovo".
- `GLOSSARY.md`: „Demo prijava" obuhvata i prijave sa demo naloga.
- `.scratch/fixit-planiranje/build-issues.md`: sekcija „Nejasno u dokumentima" zamijenjena sa „Razriješeno u tiketu 22"; odluke unesene u stavke 1, 5, 6 (sada i odjava i atribucija `street_light-2.jpg` na `/privatnost`), 7, 8, 10, 11, 12, 13, 14, 16 (zavisi i od 10, dan Sri–Čet) i 17 (preimenovana u „Generalna proba i spremnost aplikacije za video").

## Dopuna (3. 11. uveče): probne prijave tima

- **[Ivana]** Probne prijave tima se prije snimanja smiju **obrisati ili sakriti** (`hidden_at`); demo prijave iz seed-a (`citizen-seed`) se ne diraju. Pojedinačne probe se brišu ručno u Table Editoru; za sve odjednom su SQL komande (spisak, sakrij, obriši) u komentaru na issue #17.
- **[Claude]** Pravilo za tim: probu iste vrste problema ne raditi na lokaciji gdje se snima video, da se u snimanju ne pojavi ekran „postoji slična prijava".
