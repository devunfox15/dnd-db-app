import { createFileRoute } from '@tanstack/react-router'

import WorkspacePlayerPage from '@/features/session-workspace/player-page'

export const Route = createFileRoute(
  '/campaigns/$campaignId/workspace/player-characters/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <WorkspacePlayerPage campaignId={campaignId} />
}
