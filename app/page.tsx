import { HomeView } from "@/components/home/home-view"
import type { LaptopLayout } from "@/components/home/laptop-layouts"
import { getPublicMapReports } from "@/lib/reports/public-map"

// `?izgled=a|b|c` picks one of the candidate laptop layouts (ticket 32); phones ignore it.
function parseLaptopLayout(value: string | string[] | undefined): LaptopLayout {
  return value === "b" || value === "c" ? value : "a"
}

// Public map `/` (FR-14); read per request with the visitor's session.
export default async function Page({ searchParams }: PageProps<"/">) {
  const [{ reports, failed }, { izgled }] = await Promise.all([getPublicMapReports(), searchParams])
  return <HomeView reports={reports} failed={failed} layout={parseLaptopLayout(izgled)} />
}
