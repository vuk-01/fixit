// Ticket #15: the assignment letter preview on /admin shows the reporter's name (when they shared
// it) but never the account email; the letter that is sent has the real one (FR-11).
import { beforeEach, describe, expect, it, vi } from "vitest"

const REPORT = "22222222-2222-4222-8222-222222222222"
const REPORTER_EMAIL = "dev-2@fixit.test"

const m = vi.hoisted(() => ({ getUserById: vi.fn(), shareContact: true }))

function from(table: string) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    async maybeSingle() {
      if (table === "report_private") return { data: { reporter_id: "r", share_contact: m.shareContact }, error: null }
      if (table === "profiles") return { data: { first_name: "Dev", last_name: "Dva" }, error: null }
      if (table === "institutions") return { data: { name: "Služba komunalne policije" }, error: null }
      return {
        error: null,
        data: {
          code: "FX-2026-00013",
          submitted_at: "2026-11-04T15:11:58Z",
          category: "graffiti",
          description: null,
          address: null,
          lat: 42.4411,
          lng: 19.2636,
          like_count: 0,
          report_details: null,
          report_photos: [{ position: 1, storage_path: "p.jpg" }],
        },
      }
    },
  }
  return builder
}

const admin = {
  from,
  rpc: async () => ({ data: 0, error: null }),
  auth: { admin: { getUserById: m.getUserById } },
}

vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://fixit-b73a.vercel.app" }) }))

import { ADMIN_TEXT, PREPARE_TEXT } from "@/lib/constants"

import { buildAssignmentLetter } from "./report-letter"

type Admin = Parameters<typeof buildAssignmentLetter>[0]

beforeEach(() => {
  m.shareContact = true
  m.getUserById.mockReset().mockResolvedValue({ data: { user: { email: REPORTER_EMAIL } }, error: null })
})

describe("buildAssignmentLetter", () => {
  it("previews with the name and a placeholder instead of the account email, without reading it", async () => {
    const letter = await buildAssignmentLetter(admin as unknown as Admin, {
      reportId: REPORT,
      kind: "assignment",
      institutionId: null,
      preview: true,
    })
    expect(m.getUserById).not.toHaveBeenCalled()
    expect(letter.bodyText).toContain(`instituciji: Dev Dva, ${ADMIN_TEXT.contactEmailPlaceholder}.`)
    expect(letter.bodyText).not.toContain(REPORTER_EMAIL)
    // the report already has its number and date: nothing "dodjeljuje se pri slanju"
    expect(letter.bodyText).not.toContain(PREPARE_TEXT.assignedAtSubmit)
    expect(letter.params).toMatchObject({ kind: "assignment", institutionName: null, ccInstitutionName: null })
  })

  it("puts the real email in the letter that is sent, and nothing without consent", async () => {
    const sent = await buildAssignmentLetter(admin as unknown as Admin, {
      reportId: REPORT,
      kind: "assignment",
      institutionId: "i",
      preview: false,
    })
    expect(sent.includesContact).toBe(true)
    expect(sent.bodyText).toContain(`instituciji: Dev Dva, ${REPORTER_EMAIL}.`)
    expect(sent.bodyText).toContain("odredio je administrator platforme Fixit: Služba komunalne policije.")
    expect(sent.photos).toEqual([{ storagePath: "p.jpg", filename: "FX-2026-00013-1.jpg" }])

    m.shareContact = false
    const without = await buildAssignmentLetter(admin as unknown as Admin, {
      reportId: REPORT,
      kind: "assignment",
      institutionId: "i",
      preview: false,
    })
    expect(without.includesContact).toBe(false)
    expect(without.bodyText).not.toContain("Dev Dva")
  })
})
