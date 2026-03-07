import { createFileRoute } from '@tanstack/react-router'

import { DndReferencePage } from '@/features/rpg-library/dnd-page'

export const Route = createFileRoute('/rpgs/dnd')({
  component: DndReferencePage,
})
