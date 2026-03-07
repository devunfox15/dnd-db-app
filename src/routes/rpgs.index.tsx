import { createFileRoute } from '@tanstack/react-router'

import { RpgLibraryPage } from '@/features/rpg-library/page'

export const Route = createFileRoute('/rpgs/')({
  component: RpgLibraryPage,
})
