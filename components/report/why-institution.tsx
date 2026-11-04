"use client"

import { ExternalLink, Info } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { formatDay, sourceTypeText, WHY_INSTITUTION_TEXT, type SourceType } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"

type Source = {
  institution_name: string
  cc_institution_name: string | null
  source_type: SourceType
  source_title: string
  source_url: string | null
  source_excerpt: string | null
  verified_at: string
}

type State = { status: "closed" } | { status: "loading" } | { status: "open"; source: Source } | { status: "failed" }

// "Zašto ova institucija?" (PRD "Pravila nadležnosti"): a small link that opens the public part
// of the rule (get_jurisdiction_source; never notes or verified_by). A phone confirmation shows
// "slabiji izvor (potvrda telefonom)". Without a rule (assigned by the administrator) it says so.
// Used on the review (#11) and meant for /p/[code] (#13). Adds no tap to the main flow.
export function WhyInstitution({ ruleId }: { ruleId: string | null }) {
  const [state, setState] = useState<State>({ status: "closed" })

  const toggle = async () => {
    if (state.status === "open" || state.status === "loading") {
      setState({ status: "closed" })
      return
    }
    if (!ruleId) {
      setState({ status: "failed" })
      return
    }
    setState({ status: "loading" })
    const { data, error } = await createClient().rpc("get_jurisdiction_source", { p_rule_id: ruleId })
    const source = data?.[0] as Source | undefined
    setState(error || !source ? { status: "failed" } : { status: "open", source })
  }

  const open = state.status !== "closed"

  return (
    <div className="flex flex-col gap-2" data-testid="why-institution">
      <Button
        variant="link"
        className="h-11 justify-start gap-1 self-start px-0"
        aria-expanded={open}
        onClick={() => void toggle()}
      >
        <Info aria-hidden />
        {open ? WHY_INSTITUTION_TEXT.hide : WHY_INSTITUTION_TEXT.link}
      </Button>
      {open && (
        <div className="flex flex-col gap-3 rounded-lg bg-muted p-3 text-sm" role="region" aria-label={WHY_INSTITUTION_TEXT.link}>
          {!ruleId ? (
            <p>{WHY_INSTITUTION_TEXT.manual}</p>
          ) : state.status === "loading" ? (
            <p role="status">{WHY_INSTITUTION_TEXT.loading}</p>
          ) : state.status === "failed" ? (
            <p role="alert">{WHY_INSTITUTION_TEXT.failed}</p>
          ) : state.status === "open" ? (
            <SourceDetails source={state.source} />
          ) : null}
        </div>
      )}
    </div>
  )
}

function SourceDetails({ source }: { source: Source }) {
  return (
    <>
      <p className="text-muted-foreground">{WHY_INSTITUTION_TEXT.intro}</p>
      <dl className="flex flex-col gap-2">
        <div>
          <dt className="text-muted-foreground">{WHY_INSTITUTION_TEXT.institution}</dt>
          <dd className="font-medium">{source.institution_name}</dd>
          {source.cc_institution_name && (
            <dd>
              {WHY_INSTITUTION_TEXT.cc}: {source.cc_institution_name}
            </dd>
          )}
        </div>
        <div>
          <dt className="text-muted-foreground">{WHY_INSTITUTION_TEXT.source}</dt>
          <dd data-testid="source-type">{sourceTypeText(source.source_type)}</dd>
          <dd className="font-medium">{source.source_title}</dd>
        </div>
      </dl>
      {source.source_excerpt && (
        <blockquote className="border-l-4 border-primary/40 pl-3 italic">{source.source_excerpt}</blockquote>
      )}
      {source.source_url && (
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1 self-start font-medium text-primary underline-offset-4 hover:underline"
        >
          {WHY_INSTITUTION_TEXT.openSource}
          <ExternalLink aria-hidden className="size-4" />
        </a>
      )}
      <p className="text-muted-foreground">{WHY_INSTITUTION_TEXT.verified(formatDay(source.verified_at))}</p>
    </>
  )
}
