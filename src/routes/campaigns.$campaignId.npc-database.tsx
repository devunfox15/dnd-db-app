import { createFileRoute } from '@tanstack/react-router'

import NpcCharactersPage from '@/features/npc-characters/page'

export const Route = createFileRoute('/campaigns/$campaignId/npc-database')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <NpcCharactersPage campaignIdOverride={campaignId} />
}
