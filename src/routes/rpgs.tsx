import { createFileRoute, Outlet, useLocation } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'

export const Route = createFileRoute('/rpgs')({
  component: RouteComponent,
})

const RPG_LABELS: Record<string, string> = {
  '/rpgs/dnd': 'Dungeons & Dragons 5E',
}

function RouteComponent() {
  const location = useLocation()
  const subLabel = RPG_LABELS[location.pathname]

  const breadcrumbItems = subLabel
    ? [{ label: 'RPG Library', href: '/rpgs' }, { label: subLabel }]
    : [{ label: 'RPG Library' }]

  return (
    <DmAppLayout pageTitle="RPG Library" breadcrumbItems={breadcrumbItems}>
      <Outlet />
    </DmAppLayout>
  )
}
