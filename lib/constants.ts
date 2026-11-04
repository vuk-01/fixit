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

// map start when there is no GPS (PRD §4.1); centre of Podgorica
export const PODGORICA_CENTER = { lat: 42.4411, lng: 19.2636 } as const
export const MAP_DEFAULT_ZOOM = 13

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
// Icon/text colour per token passes WCAG AA (≥ 4.5:1) in light and dark mode (UI.md table).
export const STATUS_STYLE: Record<PublicReportStatus, { colorClass: string; icon: LucideIcon }> = {
  routing: { colorClass: "bg-muted text-foreground", icon: CircleHelp },
  sent: { colorClass: "bg-status-sent text-white", icon: Send },
  acknowledged: { colorClass: "bg-status-acknowledged text-white", icon: Eye },
  in_progress: { colorClass: "bg-status-in-progress text-black", icon: Wrench },
  resolved: { colorClass: "bg-status-resolved text-white", icon: CircleCheck },
  not_competent: { colorClass: "bg-muted text-foreground", icon: ArrowLeftRight },
  rejected: { colorClass: "bg-status-rejected text-white", icon: CircleX },
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

// header menu (PRD §8: "Odjavi se" for every signed-in account, never for an anonymous session)
export const HEADER_TEXT = {
  home: "Fixit, početna",
  subtitle: "Prijave u Podgorici",
  signIn: "Uloguj se",
  signOut: "Odjavi se",
} as const

// ---------------------------------------------------------------------------------------------
// Sign-in and sign-up (/uloguj-se, FR-1)
// ---------------------------------------------------------------------------------------------

export const PASSWORD_MIN_LENGTH = 6
export const NAME_MAX_LENGTH = 50

export const AUTH_TEXT = {
  pageTitle: "Uloguj se",
  signInTab: "Ulogovanje",
  signUpTab: "Registracija",
  signInTitle: "Ulogujte se",
  signInDescription: "Mejlom i šifrom vašeg naloga.",
  signUpTitle: "Napravite nalog",
  signUpDescription: "Ime i prezime su obavezni i ne prikazuju se javno.",
  firstName: "Ime",
  lastName: "Prezime",
  email: "Mejl",
  password: "Šifra",
  passwordHint: `Najmanje ${PASSWORD_MIN_LENGTH} znakova.`,
  signInSubmit: "Uloguj se",
  signUpSubmit: "Napravi nalog",
  pending: "Sačekajte…",
  // PRD §6 "Obavještenje", verbatim
  privacyNotice:
    "Javno se vide fotografija, vrsta i opis problema, lokacija, status i broj podrški. Vaše ime, mejl i nalog nijesu javni, kao ni to ko je podržao prijavu. Instituciji dostavljamo vaše ime i mejl samo ako to sami uključite pri slanju prijave.",
  privacyLink: "Više o privatnosti",
} as const

export const AUTH_ERRORS = {
  firstNameRequired: "Unesite ime.",
  lastNameRequired: "Unesite prezime.",
  nameTooLong: `Ime i prezime mogu imati najviše ${NAME_MAX_LENGTH} znakova.`,
  emailInvalid: "Unesite ispravnu mejl adresu.",
  passwordRequired: "Unesite šifru.",
  passwordTooShort: `Šifra mora imati najmanje ${PASSWORD_MIN_LENGTH} znakova.`,
  invalidCredentials: "Pogrešan mejl ili šifra.",
  emailTaken: "Nalog sa ovim mejlom već postoji. Ulogujte se.",
  weakPassword: "Šifra je preslaba. Izaberite dužu šifru.",
  rateLimited: "Previše pokušaja. Pokušajte ponovo za nekoliko minuta.",
  noSession: "Nalog je napravljen, ali ulogovanje nije uspjelo. Ulogujte se.",
  unknown: "Ulogovanje trenutno nije moguće. Pokušajte ponovo.",
} as const

// ---------------------------------------------------------------------------------------------
// Report flow: photos and location (/prijavi, FR-2, FR-3, FR-4, FR-5)
// ---------------------------------------------------------------------------------------------

// FR-2: stored and attached version, and the one sent to the model (Tech.md §5)
export const PHOTO_FULL_MAX_PX = 1600
export const PHOTO_MODEL_MAX_PX = 1024
export const PHOTO_JPEG_QUALITY = 0.8

// FR-3: device location, requested on the first tap, in parallel with the camera or gallery
export const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 60_000,
  timeout: 10_000,
} as const
// FR-3: worse than this, the citizen is asked to check the pin
export const LOW_ACCURACY_M = 50
export const LOCATION_ZOOM = 17
// without a device location the map starts on the centre of Podgorica (FR-3)
export const LOCATION_FALLBACK_ZOOM = 15

// Tech.md §8: address under the pin once the map has settled, at most 1 request/s per user
export const REVERSE_GEOCODE_DEBOUNCE_MS = 800
export const REVERSE_GEOCODE_MIN_INTERVAL_MS = 1000
export const REVERSE_GEOCODE_TIMEOUT_MS = 3000
export const COORDINATE_DECIMALS = 5

export const REPORT_FLOW_STEPS = ["Fotografija", "Lokacija", "Pregled prijave"] as const

export const REPORT_FLOW_TEXT = {
  pageTitle: "Prijavi problem",
  stepOf: (step: number, total: number) => `Korak ${step} od ${total}`,
  photoTitle: "Fotografišite problem",
  photoDescription: `Dodajte do ${MAX_PHOTOS_PER_REPORT} fotografije istog problema.`,
  takePhoto: "Fotografiši",
  fromGallery: "Iz galerije",
  // PRD §6 "Obavještenje", ticket 22 Q11: shown on every report, not remembered per account
  privacyHint: "Izbjegavajte lica i registarske tablice na fotografiji.",
  tooManyPhotos: `Možete dodati najviše ${MAX_PHOTOS_PER_REPORT} fotografije.`,
  unsupportedPhoto: "Ovaj format fotografije nije podržan. Izaberite drugu fotografiju.",
  preparingPhotos: "Pripremam fotografije…",
  photoAlt: (n: number) => `Fotografija ${n}`,
  uploading: "Otpremam…",
  uploaded: "Otpremljeno",
  uploadFailed: "Otprema nije uspjela.",
  retryUpload: "Pokušaj ponovo",
  locationTitle: "Gdje je problem?",
  locationDescription: "Pomjerite mapu tako da pin bude tačno na mjestu problema.",
  locationUnavailable: "Lokacija nije dostupna. Pomjerite mapu tako da pin bude na mjestu problema.",
  checkPin: "Provjerite da li je pin na mjestu problema i pomjerite mapu ako nije.",
  locating: "Tražim vašu lokaciju…",
  addressLoading: "Tražim adresu…",
  addressUnavailable: "Adresa nije dostupna. Tačka na mapi je ipak zapamćena.",
  mapLabel: "Mapa za izbor lokacije problema",
  confirmLocation: "Potvrdi lokaciju",
  confirming: "Provjeravam lokaciju…",
  cancel: "Odustani",
  citizensOnly: "Prijave šalju građani. Ulogujte se nalogom građanina da biste prijavili problem.",
} as const

// ---------------------------------------------------------------------------------------------
// Report flow: recognition and category choice (ticket #9, FR-5, FR-6, FR-7)
// ---------------------------------------------------------------------------------------------

// Tech.md §6: each 1024 px version sent to the classify route is a JPEG of at most 1 MB
export const MODEL_IMAGE_MAX_BYTES = 1_000_000
// Tech.md §6: the client stops waiting 15 s after the analysis started (the model's own limit
// is 12 s on the server), then continues with the manual flow
export const CLASSIFY_CLIENT_TIMEOUT_MS = 15_000
// Tech.md §7: server check of the model output
export const AI_TITLE_MAX_LENGTH = 120
export const AI_DESCRIPTION_MAX_SENTENCES = 3
export const DESCRIPTION_MAX_LENGTH = 1000

export const CLASSIFY_TEXT = {
  // FR-5, PRD §4.1: band on the location screen while the model works
  analyzing: "Prepoznajem problem…",
  // FR-7, verbatim: the model did not answer in time or returned an error
  failed: "Prepoznavanje nije uspjelo. Vrstu ćete izabrati sami.",
  recognized: (label: string) => `Prepoznato: ${label}`,
  // FR-7, verbatim: not a municipal problem or confidence below the threshold
  unsureTitle: "Nismo sigurni šta je na fotografiji. Izaberite vrstu problema.",
  // manual flow and "Promijeni": the same picker without the "not sure" sentence
  chooseTitle: "Izaberite vrstu problema.",
  categoryListLabel: "Vrste problema",
  retry: "Pokušaj ponovo",
  cancelling: "Odustajem…",
} as const

// ---------------------------------------------------------------------------------------------
// Report flow: agent steps after the pin (ticket #10, FR-5 step 3, FR-8, FR-9, FR-10, FR-11)
// ---------------------------------------------------------------------------------------------

export type AgentStep = Database["public"]["Enums"]["agent_step"]
// the steps of POST /api/agent/prepare, in order (Tech.md §6, point 2)
export type PrepareStep = Extract<AgentStep, "jurisdiction" | "duplicates" | "letter">
export const PREPARE_STEPS: readonly PrepareStep[] = ["jurisdiction", "duplicates", "letter"]
// the client stops waiting for the steps after this (Nominatim alone may take 3 s, Tech.md §8);
// the citizen then gets "Pokušaj ponovo"
export const PREPARE_CLIENT_TIMEOUT_MS = 20_000

export const PREPARE_TEXT = {
  // FR-5 step 3, verbatim
  steps: {
    jurisdiction: "Određujem nadležnog…",
    duplicates: "Provjeravam prijave u blizini…",
    letter: "Pripremam prijavu…",
  } satisfies Record<PrepareStep, string>,
  stepsLabel: "Koraci pripreme prijave",
  stepDone: "završeno",
  stepFailed: "nije uspjelo",
  stepRunning: "u toku",
  stepWaiting: "čeka",
  // FR-8, verbatim: no rule for the category, or the recipient has no verified email
  noRecipient:
    "Za ovu vrstu problema još nemamo provjerenog nadležnog. Administrator Fixita će ručno odrediti nadležnu instituciju i proslijediti prijavu.",
  // Tech.md §8: Nominatim did not answer; the report goes on with the coordinates
  coordinatesOnly: "Adresa nije pronađena, pa prijava ide sa koordinatama.",
  // FR-11, ticket 22 Q5: in the preview, where the report number, the date and time of the
  // report and the number of earlier reports go (passed to the letter template as a parameter)
  assignedAtSubmit: "dodjeljuje se pri slanju",
  failed: "Priprema prijave nije uspjela.",
  retry: "Pokušaj ponovo",
  noDraft: "Nacrt prijave nije pronađen. Pokušajte ponovo.",
} as const

// FR-9: the nearest open report of the same category within DUPLICATE_RADIUS_M
export const DUPLICATE_TEXT = {
  title: "Ovaj problem je možda već prijavljen",
  description: (distanceM: number) =>
    `Otvorena prijava iste vrste postoji na oko ${Math.max(1, Math.round(distanceM))} m od izabrane lokacije. Možete je podržati umjesto da šaljete novu.`,
  // FR-9, verbatim
  support: "Podrži postojeću",
  sendNew: "Ipak pošalji novu",
  own: "Ovaj problem ste već prijavili.",
  openOwn: (code: string) => `Pogledaj prijavu ${code}`,
  supporting: "Podržavam…",
} as const

// ---------------------------------------------------------------------------------------------
// Report flow: the review screen "Pregled prijave" (ticket #11, FR-5 step 6, FR-11)
// ---------------------------------------------------------------------------------------------

export const REVIEW_TEXT = {
  title: "Pregled prijave",
  photosTitle: (n: number) => `Fotografije (${n} od ${MAX_PHOTOS_PER_REPORT})`,
  addPhoto: "Dodaj fotografiju",
  removePhoto: (n: number) => `Ukloni fotografiju ${n}`,
  removingPhoto: "Uklanjam fotografiju…",
  // PRD §6 "Privatnost", verbatim: under a photo the model marked
  flaggedPhoto: "Na fotografiji su možda vidljiva lica ili tablice. Fotografija će biti javna.",
  // FR-6, verbatim: when the model marked an immediate danger
  danger: "Ako je neko u opasnosti, pozovite 112.",
  categoryLabel: "Vrsta problema",
  changeCategory: "Promijeni",
  recipientLabel: "Prijavu dobija",
  ccLabel: "Kopija",
  addressLabel: "Adresa",
  descriptionLabel: "Opis problema",
  // PRD §6 "Privatnost", verbatim
  descriptionPublic:
    "Opis je javan i vidi se uz fotografiju. Ne upisujte ime, broj telefona, mejl ni druge lične podatke.",
  // FR-11, verbatim; off on every report
  shareContact: "Dostavi moje ime i mejl instituciji",
  // the account's email is never shown in the UI (ticket #11, Ivana 4. 11.): only the name
  shareContactOn: (name: string) => `Instituciji se dostavljaju vaše ime i prezime (${name}) i mejl vašeg naloga.`,
  contactEmailPlaceholder: "[mejl vašeg naloga]",
  letterTitle: "Tekst prijave",
  showLetter: "Prikaži cijeli tekst",
  hideLetter: "Sakrij cijeli tekst",
  // FR-11: what "Pošalji prijavu" confirms
  confirmNote: "Slanjem potvrđujete da su podaci tačni i da prijava može biti poslata nadležnoj instituciji.",
  send: "Pošalji prijavu",
  sending: "Šaljem prijavu…",
  waitingForPhotos: "Sačekajte da se fotografije otpreme.",
} as const

// "Pošalji prijavu" (ticket #12, FR-11): the letter could not be sent; the draft keeps its number
// and "Pokušaj ponovo" repeats the whole sequence (FR-24)
export const SEND_TEXT = {
  failed: "Slanje prijave nije uspjelo. Pokušajte ponovo.",
  retry: "Pokušaj ponovo",
} as const

// "Prijava poslata" (FR-5 step 7, FR-8): also the title for a report in `routing`, with the FR-8
// message (PREPARE_TEXT.noRecipient) under it
export const SENT_TEXT = {
  title: "Prijava poslata",
  codeLabel: "Broj prijave",
  publicNote: "Prijava je javna na mapi i drugi građani je mogu podržati.",
  openReport: "Otvori stranicu prijave",
  share: "Podijeli",
  shareTitle: (code: string) => `Prijava ${code}`,
  linkCopied: "Link je kopiran.",
  copyLink: "Kopirajte link:",
  newReport: "Nova prijava",
} as const

// "Zašto ova institucija?" (PRD "Pravila nadležnosti", GLOSSARY "Izvor pravila", "Slabiji izvor")
export type SourceType = Database["public"]["Enums"]["source_type"]

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official_document: "Zvanični dokument",
  official_page: "Zvanična stranica institucije",
  written_confirmation: "Pisana potvrda institucije",
  phone_confirmation: "Telefonska potvrda",
}

export const WHY_INSTITUTION_TEXT = {
  link: "Zašto ova institucija?",
  hide: "Sakrij objašnjenje",
  intro:
    "Nadležnu instituciju određuje provjerena tabela pravila Fixita, prema vrsti problema i opštini. Ne određuje je vještačka inteligencija.",
  institution: "Institucija",
  cc: "Kopija",
  source: "Izvor",
  openSource: "Otvori izvor",
  verified: (date: string) => `Provjereno: ${date}`,
  // GLOSSARY "Slabiji izvor", verbatim
  weaker: "slabiji izvor (potvrda telefonom)",
  // PRD "Pravila nadležnosti": a report the administrator assigned
  manual: "Nadležnog je ručno odredio administrator Fixita.",
  loading: "Učitavam izvor…",
  failed: "Izvor trenutno nije dostupan. Pokušajte ponovo.",
} as const

// GLOSSARY "Slabiji izvor": a phone confirmation is shown as the weaker source, the rest by type
export function sourceTypeText(type: SourceType): string {
  return type === "phone_confirmation" ? WHY_INSTITUTION_TEXT.weaker : SOURCE_TYPE_LABELS[type]
}

// "2026-11-02" (a date column) → "2. 11. 2026."
export function formatDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  return `${d}. ${m}. ${y}.`
}
