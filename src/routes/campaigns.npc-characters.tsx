import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import FeaturePage from '@/features/npc-characters/page'

export const Route = createFileRoute('/campaigns/npc-characters')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="NPC Characters">
      <FeaturePage />
    </DmAppLayout>
  )
}
