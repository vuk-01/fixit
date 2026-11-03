import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

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

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
      <AuthForms next={next} />
      <p className="text-sm text-muted-foreground">
        {AUTH_TEXT.privacyNotice}{" "}
        <Link href="/privatnost" className="font-medium text-primary underline underline-offset-4">
          {AUTH_TEXT.privacyLink}
        </Link>
      </p>
    </main>
  )
}
