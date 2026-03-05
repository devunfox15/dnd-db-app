import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import FeaturePage from '@/features/dnd-lookup/page'

export const Route = createFileRoute('/rpgs')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="RPGs">
      <FeaturePage />
    </DmAppLayout>
  )
}
