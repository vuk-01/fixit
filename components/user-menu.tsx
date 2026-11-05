"use client"

import { Building2, ChevronDown, ChevronRight, LayoutList, LogOut, ShieldCheck, UserRound, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useTransition } from "react"

import { signOut } from "@/app/uloguj-se/actions"
import { HEADER_PILL } from "@/components/header-styles"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { initialsOf } from "@/lib/account-label"
import { HEADER_TEXT, type UserRole } from "@/lib/constants"
import { cn } from "@/lib/utils"

type MenuLink = { href: string; label: string }

// Icons are chosen here, not in SiteHeader: a Server Component cannot pass components to a client one.
const LINK_ICON: Record<string, LucideIcon> = { "/panel": Building2, "/admin": ShieldCheck }

// Shown only for a signed-in account, never for a guest or an anonymous session (PRD §8). The trigger is
// the header pill with the role only („Službenik"), plus a chevron; the menu is a profile card whose navy
// top shows `title` from accountTitle() (UI.md "Header" → "Account menu"). Nothing is cut with „…": the
// pill text is short and fixed, and long text in the menu wraps.
export function UserMenu({
  role,
  title,
  showRole,
  links,
}: {
  role: UserRole
  title: string
  showRole: boolean
  links?: MenuLink[]
}) {
  const [pending, startTransition] = useTransition()
  const roleLabel = HEADER_TEXT.roles[role]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          HEADER_PILL,
          "group shrink-0 gap-1.5 pr-3 pl-3.5 whitespace-nowrap data-popup-open:bg-white/20 data-popup-open:ring-white/50"
        )}
      >
        <UserRound aria-hidden className="size-[18px] shrink-0 text-highlight" strokeWidth={2.5} />
        {roleLabel}
        <ChevronDown
          aria-hidden
          strokeWidth={2.5}
          className="size-4 shrink-0 text-white/80 transition-transform group-data-popup-open:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-72 max-w-[calc(100vw-24px)] min-w-0 p-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 bg-primary px-4 py-4 text-primary-foreground">
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-full bg-highlight text-[17px] leading-none font-extrabold text-highlight-foreground"
            >
              {initialsOf(title)}
            </span>
            <span className="min-w-0">
              <span className="block text-[16px] leading-tight font-bold [overflow-wrap:anywhere]">{title}</span>
              {showRole && (
                <span className="mt-1.5 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[12.5px] leading-none font-semibold text-white/85 ring-1 ring-white/20 ring-inset">
                  {roleLabel}
                </span>
              )}
            </span>
          </DropdownMenuLabel>
          {links && links.length > 0 && (
            <div className="p-2">
              {links.map((link) => {
                const Icon = LINK_ICON[link.href] ?? LayoutList
                return (
                  <DropdownMenuItem
                    key={link.href}
                    render={<Link href={link.href} />}
                    className="min-h-14 gap-3 px-2 py-2 text-[15.5px] leading-tight font-semibold"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                      <Icon aria-hidden className="size-5 text-primary" />
                    </span>
                    <span className="min-w-0 flex-1">{link.label}</span>
                    <ChevronRight aria-hidden className="size-[18px] text-muted-foreground" />
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="mx-0 my-0 bg-border" />
        <div className="p-2">
          <DropdownMenuItem
            disabled={pending}
            onClick={() => startTransition(() => signOut())}
            className="min-h-12 justify-center gap-2 py-0 text-[15px] font-semibold ring-1 ring-border ring-inset"
          >
            <LogOut aria-hidden className="size-[18px]" />
            {HEADER_TEXT.signOut}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
