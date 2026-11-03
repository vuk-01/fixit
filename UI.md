# UI rules for this project

## shadcn/ui setup (ticket 17, 3. 11. 2026)

- **Preset: `b2xaqzSRuK`** (Ivana's choice). The project is created once, in the repo root, with:

  ```
  pnpm dlx shadcn@latest init --preset b2xaqzSRuK --template next
  ```

- `components.json` has **no `preset` field**. A preset is a short code that `init` spreads across the fields of `components.json` (`style`, `tailwind.baseColor`, `iconLibrary`, `menuColor`, `menuAccent`, …) and the CSS variables in `app/globals.css` (theme, radius, fonts). "Use the preset" therefore means: keep those generated values and do not edit them by hand. `style`, `tailwind.baseColor` and `tailwind.cssVariables` cannot be changed after `init`.
- To check which preset the project currently matches: `pnpm exec shadcn preset resolve`. To see what a code contains: `pnpm exec shadcn preset decode b2xaqzSRuK`. If the preset ever changes, record the new code here and apply it with `shadcn apply`.
- Component base: shadcn now defaults to Base UI (Radix only with `-b radix`). We use whatever base the preset sets up. After `init`, record it here (the `style` prefix in `components.json`, e.g. `base-…` or `radix-…`) and never mix the two bases.
  - Base after `init`: **Base UI** (`"style": "base-maia"` in `components.json`, `@base-ui/react`; ticket 1, 3. 11. 2026). `shadcn preset resolve` reports `b2xaqzSRuK`: style `maia`, baseColor `mist`, theme `blue`, chartColor `orange`, lucide icons, fonts DM Sans / Outfit, radius `large`.
- The CLI is pinned: `shadcn` 4.23.0 as a devDependency (`Tech.md`). Use `pnpm exec shadcn add <component>`, not `@latest`, so agents do not pull a different version mid-week. Only the one-time `init` above uses `@latest`.
- shadcn MCP for Claude Code: `.mcp.json` in the repo root, then restart Claude Code and check with `/mcp` (needs a valid `components.json`):

  ```json
  { "mcpServers": { "shadcn": { "command": "npx", "args": ["shadcn@4.23.0", "mcp"] } } }
  ```

## Rules

- When adding components, use the shadcn MCP to check what's available, then add them with the pinned CLI.
- Never hand-edit the preset values in `components.json` or the theme variables in `app/globals.css`; brand and accent colours come from the preset. The "Prijavi problem" button uses the default (primary) `Button` variant, not a custom colour.
- Always use shadcn/ui components and patterns for UI when possible.  
- Prefer existing components from `@/components/ui/*` before creating custom UI.
- Follow ui.shadcn.com component structure, composition, and naming.
- Do not invent custom button, input, dialog, select, table, or form primitives if shadcn/ui already provides them.
- Keep styling in Tailwind CSS.
- Reuse shadcn variants instead of writing ad-hoc styles.
- For forms, prefer shadcn form patterns and accessible labels/errors.
- Before adding a new UI primitive, check whether shadcn/ui already has that component.
- The map is the one exception: Leaflet components live in `components/map/` (`Tech.md` §8). Controls, panels and sheets around the map are still shadcn.
- Project requirements that apply to every screen (PRD §6, AGENTS.md rule 6):
  - citizen pages work at 360 px width (mobile-first); the panel is desktop-first but usable on a tablet;
  - touch targets at least 44 × 44 px; WCAG AA contrast; statuses are never shown by colour alone (colour + icon/text);
  - all user-facing text is Montenegrin, Latin script, ijekavian, and lives in `lib/constants.ts` or next to the component.
## Status colours and icons (ticket 22 Q10)

One mapping for every place a status is shown (map marker, public report page, panel). Colours are tokens from the preset (`--muted`, `--chart-1`…`--chart-4`, `--destructive` in `app/globals.css`, used as Tailwind classes such as `bg-chart-1`); icons come from the preset's icon library (lucide). Keep the mapping in one `Record<report_status, …>` next to the status labels, so a missing status breaks `pnpm typecheck`.

| Status | Label (public) | Colour token | Icon |
|---|---|---|---|
| `routing` | Određuje se nadležni | `muted` | `CircleHelp` |
| `sent` | Poslata | `chart-1` | `Send` |
| `acknowledged` | Primljena | `chart-2` | `Eye` |
| `in_progress` | U radu | `chart-3` | `Wrench` |
| `resolved` | Riješena | `chart-4` | `CircleCheck` |
| `not_competent` | Preusmjerava se (panel: „Nije naša nadležnost") | `muted` | `ArrowLeftRight` |
| `rejected` | Odbijena | `destructive` | `CircleX` |

- `draft` is never shown publicly and has no entry here.
- A status is always shown as text as well, never by colour alone (PRD §6, accessibility); the icon is a second cue, not a replacement for the label.
- The exact shades depend on the preset: check them (and WCAG AA contrast of the icon on the marker) once `init` has run. Do not hand-edit the theme variables to fix a shade; pick another existing token and update this table.

## Layout direction: prototype v2 (Ivana, 3. 11. 2026)

Ivana chose **direction v2 ("lista i kartice")** out of three prototypes; the other two are discarded. Reference: [.scratch/prototypes/v2-lista-kartice.html](.scratch/prototypes/v2-lista-kartice.html), open it in a browser (it is a throwaway mock with fake data, not code to copy). Build the real screens with shadcn components in this direction:

- **Home `/`:** a header (Fixit, „Prijave u Podgorici") with two tabs, **Mapa | Lista**. **Mapa is the default tab** when the app opens (Ivana's change to v2); Lista shows the same reports as cards (photo, category, status with icon + text, day counter, support count). A full-width primary button „Prijavi problem" sits at the bottom.
- **Cards everywhere:** content sits in white cards (`Card`) on a light neutral background; one blue primary colour (the preset's `primary`, preset is maia/mist/blue).
- **Report flow `/prijavi`:** a wizard with a progress bar and step titles (photo → location with live agent steps → „Pregled prijave"), matching the screen order and tap budget in PRD FR-5 and ticket 15. Each step is one screen with one primary button at the bottom.
- **Public report page `/p/[code]`:** stacked cards (photo, public description, category/status/institution, day counter, „Podržavam" with live count, timeline).
- The dev overlay in the prototype (tap counter, test-mode caption) is a prototype tool only; it is not part of the app.
