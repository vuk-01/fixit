# 12 — Radni proces agenata i tima od utorka

Type: grilling
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

AGENTS.md kaže šta agent ne smije, ali ne kaže kako tim i agenti rade paralelno četiri dana: grane, migracije, testovi, šta znači „gotovo". Ovo ide u AGENTS.md.

Napiši „da" da prihvatiš preporuku (➡️), ili svoj odgovor. Ono što ostaviš prazno odlučujem ja i označavam kao [Claude].

---

❓ **Q1 - Ko gradi**: Koliko ljudi gradi i koliko sesija Claude Code-a vodi svako paralelno? Pretpostavljam: ti + jedan ili dva člana tima, svako vodi jednu do dvije sesije istovremeno.

➡️ Upiši tačan broj ljudi i ko radi šta (npr. jedan građanski tok, jedan panel i baza). Ako ostaviš prazno, pišem AGENTS.md za 2 osobe × 2 sesije.

**Tvoj odgovor:** Radi nas troje. Za sada samo planiram ja, a posle kad budemo imali detaljan plan koraka ukljucice se i oni.

---

❓ **Q2 - GitHub repo, PR-ovi i Vercel preview**: Da li kod živi u privatnom GitHub repou povezanom sa Vercelom, svaka funkcija ide kroz kratku granu i PR (squash merge u `main`), a svaki PR dobija Vercel preview?

➡️ Da. Vercel preview je najbrži način da se svaka izmjena proba na telefonu.

*Dopuna nakon nalaza 07:* Vercel Hobby nema timsku saradnju, ne može se povezati sa repoom u vlasništvu GitHub organizacije i dozvoljen je samo za nekomercijalnu upotrebu. Ako repo stavimo pod tvoj lični GitHub nalog i Vercel projekat bude tvoj, Hobby je dovoljan za hakaton. Ako repo mora biti u organizaciji ili više ljudi treba pristup Vercelu, potreban je Pro (probni period). Upiši gdje repo živi.

**Tvoj odgovor:** Repo ce biti na mom githubu, prikazivacemo sve sa mog githuba. Kad oni nesto budu radili pushovace na moj github.

---

❓ **Q3 - Gdje žive tiketi za izradu**: Da li tiketi za izradu P0 (koje pravim nakon ove mape) idu u GitHub Issues tog repoa, a ne u `.scratch/`?

➡️ Da. Paralelne sesije i ljudi lakše vide šta je zauzeto, a PR može zatvoriti tiket.

**Tvoj odgovor:** Da

---

❓ **Q4 - Migracije ima jedan vlasnik**: Paralelne migracije se lako sudare (redoslijed, ista tabela). Da li jedna osoba „posjeduje" bazu: samo njene grane prave migracije i samo ona radi `supabase db push`, dok ostali traže izmjenu baze preko nje?

➡️ Da. Četiri dana nije dovoljno da se rješavaju konflikti u šemi. Upiši ko je vlasnik.

**Tvoj odgovor:** da, ja sam vlasnik.

---

❓ **Q5 - Jedan zajednički Supabase projekat**: Da li svi rade na **jednom** cloud Supabase projektu (dev = demo), bez lokalnog Supabase-a u Dockeru, a demo podatke prije subote čistimo komandom iz FR-25?

➡️ Da. Lokalni Supabase traži Docker i podešavanje na svakoj mašini; za četiri dana to se ne isplati. Rizik je da nečiji eksperiment pokvari zajedničke podatke, pa zato važi Q4.

**Tvoj odgovor:** Da

---

❓ **Q6 - Obavezni testovi samo tamo gdje greška košta najviše**: Da li su obavezni automatski testovi (Vitest) samo za:
1. guard u `lib/email/send.ts` (u `EMAIL_MODE=test` nijedan mejl ne ide van `TEST_INBOX`; Resend mockovan);
2. određivanje nadležnosti (pravilo opštine → nacionalno pravilo → bez pravila);
3. sastavljanje dopisa iz šablona (sva polja iz FR-11, bez ličnih podataka kad dostavljanje nije uključeno);
4. RLS: anonimni klijent ne može upisati u `reports` niti pročitati `report_private`.

Ostalo se provjerava ručno na telefonu, a E2E testova nema u P0.

➡️ Da. To su upravo zlatna pravila; sve ostalo vidimo na demo telefonu.

**Tvoj odgovor:**

---

❓ **Q7 - Definicija „gotovo"**: Da li je P0 funkcija gotova kad:
radi na Vercel preview-u na telefonu širine 360 px; sav tekst je na crnogorskom, latinicom, ijekavski i nalazi se u `lib/constants.ts` ili uz komponentu; `typecheck`, `lint` i testovi prolaze; nova tabela ima RLS; tipovi su regenerisani nakon migracije; i dokument je ažuriran ako se odluka promijenila?

➡️ Da.

**Tvoj odgovor:** Da

---

❓ **Q8 - AGENTS.md dobija `CLAUDE.md` pokazivač**: Claude Code automatski čita `CLAUDE.md`. Da li u repo dodajemo `CLAUDE.md` sa jednim redom koji upućuje na `AGENTS.md` (ili simbolički link), da svaka sesija sigurno učita pravila?

➡️ Da.

**Tvoj odgovor:** Da

## Answer

- **Q1 Ko gradi:** gradi troje ljudi; sada planira samo Ivana, ostali se uključuju kad postoji detaljan plan koraka **[Ivana]**. Svako vodi jednu ili dvije Claude Code sesije, svaka na svojoj grani i u svom `git worktree`, a podjela posla ide po tiketima, ne po osobama **[Claude]**, jer ko radi šta još nije poznato, a tiketi za izradu tek nastaju.
- **Q2 Repo, PR-ovi, Vercel preview:** repo je na Ivaninom ličnom GitHub nalogu, ostali pushuju u njega **[Ivana]**. Kratka grana po tiketu (`<ime>/<broj-tiketa>-<opis>`), PR sa `Closes #N`, squash merge u `main`, bez direktnog pusha u `main`; svaki push na granu pravi Vercel preview **[Claude]**, jer je to preporuka koju odgovor ne odbija, a samo PR može zatvoriti tiket. Vercel Hobby je dovoljan jer je repo na ličnom nalogu **[istraživanje 07]**.
- **Q3 Tiketi za izradu:** u GitHub Issues Ivaninog repoa **[Ivana]**.
- **Q4 Migracije:** vlasnik je Ivana; samo ona piše migracije i radi `supabase db push --remote` **[Ivana]**. Redoslijed: `migration new` → `db push --remote` → `gen types --remote` → PR samo sa migracijom i tipovima → merge odmah; migracija primijenjena na bazu se više ne mijenja **[Claude]**, jer bez lokalne baze tipovi se mogu generisati tek iz hostovanog projekta.
- **Q5 Jedan Supabase projekat:** jedan zajednički cloud projekat (razvoj = demo), bez lokalnog Supabase-a; demo podaci se brišu komandom iz FR-25 **[Ivana]**.
- **Q6 Obavezni testovi:** prihvaćena preporuka, uz dvije izmjene **[Claude]**, jer je odgovor prazan: (2) nadležnost sada testira „van Podgorice → odbijeno; vrsta sa pravilom → institucija; bez pravila → administrator", bez nacionalnog nivoa (brief, odluka 1); (4) RLS test pokriva i anonimnu sesiju sa `is_anonymous = true`, jer ona ima ulogu `authenticated` (istraživanje 05). E2E nema u P0.
- **Q7 Definicija „gotovo":** prihvaćena **[Ivana]**; dodato da labele koriste nazive iz `GLOSSARY.md` **[Claude]**, jer je rječnik (09) sada izvor istine za nazive.
- **Q8 `CLAUDE.md`:** dodat `CLAUDE.md` sa jednim redom `@AGENTS.md` (Claude Code import, učitava cijeli AGENTS.md) **[Ivana]**; import umjesto simboličkog linka **[Claude]**, jer radi isto na svakoj mašini i u git-u.

### Izmjene u dokumentima

- `AGENTS.md`, „Projekat u tri rečenice": dodato „prva verzija pokriva samo Glavni grad Podgoricu"; „potvrdama(lajkovanje)" → „podrškama (u kodu `like`)" (09 Q1).
- `AGENTS.md`, „Izvori istine": dodati redovi `/UI.md` i `/GLOSSARY.md` sa uslovom kad se čitaju.
- `AGENTS.md`, zlatno pravilo 5: migracije piše samo Ivana; ni mergovana ni na bazu primijenjena migracija se ne mijenja.
- `AGENTS.md`, nova sekcija „Radni proces": Tiketi, grane, PR; Baza (Supabase) sa napomenom da Supabase CLI 3.0.0 traži `--remote` za hostovani projekat; Obavezni testovi; Definicija „gotovo".
- Novi `/CLAUDE.md`: `@AGENTS.md`.

### Za DB.md (tiket 18)

- Sekcija o migracijama treba da koristi v3 sintaksu (`supabase db push --remote`, `supabase gen types typescript --remote`) i da kaže da ih radi samo Ivana; bez `supabase db reset` (nema lokalne baze).
- Komanda iz FR-25 (brisanje `is_demo` prijava) mora postojati jer na nju upućuje AGENTS.md; i podaci iz razvoja na zajedničkom projektu treba da budu `is_demo` ili obrisivi istom komandom.
- RLS testovi idu na zajednički projekat: šema treba da dozvoli da test samo pokušava zabranjene upise, bez ostavljanja podataka.

### Za provjeru

- **Vercel Hobby i kolege (bitno):** na ličnom Hobby projektu ne mogu se dodati saradnici, pa dashboard, env varijable i logove vidi samo Ivana. Preview deploy se pravi za grane pushovane u njen repo, ali Vercelova dokumentacija nije dosljedna: jedna strana kaže da se provjera autora commita odnosi samo na repoe organizacija, a druga („Troubleshoot project collaboration") da Hobby ne podržava saradnju na **privatnim** repoima; korisnici prijavljuju blokiran deploy kad commit napravi kolega. Provjeriti prvog dana: kolega pushuje granu i gleda da li preview nastaje. Ako je blokiran, opcije su: javni repo, Pro probni period, ili Ivana pravi deploy. Izvori: [vercel.com/docs/deployments/troubleshoot-project-collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration), [vercel.com/docs/git](https://vercel.com/docs/git), [community.vercel.com/t/.../50649](https://community.vercel.com/t/can-a-hobby-project-owner-deploy-reviewed-contributions-from-a-private-github-repository/50649) (pristup 2026-11-03).
- Kolege moraju biti dodate kao saradnici (collaborators) na Ivaninom GitHub repou. Na besplatnom GitHub planu zaštita grane `main` za privatni repo nije dostupna, pa pravilo „samo kroz PR" drži disciplina, ne GitHub.
- `.env.local` (sa `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) Ivana dijeli kolegama bezbjednim kanalom; kolege ne mogu `vercel env pull`.
- Q6 i Q2 su u odgovoru ostali prazni ili djelimični; odlučio sam po preporuci, uz izmjene navedene gore.
- AGENTS.md pretpostavlja `pnpm` i skripte `typecheck`, `lint`, `test` u `package.json`; tiket 17 treba da ih potvrdi.
- Skill `wayfinder` nije mogao biti pokrenut iz ove sesije (rezervisan za ručno pokretanje); tiket je urađen po uputstvu koordinatora i briefu.

### Novi tiketi / magla

- **Postavljanje repoa i saradnje (izrada, utorak):** repo, saradnici, Vercel veza, provjera preview-a za kolegin commit, dijeljenje `.env.local`. Dobar kandidat za `wizard` skriptu.
- **Magla:** da li uvesti GitHub Actions za `typecheck`/`lint`/`test` na PR-u. Sada se pokreću lokalno prije PR-a; CI bi bio jeftina zaštita kad troje ljudi spaja paralelno.
