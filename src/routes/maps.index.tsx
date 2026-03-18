import { createFileRoute } from '@tanstack/react-router'

import { MapLibraryPage } from '@/features/maps/page'

export const Route = createFileRoute('/maps/')({
  component: MapLibraryPage,
})
