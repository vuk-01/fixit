# 13 — Vrste problema (taksonomija) za P0

Type: grilling
Status: resolved
Blocked by: 02, 08
Mapa: [map.md](../map.md)

## Question

Koje vrste problema AI prepoznaje i građanin može izabrati u P0? Lista određuje prompt, enum/tabelu `categories`, pravila nadležnosti i seed. Vrste razdvajamo tamo gdje se razlikuje nadležna institucija, a ne tamo gdje se razlikuje izgled problema.

Konačna lista čeka nalaz o nadležnosti u Podgorici (02) i opseg demoa (08). Prijedlog ispod je privremen i biće dopunjen kad 02 stigne. Pitanja Q2–Q4 možeš odgovoriti već sada.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Lista vrsta (ažurirana nakon nalaza 02)**: Da li je P0 lista ovakva? Kolona „Pravilo u Podgorici" pokazuje šta je [nalaz 02](../research/02-nadleznost-podgorica.md) potvrdio. Ko tačno prima dopis odlučuje tiket 14.

| slug | Naziv u UI-ju | Pravilo u Podgorici |
|---|---|---|
| `pothole` | Oštećen kolovoz / rupa na putu | ✅ Putevi d.o.o. / Sekretarijat za saobraćaj (vidi 14, Q8) |
| `sidewalk` | Oštećen trotoar | ✅ isto kao kolovoz |
| `traffic_sign` | Oštećen ili oboren saobraćajni znak | ✅ isto kao kolovoz |
| `street_light` | Neispravna javna rasvjeta | ✅ Komunalne usluge d.o.o. |
| `traffic_light` | Neispravan semafor | ✅ Komunalne usluge d.o.o. |
| `manhole` | Otvoren ili oštećen šaht | ✅ Vodovod i kanalizacija d.o.o. (održava i fekalnu i atmosfersku mrežu, pa ih ne razdvajamo) |
| `water_leak` | Curenje vode / pukla cijev | ✅ Vodovod i kanalizacija d.o.o. |
| `illegal_dump` | Divlja deponija / odbačen otpad | ✅ Čistoća d.o.o. |
| `waste_container` | Prepun kontejner / otpad oko kontejnera | ✅ Čistoća d.o.o. (za prepun kontejner potvrđeno; za oštećen samo djelimično, pa je naziv sužen) |
| `greenery` | Oboreno drvo / neodržavano zelenilo | ✅ Zelenilo d.o.o. |
| `graffiti` | Grafiti | ❌ izvor nije pronađen, pa vrsta nema pravilo i ide administratoru |
| `other` | Nešto drugo | ❌ namjerno bez pravila, ide administratoru |

Izbačeno iz P0: napušteno vozilo (bez izvora), elektro-ormar/stub (CEDIS prima prijave kvarova samo telefonom, bez mejla), mobilijar i igrališta (nadležnost podijeljena između Zelenila i Puteva).

➡️ Da. Grafiti ostaju kao vrsta bez pravila: PRD ih navodi kao primjer, AI ih lako prepoznaje, a u demou pošteno pokazuju tok „biće proslijeđena ručno" umjesto da nagađamo nadležnog.

**Tvoj odgovor:**

---

❓ **Q2 - „Nešto drugo" uvijek ide administratoru**: Da li `other` nema pravilo ni u jednoj opštini, pa uvijek ide administratoru (`routing`, tiket 10)?

➡️ Da. Svako pravilo za „sve ostalo" bi bilo nagađanje nadležnosti.

**Tvoj odgovor:** Da

---

❓ **Q3 - Ozbiljnost i neposredna opasnost**: FR-6 traži ozbiljnost i „neposrednu opasnost", ali ne kaže čemu služe. Da li:
- ozbiljnost (`low` / `medium` / `high`) služi samo za sortiranje u panelu i ne ide u dopis;
- „neposredna opasnost" građaninu prikazuje traku „Ako je neko u opasnosti, pozovite 112", a u dopisu dodaje red „Na fotografiji je uočena moguća neposredna opasnost"?

➡️ Da. Aplikacija ne smije zvučati kao hitna služba, a ova traka je jeftina zaštita.

**Tvoj odgovor:**

---

❓ **Q4 - Prag pouzdanosti 0.6 ostaje**: Da li zadržavamo FR-7 prag od 0.6 (ispod toga građanin bira vrstu ručno), znajući da je pouzdanost koju model sam prijavi samo gruba procjena?

➡️ Da. Prag podešavamo na generalnoj probi u četvrtak, sa stvarnim demo fotografijama.

**Tvoj odgovor:** Da, ali necemo rucno podesavati prag.

## Answer

*Napomena o procesu:* skill `wayfinder` nije mogao da se pokrene iz ove sesije (rezervisan je za ručno pokretanje), pa je tiket riješen po koordinatorovim uputstvima i [brief-u za talas 1](../wave1-brief.md); `grilling` i `domain-modeling` su korišćeni kao kontrolna lista.

- **Q1 [Claude]** (ostavljeno prazno; preporuka je usklađena sa [nalazom 02](../research/02-nadleznost-podgorica.md) i odlukom „samo Podgorica"): P0 ima **12 vrsta**: `pothole`, `sidewalk`, `traffic_sign`, `street_light`, `traffic_light`, `manhole`, `water_leak`, `illegal_dump`, `waste_container`, `greenery`, `graffiti`, `other`. Pravilo u Podgorici ima 10 vrsta; `graffiti` i `other` nemaju pravilo i idu u `routing` (FR-8, tiket 10). Napušteno vozilo, elektro-ormar/stub i mobilijar su izbačeni; model ih vraća kao `other`. Konačna lista sa nazivima i opisom za prompt je u PRD §5.2 „Vrste problema (P0)".
  - **[Claude] Princip razdvajanja je proširen:** vrste sa istim primaocem (kolovoz/trotoar/znak; rasvjeta/semafor) ostaju odvojene, jer FR-9 traži duplikat „iste vrste u 50 m", pa bi spajanje rupu i oboren znak na istom uglu proglasilo duplikatom; uz to naslov dopisa („– {vrsta problema}") ostaje precizan.
  - **[Claude] `other` se u UI-ju zove „Drugi problem", ne „Nešto drugo"**, jer se naziv vrste pojavljuje i u naslovu dopisa i na javnoj stranici, gdje „Nešto drugo" zvuči neformalno.
  - **[Claude] Vrsta ima tri podatka:** slug (kod i baza), naziv u UI-ju i kratak opis „šta obuhvata" za prompt. Opisi opisuju samo izgled problema i **ne pominju nijednu instituciju** (zlatno pravilo 1); izvor istine za nazive i opise je `lib/constants.ts`.
  - **[Claude] Jedna vrsta po prijavi:** sve fotografije prijave (odluka o više fotografija, 10 Q9) prikazuju isti problem; ako se vidi više problema, model bira onaj najistaknutiji, jer jedna prijava ide jednom primaocu.
  - **[Claude] Ručna izmjena vrste ponovo pokreće `resolve_jurisdiction` i provjeru duplikata**, jer obje zavise od vrste; AI-jeva prvobitna vrsta i pouzdanost se čuvaju odvojeno od konačne (za mjerenje, tiket 20).
- **Q2 [Ivana]:** `other` nema pravilo i uvijek ide administratoru (`routing`). Zbog odluke „samo Podgorica" (brief, tačka 1) „ni u jednoj opštini" se svodi na „nema pravila".
- **Q3 [Claude]** (ostavljeno prazno; prihvaćena preporuka, jer je jeftina zaštita i ne dodaje dodir):
  - Ozbiljnost (`low` / `medium` / `high`) se čuva i prikazuje samo u panelu institucije; ne ide u dopis i ne prikazuje se javno ni građaninu. Sortiranje po ozbiljnosti dolazi sa P1 filterima i sortiranjem u panelu.
  - Neposredna opasnost: na ekranu pregleda građanin vidi traku „Ako je neko u opasnosti, pozovite 112." (bez dodira, ne blokira slanje), a dopis dobija red „Na fotografiji je uočena moguća neposredna opasnost." u podacima o prijavi.
  - **[Claude]** Modelu dajemo kratke definicije: `low` = estetski problem, ne ometa korišćenje; `medium` = ometa korišćenje ili će se pogoršati; `high` = ozbiljno ometa korišćenje ili može izazvati štetu. Neposredna opasnost = rizik po život ili zdravlje ljudi upravo sada (npr. otvoren šaht na prolazu, drvo ili znak pao na kolovoz, ugašen semafor na raskrsnici). Bez definicija vrijednosti bi bile nasumične.
  - **[Claude]** U ručnom toku (AI nije odgovorio) ozbiljnost je prazna, a neposredna opasnost `false`; građanin ih ne bira, da ne dodajemo dodire.
- **Q4 [Ivana]:** prag pouzdanosti je **fiksno 0.6** i ne podešava se ručno, ni na generalnoj probi. Ispod 0.6 ili kad `is_municipal_problem = false`, građanin bira vrstu ručno (FR-7). Prag je jedna konstanta u `lib/constants.ts`.

### Izmjene u dokumentima

- `PRD.md` §5.2: dodata podsekcija „Vrste problema (P0)" (tabela slug / naziv u UI-ju / šta obuhvata / pravilo u Podgorici da-ne, pravila za vrstu bez pravila, `other`, jednu vrstu po prijavi, ručnu izmjenu vrste). Bez naziva institucija.
- `PRD.md` FR-6: navedena polja i značenje ozbiljnosti i neposredne opasnosti.
- `PRD.md` FR-7: prag 0.6 je fiksan i ne podešava se.
- `PRD.md` FR-11, „podaci o prijavi": red o mogućoj neposrednoj opasnosti.

### Za DB.md (tiket 18)

- Preporuka: vrsta kao **Postgres enum `report_category`** sa 12 vrijednosti, a ne tabela `categories`. Vrste se u P0 ne mijenjaju u radu (nema CRUD-a za vrste), enum ne traži RLS, a generisani tip u `database.types.ts` omogućava da `lib/constants.ts` bude `Record<report_category, …>`, pa kompajler javi ako vrsta nema naziv ili opis. Nova vrsta = nova migracija (`ALTER TYPE … ADD VALUE`) + red u `lib/constants.ts`. Ako 18 izabere tabelu, mora imati RLS (čitanje za sve, pisanje samo admin).
- `jurisdiction_rules.category` koristi isti enum. Seed pravila: 10 vrsta za Podgoricu; **nijedno pravilo za `graffiti` i `other`** (provjera u seed testu).
- `reports`: `category` (konačna, nakon eventualne ručne izmjene), `severity` (`low`/`medium`/`high`, nullable za ručni tok), `immediate_danger boolean not null default false`.
- AI-jeva prvobitna vrsta i pouzdanost (`ai_category`, `ai_confidence`) i oznaka da li je vrsta ručno promijenjena čuvaju se u `agent_runs` ili `report_private` (ne javno), za tiket 20.

### Za provjeru

- **Q1 je moja odluka** (ostavila si prazno). Provjeri listu i nazive u PRD §5.2, posebno: da li „Drugi problem" umjesto „Nešto drugo" odgovara, i da li želiš da `sidewalk` i `pothole` (isti primalac) ostanu odvojeni. Nisam slijedio princip iz pitanja doslovno („razdvajamo samo gdje se razlikuje institucija") zbog provjere duplikata.
- **Q3 je moja odluka:** traka 112 i red o opasnosti u dopisu. Red u dopisu je jedina rečenica koja potiče od procjene modela, a ne od građanina; građanin je vidi i može je izbrisati pri pregledu teksta (FR-11).
- **Q4:** pošto prag ne podešavamo, rizik je da model na demo fotografijama prijavi pouzdanost malo ispod 0.6 i video dobije dodatni dodir. Rješenje je izbor jasnih fotografija za video, ne promjena praga.
- Za glavni tok u videu (08) treba izabrati vrstu **sa pravilom** (npr. `pothole` ili `street_light`); `graffiti` bi pokazao „biće proslijeđena ručno".
- `waste_container` pokriva samo prepun kontejner i otpad oko njega; oštećen kontejner model vraća kao `other` (nalaz 02: nadležnost za oštećene posude je samo djelimično potvrđena).
- `greenery` pokriva javne zelene površine; površine ispred stambenih zgrada su po nalazu 02 obaveza skupština etažnih vlasnika. Ne razdvajamo ih (ne vidi se sa fotografije); dopis ionako traži „obavijestite nas ako niste nadležni".

### Novi tiketi / magla

- **Magla:** izvor za grafite i napuštena vozila u Podgorici (Odluka o komunalnom redu). Ako se nađe, `graffiti` dobija pravilo samo novim redom u seed-u, a napušteno vozilo novom vrijednošću enum-a. Vrijedi ponovo provjeriti i `gradjanski.podgorica.me` (nalaz 02).
- **Magla:** kategorija puta (državni put kroz Podgoricu) i dalje je van scope-a; rupa na magistralnom putu ide po pravilu za `pothole`, a ispravka ide kroz `not_competent` (P1).
- Nema novih tiketa.
