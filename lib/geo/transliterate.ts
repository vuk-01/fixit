// Montenegrin/Serbian Cyrillic → Latin (Tech.md §3). Nominatim can return Cyrillic names
// even with accept-language=cnr-Latn; the address that is shown and stored is always Latin.
const LETTERS: Record<string, string> = {
  А: "A", Б: "B", В: "V", Г: "G", Д: "D", Ђ: "Đ", Е: "E", Ж: "Ž", З: "Z", И: "I", Ј: "J",
  К: "K", Л: "L", Љ: "Lj", М: "M", Н: "N", Њ: "Nj", О: "O", П: "P", Р: "R", С: "S", Т: "T",
  Ћ: "Ć", У: "U", Ф: "F", Х: "H", Ц: "C", Ч: "Č", Џ: "Dž", Ш: "Š",
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "đ", е: "e", ж: "ž", з: "z", и: "i", ј: "j",
  к: "k", л: "l", љ: "lj", м: "m", н: "n", њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t",
  ћ: "ć", у: "u", ф: "f", х: "h", ц: "c", ч: "č", џ: "dž", ш: "š",
}

// Montenegrin С́ / З́ are written as the letter plus a combining acute accent
const WITH_ACUTE: Record<string, string> = { С: "Ś", с: "ś", З: "Ź", з: "ź" }
const ACUTE = "́"

const isUpper = (ch: string | undefined) => !!ch && ch !== ch.toLowerCase() && ch === ch.toUpperCase()

export function transliterate(text: string): string {
  const chars = [...text.normalize("NFD")]
  let out = ""
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (chars[i + 1] === ACUTE && WITH_ACUTE[ch]) {
      out += WITH_ACUTE[ch]
      i++
      continue
    }
    const latin = LETTERS[ch]
    if (latin === undefined) {
      out += ch
      continue
    }
    // Љ, Њ, Џ inside an all-caps word stay all caps (ЏАМИЈА → DŽAMIJA, not DžAMIJA)
    out += latin.length > 1 && isUpper(ch) && isUpper(chars[i + 1]) ? latin.toUpperCase() : latin
  }
  return out.normalize("NFC")
}
