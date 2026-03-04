import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import FeaturePage from '@/features/dnd-lookup/page'

export const Route = createFileRoute('/rpg-rules')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="RPG Rules">
      <FeaturePage />
    </DmAppLayout>
  )
}
