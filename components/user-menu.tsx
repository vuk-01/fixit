"use client"

import { LayoutList, LogOut, UserRound } from "lucide-react"
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
import { HEADER_TEXT } from "@/lib/constants"

// Shown only for a signed-in account, never for a guest or an anonymous session (PRD §8). The trigger is
// the header pill, the same control as „Uloguj se" (UI.md "Header").
export function UserMenu({ name, links }: { name: string; links?: { href: string; label: string }[] }) {
  const [pending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${HEADER_PILL} max-w-48`}>
        <UserRound aria-hidden className="size-[18px] shrink-0 text-highlight" strokeWidth={2.5} />
        <span className="truncate">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {links && links.length > 0 && (
          <>
            {links.map((link) => (
              <DropdownMenuItem key={link.href} className="min-h-11" render={<Link href={link.href} />}>
                <LayoutList aria-hidden />
                {link.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          disabled={pending}
          className="min-h-11"
          onClick={() => startTransition(() => signOut())}
        >
          <LogOut aria-hidden />
          {HEADER_TEXT.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
