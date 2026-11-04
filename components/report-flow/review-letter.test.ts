// Ticket #11: "Prikaži cijeli tekst" renders the letter again with what the citizen changes on the
// review, and never shows a number, a date, a count or the account's email.
import { describe, expect, it } from "vitest"

import type { PreviewLetter } from "@/lib/agent/steps"
import { renderLetter, type LetterParams } from "@/lib/email/letter-template"

import { reviewLetter } from "./review-letter"

const params: LetterParams = {
  kind: "initial",
  code: null,
  submittedAt: null,
  previousReports: null,
  pendingText: "dodjeljuje se pri slanju",
  categoryLabel: "Oštećen kolovoz / rupa na putu",
  description: "Opis modela.",
  address: "Njegoševa 5, Podgorica",
  lat: 42.4411,
  lng: 19.2636,
  institutionName: "Sekretarijat za saobraćaj Glavnog grada Podgorice",
  ccInstitutionName: null,
  likeCount: 0,
  immediateDanger: true,
  photoPositions: [1],
  contact: null,
  siteUrl: "https://fixit-b73a.vercel.app",
}
const rendered = renderLetter(params)
const letter: PreviewLetter = { subject: rendered.subject, body: rendered.bodyText, params }

describe("reviewLetter", () => {
  it("uses the edited description, and leaves the line out when it is emptied (FR-7)", () => {
    expect(reviewLetter(letter, { description: "Moj opis.", photoCount: 1, contact: null }).bodyText).toContain("Opis: Moj opis.")
    expect(reviewLetter(letter, { description: "", photoCount: 1, contact: null }).bodyText).not.toContain("Opis:")
  })

  it("follows the photos on the review", () => {
    expect(reviewLetter(letter, { description: "", photoCount: 3, contact: null }).bodyText).toContain(
      "Prilog: 3 fotografije prijave (nazivi priloga: dodjeljuje se pri slanju)",
    )
  })

  it("adds the name and a placeholder instead of the account's email when sharing is on", () => {
    const body = reviewLetter(letter, { description: "", photoCount: 1, contact: { firstName: "Dev", lastName: "Dva" } }).bodyText
    expect(body).toContain("instituciji: Dev Dva, [mejl vašeg naloga].")
    expect(body).not.toMatch(/@/)
  })

  it("never shows a number, date or count, even if the parameters had one", () => {
    const withCode: PreviewLetter = { ...letter, params: { ...params, code: "FX-2026-00001", submittedAt: "2026-11-04T10:00:00Z", previousReports: 4 } }
    const text = reviewLetter(withCode, { description: "", photoCount: 1, contact: null })
    expect(text.subject).toContain("br. dodjeljuje se pri slanju")
    expect(text.bodyText).not.toContain("FX-")
    expect(text.bodyText).toContain("Datum i vrijeme prijave: dodjeljuje se pri slanju")
    expect(text.bodyText).toContain("(do 50 m): dodjeljuje se pri slanju")
  })

  it("keeps the immediate danger line from the model (FR-6)", () => {
    expect(reviewLetter(letter, { description: "", photoCount: 1, contact: null }).bodyText).toContain(
      "Na fotografiji je uočena moguća neposredna opasnost.",
    )
  })
})
