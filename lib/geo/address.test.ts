import { describe, expect, it } from "vitest"

import { createThrottle, formatAddress, roundCoordinate } from "./address"
import { transliterate } from "./transliterate"

describe("transliterate", () => {
  it("turns Cyrillic into Latin", () => {
    expect(transliterate("Булевар Светог Петра Цетињског")).toBe("Bulevar Svetog Petra Cetinjskog")
    expect(transliterate("Ђурђевданска, Џаковица, Љешкопоље")).toBe("Đurđevdanska, Džakovica, Lješkopolje")
    expect(transliterate("ЏАМИЈА ЊЕГОШЕВА")).toBe("DŽAMIJA NJEGOŠEVA")
  })

  it("handles the Montenegrin letters with an acute accent", () => {
    expect(transliterate("С́екира, З́ено")).toBe("Śekira, Źeno")
  })

  it("leaves Latin text and digits alone", () => {
    expect(transliterate("Hercegovačka 12, Podgorica")).toBe("Hercegovačka 12, Podgorica")
  })
})

describe("formatAddress", () => {
  it("is road + house number + city, never display_name", () => {
    expect(
      formatAddress(
        { road: "Bulevar Svetog Petra Cetinjskog", house_number: "12", city: "Podgorica", suburb: "Centar" },
        42.4411,
        19.2636,
      ),
    ).toBe("Bulevar Svetog Petra Cetinjskog 12, Podgorica")
  })

  it("works without a house number and with town or village", () => {
    expect(formatAddress({ road: "Njegoševa", town: "Podgorica" }, 42.44, 19.26)).toBe("Njegoševa, Podgorica")
    expect(formatAddress({ road: "Put", village: "Donji Kokoti" }, 42.4, 19.2)).toBe("Put, Donji Kokoti")
  })

  it("falls back to settlement, municipality and coordinates without a street", () => {
    expect(formatAddress({ suburb: "Zagorič", city: "Podgorica" }, 42.4523456, 19.2391234)).toBe(
      "Zagorič, Podgorica, 42.45235, 19.23912",
    )
    expect(formatAddress({ county: "Glavni grad Podgorica" }, 42.5, 19.3)).toBe(
      "Glavni grad Podgorica, 42.50000, 19.30000",
    )
  })

  it("transliterates a Cyrillic answer", () => {
    expect(formatAddress({ road: "Његошева", house_number: "5", city: "Подгорица" }, 42.44, 19.26)).toBe(
      "Njegoševa 5, Podgorica",
    )
  })

  it("returns null without an address object", () => {
    expect(formatAddress(undefined, 42.44, 19.26)).toBeNull()
  })
})

describe("roundCoordinate", () => {
  it("rounds to 5 decimals", () => {
    expect(roundCoordinate(42.4411234567)).toBe(42.44112)
    expect(roundCoordinate(19.263655)).toBe(19.26366)
  })
})

describe("createThrottle", () => {
  it("allows one call per interval per key", () => {
    let t = 0
    const allow = createThrottle(1000, () => t)
    expect(allow("a")).toBe(true)
    expect(allow("a")).toBe(false)
    expect(allow("b")).toBe(true)
    t = 999
    expect(allow("a")).toBe(false)
    t = 1000
    expect(allow("a")).toBe(true)
  })
})
