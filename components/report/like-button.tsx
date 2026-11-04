"use client"

import { Check, Heart, Lock } from "lucide-react"
import { useMemo, useState } from "react"

import { useLiveLikeCounts } from "@/components/report/use-live-like-counts"
import { Button } from "@/components/ui/button"
import { errorMessage, LIKE_LABELS, likeCountText } from "@/lib/constants"
import { likeStateAfterError, type LikeState } from "@/lib/reports/like"
import { createClient } from "@/lib/supabase/client"

// "Podržavam" with the live support count (FR-16, FR-17). A guest gets an anonymous session only
// on the tap (PRD §3), then like_report decides (DB.md §8.3): one support per session, only for
// someone else's open report; officials and administrators never support. The count follows
// Realtime (UPDATE on reports, id=eq.<id>), so a support from another device shows up here.
export function LikeButton({
  reportId,
  initialCount,
  initialState,
}: {
  reportId: string
  initialCount: number
  initialState: LikeState
}) {
  const [state, setState] = useState(initialState)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ownCount, setOwnCount] = useState<number | null>(null)

  const rows = useMemo(
    () => [{ id: reportId, like_count: initialCount }],
    [reportId, initialCount]
  )
  const [live] = useLiveLikeCounts(rows, `id=eq.${reportId}`)
  // supports are never withdrawn in P0, so the larger of the two is the newest
  const count = Math.max(live.like_count, ownCount ?? 0)

  const like = async () => {
    setPending(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        const { error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) {
          console.error(
            "signInAnonymously",
            signInError.code ?? signInError.message
          )
          setError(LIKE_LABELS.sessionFailed)
          return
        }
      }
      const { data, error: rpcError } = await supabase.rpc("like_report", {
        p_report_id: reportId,
      })
      if (rpcError) {
        const next = likeStateAfterError(rpcError.message)
        if (next) setState(next)
        else setError(errorMessage(rpcError))
        return
      }
      const result = data?.[0]
      if (result) setOwnCount(result.like_count)
      setState("liked")
    } finally {
      setPending(false)
    }
  }

  const note =
    state === "own"
      ? LIKE_LABELS.own
      : state === "staff"
        ? LIKE_LABELS.staff
        : null

  return (
    <div className="flex flex-col gap-3" data-testid="like" data-state={state}>
      <p
        className="font-heading text-2xl font-semibold"
        aria-live="polite"
        data-testid="like-count"
      >
        <span className="sr-only">{LIKE_LABELS.countLabel}: </span>
        {likeCountText(count)}
      </p>

      {state === "closed" ? (
        <p
          className="flex items-center gap-2 rounded-lg bg-muted px-3 py-3 font-medium"
          data-testid="like-closed"
        >
          <Lock aria-hidden className="size-4 shrink-0" />
          {LIKE_LABELS.closed}
        </p>
      ) : state === "liked" ? (
        <Button
          size="lg"
          variant="secondary"
          className="h-12 w-full text-base"
          disabled
        >
          <Check aria-hidden />
          {LIKE_LABELS.done}
        </Button>
      ) : (
        <Button
          size="lg"
          className="h-12 w-full text-base"
          disabled={state !== "can_like" || pending}
          onClick={() => void like()}
        >
          <Heart aria-hidden />
          {pending ? LIKE_LABELS.liking : LIKE_LABELS.button}
        </Button>
      )}

      {note && <p className="text-sm text-muted-foreground">{note}</p>}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
