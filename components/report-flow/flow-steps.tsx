import { cn } from "cn"
import { Check } from "lucide-react"

import { REPORT_FLOW_STEPS, REPORT_FLOW_TEXT } from "@/lib/constants"

// The wizard's steps under the header (UI.md "Layout direction", ticket 32 variant B): one navy
// segment per step done or current, the step names under them, a ✓ before a finished step. The
// current step is told in text (sr-only „Korak 2 od 3" and aria-current), never by colour alone.
export function FlowSteps({ index }: { index: number }) {
  return (
    <div className="border-b bg-background px-4 pt-3 pb-2.5">
      <p className="sr-only">{REPORT_FLOW_TEXT.stepOf(index + 1, REPORT_FLOW_STEPS.length)}</p>
      <ol aria-label={REPORT_FLOW_TEXT.pageTitle} className="grid grid-cols-3 gap-1">
        {REPORT_FLOW_STEPS.map((label, i) => (
          <li key={label} aria-current={i === index ? "step" : undefined} className="flex min-w-0 flex-col gap-1.5">
            <span aria-hidden className={cn("h-1.5 rounded-full", i <= index ? "bg-primary" : "bg-border")} />
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-bold",
                i === index ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {i < index && <Check aria-hidden className="size-3.5 shrink-0 text-status-resolved" strokeWidth={2.75} />}
              {label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
