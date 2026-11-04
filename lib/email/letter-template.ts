// The letter template (PRD FR-10, FR-11): fixed text in Montenegrin (Latin script, ijekavian,
// formal), filled with the data of one report. The only text that comes from the model is the
// description (or the citizen's own); everything else is fixed here or passed in. No laws,
// articles, deadlines or facts that are not in the parameters (AGENTS.md rule 7).
//
// A pure function, shared by the server (prepare preview, sendReport, /admin) and the seed:
// no `server-only`, no `@/` alias and no value imports (Tech.md §3, §11), so plain Node 24 can
// import it. Every piece of data, labels included, comes in as a parameter.

import type { Database } from "../supabase/database.types"

// initial: first letter on "Pošalji prijavu" (recipient from jurisdiction_rules);
// assignment: the administrator chose the institution for a report in `routing` (/admin);
// redirect: the administrator chose a new institution for a report that already had one.
export type LetterKind = Database["public"]["Enums"]["letter_kind"]

// Who calls it with what:
// - prepare preview (#10): kind "initial", code/submittedAt/previousReports null → those places
//   (number in the subject and the attachment names, date and time, earlier reports) read
//   `pendingText`; contact null (sharing is off until the citizen turns it on);
// - sendReport (#12): kind "initial", the real code, submitted_at and count_previous_reports;
// - /admin (#15): kind "assignment" (or "redirect"), the same report data, likeCount from the report;
// - seed (#16): kind "initial" for demo reports, with real codes, dates and counts.
export type LetterParams = {
  kind: LetterKind
  // FX-2026-00142; null before the report has a number (preview)
  code: string | null
  // submission time (reports.submitted_at); null in the preview. A Date or an ISO string.
  submittedAt: Date | string | null
  // count_previous_reports; the line shows only when > 0. null in the preview (shows pendingText)
  previousReports: number | null
  // "dodjeljuje se pri slanju" (lib/constants.ts, PREPARE_TEXT.assignedAtSubmit)
  pendingText: string
  // category label from lib/constants.ts (CATEGORIES[slug].label)
  categoryLabel: string
  // public description; null or empty → the line is left out (FR-7, manual flow)
  description: string | null
  // final address; null when the geocoder did not answer (the coordinates are always there)
  address: string | null
  lat: number
  lng: number
  // recipient name; null only in a preview of a report without a recipient (FR-8, routing)
  institutionName: string | null
  // cc name (only when it has a verified email, ticket 14 Q8); null otherwise
  ccInstitutionName: string | null
  // supports so far; the line shows only when > 0 (letters from routing or after a redirect)
  likeCount: number
  // FR-6: the model marked an immediate danger
  immediateDanger: boolean
  // report_photos.position of every photo, in order (1–3)
  photoPositions: number[]
  // only when the citizen turned on "Dostavi moje ime i mejl instituciji"; otherwise null
  contact: { firstName: string; lastName: string; email: string } | null
  // NEXT_PUBLIC_SITE_URL, e.g. https://fixit-b73a.vercel.app
  siteUrl: string
  // default Europe/Podgorica
  timeZone?: string
}

export type Letter = {
  subject: string
  bodyText: string
  // `{code}-{position}.jpg`; before the number exists `{pendingText}-{position}.jpg` (not sent)
  attachmentNames: string[]
}

const DEFAULT_TIME_ZONE = "Europe/Podgorica"
// FR-9, FR-11: the same 50 m as in the database
const NEARBY_RADIUS_M = 50

function coordinates(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
}

function mapLink(lat: number, lng: number): string {
  const la = lat.toFixed(5)
  const lo = lng.toFixed(5)
  return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=18/${la}/${lo}`
}

// "4. 11. 2026. u 12:05", by the clock in Podgorica
export function formatLetterDate(value: Date | string, timeZone: string = DEFAULT_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(typeof value === "string" ? new Date(value) : value)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return `${Number(get("day"))}. ${Number(get("month"))}. ${get("year")}. u ${get("hour")}:${get("minute")}`
}

function photoWord(n: number): string {
  const last = n % 10
  const lastTwo = n % 100
  if (last === 1 && lastTwo !== 11) return "fotografija"
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "fotografije"
  return "fotografija"
}

function intro(p: LetterParams): string[] {
  const lines = ["Prijava komunalnog problema zaprimljena je putem platforme Fixit."]
  if (p.kind === "initial") {
    lines.push(
      p.institutionName
        ? `Prema vrsti problema i lokaciji, nadležna institucija za ovu prijavu je: ${p.institutionName}.`
        : "Nadležnu instituciju za ovu prijavu odrediće administrator platforme Fixit.",
    )
  } else {
    lines.push(`Nadležnu instituciju za ovu prijavu odredio je administrator platforme Fixit: ${p.institutionName ?? ""}.`)
    if (p.kind === "redirect") lines.push("Prijava je prethodno bila upućena drugoj instituciji.")
  }
  if (p.ccInstitutionName) lines.push(`Kopija ovog dopisa upućena je i instituciji: ${p.ccInstitutionName}.`)
  return [lines.join(" ")]
}

export function renderLetter(p: LetterParams): Letter {
  const timeZone = p.timeZone ?? DEFAULT_TIME_ZONE
  const number = p.code ?? p.pendingText
  const location = p.address ?? coordinates(p.lat, p.lng)
  const description = p.description?.trim() || null
  const subject = `Prijava komunalnog problema br. ${number} – ${p.categoryLabel}, ${location}`
  const attachmentNames = p.photoPositions.map((position) => `${number}-${position}.jpg`)

  const data = [
    `Broj prijave: ${number}`,
    `Vrsta problema: ${p.categoryLabel}`,
    ...(description ? [`Opis: ${description}`] : []),
    ...(p.address ? [`Lokacija: ${p.address}`] : []),
    `Koordinate: ${coordinates(p.lat, p.lng)}`,
    `Mapa: ${mapLink(p.lat, p.lng)}`,
    `Datum i vrijeme prijave: ${p.submittedAt ? formatLetterDate(p.submittedAt, timeZone) : p.pendingText}`,
  ]
  const earlier = `Ranije prijave iste vrste na ovoj lokaciji (do ${NEARBY_RADIUS_M} m)`
  if (p.code === null || p.previousReports === null) data.push(`${earlier}: ${p.pendingText}`)
  else if (p.previousReports > 0) data.push(`${earlier}: ${p.previousReports}`)
  if (p.likeCount > 0) data.push(`Broj građana koji su podržali prijavu: ${p.likeCount}`)
  if (p.immediateDanger) data.push("Na fotografiji je uočena moguća neposredna opasnost.")

  const n = p.photoPositions.length
  const attachments = p.code
    ? `Prilog: ${attachmentNames.join(", ")}`
    : `Prilog: ${n} ${photoWord(n)} prijave (nazivi priloga: ${p.pendingText})`

  const paragraphs = [
    "Poštovani,",
    ...intro(p),
    ["Podaci o prijavi:", ...data].join("\n"),
    attachments,
    "Molimo vas da razmotrite prijavu i preduzmete mjere iz svoje nadležnosti.",
    "Ako prijava nije u vašoj nadležnosti, molimo vas da o tome obavijestite Fixit odgovorom na ovaj mejl, kako bi bila proslijeđena odgovarajućoj instituciji.",
    // FR-11, verbatim; only with the citizen's consent for this report
    ...(p.contact
      ? [
          `Prijavu je podnio korisnik platforme Fixit, koji je dao saglasnost da se njegovi podaci dostave instituciji: ${p.contact.firstName} ${p.contact.lastName}, ${p.contact.email}.`,
        ]
      : []),
    ["S poštovanjem,", "Tim Fixit", p.siteUrl].join("\n"),
  ]

  return { subject, bodyText: paragraphs.join("\n\n"), attachmentNames }
}
