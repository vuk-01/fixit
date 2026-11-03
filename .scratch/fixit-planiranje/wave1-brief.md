# Brief for parallel wayfinder sessions (wave 1, 2026-11-03)

This file is for the agents resolving tickets 08–17 in parallel. It is not a ticket.

## Cross-ticket decisions by Ivana (read before resolving any ticket)

Some answers in one ticket change others. If two of Ivana's answers conflict, the **later/more specific one wins**, and you note the conflict in your Answer.

1. **Only Podgorica.** In 18 Q4 Ivana changed her mind: the first version of the app works **only for Glavni grad Podgorica**; don't plan for other municipalities. This overrides 08 Q1 ("granice za sve opštine"). Consequences: FR-4 becomes "lokacija van Podgorice se odbija uz jasnu poruku"; only Podgorica's boundary is seeded; the "national rule" level (14 Q2) is not needed for P0.
2. **Demo is a 1-minute video only**, recorded on Friday, showing **only the citizen's perspective**: photographing a problem, sending the report, and how it develops afterwards. No live demo, **no QR code**: QR is removed from the app and demo plan entirely (08 Q2–Q6, 11 Q2, 11 Q8). Updated recommendations that mention QR or a live audience no longer apply.
3. **Multiple photos per report** (10 Q9): a citizen may attach more than one photo. Still one model call per report (multiple images in one call). Decide a sensible maximum and the flow for adding photos, mark them [Claude], and keep within the tap budget.
4. **First and last name are required at sign-up** (15 Q4). FR-11 no longer needs to ask for a name before sending.
5. **Tap budget** (15 Q6b, Q7): taking or choosing the photo does not count toward the 4 taps; the 60 s timer starts after the citizen has sent the photo.
6. **Hosting** (16): host on **Vercel**, Ivana will **pay for a domain**. TryCloudflare was the earlier idea; Vercel replaces it. Ivana asked (16 Q3) whether Vercel works "ako imamo agenta koji će da radi u pozadini po zahtjevu": answer it in 16's Answer (research 07: the agent runs as a request-triggered server function, max 300 s on Hobby; no always-on worker needed).
7. **Ivana is the only planner now**; 3 people build later. Repo lives on Ivana's personal GitHub; she owns migrations (12).
8. **shadcn preset** (17 Q1): `pnpm dlx shadcn@latest init --preset b2xaqzSRuK --template next`.

## Rules for each session

- Ivana's written answers under `**Tvoj odgovor:**` ARE the grilling exchange. Don't ask further questions; she is not in the loop live.
- "da"/"Da" = she accepted the recommendation → **[Ivana]**. Her own text → **[Ivana]**. Blank → she delegated it: decide (normally the recommendation, adjusted for the cross-ticket decisions and research findings) and mark **[Claude]**.
- Golden rules from AGENTS.md always win over any answer. If something conflicts, say so in the Answer.

## File ownership (to avoid clobbering)

- **Never use Write on an existing doc**: only small targeted Edits, and re-Read the file right before each Edit, because other sessions edit the same files concurrently.
- `PRD.md`: shared. Edit only the sections your ticket concerns.
- `Tech.md`: ticket 17 replaces the current three lines (Edit, not Write). Ticket 16 appends a section `## Hosting, domen i mejl` at the end.
- `UI.md`: ticket 17 only.
- `AGENTS.md` and new `CLAUDE.md`: ticket 12 only. 12 also adds `UI.md` and `GLOSSARY.md` to the sources-of-truth table.
- `GLOSSARY.md`: ticket 09 only; it creates the file.
- `DB.md`: **nobody in wave 1.** Ticket 18 writes it later. Put DB consequences in your Answer under a heading `### Za DB.md (tiket 18)`.
- `map.md` and other tickets: don't edit. The coordinating session updates the map. Propose new tickets or fog in your Answer under `### Novi tiketi / magla`.
