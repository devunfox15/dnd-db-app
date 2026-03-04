import { createFileRoute } from '@tanstack/react-router'

import FeaturePage from '@/features/npc-characters/page'

export const Route = createFileRoute('/campaigns/npc-characters')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FeaturePage />
}
