import DmScreenPage from '@/features/session-workspace/dm-screen-page'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/campaigns/$campaignId/workspace/dm-screen',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <DmScreenPage campaignId={campaignId} />
}
