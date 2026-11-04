"use client"

import { Send } from "lucide-react"
import Link from "next/link"
import { useMemo, useState, useTransition } from "react"

import { assignReport } from "@/app/admin/actions"
import { StatusBadge } from "@/components/report/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ADMIN_TEXT, type ReportStatus } from "@/lib/constants"
import { renderLetter, type LetterParams } from "@/lib/email/letter-template"
import { cn } from "@/lib/utils"

type Done = { status: ReportStatus; institutionName: string }

// Manual assignment (FR-23, PRD §4.4): the administrator picks one institution with a verified
// email, sees the letter for it (the same pure template as on the server, re-rendered for each
// choice) and sends it. The server builds the letter again from the database; nothing from this
// preview is sent. No confirmation dialog: the button is the deliberate action, and a second tap
// while sending is blocked here and by start_dispatch (`dispatch_in_progress`).
export function AssignForm({
  reportId,
  institutions,
  preview,
  canSend,
}: {
  reportId: string
  institutions: { id: string; name: string }[]
  preview: LetterParams | null
  // false for a report without photos (nothing to attach, FR-11)
  canSend: boolean
}) {
  const [institutionId, setInstitutionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Done | null>(null)
  const [pending, startTransition] = useTransition()

  const chosen = institutions.find((i) => i.id === institutionId) ?? null
  const letter = useMemo(
    () =>
      preview ? renderLetter({ ...preview, institutionName: chosen?.name ?? ADMIN_TEXT.institutionPlaceholder }) : null,
    [preview, chosen],
  )

  if (done) {
    return (
      <div className="flex flex-col gap-4" role="status">
        <Alert>
          <Send aria-hidden />
          <AlertTitle>{ADMIN_TEXT.sent(done.institutionName)}</AlertTitle>
          {done.status !== "sent" && <AlertDescription>{ADMIN_TEXT.statusChanged}</AlertDescription>}
        </Alert>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">{ADMIN_TEXT.statusLabel}:</span>
          {done.status !== "draft" && <StatusBadge status={done.status} label="panel" />}
        </div>
        <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "h-11 self-start")}>
          {ADMIN_TEXT.back}
        </Link>
      </div>
    )
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!institutionId) return setError(ADMIN_TEXT.chooseInstitution)
    setError(null)
    startTransition(async () => {
      const result = await assignReport({ reportId, institutionId })
      if (!result.ok) return setError(result.error)
      setDone({ status: result.status, institutionName: result.institutionName })
    })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6" noValidate>
      <FieldSet>
        <FieldLegend variant="label">{ADMIN_TEXT.institutionLegend}</FieldLegend>
        {institutions.length === 0 ? (
          <FieldDescription>{ADMIN_TEXT.noInstitutions}</FieldDescription>
        ) : (
          <RadioGroup
            value={institutionId}
            onValueChange={(value) => {
              setInstitutionId(value as string)
              setError(null)
            }}
            disabled={pending}
            className="grid gap-2 md:grid-cols-2"
          >
            {institutions.map((institution) => (
              <FieldLabel key={institution.id} htmlFor={`institution-${institution.id}`}>
                <Field orientation="horizontal" className="min-h-11">
                  <RadioGroupItem value={institution.id} id={`institution-${institution.id}`} />
                  <FieldTitle>{institution.name}</FieldTitle>
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        )}
      </FieldSet>

      {letter && (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">{ADMIN_TEXT.letterTitle}</h3>
          <p className="text-sm text-muted-foreground">{ADMIN_TEXT.letterHint}</p>
          <p className="font-medium wrap-anywhere" data-testid="letter-subject">
            {letter.subject}
          </p>
          <pre
            className="max-h-[32rem] overflow-auto rounded-lg bg-muted p-3 font-sans text-sm wrap-anywhere whitespace-pre-wrap"
            data-testid="letter-body"
          >
            {letter.bodyText}
          </pre>
        </div>
      )}

      {!canSend && <FieldDescription>{ADMIN_TEXT.noPhotos}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}

      <Button
        type="submit"
        className="h-11 self-start"
        disabled={pending || !canSend || institutions.length === 0}
      >
        <Send aria-hidden data-icon="inline-start" />
        {pending ? ADMIN_TEXT.sending : ADMIN_TEXT.send}
      </Button>
    </form>
  )
}
