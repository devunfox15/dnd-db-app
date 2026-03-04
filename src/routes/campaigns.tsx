import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import FeaturePage from '@/features/campaigns/page'

export const Route = createFileRoute('/campaigns')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="Campaigns">
      <FeaturePage />
    </DmAppLayout>
  )
}
