import { createFileRoute } from '@tanstack/react-router'

import SessionBoardPage from '@/features/session-workspace/session-board-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/session-board')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <SessionBoardPage campaignId={campaignId} />
}
