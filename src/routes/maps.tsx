import { createFileRoute, Outlet } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'

export const Route = createFileRoute('/maps')({
  component: RouteComponent,
})

function RouteComponent() {
  const breadcrumbItems = [{ label: 'Maps' }]

  return (
    <DmAppLayout pageTitle="Maps" breadcrumbItems={breadcrumbItems}>
      <Outlet />
    </DmAppLayout>
  )
}
