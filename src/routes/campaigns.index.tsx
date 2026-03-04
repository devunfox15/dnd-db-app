import { createFileRoute } from '@tanstack/react-router'

import FeaturePage from '@/features/campaigns/page'

export const Route = createFileRoute('/campaigns/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FeaturePage />
}
