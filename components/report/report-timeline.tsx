import { STATUS_STYLE, TIMELINE_TEXT } from "@/lib/constants"
import { formatLetterDate } from "@/lib/email/letter-template"
import { timelineEntry, type TimelineEvent } from "@/lib/reports/timeline"
import { cn } from "@/lib/utils"

// Timeline (FR-18): oldest first; each entry has the status icon, the text, the date by the clock
// in Podgorica, the public message and who signed it (institution or "Tim Fixit").
export function ReportTimeline({
  events,
  institutionNames,
  view,
}: {
  events: TimelineEvent[]
  institutionNames: ReadonlyMap<string, string>
  view: "public" | "panel"
}) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">{TIMELINE_TEXT.empty}</p>

  return (
    <ol className="flex flex-col gap-4">
      {events.map((event) => {
        const entry = timelineEntry(event, institutionNames, view)
        const style = entry.status === "draft" ? null : STATUS_STYLE[entry.status]
        const Icon = style?.icon
        return (
          <li key={entry.id} className="flex gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                style?.colorClass ?? "bg-muted text-foreground",
              )}
            >
              {Icon && <Icon className="size-4" />}
            </span>
            <div className="flex min-w-0 flex-col gap-1 text-sm">
              <p className="font-medium">{entry.title}</p>
              {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
              {entry.message && (
                <blockquote className="rounded-lg bg-muted px-3 py-2 whitespace-pre-wrap">{entry.message}</blockquote>
              )}
              <p className="text-muted-foreground">
                <time dateTime={entry.createdAt}>{formatLetterDate(entry.createdAt)}</time>
                {entry.signature && (
                  <>
                    <span aria-hidden> · </span>
                    <span>{entry.signature}</span>
                  </>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
