// The letter on the review, rendered again in the browser from the template parameters the
// prepare route sent (lib/email/letter-template.ts is a pure function): with the description as
// the citizen edits it, the current number of photos and the contact toggle. The number, date
// and time and earlier reports stay "dodjeljuje se pri slanju" (FR-11, ticket 22 Q5).

import type { PreviewLetter } from "@/lib/agent/steps"
import { REVIEW_TEXT } from "@/lib/constants"
import { renderLetter } from "@/lib/email/letter-template"

export type ReviewLetterInput = {
  description: string
  photoCount: number
  // the account's name when "Dostavi moje ime i mejl instituciji" is on; the email itself is never
  // shown in the UI (ticket #11), the letter that is sent gets it on the server (#12)
  contact: { firstName: string; lastName: string } | null
}

export function reviewLetter(letter: PreviewLetter, input: ReviewLetterInput) {
  const { subject, bodyText } = renderLetter({
    ...letter.params,
    // never a number, date or count in the preview, whatever the parameters say
    code: null,
    submittedAt: null,
    previousReports: null,
    description: input.description,
    photoPositions: Array.from({ length: input.photoCount }, (_, i) => i + 1),
    contact: input.contact ? { ...input.contact, email: REVIEW_TEXT.contactEmailPlaceholder } : null,
  })
  return { subject, bodyText }
}
