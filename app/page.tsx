import { HomeView } from "@/components/home/home-view"
import { getPublicMapReports } from "@/lib/reports/public-map"

// Public map `/` (FR-14); read per request with the visitor's session.
export default async function Page() {
  const { reports, failed } = await getPublicMapReports()
  return <HomeView reports={reports} failed={failed} />
}
