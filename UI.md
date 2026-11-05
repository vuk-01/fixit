# UI rules for this project

Every screen follows **"Fixit design"** below. Read it whole before building or changing any screen or component; when a screen needs something it does not cover, extend it in the same grammar and add the rule here in the same PR.

## shadcn/ui setup (ticket 17, 3. 11. 2026; theme replaced 5. 11. 2026)

- The project was created from **preset `b2xaqzSRuK`** (Ivana's choice) with `pnpm dlx shadcn@latest init --preset b2xaqzSRuK --template next`. On 5. 11. 2026 the preset's theme (colours, fonts, radius) was replaced by the Fixit theme below [Vuk, 5. 11. 2026; Ivana approves in the PR]. The structure the preset chose stays: `components.json` (`"style": "base-maia"`, Base UI, lucide icons, `baseColor` mist) is unchanged and is not edited by hand.
- **Never run `shadcn init`, `shadcn apply` or `shadcn preset …` again**: they rewrite the theme tokens in `app/globals.css`. Theme tokens change only by hand, in `app/globals.css`, together with this file.
- Component base: **Base UI** (`"style": "base-maia"`, `@base-ui/react`). Never mix in Radix components.
- The CLI is pinned: `shadcn` 4.23.0 as a devDependency (`Tech.md`). Add components with `pnpm exec shadcn add <component>`, not `@latest`. New components pick up the Fixit theme through the same tokens (`bg-primary`, `text-muted-foreground`, …).
- shadcn MCP for Claude Code: `.mcp.json` in the repo root (`{ "mcpServers": { "shadcn": { "command": "npx", "args": ["shadcn@4.23.0", "mcp"] } } }`), then restart Claude Code and check with `/mcp`.

## Rules

- When adding components, use the shadcn MCP to check what's available, then add them with the pinned CLI.
- Always use shadcn/ui components and patterns for UI when possible; prefer `@/components/ui/*` before creating custom UI. Do not invent custom button, input, dialog, select, table, or form primitives if shadcn/ui already provides them. A shadcn component may get a new **variant** (e.g. `highlight` on `Button`) when the design needs one; its base classes are not rewritten.
- Keep styling in Tailwind CSS and the theme tokens; no raw hex values in components (the only hex values live in `app/globals.css`).
- Merge classes with `cn` (it merges Tailwind conflicts): `cn(buttonVariants({ variant: "highlight" }), "h-14 px-5")`. Do not pass overrides through `buttonVariants({ className })`: cva only concatenates, and which conflicting class wins is then an accident of CSS order.
- For forms, prefer shadcn form patterns and accessible labels/errors.
- The map is the one exception: Leaflet components live in `components/map/` (`Tech.md` §8). Controls, panels and sheets around the map are still shadcn or follow the rules below.
- Project requirements that apply to every screen (PRD §6, AGENTS.md rule 6):
  - citizen pages work at 360 px width (mobile-first); the panel is desktop-first but usable on a tablet;
  - touch targets at least 44 × 44 px; WCAG AA contrast; statuses are never shown by colour alone (colour + icon/text);
  - all user-facing text is Montenegrin, Latin script, ijekavian, and lives in `lib/constants.ts` or next to the component.

## Fixit design [Vuk, 5. 11. 2026]

Chosen by Vuk from home-page prototypes (ticket 32; the prototype branch is `32-prototip-pocetna`, variant D). The world is a **departure board**: navy panels carry structure and state, one amber lamp marks the action, and figures are tabular — the day counter of a report leads the way a departure time does. Navy and amber are the two colours of the logo (`public/fixit-logo.svg`).

### Colour tokens (`app/globals.css`)

| Token (Tailwind) | Value | Use | Never |
|---|---|---|---|
| `primary` / `primary-foreground` | navy `#17212f` / white | header, active tab pill, marker day count and needle, zoom buttons, default buttons, links, focus ring | — |
| `highlight` / `highlight-foreground` | amber `#ffb400` / navy | **the one main action of a screen** (`Button` variant `highlight`), the logo, icons inside navy (active tab icon, „Uloguj se" icon), text selection | amber text or amber thin lines on white (1.9:1, fails AA); two amber buttons competing on one screen |
| `ground` | `#eef0f3` | page ground behind white cards (lists, sidebars' list area) | as a card colour |
| `background`, `card`, `popover` | white | bars (bottom navigation, laptop sidebar head), cards, popups, menus | — |
| `foreground` | navy `#17212f` | text | — |
| `muted` / `muted-foreground` | `#e7eaee` / `#4b5563` | photo placeholders, stat tiles; secondary text (addresses, counts, inactive tab labels) | — |
| `border`, `input` | `#d9dde3` | card rings, bar borders, inputs | — |
| `status-*` | see "Status colours and icons" | status badges and markers only | for anything that is not a status |
| `report-day` / `report-day-foreground` | dark navy blue `#1f3352` / off-white `#f1f5f9` | day column of a report card in the list (every status but `resolved`) | amber figures on it |
| `report-resolved` / `report-resolved-day` | light green `#eef7f1` / `#d6ecdd` | a resolved report card: the whole card / its day column, figures in `foreground` | as a status colour (the badge stays `status-resolved`) |
| `highlight-shade` | `#e09e00` | darker amber details on the sign-in scene's worker (hard hat ridge, vest seam) | for UI |
| `scene-*` (`hole`, `stone`, `steel`, `skin`, `wood`, `straw`, `cardboard`, `check`) | see `app/globals.css` | the sign-in repair scene's drawing only (see "Sign-in page"), used as `var(--scene-…)` in its SVG | for UI; `scene-check` is the scene's ✓ and is not a status colour |

`--radius` is `0.75rem`: `rounded-lg` 12 px, `rounded-xl` 16.8 px, `rounded-2xl` 21.6 px, `rounded-4xl` 31.2 px (pills).

### Typography

- **Overpass** for everything, **Overpass Mono** for figures that are data (day counts, the legend sample, stat numbers). Both are self-hosted in `public/fonts/` (SIL OFL, `public/fonts/OFL.txt`), Latin + Latin Extended, declared with `@font-face` in `app/globals.css` and preloaded in `app/layout.tsx`. Tailwind: `font-sans`, `font-heading` (same face), `font-mono`.
- **Vertical centring is solved in the font, once.** Overpass places its capitals 0.10 em above the centre of the line box, so a label sat high next to its icon and inside its pill. The `@font-face` rules carry `ascent-override: 98.45%; descent-override: 28.15%` (ascent − descent = cap height, sum unchanged, so line heights are unchanged), and single-line controls (`Button`, `Badge`, the header pill) use `line-height: normal` so the browser has no half-leading to round. **Never nudge a label with `translate-y`, `pt-px` or similar to centre it**; if something looks off-centre, fix the cause here.
- Scale in use (size / weight / line height):

| Role | Style |
|---|---|
| Header title „Fixit" | 26 px / 800 / 1, tracking −0.01em |
| Page heading (laptop sidebar „Sve prijave") | 22 px / 800, tracking −0.01em |
| Popup title (category) | 17 px / 700 / 1.375 |
| Card title (category) | 15.5 px / 700 / 1.375, at most 2 lines |
| Main action label | 16.5 px / 500 (phone bar), 16 px / 500 (sidebar) |
| Header pill label | 15 px / 700 |
| Popup button label | 15 px / 500 |
| Meta text (address, supports, counters) | 13 px / 400, `text-muted-foreground`; in the popup counters 13 px / 600 in `foreground` |
| Bottom-bar tab label | 13 px / 700 |
| Legend | 12.5 px / 600 |
| Badge | 12 px / 500 |
| Day count (card) | Overpass Mono 30 px / 600 / 1, tabular |
| Day word under it („DAN", „DANA") | 11 px / 700 / 1, uppercase, tracking 0.08em, same colour as the number |
| Marker day count | Overpass Mono 13 px / 600 / 1, tabular |

### Header (`components/site-header.tsx`, every page)

- Navy (`bg-primary`), height `--header-height` = **4.75rem (76 px)**, no bottom border, sticky. Full-height screens use `h-[calc(100svh-var(--header-height))]`, never a hard-coded rem value.
- Left: the logo (`/fixit-logo.svg`, 44 × 44, `alt=""`; the link carries „Fixit, početna"), 12 px gap, „Fixit", vertically centred on the logo. No subtitle [ticket 32, 5. 11. 2026: „Prijave u Podgorici" removed]. The logo block never shrinks (`shrink-0`).
- Right: **one pill control** (`HEADER_PILL` in `components/header-styles.ts`): 44 px tall, `rounded-full`, `bg-white/10` with a `white/25` inner ring, white 15 px / 700 label, an 18 px amber icon before it (`LogIn` for „Uloguj se", `UserRound` + the account's role for the account menu), `-mr-1`. The account menu is the same pill; the menu itself is the shadcn `DropdownMenu`.
- **Account menu** (`components/user-menu.tsx`) [ticket 32, 5. 11. 2026]:
  - Trigger: the pill with `UserRound`, **the role only** („Građanin", „Službenik", „Administrator", `HEADER_TEXT.roles`) and a 16 px `ChevronDown` (`white/80`), 6 px gaps, padding 14 px left / 12 px right, `whitespace-nowrap`. No name and no institution in the header: the label is short and fixed, so it fits whole next to the logo at 360 px.
  - **No `truncate` and no „…" anywhere in the header or the menu.** Long text in the menu wraps.
  - Open state: `bg-white/20`, inner ring `white/50`, the chevron turns 180°.
  - Menu: 288 px wide (at most `100vw − 24px`), under the pill (`align="end"`, 8 px gap), no inner padding, `rounded-2xl`. Top part navy (`bg-primary`, 16 px padding): a 48 px amber circle with the initials (navy, 17 px / 800), the title (16 px / 700, wraps, never cut) and the role as a small pill under it. The title (`accountTitle` in `lib/account-label.ts`): official → their institution (`institutions.name`), with the „Službenik" pill; administrator → „Administrator", without a second role pill; citizen → first and last name, or the sign-in mail when there is no name, with the „Građanin" pill. Initials are the first letters of the title's first and last word (one letter for a single word; for a mail, its local part), so „Dev Jedan" → DJ, „Administrator" → A.
  - Links, by role (official: „Panel institucije" with `Building2`, admin: „Administracija" with `ShieldCheck`; a citizen has none): 56 px rows, a 40 px `bg-muted` icon square with a navy 20 px icon, 15.5 px / 600 label that wraps, `ChevronRight` at the end.
  - „Odjavi se" stands apart at the bottom, after a full-width line: 48 px, centred, `LogOut` icon, a `border` coloured inner ring. Every account has it.
  - Keyboard, Escape and a tap outside come from the Base UI menu; focus returns to the pill on close.
- **„Uloguj se" is hidden on `/uloguj-se` itself** [ticket 32, 5. 11. 2026]: a link to the page you are on is noise, and the right side of the header stays empty there. The page marks its `<main>` with `data-page="sign-in"` and the pill carries `[body:has([data-page=sign-in])_&]:hidden` (the header is a Server Component in the shared layout and does not know the route). The account menu never shows on that page: a signed-in visitor is redirected away from it.
- Container `max-w-5xl px-4`; on the laptop home page (`data-header="wide"`) it spans the screen.
- The browser bar is navy too (`viewport.themeColor`).

### Bottom navigation (phone and tablet, below `lg`)

The phone home page ends in a white bar: `border-t`, padding 6 px top, 8 px sides, `max(8px, safe-area)` bottom, 77 px tall in all. Three columns `[1fr_auto_1fr]`, items aligned to the bottom:

- **Tabs** at the left and right edge (shadcn `Tabs`; the `TabsList` is `display: contents`): each 60 px tall, icon above label, 2 px apart. The icon (24 px lucide) sits in a 60 × 28 px pill; the **active** tab's pill is navy with an amber icon and its label is navy; inactive tabs are `muted-foreground` with no pill.
- **The main action** in the middle, raised 14 px above the bar (`-translate-y-3.5`, `mb-1.5`): `Button` variant `highlight`, 56 px tall, `px-5`, `rounded-4xl` (pill), 24 px icon + 16.5 px label 10 px apart, a 4 px white ring that separates it from the map, shadow `0 8px 18px rgb(23 33 47 / .28)`.
- A screen with more sections reuses this bar; it never gets a second amber button.

### Main action button

- Exactly one per screen, `Button` variant **`highlight`** (amber, navy label, `font-medium`). Everything else is the navy default, `outline`, `secondary` or `ghost`.
- Sizes: 56 px in the phone bottom bar, 48 px full width in a sidebar or card (`h-12`, 16 px label, 22 px icon, shadow `0 4px 12px rgb(23 33 47 / .18)`), 44 px inside a popup or card footer (`h-11`, `rounded-xl`, 15 px label).
- „Prijavi problem" always has the `Camera` icon (stroke 2.5).

### Surfaces, cards and spacing

- Lists sit on `bg-ground` with 16 px padding and **10 px gaps** (`gap-2.5`); cards are white (`Card`), `rounded-2xl`, the `border` colour as their 1 px ring and shadow `0 1px 2px rgb(23 33 47 / .08)`. No nested cards.
- Grids of cards are `grid-cols-1` (two columns from `md`) with `min-w-0` items, so a long address never widens a column.
- Inside a card: 12 px padding, 6 px between rows.

### Report card (`ReportListCard` in `components/home/home-parts.tsx`)

The reusable way to show one report in a list (home now; „Moje prijave", panel and admin lists later):

- `Card` as a row (`flex-row`, `p-0`, `gap-0`, `overflow-hidden`), the whole card one link to `/p/[code]`.
- **Day column** on the left, 72 px wide, full height: the number of days since the report (Overpass Mono 30 px) over „DAN"/„DANA". **Colours** [ticket 32, 5. 11. 2026; variant A of four prototypes, Danijela]: every report but a resolved one — `routing`, `sent`, `acknowledged`, `in_progress`, `not_competent`, `rejected` — has a `report-day` column (dark navy blue, a touch bluer than the header) with off-white figures, never amber, also after 7 days. A **resolved** report is light green as a whole card (`report-resolved`) with a slightly deeper green column (`report-resolved-day`) and `foreground` figures. The status badge keeps its own colour, icon and text („Odbijena" stays red), so the status is never told by the card colour alone. Contrast (WCAG AA): figures 11.6:1 on blue, 13.1:1 on green; secondary text 6.9:1 on the green card; the „Riješena" badge 4.6:1 against the green card. The column is `aria-hidden`; the full counter text („9 dana bez rješenja") is in an `sr-only` span in the body.
- **Body**: category (2 lines max), place (one line, truncated), status badge + „Demo prijava" badge, supports with the `HeartHandshake` icon.
- **Photo** on the right, 80 px wide, full height, `object-cover`, with **square corners** (`rounded-none!`: `Card` rounds a last-child `<img>` at the bottom); the card's own clip rounds the outer corners. The photo fills its column edge to edge: the classes passed to `ReportPhoto` also land on the `<img>`, so they carry size and corners only, never padding (padding shows the `muted` background as strips beside the photo). A report without a photo to show (a demo report without one, DB.md §12.4) gets `NoPhoto` in the same 80 px column: the neutral `muted` surface with **one plain image icon** (lucide `Image`, the same for every category) over „Bez fotografije" (11 px), never a crossed-out image, which reads as a broken one. The same `NoPhoto` stands in the popup's photo frame and on `/p/[code]` [Danijela, 5. 11.]. A crossed-out `ImageOff` stays only for a photo that exists but cannot be shown (`/p`: „Fotografija trenutno nije dostupna.").
- On a laptop, hover/focus gives the card a 2 px amber ring and highlights its marker.
- **Place** = `placeLabel(address)` (`lib/geo/address.ts`): the address without the coordinates `formatAddress` adds when there is no street, or „Podgorica" when nothing else is left. The same in the map popup. Coordinates appear only on the report page `/p/[code]` [Danijela, 5. 11.].
- On a phone the list's `pb-8` keeps the last card clear of the bottom bar and the raised „Prijavi problem" (25 px above the button at 360 and 393 px).

### Map (`components/map/report-map.tsx`)

- **Markers** are status chips stuck into the map on a needle: a 28 px square in the status colour with the status icon, joined to a navy tag with the day count (min 28 px wide), the chip `rounded-lg` with a 2 px white ring and shadow `0 3px 8px rgb(23 33 47 / .35)`; under it a 3 × 14 px navy needle and a soft shadow ellipse where it enters the map. The anchor is the needle's point. Status is never colour alone: the icon is in the chip and the marker's `title` names the status. Active marker (laptop hover): scale 1.15 from the needle's point and an amber ring. **Selected marker** (its popup is open) [ticket 32, 5. 11. 2026]: one short hop (300 ms, `animate-pin-hop` in `globals.css`, skipped with `prefers-reduced-motion`), then scale 1.15 from the needle's point with a 3 px amber ring, in front of every other marker (`zIndexOffset` 10000, above the list's hover highlight). Closing the popup (×, a tap on the map) or opening another marker's popup moves or clears it: at most one marker is selected. Other markers keep their colours and stay tappable. The scale and the hop are on the icon's inner element, never on Leaflet's root element (Leaflet positions the marker with its transform). Keyboard: Leaflet makes each marker focusable (Tab, Enter opens the popup); the focus ring is a 3 px navy outline around the chip, distinct from the amber selected ring.
- **Legend** top-left over the map: white pill (95 %), a navy mono sample „14" and „Broj na oznaci: dani od prijave".
- **Zoom**: our own two navy 44 px squares (`rounded-lg`, 4 px apart) at the right; Leaflet's zoom control is off. Labels „Uvećaj mapu" / „Umanji mapu".
- **Popup** (`.report-popup` in `globals.css`, content `ReportPopupContent`): white, `border-radius` 20 px, shadow `0 12px 32px -8px rgb(23 33 47 / .45)`, 12 px padding all round, a fixed 240 px column; photo 240 × 180 in a clipping frame (`rounded-xl`); then status + demo badges, category, place with `MapPin` (`placeLabel`, no coordinates), day counter and supports with icons, and „Otvori prijavu" (`highlight`, 44 px). The close button is a 32 px white circle with a navy X over the photo's corner (44 px hit area), labelled „Zatvori pregled prijave". Leaflet's popup CSS is unlayered: override it in `globals.css` with at least `.leaflet-container .report-popup …`, never with Tailwind utilities.
- Leaflet's attribution stays visible; where a raised button overlaps the map's bottom edge, lift `.leaflet-bottom` (`[&_.leaflet-bottom]:bottom-7!`).
- The map's container is `isolate` (Leaflet panes use z-index 400–1000), and so is any overlay layer on top of it (legend, notices), so the header's menu always opens above them.

### Badges

- Status: `StatusBadge` (`components/report/status-badge.tsx`) — colour, icon and text from `STATUS_STYLE`; 20 px tall pill. „Demo prijava": `Badge variant="outline"`. Status badge first, demo badge after it, 6 px apart.

### Do not

- Amber text or thin amber lines on white; amber for anything but the main action and accents on navy.
- A second amber button on a screen.
- Per-component nudges to centre text (`translate-y`, extra 1 px padding); see "Typography".
- Hex colours in components; new colours without a token here.
- Status colours for decoration.

## Sign-in page `/uloguj-se` (ticket 32, 5. 11. 2026) [Danijela]

Chosen from prototypes (commit `f451db1` on `32-animacija-uloguj-se`; three placements of a tap-to-fix scene with a counter were dropped first, for one automatic scene around the form).

- **Layout:** the tabs („Ulogovanje" / „Registracija"), the form card and the privacy notice are one group, `max-w-md`, centred vertically in the screen below the header (a `min-h-[calc(100svh-var(--header-height))]` flex column, the group `my-auto`). On a short phone (360 × 640) the group starts at the top and the page scrolls; nothing is cut off. Below `md` the group has 64 px padding above and below it, the scene's bands.
- **Repair scene** (`components/sign-in/repair-scene.tsx`): decorative and automatic, no taps, no counter. Problems appear one at a time — a pothole, an open manhole, a flickering street light, an illegal dump; an original worker in an amber hard hat and vest runs in from the nearer screen edge, fixes it with its tool (shovel, wrench, screwdriver, broom), a ✓ pops above the spot, the problem fades and the worker runs off; after the last one a 2.6 s pause and the loop repeats (about 25 s a loop).
  - From `md`: pothole left of the card, manhole right, street light top right, dump bottom left; the drawing grows with the free space beside the card.
  - Below `md`: pothole, manhole and street light in the band above the tabs; the dump in the band below the notice only when that band is on the first screen (393 × 852 has four problems, 360 × 640 three).
  - It never covers the tabs, the card or the notice, and never makes the page scroll sideways (the wrapper is `overflow-x: clip`).
  - The layer is `aria-hidden`, `pointer-events: none`, under the content by z-index (`z-0` vs `relative z-10`).
  - `prefers-reduced-motion: reduce`: a static scene (the pothole already fixed, the worker beside it with the ✓), no movement and no flicker.
  - Colours are tokens only (`highlight-shade` and `scene-*`, see "Colour tokens"); the motion is CSS keyframes and transitions in `repair-scene.module.css`, timed by `repair-scene-plan.ts` (pure functions, with tests). No animation library.

## Light theme only (P0) [Claude, 4. 11. 2026]

The app is always light (`ThemeProvider forcedTheme="light"` in `app/layout.tsx`), even when the phone is in dark mode. On Ivana's phone in dark mode the tabs, buttons and cards were hard to read next to the light map tiles. The `.dark` block in `app/globals.css` still holds the old preset's values and is not maintained; dark mode can come back after P0, with Fixit dark tokens, once every screen is checked in it.

## Status colours and icons (ticket 22 Q10; colours changed by Ivana, 4. 11. 2026)

One mapping for every place a status is shown (map marker, public report page, panel). Icons come from lucide. Keep the mapping in one `Record<report_status, …>` next to the status labels (`STATUS_STYLE` in `lib/constants.ts`), so a missing status breaks `pnpm typecheck`.

**Status colours are our own tokens, not a chart palette** [Ivana, 4. 11.]: four orange chart colours looked alike and „Riješena" looked like a warning. The tokens are `--status-*` in `app/globals.css` (same value in light and dark mode, because markers sit on the light map tiles), used as Tailwind classes such as `bg-status-sent`. `routing` and `not_competent` use `muted`.

| Status | Label (public) | Colour | Icon / text colour | Contrast | Icon |
|---|---|---|---|---|---|
| `routing` | Određuje se nadležni | `muted` (grey) | `foreground` | ≥ 12 | `CircleHelp` |
| `sent` | Poslata | `status-sent`, blue `#1d4ed8` | white | 6.7 | `Send` |
| `acknowledged` | Primljena | `status-acknowledged`, violet `#6d28d9` | white | 7.1 | `Eye` |
| `in_progress` | U radu | `status-in-progress`, amber `#f59e0b` | black | 9.8 | `Wrench` |
| `resolved` | Riješena | `status-resolved`, green `#15803d` | white | 5.0 | `CircleCheck` |
| `not_competent` | Preusmjerava se (panel: „Nije naša nadležnost") | `muted` (grey) | `foreground` | ≥ 12 | `ArrowLeftRight` |
| `rejected` | Odbijena | `status-rejected`, red `#b91c1c` | white | 6.5 | `CircleX` |

- `draft` is never shown publicly and has no entry here.
- A status is always shown as text as well, never by colour alone (PRD §6, accessibility); the icon is a second cue, not a replacement for the label. On a map marker the text is the marker's `title` and the popup.
- Every icon/text pair passes WCAG AA for text (≥ 4.5:1). Markers have a white ring and a dark shadow, so the grey and amber ones stay visible on the map tiles.
- A new status colour is a new `--status-*` token plus a row here.

## Layout direction (Ivana, 3. 11. 2026; restyled 5. 11. 2026)

Ivana chose **direction v2 ("lista i kartice")** out of three prototypes ([.scratch/prototypes/v2-lista-kartice.html](.scratch/prototypes/v2-lista-kartice.html), a throwaway mock). Its structure stays; its look is replaced by "Fixit design" [Vuk, 5. 11. 2026]:

- **Home `/`:** the header, then **Mapa** (default tab) or **Lista**, switched in the bottom navigation; „Prijavi problem" raised in the middle of that bar. From `lg` the list sidebar + map described under "Page widths".
- **Cards everywhere:** content sits in white cards on the `ground` colour.
- **Report flow `/prijavi`:** a wizard with a progress bar and step titles (photo → location with live agent steps → „Pregled prijave"), matching the screen order and tap budget in PRD FR-5 and ticket 15. Each step is one screen with one main action at the bottom.
- **Public report page `/p/[code]`:** stacked cards (photo, public description, category/status/institution, day counter, „Podržavam" with live count, timeline).

## Page widths (ticket 32, 4. 11. 2026; updated 5. 11. 2026) [Claude, Vuk]

Every page works at 360, 390 and 430 px (phone), 768 px (tablet) and 1280–1440 px (laptop), with no horizontal page scroll; a wide table scrolls only inside its own card.

- **One container:** the header, the list, `/p/[code]`, `/panel` and `/admin` pages use `mx-auto max-w-5xl px-4`, so the logo and the account pill line up with the content.
- **Map:** full width between the header and the bottom navigation on every screen below `lg`.
- **Home `/` below `lg`:** header, map or list, bottom navigation (see "Bottom navigation"). The list is one column on a phone and two from `md`, inside the container.
- **Home `/` from `lg` (Ivana's pick, ticket 32):** no tabs, no bottom bar. A white list sidebar on the left (400 px, 420 px from `xl`) with the heading „Sve prijave", three counts (Ukupno / Otvorene / Riješene, mono numbers on `ground` tiles), the 48 px „Prijavi problem" (`highlight`) across the sidebar, and the report cards on `ground` scrolling below; the map fills the rest of the screen with the legend top-left and the zoom buttons bottom-right. Hovering or focusing a card highlights its marker. The header spans the screen edges on this page only (`data-header="wide"`).
- **`/p/[code]` from `lg`:** two columns, photo and description on the left (3fr), institution, supports and timeline on the right (2fr). On a phone it is the same single column as before.
- **Single-task pages stay narrow and centred:** `/prijavi` is one `max-w-2xl` column with side borders from `md`; `/uloguj-se` (`max-w-md`, centred vertically too, see "Sign-in page") and `/privatnost` (`max-w-2xl`).
- **Long text never widens a page:** grid columns are `grid-cols-1` / `minmax(0, …)` with `min-w-0` children, detail pages carry `wrap-break-word`, and letters (`<pre>`, `whitespace-pre-wrap`) add `wrap-anywhere` so the map URL wraps.
