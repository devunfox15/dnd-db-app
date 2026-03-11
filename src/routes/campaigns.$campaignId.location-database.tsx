import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/$campaignId/location-database')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground">
      <p className="text-sm">Map builder coming soon.</p>
    </div>
  )
}
