"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { cancelReport } from "@/app/prijavi/actions"
import { Button } from "@/components/ui/button"
import { CLASSIFY_TEXT, REPORT_FLOW_TEXT } from "@/lib/constants"

// "Odustani" on every step (FR-5): deletes the draft and its photos (Server Action), then home.
// `draft` resolves with the draft id; while classify still runs it waits for it (at most until
// the client's 15 s limit), so the draft made by the server is not left behind.
export function CancelButton({ draft, photoPaths }: { draft: () => Promise<string | null>; photoPaths: string[] }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cancel = async () => {
    setPending(true)
    setError(null)
    const reportId = await draft()
    const result = await cancelReport({ reportId, photoPaths }).catch(() => null)
    if (result && !result.ok) {
      setPending(false)
      setError(result.error)
      return
    }
    router.push("/")
  }

  return (
    <>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button variant="ghost" className="h-11 w-full" disabled={pending} onClick={() => void cancel()}>
        {pending ? CLASSIFY_TEXT.cancelling : REPORT_FLOW_TEXT.cancel}
      </Button>
    </>
  )
}
