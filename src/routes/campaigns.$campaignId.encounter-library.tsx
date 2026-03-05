import { createFileRoute } from '@tanstack/react-router'

import EncounterLibraryPage from '@/features/encounter-library/page'

export const Route = createFileRoute('/campaigns/$campaignId/encounter-library')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <EncounterLibraryPage campaignIdOverride={campaignId} />
}
