import { createFileRoute } from '@tanstack/react-router'

import { DmAppLayout } from '@/components/layout/dm-app-layout'
import HomePage from '@/features/home/page'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DmAppLayout pageTitle="Home">
      <HomePage />
    </DmAppLayout>
  )
}
