import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants"

// Placeholder until the public map (#7).
export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-2 p-4">
      <h1 className="font-heading text-2xl font-semibold">{APP_NAME}</h1>
      <p className="text-muted-foreground">{APP_DESCRIPTION}</p>
    </main>
  )
}
