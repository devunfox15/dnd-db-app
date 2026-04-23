import { createFileRoute } from '@tanstack/react-router'

import SessionLogListPage from '@/features/session-log/list-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/log')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <SessionLogListPage campaignId={campaignId} />
}
