// The blue accent of the report lists in /admin and /panel and their report pages (UI.md
// "Report lists in /admin and /panel"): the `report-day` token of the report cards, used sparingly
// on white. Figures and links in it pass WCAG AA (12:1 on white).

// a 4 × 16 px blue bar before a card title
export const REPORT_ACCENT_TITLE =
  "flex items-center gap-2 before:h-4 before:w-1 before:shrink-0 before:rounded-full before:bg-report-day before:content-['']"

// a light blue tint for a report row under the pointer or with keyboard focus inside it
export const REPORT_ROW_TINT = "hover:bg-report-day/5 focus-within:bg-report-day/5"

// the report number in a list
export const REPORT_CODE = "font-semibold text-report-day"
