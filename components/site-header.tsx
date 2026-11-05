import { LogIn } from "lucide-react"
import Link from "next/link"

import { HEADER_PILL } from "@/components/header-styles"
import { UserMenu } from "@/components/user-menu"
import { getAccount } from "@/lib/auth"
import { APP_NAME, HEADER_TEXT } from "@/lib/constants"

// Header on every page (PRD §8, UI.md "Fixit design"): navy bar, logo + „Fixit" / „Prijave u Podgorici",
// and on the right „Uloguj se" or the account menu („Odjavi se" is for a signed-in account only).
// Height is --header-height (4.75rem); full-height screens subtract it. Same container as the wide pages
// (max-w-5xl px-4, UI.md "Page widths"); the pill on the right pulls back by 4 px (-mr-1). The laptop home
// page marks itself `data-header="wide"`; from `lg` the header then spans the screen so the logo lines up
// with its list sidebar.
export async function SiteHeader() {
  const account = await getAccount()

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-(--header-height) max-w-5xl items-center justify-between gap-2 px-4 lg:[body:has([data-header=wide])_&]:max-w-none">
        <Link href="/" aria-label={HEADER_TEXT.home} className="flex min-h-11 items-center gap-3">
          {/* decorative: the link carries the name; a static SVG needs no next/image optimisation */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/fixit-logo.svg" alt="" width={44} height={44} className="size-11 shrink-0" />
          <span className="flex flex-col">
            <span className="text-[26px] leading-none font-extrabold tracking-[-0.01em]">{APP_NAME}</span>
            <span className="mt-1 text-[13.5px] leading-tight text-white/75">{HEADER_TEXT.subtitle}</span>
          </span>
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
          // hidden on /uloguj-se itself, which marks its <main> with data-page="sign-in"
          <Link href="/uloguj-se" className={`${HEADER_PILL} [body:has([data-page=sign-in])_&]:hidden`}>
            <LogIn aria-hidden className="size-[18px] text-highlight" strokeWidth={2.5} />
            {HEADER_TEXT.signIn}
          </Link>
        )}
      </div>
    </header>
  )
}

