import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { UserMenu } from "@/components/user-menu"
import { getAccount } from "@/lib/auth"
import { APP_NAME, HEADER_TEXT } from "@/lib/constants"
import { cn } from "@/lib/utils"

// Header on every page (PRD §8, UI.md v2: „Fixit" / „Prijave u Podgorici"): the menu with "Odjavi se" is for a signed-in account only.
export async function SiteHeader() {
  const account = await getAccount()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-2 px-4">
        <Link href="/" aria-label={HEADER_TEXT.home} className="flex min-h-11 flex-col justify-center">
          <span className="font-heading text-xl leading-tight font-semibold">{APP_NAME}</span>
          <span className="text-sm leading-tight text-muted-foreground">{HEADER_TEXT.subtitle}</span>
        </Link>
        {account ? (
          <UserMenu
            name={`${account.firstName} ${account.lastName}`}
            links={
              account.role === "official"
                ? [{ href: "/panel", label: HEADER_TEXT.panel }]
                : account.role === "admin"
                  ? [{ href: "/admin", label: HEADER_TEXT.admin }]
                  : undefined
            }
          />
        ) : (
          <Link href="/uloguj-se" className={cn(buttonVariants({ variant: "ghost" }), "h-11 px-3")}>
            {HEADER_TEXT.signIn}
          </Link>
        )}
      </div>
    </header>
  )
}
