// Photos of the public report page (PRD §6 "Privatnost"): a hidden photo keeps its place and is
// replaced by a note; only visible photos have a (signed) URL. Pure, so it is tested without a database.
export type PublicPhoto = { position: number } & (
  { hidden: true } | { hidden: false; url: string | null }
)

export function publicPhotos(
  // rows the visitor's own query returned with hidden_at is null
  visible: { storage_path: string; position: number }[],
  // positions of hidden photos (never their paths)
  hiddenPositions: number[],
  signedUrls: ReadonlyMap<string, string>
): PublicPhoto[] {
  const hidden = new Set(hiddenPositions)
  return [
    ...visible
      .filter((p) => !hidden.has(p.position))
      .map((p) => ({
        position: p.position,
        hidden: false as const,
        url: signedUrls.get(p.storage_path) ?? null,
      })),
    ...[...hidden].map((position) => ({ position, hidden: true as const })),
  ].sort((a, b) => a.position - b.position)
}
