import { createFileRoute } from '@tanstack/react-router'

import WorkspacePlayerDetailPage from '@/features/session-workspace/player-detail-page'

export const Route = createFileRoute(
  '/campaigns/$campaignId/workspace/player-characters/$playerCharacterId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId, playerCharacterId } = Route.useParams()
  return (
    <WorkspacePlayerDetailPage
      campaignId={campaignId}
      playerCharacterId={playerCharacterId}
    />
  )
}
