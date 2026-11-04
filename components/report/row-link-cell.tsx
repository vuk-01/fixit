import Link from "next/link"
import { cn } from "cn"

import { TableCell } from "@/components/ui/table"

// A table cell whose whole area opens the row's report (/panel, /admin; ticket #32). Every cell
// has its own link to the same address instead of one stretched `::after` overlay: WebKit
// (iPhone Safari) does not make a <tr> the containing block of positioned descendants, so a
// stretched link escaped its row, the last row's overlay covered the whole table, and every tap
// opened the oldest report. Nothing here is positioned, so a tap can only reach its own row.
//
// The cell has no padding; the link carries it and fills the cell (`h-px` on the cell lets the
// link's `h-full` resolve to the row height). Only the `primary` cell (the code) is in the tab
// order; the others are tap targets only (`tabIndex={-1}`) but stay readable for screen readers.
// No prefetch: opening a report in the panel acknowledges it (FR-22), so only a real tap may
// load it.
export function RowLinkCell({
  href,
  primary = false,
  className,
  linkClassName,
  children,
}: {
  href: string
  primary?: boolean
  className?: string
  linkClassName?: string
  children: React.ReactNode
}) {
  return (
    <TableCell className={cn("h-px p-0", className)}>
      <Link
        href={href}
        prefetch={false}
        tabIndex={primary ? undefined : -1}
        data-row-link={primary ? "primary" : "cell"}
        className={cn(
          "flex h-full min-h-11 flex-col justify-center p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          linkClassName,
        )}
      >
        {children}
      </Link>
    </TableCell>
  )
}
