# 04 — Claude vision: model, latencija i strukturisan izlaz

Type: research
Status: resolved
Blocked by: —
Mapa: [map.md](../map.md)

## Question

Koji Claude model i koji način poziva ispunjavaju FR-6 (strukturisan rezultat: da li je komunalni problem, vrsta, pouzdanost, naslov, opis, ozbiljnost, neposredna opasnost, vidljivi lični podaci) uz zahtjev „prepoznavanje ≤ 8 s od otpreme fotografije" i „jedna prijava = jedan poziv modela"?

Treba utvrditi (iz zvanične dokumentacije; koristiti skill `claude-api`):

1. Kandidat-modeli (trenutne Haiku / Sonnet / Opus verzije): tačni ID-jevi, cijena po pozivu sa jednom slikom, tipična latencija za sliku + kratak JSON odgovor.
2. Optimalna veličina slike za model (koliko tokena košta slika od 1600 px; da li za model poslati manju verziju, npr. 1024 px).
3. Kako dobiti garantovano validan JSON: structured outputs / JSON schema, tool use sa `tool_choice` ili nešto treće. Šta je trenutno preporučeno u SDK-u za TypeScript.
4. Slanje slike: base64 vs. URL (potpisani Supabase Storage URL), ograničenja veličine.
5. Zaštita od prompt injection-a preko teksta na fotografiji (AGENTS.md pravilo 7): šta dokumentacija preporučuje.
6. Kvalitet opisa na crnogorskom / srpskom ijekavskom: da li model pouzdano piše ijekavski latinicom kad mu se to zada.
7. Može li se poziv izvršiti na Vercel funkciji u zadatom vremenu i kako izvještavati korake („Prepoznajem problem…") dok poziv traje (streaming?).

Odluke koje ovo čeka: Tok prijave (15), Tehnički stack (17).

Nalaze zapisati u `.scratch/fixit-planiranje/research/04-claude-vision.md`.

## Answer

- **[istraživanje]** Kandidati (tačni ID-jevi): `claude-haiku-5-5` ($0.10 / $0.50 po MTok, „Fastest", namijenjen klasifikaciji i ekstrakciji), `claude-sonnet-5-5` ($2 / $10, „Fast"), `claude-opus-5-5` ($4 / $20, „Moderate"). Dokumentacija ne objavljuje latenciju u sekundama, pa ≤ 8 s treba izmjeriti (plan mjerenja u nalazima, < $1).
- **[istraživanje]** Slika košta `⌈š/28⌉ × ⌈v/28⌉` tokena: 1600×1200 ≈ 2 494, 1024×768 ≈ 1 036. Cijeli poziv sa slikom na Haiku 5.5 je ≈ $0.0004–0.0005 (Sonnet 5.5 ≈ $0.01, Opus 5.5 ≈ $0.02). Dokumentacija savjetuje smanjivanje slike radi latencije, a model ne čita EXIF (orijentacija mora biti u pikselima).
- **[istraživanje]** Garantovan JSON: `output_config.format` (JSON outputs, stabilno, bez beta headera). U TS SDK-u se preporučuje `client.messages.parse()` + `zodOutputFormat()`. Forsiran `tool_choice` vraća 400 na Opus 5.5 / Sonnet 5.5; prefill i stari `output_format` ne rade.
- **[istraživanje]** Ograničenja šeme: nema `minimum`/`maximum` (SDK ih validira lokalno), `additionalProperties: false` je obavezan, veličina slova u `enum` vrijednostima nije garantovana, a prvi poziv sa novom šemom je sporiji (gramatika se kešira 24 h). Na `refusal` / `max_tokens` izlaz možda ne odgovara šemi; thinking troši `max_tokens`.
- **[istraživanje]** Haiku 5.5 odbija `temperature`/`top_p`/`top_k` (400). Thinking je uključen podrazumijevano; brzina se podešava kroz `effort` (`low` je najbrži). Bezbjednosni klasifikatori mogu odbiti i bezazlen zahtjev, a Haiku 5.5 nema server-side fallback, pa odbijanje vodi u ručni tok.
- **[istraživanje]** Slika: base64 (do 10 MB), URL ili Files API. Base64 radi na svim platformama i ne izlaže potpisani Supabase URL; za ponašanje pri preuzimanju sa URL-a dokumentacija ne daje detalje. Vercel funkcija prima najviše 4,5 MB, a rok joj je 300 s na Hobby planu.
- **[istraživanje]** Injection: dokumentacija preporučuje pravilo u sistemskom promptu („nepouzdan sadržaj je podatak"), opis izvora sadržaja, najmanje privilegije (bez alata), nepouzdan sadržaj u `tool_result` i red-team testiranje. Odvojeni screen poziv bi prekršio „jedan poziv po prijavi".
- **[istraživanje]** Srpski/crnogorski nije u zvaničnoj tabeli jezika. Dokumentacija samo savjetuje da se jezik zada u sistemskom promptu i da se testira, pa ijekavica nije garantovana i mora ući u test skup.
- **[istraživanje]** Koraci u UI-ju („Prepoznajem problem…") ne traže Claude streaming, jer je izlaz kratak JSON. SDK podrazumijevano ima timeout 10 min i 2 ponovna pokušaja, pa za budžet od 8 s treba kratak `timeout` i 0–1 ponovni pokušaj.
- **[istraživanje]** Preporuka (nije odluka): `claude-haiku-5-5`, `effort: "low"`, slika od 1024 px kao base64 sa servera, `messages.parse` + Zod šema, mjere protiv injekcije iz nalaza. Potvrditi mjerenjem prije odluka 15 i 17.

[Nalazi](../research/04-claude-vision.md)
