# 10 — Životni ciklus prijave: statusi, prelazi, brojač dana i podrške

Type: grilling
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

FR-5, FR-8, FR-11, FR-15, FR-16, FR-18, FR-22 i FR-23 zajedno ostavljaju nekoliko rupa: šta se dešava kad pravilo ne postoji, šta je „otvorena" prijava, ko smije koji prelaz, kad prijava dobija broj. Ovo mora biti zaključano prije šeme baze (18).

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Prijava bez pravila dobija status „Čeka nadležnog"**: FR-8 kaže da prijava bez pravila ide administratoru, ali ne kaže koji status ima ni da li brojač dana teče. Da li uvodimo status `routing` („Određuje se nadležni"), koji se vidi na javnoj mapi, a brojač dana teče od trenutka kad je građanin poslao prijavu? Kad administrator izabere instituciju, dopis se šalje i status prelazi u `sent`.

Posljedica: brojač dana se računa od `submitted_at` (kad je građanin poslao), a `sent_at` bilježi kad je dopis zaista otišao. FR-15 se mijenja u „od `submitted_at`".

➡️ Da. Građaninu je važno koliko dugo problem stoji od njegove prijave, a ne kad smo mi našli primaoca. Bez posebnog statusa takve prijave bi bile nevidljive ili lažno „poslate".

**Tvoj odgovor:** Da

---

❓ **Q2 - Preusmjeravanje zadržava istu prijavu**: FR-23 kaže „nova poruka, nova prijava". Da li preusmjeravanje (nakon `not_competent` ili iz `routing`) **zadržava istu prijavu** (isti kod, podrške, fotografija i brojač dana), dobija novu nadležnu instituciju i **novi dopis**, a status se vraća u `sent`? U vremenskoj liniji se vidi „Preusmjereno: {stara} → {nova}".

➡️ Da. Nova prijava bi izgubila podrške i resetovala brojač dana, a to su upravo podaci koji vrše pritisak.

**Tvoj odgovor:** Da 

---

❓ **Q3 - Ko smije koji prelaz**: Da li su prelazi ovakvi?
- **Sistem:** `draft` → `sent` (ili `routing` bez pravila), kad građanin pošalje prijavu.
- **Službenik svoje institucije:** `sent` → `acknowledged` (automatski pri prvom otvaranju, FR-22); `acknowledged`/`sent` → `in_progress`; `sent`/`acknowledged`/`in_progress` → `resolved`, `rejected` (obavezna poruka), `not_competent` (obavezno obrazloženje; P1).
- **Administrator:** sve, uključujući vraćanje `resolved` → `in_progress` i preusmjeravanje.
- **Građanin:** nakon slanja ne mijenja ništa; nacrt može samo napustiti.

➡️ Da. Službenik ne može ponovo otvoriti riješenu prijavu u P0; to radi administrator ako zatreba.

**Tvoj odgovor:**

---

❓ **Q4 - `not_competent` je u P0 šemi, a dugme je P1**: FR-18 navodi `not_competent` među statusima, a označavanje „Nije naša nadležnost" je P1. Da li status postoji u šemi i enum-u od prvog dana, a dugme u panelu i administratorski tok preusmjeravanja dolaze kao P1?

➡️ Da. Dodavanje vrijednosti u enum kasnije je nova migracija bez potrebe; dugme je jeftino dodati kasnije.

**Tvoj odgovor:**

---

❓ **Q5 - Brojač dana po statusu**: Da li brojač dana radi ovako?
- `routing`, `sent`, `acknowledged`, `in_progress`, `not_competent`: „{n} dana bez rješenja" (od `submitted_at` do danas);
- `resolved`: „Riješeno za {n} dana" (do `resolved_at`);
- `rejected`: „Odbijeno nakon {n} dana" (do `closed_at`), brojač stoji.

➡️ Da.

**Tvoj odgovor:**

---

❓ **Q6 - Šta je „otvorena" prijava**: Da li je „otvorena" prijava ona u statusu `routing`, `sent`, `acknowledged`, `in_progress` ili `not_competent` i nije sakrivena? Samo otvorene prijave se mogu podržati (FR-16) i samo njih nudimo kao duplikat (FR-9).

➡️ Da. Podrška riješenoj prijavi nema smisla, a nuditi je kao duplikat bi zbunilo građanina („riješeno je, ali rupa je i dalje tu").

**Tvoj odgovor:**

---

❓ **Q7 - Duplikat: ista vrsta, 50 m, može se ignorisati**: Da li FR-9 radi ovako: nakon prepoznavanja vrste tražimo otvorene prijave **iste vrste** u krugu od 50 m; ako ih ima, prikazujemo najbližu uz „Podrži postojeću" i „Ipak pošalji novu"? Izbor „Podrži postojeću" briše nacrt i vodi na javnu stranicu postojeće prijave.

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q8 - Broj prijave se dodjeljuje pri slanju**: Da li kod `FX-2026-00142` (FR-24) prijava dobija **u trenutku slanja**, a ne pri kreiranju nacrta, da napušteni nacrti ne troše brojeve? Brojač je godišnji, sa pet cifara.

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q9 - Jedna fotografija po prijavi u P0**: FR-11 pominje „fotografije" u prilogu, a tok ima jednu. Da li je u P0 tačno **jedna fotografija** po prijavi?

➡️ Da. Više fotografija dodaje UI, otpremanje i dodire, a ništa ne dodaje demou.

**Tvoj odgovor:** Po prijavi moze biti vise fotografija koje je gradjanin poslao.

---

❓ **Q10 - „Broj prijava za ovu lokaciju" u dopisu**: FR-11 traži u dopisu „broj prijava za ovu lokaciju". Pri prvom slanju to je uvijek 1, a podrški još nema. Da li to postaje: „Ranije prijave iste vrste na ovoj lokaciji (do 50 m): {n}", i to samo ako je n > 0 (uključujući riješene i odbijene)?

➡️ Da. Tako podatak ima smisla (ponavljajući problem), a ne piše uvijek „1".

**Tvoj odgovor:**

---

❓ **Q11 - Ograničenje od 10 važi za nacrte**: Ograničenje „10 prijava dnevno po korisniku" (nefunkcionalni zahtjevi) postoji i zbog troška AI poziva. Da li važi za **nacrte koji su prošli AI analizu**, a ne samo za poslate prijave?

➡️ Da. Inače neko može praviti neograničen broj AI poziva bez slanja.

**Tvoj odgovor:** Da

---

❓ **Q12 - Status se ne osvježava uživo u P0**: FR-17 traži uživo samo brojač podrški. Da li status na javnoj stranici ostaje bez Realtime-a u P0 (osvježava se ponovnim učitavanjem)?

➡️ Da. Ako Realtime za podrške proradi lako, status dodajemo kao P1.

**Tvoj odgovor:**

## Answer

Napomena o procesu: skill `wayfinder` nije mogao biti pozvan iz ove sesije (rezervisan je za ručno pokretanje), pa je tiket razriješen po koracima iz koordinatorovog uputstva; `grilling` i `domain-modeling` su korišćeni kao kontrolna lista.

- **Q1 [Ivana]** Uvodi se status `routing` („Određuje se nadležni"). Prijava bez pravila (u P0 `graffiti` i `other`) ili sa primaocem bez provjerene mejl adrese pri slanju dobija kod, javna je, može se podržati, a brojač dana teče od `submitted_at`. Administrator bira instituciju i šalje dopis → `sent`. `sent_at` je vrijeme uspješnog slanja konkretnog dopisa (vidi DB ispod). Važi i uz „samo Podgorica", jer vrste bez pravila ostaju.
- **Q2 [Ivana]** Preusmjeravanje zadržava istu prijavu (kod, fotografije, podrške, brojač), dobija novu instituciju i novi dopis, status → `sent`, u vremenskoj liniji „Preusmjereno: {stara} → {nova}". Ovo mijenja FR-23 („nova poruka, nova prijava" više ne važi).
- **Q3 [Claude]** Prelazi po preporuci, ali „administrator: sve" je suženo na zatvoren spisak prelaza (tabela ispod), jer RPC i RLS moraju provjeravati konkretan par (iz, u). Dodato: administrator može odbiti prijavu iz `routing`/`not_competent` i mijenja status u ime institucije koja je odgovorila mejlom (inbound je van scope-a); službenik nikad ne vraća status unazad.
- **Q4 [Claude]** `not_competent` je u enum-u od prvog dana; dugme „Nije naša nadležnost" i tok preusmjeravanja su P1, jer je vrijednost enum-a jeftinija sada nego nova migracija kasnije. Ručni izbor institucije iz `routing` je P0 (tiket 14, Q5).
- **Q5 [Claude]** Brojač po preporuci, uz dopune: n = razlika kalendarskih dana u `Europe/Podgorica`; za n = 0 „Prijavljeno danas" / „Riješeno istog dana" / „Odbijeno istog dana"; oblik „1 dan, 21 dan, 11 dana". Umjesto `resolved_at` i posebnog `closed_at` koristi se jedno polje `closed_at` za `resolved` i `rejected`, jer status već kaže kako je prijava zatvorena; ponovno otvaranje ga briše.
- **Q6 [Claude]** Otvorena = `routing`, `sent`, `acknowledged`, `in_progress`, `not_competent` i nije sakrivena (po preporuci, jer podrška zatvorenoj prijavi nema smisla). Dopuna za podršku: službenici i administratori ne podržavaju prijave, podrška se u P0 ne može povući, a zatvorena prijava zadržava broj podrški uz tekst „Prijava je zatvorena".
- **Q7 [Ivana]** Duplikat: ista vrsta, 50 m od pina, otvorena i nesakrivena, prikazuje se najbliža uz „Podrži postojeću" i „Ipak pošalji novu"; „Podrži postojeću" dodaje podršku, briše nacrt i vodi na javnu stranicu. **[Claude]** dopuna: ako je najbliža prijava građaninova, umjesto podrške piše „Ovaj problem ste već prijavili." (autor ne može podržati svoju prijavu, FR-16); provjera se ponavlja kad građanin promijeni vrstu (usklađeno sa tiketima 13 i 15).
- **Q8 [Ivana]** Kod `FX-{godina}-{5 cifara}` dodjeljuje se pri slanju, brojač je godišnji. **[Claude]** precizirano: „pri slanju" = prvi pritisak na „Pošalji prijavu", jer kod mora biti u naslovu dopisa prije nego što mejl ode; ako slanje ne uspije, nacrt zadržava kod za ponovni pokušaj, pa su rijetke rupe u nizu moguće. Godina = godina slanja po vremenu u Podgorici.
- **Q9 [Ivana]** Više fotografija po prijavi. **[Claude]** maksimum je **3** (najmanje 1), jer: tri slike od 1024 px su ≈ 3 100 vizuelnih tokena, tj. otprilike koliko jedna slika od 1600 px plus pola (istraživanje 04: ≈ 1 036 tokena po slici, cijena ispod $0.001 po pozivu na Haiku 5.5), pa latencija ostaje blizu cilja od 8 s; tri JPEG-a od 1600 px su ≈ 1–1,5 MB po prijavi, što je ≈ 700+ prijava u 1 GB Storage-a na Free planu (istraživanje 07) i daleko ispod 40 MB po mejlu u Resendu (istraživanje 05); više od tri dodaje UI bez koristi za demo. Tok: modelu idu sve fotografije otpremljene do početka analize, u **jednom** pozivu; iz galerije se odjednom bira do 3; fotografije dodate kasnije („Dodaj fotografiju" na ekranu pregleda, do „Pošalji prijavu") idu samo u prilog dopisa i na javnu stranicu i ne pokreću novi poziv. Dodavanje je opciono i ne ulazi u 4 dodira. Dopis prilaže sve fotografije (`{kod}-1.jpg` …).
- **Q10 [Claude]** Umjesto „broj prijava za ovu lokaciju": „Ranije prijave iste vrste na ovoj lokaciji (do 50 m): {n}", samo ako je n > 0, uključujući riješene i odbijene, bez sakrivenih (po preporuci, jer „1" ništa ne govori). Dopuna: dopis poslat iz `routing` ili nakon preusmjeravanja dobija i red „Broj građana koji su podržali prijavu: {n}" ako je n > 0, jer tada podrške već postoje i to je upravo podatak koji vrši pritisak.
- **Q11 [Ivana]** Ograničenje od 10 važi za nacrte koji su prošli AI analizu. **[Claude]** precizirano: računa se po kalendarskom danu u Podgorici, uključujući napuštene i obrisane nacrte, provjerava se prije poziva modela; poruka „Dostigli ste dnevno ograničenje od 10 prijava. Pokušajte ponovo sjutra."
- **Q12 [Claude]** Status se u P0 ne osvježava uživo (ponovno učitavanje); Realtime za status je P1, jer je demo samo video i ponovno učitavanje u njemu ništa ne kvari.

### Tabela prelaza (za RPC/RLS u tiketu 18)

Sve što nije u tabeli je zabranjeno. Status nikad ne piše klijent direktno (zlatno pravilo 4); svaki red osim brisanja nacrta upisuje događaj u vremensku liniju (`report_events`) sa ulogom aktera (`institution` / `fixit`), bez imena osobe.

| # | Iz | U | Ko | Uslov / obavezno | Događaj u vremenskoj liniji (javni tekst) |
|---|---|---|---|---|---|
| 1 | — | `draft` | građanin, autor (server ruta na otpremu prve fotografije) | ulogovan, `is_anonymous = false`, uloga `citizen`, ispod dnevnog ograničenja | — (nacrt nije javan) |
| 2 | `draft` | obrisan | građanin, autor | „Odustani", napušten nacrt ili „Podrži postojeću"; brišu se i fotografije | — |
| 3 | `draft` | `sent` | sistem (server, service role), na „Pošalji prijavu" autora | pravilo postoji, primalac ima mejl, dopis uspješno poslat; postavlja `code` (ako ga nema), `submitted_at`, `letter.sent_at` | „Prijava poslata: {institucija}" |
| 4 | `draft` | `draft` | sistem | slanje dopisa nije uspjelo; `code` ostaje, `submitted_at` se ne postavlja | — |
| 5 | `draft` | `routing` | sistem, na „Pošalji prijavu" autora | nema pravila ili primalac nema mejl; postavlja `code`, `submitted_at`; mejl se ne šalje | „Prijava primljena. Nadležnu instituciju određuje tim Fixit." |
| 6 | `routing` | `sent` | administrator (P0) | izabrana institucija, novi dopis uspješno poslat; inače ostaje `routing` | „Proslijeđeno: {institucija}" |
| 7 | `sent` | `acknowledged` | sistem | službenik **nadležne** institucije prvi put otvori prijavu (FR-22); administrator ne okida | „Primljena" |
| 8 | `sent`, `acknowledged` | `in_progress` | službenik nadležne institucije; administrator | poruka opciona | „U radu" (+ poruka) |
| 9 | `sent`, `acknowledged`, `in_progress` | `resolved` | službenik nadležne institucije; administrator | poruka opciona; `closed_at = now()` | „Riješena" (+ poruka) |
| 10 | `sent`, `acknowledged`, `in_progress` | `rejected` | službenik nadležne institucije; administrator | poruka obavezna; `closed_at = now()` | „Odbijena" + poruka |
| 11 | `routing`, `not_competent` | `rejected` | administrator | poruka obavezna; `closed_at = now()` | „Odbijena" + poruka |
| 12 | `sent`, `acknowledged`, `in_progress` | `not_competent` | službenik nadležne institucije (dugme P1); administrator | obrazloženje obavezno | „Preusmjerava se" + obrazloženje |
| 13 | `not_competent`, `sent`, `acknowledged`, `in_progress` | `sent` (preusmjeravanje) | administrator (P1) | nova institucija ≠ trenutna; novi dopis uspješno poslat; `institution_id` se mijenja | „Preusmjereno: {stara} → {nova}" |
| 14 | `resolved`, `rejected` | `in_progress` | administrator | poruka obavezna; `closed_at = null` | „Ponovo otvorena" + poruka |

Ortogonalno statusu (nije prelaz): sakrivanje prijave ili pojedinačne fotografije (samo administrator, tiket 11); podrška (red u `report_likes`, FR-16). Građanin nakon slanja ne mijenja ništa.

### Izmjene u dokumentima

- `PRD.md` §5.1 **FR-5**: nacrt nastaje pri otpremi prve fotografije, nije javan, nema kod; napuštanje briše nacrt i fotografije; podtačka „Fotografije" (1–3, šta ide modelu, kasnije dodate fotografije).
- `PRD.md` §5.2 **FR-8**: dodata rečenica o tome šta je `routing` u životnom ciklusu (kod, javna, brojač, → `sent`). Ostatak FR-8 je napisao tiket 14 i nije diran.
- `PRD.md` **FR-9**: potpuno prepisan (ista vrsta, 50 m, otvorene i nesakrivene, najbliža, dva dugmeta, sopstvena prijava, ponavljanje pri promjeni vrste).
- `PRD.md` **FR-11**: samo red „podatke o prijavi" (ranije prijave do 50 m i broj podrški, oba samo ako je n > 0) i red „prilog" (sve fotografije 1–3, nazivi fajlova).
- `PRD.md` §5.3 **FR-15** (od `submitted_at`, tekstovi po statusu, kalendarski dani, oblik „dan/dana", ponovno otvaranje), **FR-16** (uslovi podrške; tekst tiketa 09 o „Podržavam" i brojaču je zadržan), **FR-18** (osam statusa u enum-u, otvorena/zatvorena, tabela prelaza, osvježavanje bez Realtime-a; podtačka tiketa 09 o nazivima je zadržana).
- `PRD.md` §5.4 **FR-22**, **FR-23**; §5.5 **FR-24**.
- `PRD.md` §6 „Bezbjednost": kako se računa ograničenje od 10 i poruka.

### Za DB.md (tiket 18)

- Enum `report_status`: `draft`, `routing`, `sent`, `acknowledged`, `in_progress`, `resolved`, `rejected`, `not_competent` (svih osam od prve migracije).
- `reports`: `code text unique null` (null samo u nacrtu), `submitted_at timestamptz null`, `closed_at timestamptz null`, `institution_id` (trenutna nadležna, null u `draft`/`routing`), `is_hidden`, `like_count`. CHECK: `status = 'draft'` ⇔ `submitted_at is null`; `status in ('resolved','rejected')` ⇔ `closed_at is not null`; `status <> 'draft'` ⇒ `code is not null`; `status in ('sent','acknowledged','in_progress','not_competent')` ⇒ `institution_id is not null`. Nema `sent_at`/`resolved_at` na `reports`.
- `sent_at` živi na dopisu/slanju (`letters`/`dispatches`): jedan red po dopisu (prvi, iz `routing`, svako preusmjeravanje), sa `institution_id`, `sent_at` i ishodom. Partial unique index „najviše jedno uspješno slanje po dopisu" štiti od dvostrukog slanja (dvostruki dodir na „Pošalji prijavu").
- Kod: tabela `report_code_counters(year int primary key, last_value int)` + funkcija `next_report_code()` sa `insert … on conflict do update … returning` (godišnji reset; sekvenca to ne radi sama). Format `'FX-' || year || '-' || lpad(n::text, 5, '0')`. Poziva se samo ako `code is null`.
- `report_photos`: `report_id`, `storage_path`, `position` (1–3), `sent_to_model boolean`, `is_hidden`; CHECK/trigger najviše 3 po prijavi; brisanje nacrta briše redove i objekte u Storage-u.
- `set_report_status(report_id, new_status, message)` (`security definer`): zaključava red (`for update`), provjerava par (iz, u) i ulogu iz tabele prelaza, obaveznu poruku za `rejected`/`not_competent`/ponovno otvaranje, postavlja/briše `closed_at`, upisuje `report_events`. Redovi 3, 5, 6 i 13 (slanje dopisa) idu iz server rute sa service role ključem, jer uključuju mejl; RPC za njih je odvojen (npr. `mark_report_submitted`, `mark_report_routed`) i nije dostupan klijentu.
- `acknowledge_report(report_id)`: no-op ako status nije `sent` ili pozivalac nije službenik `reports.institution_id`.
- `find_nearby_open_reports(category, point, radius_m = 50)`: status u skupu otvorenih, `is_hidden = false`, sortirano po udaljenosti; vraća i `is_own`.
- `count_previous_reports(category, point, radius_m = 50, exclude_report_id)`: sve osim `draft` i sakrivenih, za red u dopisu.
- `like_report`: dozvoljeno samo za otvorene, nesakrivene, tuđe prijave i uloge `citizen`/anonimna sesija; nema `unlike` u P0 (Realtime tada vidi samo rast, bez `DELETE` događaja koje Postgres Changes ne filtrira kroz RLS).
- Dnevno ograničenje: broji redove `agent_runs` (korak prepoznavanja) po `user_id` za kalendarski dan u `Europe/Podgorica`, ne redove `reports` (nacrti se brišu).
- RLS za službenika: vidi samo `reports.institution_id = svoja institucija` (nakon preusmjeravanja stara institucija gubi pristup).

### Za provjeru

- **Q3:** „administrator: sve" sam pretvorio u zatvoren spisak prelaza i dodao administratoru odbijanje iz `routing`/`not_competent` i promjenu statusa u ime institucije. Provjeri da li ti nešto fali (npr. da administrator vrati prijavu iz `sent` u `routing`; to nisam dozvolio).
- **Q9:** maksimum 3 fotografije je moja odluka; ako želiš više, cijena i Storage nisu prepreka do ~5, ali latencija modela raste. Fotografije dodate poslije početka analize model ne vidi (jedan poziv po prijavi); ako ti je važno da model vidi sve, analiza bi morala čekati, što ruši paralelizam iz 15 Q2.
- **Q10:** dodao sam red „Broj građana koji su podržali prijavu" u dopis poslat iz `routing` ili nakon preusmjeravanja. To proširuje šablon dopisa iz FR-11.
- **FR-23:** prethodna institucija nakon preusmjeravanja više ne vidi prijavu u panelu (moja odluka, slijedi iz FR-20).
- **FR-11, rečenica „Jedna prijava se može poslati samo jednom."** sam ostavio netaknutu (koordinator mi je dao samo dva reda FR-11). Uz preusmjeravanje ona sada znači „građanin šalje jednom"; jedna prijava može imati više dopisa. Predlažem da se preformuliše u „Građanin prijavu šalje samo jednom".
- **FR-6** (tiket 13) još kaže „šalje fotografiju modelu" u jednini; uz više fotografija treba „fotografije".
- **FR-2** (tiket 15) koristi ekavsko „posle"; treba „poslije".
- **PRD §8 `/admin`** i dalje kaže „prijave bez nadležnog i `not_competent`", što je tačno, ali bi trebalo pomenuti status `routing` (vlasnik je tiket 14, Q5).

### Novi tiketi / magla

- **Čišćenje napuštenih nacrta** (redovi i fotografije u Storage-u, npr. stariji od 24 h): nije P0, ali bez toga Storage od 1 GB polako curi. Prijedlog: magla na mapi ili stavka u tiketu 18.
- **Tiket 20 (mjerenje modela):** dodati slučaj sa 3 fotografije u jednom pozivu (latencija i da li model ispravno spaja tri ugla istog problema).
- **Tiket 09 / `GLOSSARY.md`:** upisati pojmove „otvorena / zatvorena prijava", „slanje prijave" (`submitted_at`) naspram „slanje dopisa" (`sent_at`), „preusmjeravanje" (ista prijava, novi dopis), `routing` „Određuje se nadležni".
- **Obavještenja (P1, FR-19):** da li prelaz `routing` → `sent` i preusmjeravanje obavještavaju autora; već je pod „Model obavještenja" u mapi.
