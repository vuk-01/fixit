# 09 — Rječnik domena i nazivi za korisnika

Type: grilling
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Isti pojmovi u PRD-u imaju više značenja, a neki nazivi u UI-ju krše pravilo o jeziku. Prije šeme baze (18) treba zaključati jedan naziv po pojmu: crnogorski za UI, engleski za kod. Rezultat ide u novi `GLOSSARY.md` i u `lib/constants.ts`.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - „Like" postaje „Podrška"**: Dugme „Like" je na engleskom, a AGENTS.md pravilo 6 traži crnogorski. AGENTS.md ga zove „potvrda", ali „potvrda" se već koristi za potvrdu lokacije i potvrdu slanja prijave, pa bi bila dvosmislena. Da li u UI-ju koristimo **„Podrška"**: dugme „Podržavam", brojač „{n} podrški" (1 podrška, 2–4 podrške, 5+ podrški), a u kodu ostaje `like` (tabela `report_likes`, kolona `like_count`)?

Alternative: „I mene ovo muči", „Potvrđujem problem", „+1".

➡️ Da. „Podrška" je kratka, jasna i nije zauzeta drugim značenjem. Kod ostaje `like` jer je kraći i svi ga razumiju; mapiranje se zapisuje u rječnik.

**Tvoj odgovor:** da

---

❓ **Q2 - Prijava, dopis i mejl su tri različite stvari**: PRD riječju „prijava" zove i zapis koji građanin pravi i formalni tekst koji ide instituciji. Da li razdvajamo:
- **prijava** (`report`): zapis o problemu (fotografija, lokacija, vrsta, status, podrške), javno vidljiv;
- **dopis** (`letter`): formalni tekst koji se šalje instituciji (šablon + opis), privatan, čuva se u `report_private`;
- **slanje** (`dispatch`): jedan pokušaj slanja dopisa mejlom, sa ishodom.

Građaninu u UI-ju i dalje pišemo „tekst prijave"; razdvajanje važi za kod i dokumente.

➡️ Da. Bez ovoga šema miješa javne i privatne podatke, a preusmjeravanje (nova institucija → novi dopis za istu prijavu) nema gdje da stane.

**Tvoj odgovor:**

---

❓ **Q3 - „Vrsta problema" u kodu je `category`**: Da li je u UI-ju „vrsta problema", a u kodu `category`? (Riječ „kategorija" u PRD-u se odnosi i na kategoriju puta, koja je van scope-a.)

➡️ Da.

**Tvoj odgovor:** da

---

❓ **Q4 - „Institucija" je svaki primalac**: Da li je **institucija** (`institution`) svaki mogući primalac dopisa (sekretarijat Glavnog grada, komunalno preduzeće, državni organ, javno preduzeće poput elektrodistribucije), dok je **služba** jedinica unutar institucije (P2, van scope-a)? „Nadležna institucija" je institucija koju je za datu prijavu odredilo pravilo.

➡️ Da.

**Tvoj odgovor:** da

---

❓ **Q5 - Ko je „prijavilac"**: Da li je **prijavilac** (`reporter`) građanin koji je napravio prijavu? Tabela korisnika je `profiles`, a uloge su `citizen`, `official`, `admin`. Anonimni korisnik nema profil, nego samo anonimnu sesiju.

➡️ Da.

**Tvoj odgovor:** da

---

❓ **Q6 - Nazivi statusa u UI-ju**: Da li statusi (FR-18) u UI-ju glase:
`draft` „Nacrt" (nikad javno) · `sent` „Poslata" · `acknowledged` „Primljena" · `in_progress` „U radu" · `resolved` „Riješena" · `not_competent` javno „Preusmjerava se", u panelu „Nije naša nadležnost" · `rejected` „Odbijena"?

➡️ Da. Javni naziv za `not_competent` ne smije zvučati kao da je problem zatvoren.

**Tvoj odgovor:** da

---

❓ **Q7 - „Opština" za sve lokalne samouprave**: Da li UI uvijek kaže „opština" (`municipality`), i za Glavni grad Podgoricu i Prijestonicu Cetinje, a puni zvanični naziv koristimo samo u nazivu institucije i u dopisu?

➡️ Da.

**Tvoj odgovor:** da

---

❓ **Q8 - „Fixit" ostaje brend**: Ime „Fixit" nije crnogorska riječ, ali je naziv proizvoda. Da li ostaje kao brend (u UI-ju, dopisu i potpisu „Tim Fixit") i ne smatra se kršenjem pravila o jeziku?

➡️ Da.

**Tvoj odgovor:** da

## Answer

Napomena: skill `wayfinder` nije mogao da se pokrene iz ove sesije (rezervisan je za ručno pokretanje), pa je tiket riješen po koracima iz koordinatorovog uputstva i `wave1-brief.md`; `grilling` i `domain-modeling` su korišćeni kao kontrolna lista.

- **Q1** Podrška: dugme „Podržavam", brojač „{n} podrški" sa gramatičkim oblikom po broju; u kodu `like` (`report_likes`, `like_count`). **[Ivana]**
  - Dopuna: oblik ide po crnogorskoj gramatici, ne samo 1 / 2–4 / 5+ (21 podrška, 22 podrške, 11–14 podrški), a „podrška" se ne koristi za pomoć korisnicima („Pomoć" / „Kontakt"). Duplikat nudi „Podrži postojeću" (10 Q7). **[Claude]**, jer bi inače brojač bio gramatički pogrešan za 21+ i dvosmislen sa pomoći.
- **Q2** Razdvajamo prijavu (`report`, javna), dopis (`letter`, privatan, novi za svaku instituciju kojoj se prijava upućuje) i slanje dopisa (`dispatch`, jedan pokušaj sa ishodom); građaninu u UI-ju i dalje „tekst prijave". **[Claude]**, jer preusmjeravanje (10 Q2: ista prijava, novi dopis) bez ovoga nema gdje da stane, a javni i privatni podaci se ne smiju miješati.
  - Dopuna: uveden je i pojam **podnošenje prijave** (`submit`, trenutak kad građanin dodirne „Pošalji prijavu"), da se ne miješa sa slanjem dopisa; od njega teče brojač dana (10 Q1, `submitted_at`). **[Claude]**
- **Q3** UI „vrsta problema", kod `category`; u UI-ju i dokumentima se ne kaže „kategorija". **[Ivana]**
- **Q4** Institucija (`institution`) je svaki primalac dopisa; služba je jedinica unutar institucije (P2); nadležna institucija je ona koju je odredilo pravilo ili administrator. **[Ivana]**
- **Q5** Prijavilac (`reporter`), tabela `profiles`, uloge `citizen` / `official` / `admin`; anonimni korisnik ima samo anonimnu sesiju. **[Ivana]**
  - Dopuna: „autor" i „podnosilac" se više ne koriste (u FR-16 i FR-19 zamijenjeno sa „prijavilac"). **[Claude]**, jer je jedan naziv po pojmu cilj ovog tiketa.
- **Q6** Statusi: `draft` „Nacrt" · `sent` „Poslata" · `acknowledged` „Primljena" · `in_progress` „U radu" · `resolved` „Riješena" · `not_competent` javno „Preusmjerava se", u panelu „Nije naša nadležnost" · `rejected` „Odbijena". **[Ivana]**
  - Dodat `routing` „Određuje se nadležni" (tiket 10 Q1, odgovor „Da"). **[Ivana]**
- **Q7** UI uvijek kaže „opština" (`municipality`); puni zvanični naziv samo u nazivu institucije i dopisu. Prva verzija radi samo za Podgoricu (brief, 18 Q4), ali pojam ostaje. **[Ivana]**
- **Q8** „Fixit" ostaje brend (UI, dopis, potpis „Tim Fixit"). **[Ivana]**
- Sakrivanje nije status nego oznaka moderacije; prijava zadržava status. **[Claude]**, jer FR-14 već razdvaja „draft" i „sakrivene", a 11 Q3 (odgovor a) sakriva i pojedinačne fotografije.
- Pojmovi iz tiketa 14 (dopuna na zahtjev koordinatora): **primalac** (nadležna institucija kao adresat dopisa; jedina vidi prijavu u panelu), **kopija** (`cc`), **izvor pravila** (`source_type`: `official_document` / `official_page` / `written_confirmation` / `phone_confirmation`), **slabiji izvor** (telefonska potvrda), **ručno raspoređivanje** (administrator bira instituciju za prijavu u `routing`, bez stvaranja pravila); pravilo nadležnosti dopunjeno kopijom i zabranom rezervnog pravila. **[Claude]**, prema Answer-u tiketa 14.
  - **Preusmjeravanje** je suženo na promjenu primaoca nakon `not_competent`; prvi izbor iz `routing` je ručno raspoređivanje. **[Claude]**, jer 14 ta dva slučaja razlikuje, a 10 Q2 ih je zvao istim imenom; posljedica je ista (ista prijava, novi dopis, bez pravila).
  - „primalac" je skinut sa liste riječi koje se izbjegavaju, jer ga 14 koristi kao pojam.
- `other` se u UI-ju zove „Drugi problem" (tiket 13), a „Nešto drugo" je na listi riječi koje se izbjegavaju. **[Claude]**, prema tiketu 13.

### Izmjene u dokumentima

- **Novi `GLOSSARY.md`** (format iz `domain-modeling`): prijava, dopis, slanje dopisa, podnošenje, broj prijave, fotografija, vrsta problema, lokacija, adresa, duplikat; tabela statusa sa javnim i panel nazivima (uključujući `routing`); otvorena i sakrivena prijava, vremenska linija, brojač dana; podrška; uloge (građanin, prijavilac, anonimni korisnik, gost, profil, službenik, administrator); institucija, služba, nadležna institucija, pravilo nadležnosti, preusmjeravanje, opština; Fixit, agent. Identifikatori u kodu su upisani samo gdje ih je ovaj tiket (ili 10 Q1) odlučio.
- **`PRD.md`**:
  - zaglavlje: `GLOSSARY.md` dodat u povezane dokumente;
  - §1, §3 (Anonimni korisnik, Građanin), §4.1 (javna stranica, podrška uživo), §4.3 (sortiranje), FR-9 („Podrži postojeću"), naslov §5.3, FR-16 (cijeli tekst + oblici brojača), FR-17, FR-19, §8 `/p/[code]`, §9 (srijeda) i demo lista (red 4): „Like"/„lajk" → „Podržavam"/„podrška";
  - ispod FR-18 dodat red „Nazivi statusa u UI-ju" sa svih osam statusa.
- `AGENTS.md` nije diran (tiket 12 dodaje `GLOSSARY.md` u tabelu izvora istine i treba da zamijeni „potvrdama(lajkovanje)" sa „podrškama").

### Za DB.md (tiket 18)

- Nazivi: `reports`, `report_likes`, `reports.like_count`, `profiles` (`role`: `citizen` / `official` / `admin`), `institutions`, `municipalities`, `jurisdiction_rules`, kolona `category`, kolona prijavioca `reporter_id`.
- Enum statusa ima osam vrijednosti: `draft`, `routing`, `sent`, `acknowledged`, `in_progress`, `resolved`, `not_competent`, `rejected`.
- Sakrivanje je posebna oznaka (na prijavi i na fotografiji), ne vrijednost u enum-u statusa.
- Dopis i slanje su zasebni pojmovi: prijava ima više dopisa (po jedan za svaku instituciju kojoj je upućena), a dopis više pokušaja slanja. Preporuka iz Q2 je pominjala `report_private` za dopis; uz preusmjeravanje je prirodnija posebna privatna tabela dopisa (npr. `letters`) i tabela pokušaja (`dispatches`). Odluka je na 18.
- Prijava ima više fotografija (brief, 10 Q9).
- `lib/constants.ts` (izrada): nazivi statusa (javni i panel), oblici „podrška" po broju i tekst dugmeta „Podržavam" idu tamo, iz `GLOSSARY.md`.

### Za provjeru

- **Q2 je moja odluka** (polje je bilo prazno): da li ti odgovara podjela prijava / dopis / slanje dopisa i novi pojam „podnošenje prijave"?
- Tiket 10 Q1 u naslovu kaže „Čeka nadležnog", a u tekstu `routing` („Određuje se nadležni"). Uzeo sam „Određuje se nadležni", kako stoji u tekstu pitanja.
- Prijava u `routing` građaninu pokazuje ekran „Prijava poslata", a status „Određuje se nadležni". To je namjerno (on jeste poslao prijavu; dopis još nije), ali provjeri da li zvuči jasno.
- „Otvorena prijava" u rječniku slijedi preporuku iz 10 Q6 (sve podnesene osim riješene, odbijene i sakrivene); ako sesija tiketa 10 odluči drugačije, rječnik treba uskladiti.
- PRD FR-10/FR-11 i §1 još riječju „prijava" zovu i formalni tekst koji ide instituciji (u rječniku: dopis). Nisam ih prepisivao jer te sekcije mijenjaju drugi tiketi; uskladiti u završnoj provjeri (19).
- §6 Privatnost (sekcija tiketa 11) još koristi „autor" za prijavioca; nisam dirao.
- Šta dugme prikazuje nakon podrške i da li se podrška može povući nije odlučeno nigdje; prijedlog: „Podržano", bez povlačenja u P0.

### Novi tiketi / magla

- Nema novih tiketa. Za završnu provjeru (19): PRD FR-23 i tiket 10 Q2 i dalje zovu i izbor iz `routing` „preusmjeravanje"; uskladiti sa rječnikom (ručno raspoređivanje vs preusmjeravanje). Takođe: jedan prolaz kroz PRD/UI/Tech da svaki pojam odgovara `GLOSSARY.md` (dopis vs prijava, autor → prijavilac).
