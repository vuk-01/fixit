import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { getAccount } from "@/lib/auth"
import { APP_NAME, HEADER_TEXT } from "@/lib/constants"
import { cn } from "@/lib/utils"

// Header on every page (PRD §8): the menu with "Odjavi se" is for a signed-in account only.
export async function SiteHeader() {
  const account = await getAccount()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
        <Link
          href="/"
          aria-label={HEADER_TEXT.home}
          className="flex h-11 items-center font-heading text-lg font-semibold"
        >
          {APP_NAME}
        </Link>
        {account ? (
          <UserMenu name={`${account.firstName} ${account.lastName}`} />
        ) : (
          <Link href="/uloguj-se" className={cn(buttonVariants({ variant: "ghost" }), "h-11 px-3")}>
            {HEADER_TEXT.signIn}
          </Link>
        )}
      </div>
    </header>
  )
}
