import MapBuilderPage from '@/features/map-builder/page'

export default function WorkspaceLocationsPage({
  campaignId,
}: {
  campaignId: string
}) {
  return <MapBuilderPage campaignId={campaignId} initialMode="session" />
}
