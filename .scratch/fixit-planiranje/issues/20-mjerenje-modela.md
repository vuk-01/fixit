# 20 — Mjerenje brzine i jezika modela na demo fotografijama

Type: task
Status: open
Blocked by: 04
Mapa: [map.md](../map.md)

> **Odloženo [Ivana], 3. 11.:** API ključ se dodaje naknadno. Tiket ne blokira izradu. Bez ključa poziv modela vraća grešku i aplikacija prelazi na ručni tok (tiket 15, Q5), pa se sve ostalo može graditi i testirati. Fotografije za test mogu biti iste kao demo fotografije ([21](21-demo-fotografije.md), Q4).

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
