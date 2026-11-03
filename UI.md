# UI rules for this project

## shadcn/ui setup (ticket 17, 3. 11. 2026)

- **Preset: `b2xaqzSRuK`** (Ivana's choice). The project is created once, in the repo root, with:

  ```
  pnpm dlx shadcn@latest init --preset b2xaqzSRuK --template next
  ```

- `components.json` has **no `preset` field**. A preset is a short code that `init` spreads across the fields of `components.json` (`style`, `tailwind.baseColor`, `iconLibrary`, `menuColor`, `menuAccent`, …) and the CSS variables in `app/globals.css` (theme, radius, fonts). "Use the preset" therefore means: keep those generated values and do not edit them by hand. `style`, `tailwind.baseColor` and `tailwind.cssVariables` cannot be changed after `init`.
- To check which preset the project currently matches: `pnpm exec shadcn preset resolve`. To see what a code contains: `pnpm exec shadcn preset decode b2xaqzSRuK`. If the preset ever changes, record the new code here and apply it with `shadcn apply`.
- Component base: shadcn now defaults to Base UI (Radix only with `-b radix`). We use whatever base the preset sets up. After `init`, record it here (the `style` prefix in `components.json`, e.g. `base-…` or `radix-…`) and never mix the two bases.
  - Base after `init`: _(fill in on Tuesday)_
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