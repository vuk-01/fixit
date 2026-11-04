import "server-only"

import { z } from "zod"

import {
  AI_DESCRIPTION_MAX_SENTENCES,
  AI_TITLE_MAX_LENGTH,
  CATEGORY_ORDER,
  DESCRIPTION_MAX_LENGTH,
  MAX_PHOTOS_PER_REPORT,
  type ReportCategory,
} from "@/lib/constants"

// Model output (Tech.md §7, FR-6). Every field is required and nothing is nullable. The API
// does not enforce enum, minimum or maximum (the SDK moves them into the description), so the
// SDK checks them locally with this schema; `category` is compared case-insensitively.
export const classificationSchema = z.object({
  is_municipal_problem: z
    .boolean()
    .describe("true ako fotografije prikazuju komunalni problem na javnoj površini ili javnoj infrastrukturi"),
  category: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
      z.enum(CATEGORY_ORDER as [ReportCategory, ...ReportCategory[]]),
    )
    .describe("tačno jedan slug vrste problema sa spiska"),
  confidence: z.number().min(0).max(1).describe("pouzdanost za izabranu vrstu, od 0 do 1"),
  title: z.string().describe("kratak naslov samog problema, do 80 znakova"),
  description: z
    .string()
    .describe("opis samog problema i njegovog stanja, najviše tri rečenice; bez ljudi, vozila, doba dana i pominjanja fotografije"),
  severity: z.enum(["low", "medium", "high"]),
  immediate_danger: z.boolean(),
  personal_data_photos: z
    .array(z.number().int().min(1).max(MAX_PHOTOS_PER_REPORT))
    .describe("redni brojevi fotografija sa prepoznatljivim licem ili čitljivom registarskom tablicom; prazno ako ih nema"),
  image_contains_instructions: z.boolean(),
})

export type Classification = z.infer<typeof classificationSchema>

// What the client gets back (the title, severity and the instruction flag stay on the server;
// PRD §6: they are not public and the citizen does not see them).
export type ClassificationForClient = Pick<
  Classification,
  "is_municipal_problem" | "category" | "confidence" | "description" | "immediate_danger" | "personal_data_photos"
>

export type LanguageFlag = "cyrillic" | "ekavian"

export type FallbackReason = "no_api_key" | "timeout" | "refusal" | "max_tokens" | "invalid_output" | "api_error"

// The answer of POST /api/agent/classify, read by the report flow (type import only).
export type ClassifyResponse =
  | { reportId: string; result: ClassificationForClient }
  | { reportId: string; fallback: true; reason: FallbackReason }
export type ClassifyErrorCode = "not_authenticated" | "not_allowed" | "invalid_request" | "daily_limit_reached" | "unknown"

// ---------------------------------------------------------------------------------------------
// Server check of the output (Tech.md §7). The description is public (PRD §6), so URLs, email
// addresses and phone numbers are removed. Cyrillic and common ekavian forms only flag the
// text for review; they never block the flow.
// ---------------------------------------------------------------------------------------------

const EMAIL = /[^\s@<>()"',;]+@[^\s@<>()"',;]+\.[^\s@<>()"',;]+/gi
// a sentence's closing punctuation after a link stays
const URL_WITH_SCHEME = /\b(?:https?:\/\/|www\.)[^\s]*[^\s.,;:!?)"'»“”]/gi
const BARE_DOMAIN =
  /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:me|com|org|net|info|io|app|eu|rs|ba|hr|si|mk|al|de|at|it)\b(?:\/[^\s]*[^\s.,;:!?)"'»“”])?/gi
// a run of digits with the usual separators; removed when it holds 8 or more digits
const PHONE_LIKE = /(?:\+|\b00)?\(?\d[\d\s/().-]{6,}\d\b/g
const PHONE_MIN_DIGITS = 8

const CYRILLIC = /[Ѐ-ӿ]/
const EKAVIAN = /\b(?:mesto|mesta|mestu|reka|reke|cev|cevi|obaveštenje|obavestenje|bezbednost|bezbedno|bezbedan)\b/i

export function removeContactData(text: string): { text: string; removed: number } {
  let removed = 0
  const strip = (pattern: RegExp, keep?: (match: string) => boolean) => (input: string) =>
    input.replace(pattern, (match) => {
      if (keep?.(match)) return match
      removed += 1
      return " "
    })

  const steps = [
    strip(EMAIL),
    strip(URL_WITH_SCHEME),
    strip(BARE_DOMAIN),
    strip(PHONE_LIKE, (match) => match.replace(/\D/g, "").length < PHONE_MIN_DIGITS),
  ]
  const cleaned = steps
    .reduce((acc, step) => step(acc), text)
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim()
  return { text: cleaned, removed }
}

export function firstSentences(text: string, max: number): string {
  const sentences = text.split(/(?<=[.!?…])\s+/).filter((s) => s.trim() !== "")
  return sentences.slice(0, max).join(" ")
}

export function languageFlags(...texts: string[]): LanguageFlag[] {
  const flags: LanguageFlag[] = []
  if (texts.some((t) => CYRILLIC.test(t))) flags.push("cyrillic")
  if (texts.some((t) => EKAVIAN.test(t))) flags.push("ekavian")
  return flags
}

export type CheckedClassification = {
  result: Classification
  languageFlags: LanguageFlag[]
  removedContactData: number
}

export function checkClassification(output: Classification, photoCount: number): CheckedClassification {
  const contact = removeContactData(output.description)
  const description = firstSentences(contact.text, AI_DESCRIPTION_MAX_SENTENCES).slice(0, DESCRIPTION_MAX_LENGTH).trim()
  const titleContact = removeContactData(output.title)
  const title = titleContact.text.slice(0, AI_TITLE_MAX_LENGTH).trim()

  const positions = [...new Set(output.personal_data_photos)]
    .filter((p) => p >= 1 && p <= photoCount)
    .sort((a, b) => a - b)

  return {
    result: { ...output, title, description, personal_data_photos: positions },
    languageFlags: languageFlags(title, description),
    removedContactData: contact.removed + titleContact.removed,
  }
}

export function forClient(result: Classification): ClassificationForClient {
  return {
    is_municipal_problem: result.is_municipal_problem,
    category: result.category,
    confidence: result.confidence,
    description: result.description,
    immediate_danger: result.immediate_danger,
    personal_data_photos: result.personal_data_photos,
  }
}
