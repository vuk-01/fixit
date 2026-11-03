# Fixit

Rječnik domena za Fixit: građanin fotografiše problem, sistem iz tabele pravila određuje nadležnu instituciju i šalje joj dopis, a prijava je javna na mapi, gdje je drugi građani podržavaju. Uz svaki pojam stoji naziv koji koristimo u UI-ju i dokumentima, identifikator u kodu (u zagradi, gdje je odlučen) i riječi koje ne koristimo.

## Jezik

### Prijava i ono što iz nje nastaje

**Prijava** (`report`):
Javni zapis o jednom problemu na jednom mjestu: fotografije, opis problema, lokacija, vrsta problema, nadležna institucija, status i podrške. Ostaje ista prijava i kad se preusmjeri drugoj instituciji.
_Izbjegavaj_: zahtjev, tiket, slučaj; „prijava" u značenju formalnog teksta koji ide instituciji (to je dopis)

**Dopis** (`letter`):
Formalni tekst koji Fixit šalje nadležnoj instituciji za jednu prijavu: fiksni šablon popunjen podacima prijave i opisom onoga što se vidi na fotografiji. Nije javan; prijava dobija novi dopis za svaku instituciju kojoj se upućuje. Građaninu se u UI-ju prikazuje kao „tekst prijave".
_Izbjegavaj_: prijava, mejl, poruka (u ovom značenju)

**Slanje dopisa** (`dispatch`):
Jedan pokušaj da se dopis isporuči instituciji mejlom, zajedno sa ishodom (uspjelo ili nije uspjelo). Neuspjelo slanje se može ponoviti.
_Izbjegavaj_: isporuka, mejl (kao naziv za pokušaj)

**Podnošenje prijave** (`submit`):
Trenutak kad prijava, nakon što građanin dodirne „Pošalji prijavu", prestaje da bude nacrt: dopis je uspješno poslat ili je prijava prešla u „Određuje se nadležni". Od tog trenutka prijava je javna i teče brojač dana, čak i ako dopis još nije poslat jer se nadležni tek određuje. Ako slanje dopisa ne uspije, prijava nije podnesena i ostaje nacrt.
_Izbjegavaj_: slanje (to je slanje dopisa)

**Broj prijave**:
Kratka javna oznaka prijave oblika `FX-2026-00142`. Prijava ga dobija pri prvom dodiru na „Pošalji prijavu" (jer je u naslovu dopisa) i zadržava ga i kad slanje ne uspije; nacrt koji nikad nije poslat ga nema.
_Izbjegavaj_: ID, broj tiketa

**Fotografija**:
Slika problema koju je građanin priložio prijavi; prijava ima od jedne do tri fotografije.
_Izbjegavaj_: slika, prilog (prilog je samo dio mejla)

**Vrsta problema** (`category`):
Jedna od unaprijed zadatih vrsta (npr. rupa na putu, divlja deponija) kojoj prijava pripada. AI je predlaže sa fotografije, a građanin je može promijeniti. Vrsta za sve što nije na spisku je `other`, u UI-ju „Drugi problem".
_Izbjegavaj_: kategorija (u UI-ju i dokumentima; „kategorija puta" je drugi pojam), tip, „Nešto drugo"

**Opis problema** (`description`):
Kratak tekst o onome što se vidi na fotografijama. Predlaže ga model (u ručnom toku ga građanin piše sam ili ostavlja prazan), a građanin ga mijenja na pregledu prijave. Javan je, prikazuje se uz fotografije, i ide u dopis. Naslov koji predlaže model (`title`) nije javan i nije isto što i opis.
_Izbjegavaj_: komentar, napomena, poruka (poruka je tekst službenika u vremenskoj liniji)

**Lokacija**:
Tačka koju je građanin potvrdio pinom na mapi; jedini izvor mjesta prijave.
_Izbjegavaj_: GPS, pozicija

**Adresa**:
Čitljiv opis lokacije (ulica, broj, naselje) koji se izvodi iz lokacije, nikad obrnuto.
_Izbjegavaj_: lokacija (u ovom značenju)

**Duplikat**:
Otvorena prijava iste vrste problema u krugu od 50 m od nove lokacije, koju građaninu nudimo da podrži umjesto da pravi novu.
_Izbjegavaj_: ista prijava, slična prijava

### Statusi

**Status** (`status`):
Faza u kojoj se prijava nalazi. Svaka promjena statusa ulazi u vremensku liniju prijave.

| Kod | Javni naziv u UI-ju | Naziv u panelu (ako je drugačiji) | Značenje |
|---|---|---|---|
| `draft` | „Nacrt" (nikad javno, vidi ga samo prijavilac) | | Prijava je započeta, ali nije podnesena. |
| `routing` | „Određuje se nadležni" | | Prijava je podnesena, ali ne postoji pravilo nadležnosti ili primalac nema provjeren mejl; čeka ručno raspoređivanje. |
| `sent` | „Poslata" | | Dopis je poslat nadležnoj instituciji. |
| `acknowledged` | „Primljena" | | Službenik nadležne institucije je otvorio prijavu. |
| `in_progress` | „U radu" | | Institucija rješava problem. |
| `resolved` | „Riješena" | | Institucija je riješila problem. |
| `not_competent` | „Preusmjerava se" | „Nije naša nadležnost" | Institucija je javila da nije nadležna; prijava čeka preusmjeravanje. |
| `rejected` | „Odbijena" | | Prijava je neosnovana ili je duplikat. |

**Otvorena prijava**:
Podnesena prijava koja nije riješena, odbijena ni sakrivena. Samo otvorena prijava se može podržati i samo nju nudimo kao duplikat.
_Izbjegavaj_: aktivna prijava, neriješena prijava

**Zatvorena prijava**:
Prijava u statusu „Riješena" ili „Odbijena". Brojač dana joj stoji, a podrška više nije moguća; samo administrator je može ponovo otvoriti.
_Izbjegavaj_: završena, arhivirana

**Sakrivena prijava**:
Prijava koju je administrator uklonio iz javnog prikaza (moderacija). Sakrivanje nije status: prijava zadržava svoj status. Administrator na isti način može sakriti i pojedinačnu fotografiju.
_Izbjegavaj_: obrisana, blokirana

**Označena fotografija**:
Fotografija na kojoj je model uočio lica ili registarske tablice. Ostaje javna dok je administrator ne sakrije.
_Izbjegavaj_: zabranjena, cenzurisana fotografija

**Vremenska linija**:
Javni hronološki spisak promjena statusa, preusmjeravanja i poruka službenika za jednu prijavu.
_Izbjegavaj_: istorija, log

**Brojač dana**:
Broj kalendarskih dana, po vremenu u Podgorici, od podnošenja prijave do zatvaranja (rješenja ili odbijanja), odnosno do danas dok prijava nije zatvorena.
_Izbjegavaj_: starost prijave, SLA

### Podrška

**Podrška** (`like`):
Znak drugog korisnika da ga muči isti problem; jedna po korisniku po prijavi, samo za tuđu otvorenu prijavu. Dugme glasi „Podržavam", poslije podrške „Podržano" (onemogućeno), a brojač „1 podrška", „2–4 podrške", „5 i više podrški" (po crnogorskoj gramatici: 21 podrška, 22 podrške, 11–14 podrški). U kodu ostaje `like` (tabela `report_likes`, kolona `like_count`).
_Izbjegavaj_: like, lajk, lajkovati, glas, potvrda (zauzeta za potvrdu lokacije i slanja), +1; „podrška" u značenju pomoći korisnicima (to je „Pomoć" ili „Kontakt")

### Ljudi i uloge

**Građanin** (`citizen`):
Korisnik sa nalogom (ime, prezime, mejl i šifra) koji podnosi prijave i podržava tuđe.
_Izbjegavaj_: korisnik (kad se misli baš na građanina), stanovnik

**Prijavilac** (`reporter`):
Građanin koji je podnio određenu prijavu. Njegov identitet nikad nije javan.
_Izbjegavaj_: autor, podnosilac, vlasnik prijave

**Dostavljanje podataka**:
Prijaviočev izbor, posebno za svaku prijavu, da se njegovo ime, prezime i mejl uključe u dopis. Podrazumijevano je isključeno i ne pamti se sa prethodne prijave.
_Izbjegavaj_: dijeljenje podataka, javni podaci

**Anonimni korisnik**:
Posjetilac bez naloga koji je dodirnuo „Podržavam"; ima samo anonimnu sesiju, bez profila, i može jedino da podrži prijavu.
_Izbjegavaj_: gost (gost nema ni sesiju)

**Gost**:
Neulogovan posjetilac bez sesije; samo gleda javnu mapu, javne stranice prijava i statistiku.
_Izbjegavaj_: posjetilac, anonimni korisnik

**Profil** (`profiles`):
Podaci o korisniku sa nalogom: ime, prezime i uloga. Anonimni korisnik ga nema.
_Izbjegavaj_: nalog (nalog je način prijavljivanja, profil su podaci)

**Uloga** (`citizen`, `official`, `admin`):
Ono što korisnik sa nalogom smije da radi: građanin, službenik ili administrator.
_Izbjegavaj_: tip korisnika, prava

**Službenik** (`official`):
Zaposleni u instituciji kome je administrator otvorio nalog; vidi i mijenja samo prijave svoje institucije.
_Izbjegavaj_: operater, radnik, predstavnik institucije

**Administrator** (`admin`):
Član tima Fixit koji upravlja institucijama, pravilima nadležnosti, nalozima službenika, preusmjeravanjem i moderacijom.
_Izbjegavaj_: moderator, superadmin

### Institucije i nadležnost

**Institucija** (`institution`):
Svaki mogući primalac ili kopija dopisa: sekretarijat Glavnog grada, komunalno preduzeće, državni organ ili javno preduzeće.
_Izbjegavaj_: organ, služba, firma

**Služba**:
Organizaciona jedinica unutar institucije; raspoređivanje prijava službama je van scope-a.
_Izbjegavaj_: odjeljenje, sektor

**Nadležna institucija**:
Institucija kojoj je prijava upućena, a koju je za tu prijavu odredilo pravilo nadležnosti ili administrator (ručnim raspoređivanjem ili preusmjeravanjem); nikad AI.
_Izbjegavaj_: nadležni organ

**Primalac**:
Nadležna institucija u ulozi adresata dopisa; jedina institucija koja prijavu vidi u panelu i mijenja joj status.
_Izbjegavaj_: adresat, nadležni (kao imenica u dokumentima)

**Kopija** (`cc`):
Institucija koja po pravilu nadležnosti dobija dopis u kopiji, jer izvodi radove po nalogu primaoca (npr. „Putevi" d.o.o. uz Sekretarijat za saobraćaj). Ne vidi prijavu u panelu i ne mijenja status; ako nema mejl, dopis ide bez kopije.
_Izbjegavaj_: drugi primalac, sekundarna institucija

**Pravilo nadležnosti** (`jurisdiction_rules`):
Provjerena veza „vrsta problema + opština → primalac (i, po potrebi, kopija)", uz izvor pravila. Za jednu vrstu i opštinu postoji najviše jedno pravilo; nema rezervnog pravila „sve ostalo ide instituciji X".
_Izbjegavaj_: mapiranje, rezervno pravilo, AI procjena nadležnosti

**Izvor pravila** (`source_type`):
Ono na čemu pravilo nadležnosti počiva: zvanični dokument (`official_document`), zvanična stranica institucije (`official_page`), pisana potvrda institucije (`written_confirmation`) ili telefonska potvrda (`phone_confirmation`). Bez izvora nema pravila.
_Izbjegavaj_: referenca, dokaz

**Slabiji izvor**:
Izvor pravila koji je samo telefonska potvrda; u UI-ju se prikazuje kao „slabiji izvor (potvrda telefonom)".
_Izbjegavaj_: nepouzdan izvor, nepotvrđeno pravilo

**Ručno raspoređivanje**:
Administratorov izbor nadležne institucije za prijavu u statusu „Određuje se nadležni"; nakon toga se šalje dopis. Ne stvara pravilo nadležnosti i nije odluka AI-ja. U vremenskoj liniji: „Nadležnog je odredio administrator Fixita".
_Izbjegavaj_: ručno pravilo, prosljeđivanje

**Preusmjeravanje**:
Administratorovo dodjeljivanje nove nadležne institucije prijavi koja već ima primaoca: najčešće kad je primalac označio „Nije naša nadležnost", ili kad administrator sam primijeti grešku. Kao i ručno raspoređivanje, ne stvara pravilo. Prijava ostaje ista (broj, podrške, brojač dana), a nastaje novi dopis.
_Izbjegavaj_: nova prijava, ponovna prijava

**Opština** (`municipality`):
Jedinica lokalne samouprave u kojoj je lokacija. UI uvijek kaže „opština", i za Glavni grad Podgoricu; puni zvanični naziv ide samo u naziv institucije i u dopis. Prva verzija radi samo za Podgoricu.
_Izbjegavaj_: grad, glavni grad, prijestonica, lokalna samouprava (u UI-ju)

### Proizvod

**Fixit**:
Naziv proizvoda i brend; koristi se i u UI-ju, dopisu i potpisu „Tim Fixit" i ne smatra se kršenjem pravila o crnogorskom jeziku.
_Izbjegavaj_: prevode naziva

**Agent**:
Tok na serveru koji sa fotografija prepoznaje vrstu problema i opis (AI), iz pravila nadležnosti određuje nadležnu instituciju (bez AI-ja) i sastavlja dopis iz šablona.
_Izbjegavaj_: bot, asistent

**Demo prijava** (`is_demo`):
Prijava koju je za demo napravio tim, sa izmišljenom istorijom i upisanim brojem podrški, ili prijava napravljena sa demo naloga (probe tima i prijava snimljena u videu). U UI-ju nosi oznaku „Demo prijava" (na javnoj stranici i u oblačiću markera); fotografija je sa otvorenom licencom, a neke demo prijave su bez fotografije. Briše se jednom komandom tek poslije ocjenjivanja.
_Izbjegavaj_: lažna prijava, test prijava, primjer

**Ručni tok**:
Nastavak prijave bez AI-ja kad model ne odgovori na vrijeme ili vrati grešku: građanin sam bira vrstu problema i po želji upisuje opis, a dopis nastaje iz istog šablona.
_Izbjegavaj_: rezervni režim, offline režim
