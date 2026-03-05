import { createFileRoute } from '@tanstack/react-router'

import SceneNotesWorkspacePage from '@/features/session-workspace/scene-notes-page'

export const Route = createFileRoute('/campaigns/$campaignId/workspace/scene-notes')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <SceneNotesWorkspacePage campaignId={campaignId} />
}
