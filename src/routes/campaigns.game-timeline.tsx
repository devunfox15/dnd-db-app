import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import FeaturePage from '@/features/game-timeline/page'

export const Route = createFileRoute('/campaigns/game-timeline')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="Game Timeline">
      <FeaturePage />
    </DmAppLayout>
  )
}
