import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import FeaturePage from '@/features/map-builder/page'

export const Route = createFileRoute('/campaigns/map-builder')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="Map Builder">
      <FeaturePage />
    </DmAppLayout>
  )
}
