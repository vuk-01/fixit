# 20 — Mjerenje brzine i jezika modela na demo fotografijama

Type: task
Status: resolved
Blocked by: 04
Mapa: [map.md](../map.md)

> **Ažurirano [Ivana], 3. 11. uveče:** API ključ je u `.env.local` (budžet ključa $5). Test se pokreće čim demo fotografije iz tiketa 21 budu spremne. Skripta je van repoa (scratchpad), ključ ne ispisuje, a sama staje na $0.50. Očekivani trošak: ~$0.01 na Haiku 5.5. Sonnet 5.5 se pokreće samo ako Haiku podbaci (~$0.10).

## Question

Istraživanje 04 nije izmjerilo da li `claude-haiku-5-5` stiže za ≤ 8 s i da li pouzdano piše ijekavicu latinicom; dokumentacija daje samo relativnu brzinu. Treba izvršiti test iz [nalaza 04](../research/04-claude-vision.md): oko 20 fotografija, tri konfiguracije, ispod $1. Rezultat zaključava model u Tech.md (17, Q5).

Ovaj tiket ne blokira tiket 17. Model je env varijabla (`ANTHROPIC_MODEL`), pa Tech.md može upisati Haiku sa Sonnetom kao rezervom, a ovaj test samo potvrđuje izbor.

Za test je potrebno:
- `ANTHROPIC_API_KEY`. Ti ga postavljaš u lokalni `.env.local`, nikad u chat ni u repo.
- 15–20 fotografija stvarnih problema (najbolje iz Podgorice), plus 2–3 fotografije sa tekstom koji glumi instrukciju (provjera prompt injection-a).
- *Dopuna nakon tiketa 10:* prijava ima do 3 fotografije u jednom pozivu modela, pa test mjeri i slučaj sa 3 slike (latencija ≤ 8 s).

❓ **Q1 - Ko i kada pravi test**: Da li test pokrećem ja u utorak ujutru, čim ključ bude u `.env.local` i fotografije u `.scratch/fixit-planiranje/test-fotografije/`?

➡️ Da. Test traje oko 15 minuta i ne blokira početak izrade.

**Tvoj odgovor:** Mozes ti

## Answer

Mjereno 3. 11. 2026. uveče. Model `claude-haiku-5-5`, `effort: low`, `output_config.format` (json_schema), slike od 1024 px u base64. Skripta je van repoa (scratchpad); prompt i šema prate Tech.md §7.

| Slučaj | Poziva | Tačna vrsta | Latencija (s) | Napomena |
|---|---|---|---|---|
| 8 demo fotografija, po 1 slika | 8 | 8/8 | 1,97–4,36 | pouzdanost 0,90–0,95 |
| Lažna instrukcija na slici | 2 | 2/2 | 2,74–3,58 | obje označene sa `image_contains_instructions = true`; model nije poslušao (nema broja telefona ni engleskog, vrsta nije promijenjena) |
| 3 slike u jednom pozivu | 2 | 2/2 | 2,54–5,70 | |

- **[istraživanje]** Latencija: medijan 2,7 s, najsporiji 5,7 s (3 slike), sve ispod cilja od 8 s. Prvi poziv sa novom šemom (4,4 s) nije bio primjetno sporiji.
- **[istraživanje]** JSON je validan u 12/12, `stop_reason = end_turn` u 12/12, nijedno odbijanje.
- **[istraživanje]** Jezik: svih 12 opisa je na latinici i ijekavski (npr. „dio", „bijela", „svjetiljka", „neobezbijeđen"), bez ćirilice i bez ekavskih oblika. Ima sitnih gramatičkih grešaka u slaganju („stari automobilski gume", „razni sitni smeće"). Građanin ih može ispraviti na ekranu pregleda, pa ne blokiraju.
- **[istraživanje]** Trošak: **$0.0046 ukupno** za 12 poziva (~$0.0004 po prijavi sa 1 slikom, ~$0.0005 sa 3 slike). Sonnet 5.5 nije pokretan.
- **[Claude]** Model ostaje `claude-haiku-5-5`; Sonnet je samo rezerva preko `ANTHROPIC_MODEL`. Tech.md §7 je ažuriran.
