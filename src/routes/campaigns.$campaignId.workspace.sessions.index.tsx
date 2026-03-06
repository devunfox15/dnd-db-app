import { createFileRoute } from '@tanstack/react-router'

import SessionsPage from '@/features/session-workspace/sessions-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/sessions/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <SessionsPage campaignId={campaignId} />
}
