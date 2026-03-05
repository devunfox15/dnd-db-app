import { createFileRoute } from '@tanstack/react-router'

import WorkspaceLocationsPage from '@/features/session-workspace/locations-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/locations')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <WorkspaceLocationsPage campaignId={campaignId} />
}
