"use client"

import { ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CATEGORIES, CATEGORY_ORDER, CLASSIFY_TEXT, type ReportCategory } from "@/lib/constants"

import { needsCategoryChoice, type Analysis } from "./flow-state"
import { AnalysisBanner } from "./analysis-banner"

// Category picker (FR-7): every category from lib/constants.ts, "Drugi problem" last; one tap
// picks the category and moves on. The model's description, if any, stays in the flow.
export function CategoryStep({
  analysis,
  onChoose,
  cancel,
}: {
  analysis: Analysis
  onChoose: (category: ReportCategory) => void
  cancel: React.ReactNode
}) {
  // the "not sure" sentence only when the model answered but was not sure (FR-7)
  const title =
    analysis.status === "done" && needsCategoryChoice(analysis) ? CLASSIFY_TEXT.unsureTitle : CLASSIFY_TEXT.chooseTitle

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b bg-background px-4 py-3">
        {analysis.status === "fallback" && <AnalysisBanner analysis={analysis} />}
        <h1 className="font-heading text-xl font-semibold" data-testid="category-title">
          {title}
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <ul className="flex flex-col gap-2" aria-label={CLASSIFY_TEXT.categoryListLabel}>
          {CATEGORY_ORDER.map((slug) => (
            <li key={slug}>
              <Button
                variant="outline"
                size="lg"
                className="h-auto min-h-12 w-full justify-between bg-background py-3 text-left text-base whitespace-normal"
                onClick={() => onChoose(slug)}
              >
                {CATEGORIES[slug].label}
                <ChevronRight aria-hidden className="text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{cancel}</div>
    </div>
  )
}
