// User-facing text and shared limits (AGENTS.md rule 6). Montenegrin, Latin script, ijekavian.
// Records over the generated enums: a missing category or status fails `pnpm typecheck`.
// No `@/` value imports and no enums here: scripts/ import this file with plain Node (Tech.md §11).
import type { LucideIcon } from "lucide-react"
import { ArrowLeftRight, CircleCheck, CircleHelp, CircleX, Eye, Send, Wrench } from "lucide-react"

import type { Database } from "./supabase/database.types"

export type ReportCategory = Database["public"]["Enums"]["report_category"]
export type ReportStatus = Database["public"]["Enums"]["report_status"]
export type PublicReportStatus = Exclude<ReportStatus, "draft">

// ---------------------------------------------------------------------------------------------
// Limits (the database enforces its own copies; these are for UI text and client checks)
// ---------------------------------------------------------------------------------------------

export const MAX_PHOTOS_PER_REPORT = 3
// FR-7: below this, or not a municipal problem, the citizen picks the category
export const CONFIDENCE_THRESHOLD = 0.6
// FR-9: duplicates within this radius; same value as in find_nearby_open_reports
export const DUPLICATE_RADIUS_M = 50
// PRD §6: started analyses per calendar day in Podgorica; create_draft enforces it
export const DAILY_REPORT_LIMIT = 10
export const TIME_ZONE = "Europe/Podgorica"

// Tech.md §8: one place for the tile provider
export const MAP_TILES = {
  url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
} as const

// ---------------------------------------------------------------------------------------------
// Categories (PRD §5.2 "Vrste problema"). Labels and prompt descriptions never name an institution.
// ---------------------------------------------------------------------------------------------

export const CATEGORIES: Record<ReportCategory, { label: string; promptDescription: string }> = {
  pothole: {
    label: "Oštećen kolovoz / rupa na putu",
    promptDescription: "rupa, udarna rupa ili oštećen asfalt na kolovozu",
  },
  sidewalk: {
    label: "Oštećen trotoar",
    promptDescription: "razlomljeno, uleglo ili oštećeno popločanje trotoara ili pješačke staze",
  },
  traffic_sign: {
    label: "Oštećen ili oboren saobraćajni znak",
    promptDescription: "oštećen, oboren, savijen ili nečitljiv saobraćajni znak",
  },
  street_light: {
    label: "Neispravna javna rasvjeta",
    promptDescription: "ugašena, oštećena ili oborena ulična svjetiljka javne rasvjete",
  },
  traffic_light: {
    label: "Neispravan semafor",
    promptDescription: "ugašen, neispravan ili oštećen semafor",
  },
  manhole: {
    label: "Otvoren ili oštećen šaht",
    promptDescription:
      "otvoren, polomljen ili ulegao poklopac šahta ili slivnika, ili poklopac nedostaje",
  },
  water_leak: {
    label: "Curenje vode / pukla cijev",
    promptDescription: "voda koja curi ili izbija iz zemlje, kolovoza ili cijevi; pukla cijev",
  },
  illegal_dump: {
    label: "Divlja deponija / odbačen otpad",
    promptDescription:
      "otpad, šut ili kabasti otpad odbačen van kontejnera na javnoj ili neizgrađenoj površini",
  },
  waste_container: {
    label: "Prepun kontejner / otpad oko kontejnera",
    promptDescription: "prepun kontejner ili otpad nagomilan oko kontejnera",
  },
  greenery: {
    label: "Oboreno drvo / neodržavano zelenilo",
    promptDescription:
      "oboreno ili polomljeno drvo, opasne grane, zarasla ili neodržavana javna zelena površina",
  },
  graffiti: {
    label: "Grafiti",
    promptDescription: "grafiti ili ispisane poruke na zidovima i objektima",
  },
  other: {
    label: "Drugi problem",
    promptDescription: "komunalni problem koji ne odgovara nijednoj vrsti iznad",
  },
}

// display order on the category picker; "Drugi problem" last
export const CATEGORY_ORDER = Object.keys(CATEGORIES) as ReportCategory[]

// ---------------------------------------------------------------------------------------------
// Statuses (GLOSSARY "Statusi", UI.md "Status colours and icons")
// ---------------------------------------------------------------------------------------------

export const STATUS_LABELS: Record<ReportStatus, { public: string; panel: string }> = {
  draft: { public: "Nacrt", panel: "Nacrt" },
  routing: { public: "Određuje se nadležni", panel: "Određuje se nadležni" },
  sent: { public: "Poslata", panel: "Poslata" },
  acknowledged: { public: "Primljena", panel: "Primljena" },
  in_progress: { public: "U radu", panel: "U radu" },
  resolved: { public: "Riješena", panel: "Riješena" },
  not_competent: { public: "Preusmjerava se", panel: "Nije naša nadležnost" },
  rejected: { public: "Odbijena", panel: "Odbijena" },
}

// a status is always shown as text too, never by colour alone (PRD §6)
export const STATUS_STYLE: Record<PublicReportStatus, { colorClass: string; icon: LucideIcon }> = {
  routing: { colorClass: "bg-muted text-muted-foreground", icon: CircleHelp },
  sent: { colorClass: "bg-chart-1 text-white", icon: Send },
  acknowledged: { colorClass: "bg-chart-2 text-white", icon: Eye },
  in_progress: { colorClass: "bg-chart-3 text-white", icon: Wrench },
  resolved: { colorClass: "bg-chart-4 text-white", icon: CircleCheck },
  not_competent: { colorClass: "bg-muted text-muted-foreground", icon: ArrowLeftRight },
  rejected: { colorClass: "bg-destructive text-white", icon: CircleX },
}

// "open report" (GLOSSARY, FR-18); the database has the same set in private.is_open
export const OPEN_STATUSES: readonly ReportStatus[] = [
  "routing",
  "sent",
  "acknowledged",
  "in_progress",
  "not_competent",
]

// ---------------------------------------------------------------------------------------------
// Error codes raised by the database (DB.md §8.1)
// ---------------------------------------------------------------------------------------------

export const ERROR_MESSAGES = {
  not_authenticated: "Prijavite se da biste nastavili.",
  not_allowed: "Nemate dozvolu za ovu radnju.",
  not_found: "Prijava nije pronađena.",
  invalid_state: "Ova radnja trenutno nije moguća. Osvježite stranicu i pokušajte ponovo.",
  transition_not_allowed: "Ova promjena statusa nije dozvoljena.",
  message_required: "Unesite obrazloženje.",
  daily_limit_reached: `Dostigli ste dnevno ograničenje od ${DAILY_REPORT_LIMIT} prijava. Pokušajte ponovo sjutra.`,
  outside_area:
    "Fixit za sada radi samo na teritoriji Glavnog grada Podgorice. Izaberite lokaciju u Podgorici.",
  photo_limit: `Prijava može imati najviše ${MAX_PHOTOS_PER_REPORT} fotografije.`,
  photo_missing: "Fotografija se još otprema. Sačekajte trenutak i pokušajte ponovo.",
  photos_required: "Prijava mora imati bar jednu fotografiju.",
  own_report: "Ne možete podržati svoju prijavu.",
  report_not_open: "Prijava je zatvorena.",
  dispatch_in_progress: "Prijava se već šalje. Sačekajte trenutak.",
  no_verified_email: "Izabrana institucija nema provjerenu mejl adresu.",
  same_institution: "Prijava je već upućena ovoj instituciji.",
  code_overflow: "Prijava trenutno ne može dobiti broj. Pokušajte kasnije.",
} as const

export type DbErrorCode = keyof typeof ERROR_MESSAGES

export const UNKNOWN_ERROR_MESSAGE = "Nešto nije u redu. Pokušajte ponovo."

// The database raises the code as the whole message (`raise exception 'daily_limit_reached'`).
export function errorMessage(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : ""
  return message in ERROR_MESSAGES ? ERROR_MESSAGES[message as DbErrorCode] : UNKNOWN_ERROR_MESSAGE
}

// ---------------------------------------------------------------------------------------------
// Day counter (FR-15) and support count (FR-16)
// ---------------------------------------------------------------------------------------------

// "dan" for numbers ending in 1 except 11 ("1 dan", "21 dan"), otherwise "dana"
export function dayWord(n: number): "dan" | "dana" {
  return n % 10 === 1 && n % 100 !== 11 ? "dan" : "dana"
}

const podgoricaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

// calendar days between two instants, by the calendar in Podgorica
export function calendarDaysBetween(from: Date, to: Date): number {
  const day = (d: Date) => {
    const [y, m, dd] = podgoricaDate.format(d).split("-").map(Number)
    return Date.UTC(y, m - 1, dd) / 86_400_000
  }
  return Math.max(0, Math.round(day(to) - day(from)))
}

export function dayCounterText(report: {
  status: ReportStatus
  submitted_at: string | null
  closed_at: string | null
}, now: Date = new Date()): string | null {
  if (report.status === "draft" || !report.submitted_at) return null

  const submitted = new Date(report.submitted_at)

  if (report.status === "resolved" || report.status === "rejected") {
    const n = calendarDaysBetween(submitted, report.closed_at ? new Date(report.closed_at) : now)
    if (report.status === "resolved") {
      return n === 0 ? "Riješeno istog dana" : `Riješeno za ${n} ${dayWord(n)}`
    }
    return n === 0 ? "Odbijeno istog dana" : `Odbijeno nakon ${n} ${dayWord(n)}`
  }

  const n = calendarDaysBetween(submitted, now)
  return n === 0 ? "Prijavljeno danas" : `${n} ${dayWord(n)} bez rješenja`
}

// "1 podrška", "2–4 podrške", "5 i više podrški"; 21 podrška, 22 podrške, 11–14 podrški
export function likeCountText(n: number): string {
  const lastDigit = n % 10
  const lastTwo = n % 100
  if (lastDigit === 1 && lastTwo !== 11) return `${n} podrška`
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} podrške`
  return `${n} podrški`
}

export const LIKE_LABELS = {
  button: "Podržavam",
  done: "Podržano",
  closed: "Prijava je zatvorena",
} as const

// ---------------------------------------------------------------------------------------------
// App frame
// ---------------------------------------------------------------------------------------------

export const APP_NAME = "Fixit"
export const APP_DESCRIPTION = "Prijave komunalnih problema u Podgorici"
