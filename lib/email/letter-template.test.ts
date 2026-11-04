// Mandatory test 3 (AGENTS.md): the letter from the template has every FR-11 field; the
// citizen's name and email only with contact sharing on; before the report has a number, the
// number, the date and time and the earlier-reports count read "dodjeljuje se pri slanju".
import { describe, expect, it } from "vitest"

import { PREPARE_TEXT } from "@/lib/constants"

import { formatLetterDate, renderLetter, type LetterParams } from "./letter-template"

const PENDING = PREPARE_TEXT.assignedAtSubmit
const SITE = "https://fixit-b73a.vercel.app"
const EMAIL = /[^\s@<>()"',;]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi

const params = (over: Partial<LetterParams> = {}): LetterParams => ({
  kind: "initial",
  code: "FX-2026-00142",
  submittedAt: "2026-11-04T11:05:00Z", // 12:05 in Podgorica
  previousReports: 2,
  pendingText: PENDING,
  categoryLabel: "Oštećen kolovoz / rupa na putu",
  description: "Na kolovozu se vidi udarna rupa sa oštećenim asfaltom.",
  address: "Njegoševa 5, Podgorica",
  lat: 42.441104,
  lng: 19.263649,
  institutionName: "Sekretarijat za saobraćaj Glavnog grada Podgorice",
  ccInstitutionName: "„Putevi“ d.o.o. Podgorica",
  likeCount: 0,
  immediateDanger: false,
  photoPositions: [1, 2],
  contact: null,
  siteUrl: SITE,
  ...over,
})

describe("letter template: every FR-11 field", () => {
  const letter = renderLetter(params({ immediateDanger: true, likeCount: 3 }))
  const body = letter.bodyText

  it("has the subject 'Prijava komunalnog problema br. {broj} – {vrsta}, {lokacija}'", () => {
    expect(letter.subject).toBe(
      "Prijava komunalnog problema br. FX-2026-00142 – Oštećen kolovoz / rupa na putu, Njegoševa 5, Podgorica",
    )
  })

  it("opens with 'Poštovani', Fixit as the channel and the recipient by category and location", () => {
    expect(body.startsWith("Poštovani,")).toBe(true)
    expect(body).toContain("zaprimljena je putem platforme Fixit")
    expect(body).toContain(
      "Prema vrsti problema i lokaciji, nadležna institucija za ovu prijavu je: Sekretarijat za saobraćaj Glavnog grada Podgorice.",
    )
    expect(body).toContain("Kopija ovog dopisa upućena je i instituciji: „Putevi“ d.o.o. Podgorica.")
  })

  it("has the report data: category, description, location with coordinates and map link, date and time", () => {
    expect(body).toContain("Broj prijave: FX-2026-00142")
    expect(body).toContain("Vrsta problema: Oštećen kolovoz / rupa na putu")
    expect(body).toContain("Opis: Na kolovozu se vidi udarna rupa sa oštećenim asfaltom.")
    expect(body).toContain("Lokacija: Njegoševa 5, Podgorica")
    expect(body).toContain("Koordinate: 42.44110, 19.26365")
    expect(body).toContain("https://www.openstreetmap.org/?mlat=42.44110&mlon=19.26365#map=18/42.44110/19.26365")
    expect(body).toContain("Datum i vrijeme prijave: 4. 11. 2026. u 12:05")
  })

  it("has the earlier reports, supports and immediate danger lines when they apply", () => {
    expect(body).toContain("Ranije prijave iste vrste na ovoj lokaciji (do 50 m): 2")
    expect(body).toContain("Broj građana koji su podržali prijavu: 3")
    expect(body).toContain("Na fotografiji je uočena moguća neposredna opasnost.")
  })

  it("leaves those lines out when they do not apply", () => {
    const plain = renderLetter(params({ previousReports: 0, likeCount: 0, immediateDanger: false })).bodyText
    expect(plain).not.toContain("Ranije prijave")
    expect(plain).not.toContain("podržali")
    expect(plain).not.toContain("opasnost")
  })

  it("names the attachments {broj}-1.jpg, {broj}-2.jpg", () => {
    expect(letter.attachmentNames).toEqual(["FX-2026-00142-1.jpg", "FX-2026-00142-2.jpg"])
    expect(body).toContain("Prilog: FX-2026-00142-1.jpg, FX-2026-00142-2.jpg")
  })

  it("asks the institution to act, and to tell Fixit when it is not competent", () => {
    expect(body).toContain("Molimo vas da razmotrite prijavu i preduzmete mjere iz svoje nadležnosti.")
    expect(body).toContain("Ako prijava nije u vašoj nadležnosti")
    expect(body).toContain("kako bi bila proslijeđena odgovarajućoj instituciji")
  })

  it("ends with 'S poštovanjem, Tim Fixit' and the site", () => {
    expect(body.endsWith(`S poštovanjem,\nTim Fixit\n${SITE}`)).toBe(true)
  })

  it("invents no laws, articles or deadlines", () => {
    expect(body).not.toMatch(/zakon|član|propis|odluk|rok|dana od/i)
  })

  it("leaves the description out when there is none (manual flow)", () => {
    expect(renderLetter(params({ description: "  " })).bodyText).not.toContain("Opis:")
    expect(renderLetter(params({ description: null })).bodyText).not.toContain("Opis:")
  })

  it("uses the coordinates as the location when there is no address", () => {
    const l = renderLetter(params({ address: null }))
    expect(l.subject.endsWith(", 42.44110, 19.26365")).toBe(true)
    expect(l.bodyText).not.toContain("Lokacija:")
    expect(l.bodyText).toContain("Koordinate: 42.44110, 19.26365")
  })
})

describe("letter template: the citizen's data only with consent", () => {
  const contact = { firstName: "Dev", lastName: "Dva", email: "dev-2@fixit.test" }

  it("adds the FR-11 sentence with name, surname and email when sharing is on", () => {
    const body = renderLetter(params({ contact })).bodyText
    expect(body).toContain(
      "Prijavu je podnio korisnik platforme Fixit, koji je dao saglasnost da se njegovi podaci dostave instituciji: Dev Dva, dev-2@fixit.test.",
    )
    // the citizen's address is the only email address in the letter
    expect(body.match(EMAIL)).toEqual(["dev-2@fixit.test"])
  })

  it("has no name and no email address when sharing is off", () => {
    const letter = renderLetter(params({ contact: null }))
    expect(letter.bodyText).not.toContain("Prijavu je podnio")
    expect(letter.bodyText).not.toContain("Dev")
    expect(letter.bodyText.match(EMAIL)).toBeNull()
    expect(letter.subject.match(EMAIL)).toBeNull()
  })
})

describe("letter template: preview before the report has a number", () => {
  const letter = renderLetter(params({ code: null, submittedAt: null, previousReports: null }))

  it("writes 'dodjeljuje se pri slanju' for the number, date and time and earlier reports", () => {
    expect(letter.subject).toBe(
      `Prijava komunalnog problema br. ${PENDING} – Oštećen kolovoz / rupa na putu, Njegoševa 5, Podgorica`,
    )
    expect(letter.bodyText).toContain(`Broj prijave: ${PENDING}`)
    expect(letter.bodyText).toContain(`Datum i vrijeme prijave: ${PENDING}`)
    expect(letter.bodyText).toContain(`Ranije prijave iste vrste na ovoj lokaciji (do 50 m): ${PENDING}`)
    expect(letter.bodyText).toContain(`Prilog: 2 fotografije prijave (nazivi priloga: ${PENDING})`)
    expect(letter.bodyText).not.toContain("FX-")
  })

  it("says the administrator will choose the institution when there is no recipient (FR-8)", () => {
    const body = renderLetter(params({ code: null, institutionName: null, ccInstitutionName: null })).bodyText
    expect(body).toContain("Nadležnu instituciju za ovu prijavu odrediće administrator platforme Fixit.")
    expect(body).not.toContain("Kopija")
  })
})

describe("letter template: assignment and redirect", () => {
  it("assignment: the administrator chose the institution, with the supports so far", () => {
    const body = renderLetter(
      params({ kind: "assignment", institutionName: "Komunalna policija", ccInstitutionName: null, likeCount: 5 }),
    ).bodyText
    expect(body).toContain("Nadležnu instituciju za ovu prijavu odredio je administrator platforme Fixit: Komunalna policija.")
    expect(body).not.toContain("Prema vrsti problema i lokaciji")
    expect(body).not.toContain("prethodno")
    expect(body).toContain("Broj građana koji su podržali prijavu: 5")
    expect(body).toContain("Broj prijave: FX-2026-00142")
  })

  it("redirect: also says the report went to another institution before", () => {
    const body = renderLetter(params({ kind: "redirect", institutionName: "Vodovod i kanalizacija" })).bodyText
    expect(body).toContain("odredio je administrator platforme Fixit: Vodovod i kanalizacija.")
    expect(body).toContain("Prijava je prethodno bila upućena drugoj instituciji.")
  })
})

describe("formatLetterDate", () => {
  it("uses the clock in Podgorica, also across the DST change", () => {
    expect(formatLetterDate("2026-07-01T22:30:00Z")).toBe("2. 7. 2026. u 00:30")
    expect(formatLetterDate(new Date("2026-12-31T23:59:00Z"))).toBe("1. 1. 2027. u 00:59")
  })
})
