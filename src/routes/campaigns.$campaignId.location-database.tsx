import { createFileRoute } from '@tanstack/react-router'

import MapBuilderPage from '@/features/map-builder/page'

export const Route = createFileRoute('/campaigns/$campaignId/location-database')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  return <MapBuilderPage campaignIdOverride={campaignId} />
}
