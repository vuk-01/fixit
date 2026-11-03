import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, STATUS_STYLE, type PublicReportStatus } from "@/lib/constants"

// Status as colour + icon + text (UI.md "Status colours and icons"; never colour alone).
export function StatusBadge({
  status,
  label = "public",
  className,
}: {
  status: PublicReportStatus
  label?: "public" | "panel"
  className?: string
}) {
  const { colorClass, icon: Icon } = STATUS_STYLE[status]
  return (
    <Badge className={cn(colorClass, className)}>
      <Icon aria-hidden data-icon="inline-start" />
      {STATUS_LABELS[status][label]}
    </Badge>
  )
}
