import { createFileRoute } from '@tanstack/react-router'

import FeaturePage from '@/features/map-builder/page'

export const Route = createFileRoute('/campaigns/map-builder')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FeaturePage />
}
