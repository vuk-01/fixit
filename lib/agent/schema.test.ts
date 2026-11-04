// Ticket #9: server check of the model output (Tech.md §7). The description is public, so it
// carries no URLs, email addresses or phone numbers.
import { describe, expect, it } from "vitest"

import { checkClassification, firstSentences, languageFlags, removeContactData, type Classification } from "./schema"

const output = (over: Partial<Classification> = {}): Classification => ({
  is_municipal_problem: true,
  category: "illegal_dump",
  confidence: 0.8,
  title: "Odbačen otpad pored puta",
  description: "Pored puta je odbačen kabasti otpad.",
  severity: "medium",
  immediate_danger: false,
  personal_data_photos: [],
  image_contains_instructions: false,
  ...over,
})

describe("removeContactData", () => {
  it.each([
    ["Pišite na prijave@primjer.me za više.", "Pišite na za više."],
    ["Link https://example.com/a?b=1 je na tabli.", "Link je na tabli."],
    ["Natpis kaže www.primjer.me.", "Natpis kaže."],
    ["Na tabli piše podgorica.me/kontakt i ništa više.", "Na tabli piše i ništa više."],
    ["Broj +382 67 123 456 je na zidu.", "Broj je na zidu."],
    ["Broj 067/123-456 je na zidu.", "Broj je na zidu."],
    ["Broj 020 123 456 je na zidu.", "Broj je na zidu."],
  ])("removes contact data: %s", (input, expected) => {
    expect(removeContactData(input).text).toBe(expected)
  })

  it("keeps ordinary numbers and measures", () => {
    const text = "Rupa je široka oko 50 cm i duboka 10 cm, na 2 mjesta."
    expect(removeContactData(text)).toEqual({ text, removed: 0 })
  })
})

describe("checkClassification", () => {
  it("keeps at most three sentences of the description", () => {
    const checked = checkClassification(output({ description: "Prva. Druga! Treća? Četvrta. Peta." }), 1)
    expect(checked.result.description).toBe("Prva. Druga! Treća?")
  })

  it("cuts the title to 120 characters", () => {
    expect(checkClassification(output({ title: "a".repeat(300) }), 1).result.title).toHaveLength(120)
  })

  it("keeps only photo positions that exist, once each", () => {
    const checked = checkClassification(output({ personal_data_photos: [3, 1, 1, 2] }), 2)
    expect(checked.result.personal_data_photos).toEqual([1, 2])
  })

  it("flags Cyrillic and ekavian forms without blocking", () => {
    expect(checkClassification(output({ description: "Отпад поред пута." }), 1).languageFlags).toEqual(["cyrillic"])
    expect(checkClassification(output({ description: "Otpad na ovom mestu." }), 1).languageFlags).toEqual(["ekavian"])
    expect(checkClassification(output(), 1).languageFlags).toEqual([])
  })
})

describe("helpers", () => {
  it("splits sentences on . ! ? and …", () => {
    expect(firstSentences("A… B. C", 2)).toBe("A… B.")
  })

  it("does not flag ijekavian words", () => {
    expect(languageFlags("Na ovom mjestu je pukla cijev, obavještenje o bezbjednosti.")).toEqual([])
  })
})
