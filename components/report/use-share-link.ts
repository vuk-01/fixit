"use client"

import { useState } from "react"

import { SENT_TEXT } from "@/lib/constants"

// "Podijeli" (FR-5 step 7, PRD §8 /p/[code]): the system share sheet where there is one,
// otherwise the link is copied; if copying fails too, the link is shown to copy by hand.
export function useShareLink(path: string, title: string) {
  const [note, setNote] = useState<string | null>(null)

  const share = async () => {
    const url = `${window.location.origin}${path}`
    setNote(null)
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url })
        return
      } catch (error) {
        // the visitor closed the sheet: nothing to do
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      setNote(SENT_TEXT.linkCopied)
    } catch {
      setNote(`${SENT_TEXT.copyLink} ${url}`)
    }
  }

  return { share, note }
}
