import { createFileRoute } from '@tanstack/react-router'
import NewMapBuilderPage from '@/features/new-map-builder/page'

export const Route = createFileRoute('/maps/$mapId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <NewMapBuilderPage />
}
