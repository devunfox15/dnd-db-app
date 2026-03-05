import { createFileRoute } from '@tanstack/react-router'

import WorkspaceSecretsPage from '@/features/session-workspace/secrets-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/secrets')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <WorkspaceSecretsPage campaignId={campaignId} />
}
