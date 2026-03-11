import { Navigate, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/campaigns/$campaignId/location-database')({
  component: RouteComponent,
})

export function RouteComponent() {
  const { campaignId } = Route.useParams()
  return (
    <Navigate
      to="/campaigns/$campaignId/workspace/locations"
      params={{ campaignId }}
      replace
    />
  )
}
