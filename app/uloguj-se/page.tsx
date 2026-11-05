import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { RepairScene } from "@/components/sign-in/repair-scene"
import { getAccount } from "@/lib/auth"
import { safeNextPath } from "@/lib/auth-paths"
import { AUTH_TEXT } from "@/lib/constants"

import { AuthForms } from "./auth-forms"

export const metadata: Metadata = { title: AUTH_TEXT.pageTitle }

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const next = safeNextPath((await searchParams).next)

  // already signed in: go straight to where the visitor was heading
  if (await getAccount()) redirect(next)

  // UI.md "Sign-in page": the scene fills the screen below the header; `my-auto` centres the group (tabs,
  // card, notice) in it and collapses to 0 on a short screen, so the group starts at the top and the page
  // scrolls. Below `md` the 64 px padding above and below the group is the scene's band for the problems.
  return (
    <RepairScene className="flex min-h-[calc(100svh-var(--header-height))] flex-col">
      {/* data-page hides the header's „Uloguj se" pill on this page (components/site-header.tsx) */}
      <main
        data-page="sign-in"
        data-scene-content
        className="relative z-10 mx-auto my-auto flex w-full max-w-md flex-col gap-4 px-4 py-6 max-md:py-16"
      >
        <AuthForms next={next} />
        <p className="text-sm text-muted-foreground">
          {AUTH_TEXT.privacyNotice}{" "}
          <Link href="/privatnost" className="font-medium text-primary underline underline-offset-4">
            {AUTH_TEXT.privacyLink}
          </Link>
        </p>
      </main>
    </RepairScene>
  )
}
