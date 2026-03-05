import { createFileRoute } from '@tanstack/react-router'

import WorkspaceNpcsPage from '@/features/session-workspace/npcs-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/npcs')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <WorkspaceNpcsPage campaignId={campaignId} />
}
