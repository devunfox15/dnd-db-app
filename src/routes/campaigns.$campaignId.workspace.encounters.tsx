import { createFileRoute } from '@tanstack/react-router'

import WorkspaceEncountersPage from '@/features/session-workspace/encounters-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/encounters')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <WorkspaceEncountersPage campaignId={campaignId} />
}
