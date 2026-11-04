"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

import { changeReportStatus } from "@/app/panel/actions"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import {
  ERROR_MESSAGES,
  PANEL_TEXT,
  STATUS_LABELS,
  STATUS_MESSAGE_MAX_LENGTH,
  STATUS_STYLE,
  type ReportStatus,
} from "@/lib/constants"
import { messageRequired, normalizeMessage, officialTargets, type OfficialTarget } from "@/lib/panel/status-change"

// Status change for the recipient's official (FR-21). Only the transitions the official may make
// from the current status are offered (FR-18 8–10); the database checks them again.
export function StatusForm({ reportId, status }: { reportId: string; status: ReportStatus }) {
  const router = useRouter()
  const targets = officialTargets(status)
  const [to, setTo] = useState<OfficialTarget | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  if (targets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {status === "not_competent" ? PANEL_TEXT.notCompetent : PANEL_TEXT.closed}
      </p>
    )
  }

  const required = to !== null && messageRequired(to)

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    if (!to) return setError(PANEL_TEXT.chooseStatus)
    if (required && !normalizeMessage(message)) return setError(ERROR_MESSAGES.message_required)
    setError(null)
    startTransition(async () => {
      const result = await changeReportStatus({ reportId, to, message })
      if (!result.ok) return setError(result.error)
      setTo(null)
      setMessage("")
      setSaved(true)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <FieldSet>
        <FieldLegend variant="label">{PANEL_TEXT.newStatus}</FieldLegend>
        <RadioGroup
          value={to}
          onValueChange={(value) => {
            setTo(value as OfficialTarget)
            setError(null)
            setSaved(false)
          }}
          disabled={pending}
        >
          {targets.map((target) => {
            const Icon = STATUS_STYLE[target].icon
            return (
              <FieldLabel key={target} htmlFor={`status-${target}`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>
                      <Icon aria-hidden className="size-4" />
                      {STATUS_LABELS[target].panel}
                    </FieldTitle>
                    <FieldDescription>{PANEL_TEXT.targets[target]}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value={target} id={`status-${target}`} />
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>
      </FieldSet>

      <Field data-invalid={error === ERROR_MESSAGES.message_required || undefined}>
        <FieldLabel htmlFor="status-message">
          {required ? PANEL_TEXT.messageRequired : PANEL_TEXT.messageOptional}
        </FieldLabel>
        <Textarea
          id="status-message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            setSaved(false)
          }}
          maxLength={STATUS_MESSAGE_MAX_LENGTH}
          rows={4}
          disabled={pending}
          aria-invalid={error === ERROR_MESSAGES.message_required || undefined}
          aria-required={required || undefined}
        />
        <FieldDescription>{PANEL_TEXT.messageHint}</FieldDescription>
      </Field>

      {error && <FieldError>{error}</FieldError>}
      {saved && (
        <p role="status" className="text-sm font-medium text-status-resolved">
          {PANEL_TEXT.saved}
        </p>
      )}

      <Button type="submit" className="h-11" disabled={pending}>
        {pending ? PANEL_TEXT.saving : PANEL_TEXT.save}
      </Button>
    </form>
  )
}
