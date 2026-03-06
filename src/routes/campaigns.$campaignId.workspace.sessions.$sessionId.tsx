import { createFileRoute } from '@tanstack/react-router'

import SessionDetailPage from '@/features/session-workspace/session-detail-page'

export const Route = createFileRoute(
  '/campaigns/$campaignId/workspace/sessions/$sessionId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId, sessionId } = Route.useParams()
  return <SessionDetailPage campaignId={campaignId} sessionId={sessionId} />
}
