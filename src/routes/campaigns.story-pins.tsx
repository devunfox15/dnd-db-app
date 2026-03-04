import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import FeaturePage from '@/features/story-pins/page'

export const Route = createFileRoute('/campaigns/story-pins')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="Story Pins">
      <FeaturePage />
    </DmAppLayout>
  )
}
