"use client"

import { LayoutList, LogOut, UserRound } from "lucide-react"
import Link from "next/link"
import { useTransition } from "react"

import { signOut } from "@/app/uloguj-se/actions"
import { Button } from "@/components/ui/button"
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

// Shown only for a signed-in account, never for a guest or an anonymous session (PRD §8).
export function UserMenu({ name, links }: { name: string; links?: { href: string; label: string }[] }) {
  const [pending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="-mr-3 h-11 max-w-48 gap-2 px-3" />}>
        <UserRound aria-hidden />
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
