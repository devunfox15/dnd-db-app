import { createServerFn } from '@tanstack/react-start'

import { extractDndBeyondCharacterId, mapDndBeyondCharacter, requestDndBeyondCharacter } from '@/features/player-characters/server/import-service'
import type { ImportPlayerCharacterInput } from '@/features/player-characters/types'

export const importPlayerCharacter = createServerFn({ method: 'POST' })
  .inputValidator((input: ImportPlayerCharacterInput) => input)
  .handler(async ({ data }) => {
    const dndBeyondCharacterId = extractDndBeyondCharacterId(data.url)
    const payload = await requestDndBeyondCharacter(dndBeyondCharacterId)
    return mapDndBeyondCharacter({
      campaignId: data.campaignId,
      sourceUrl: data.url,
      payload,
    })
  })
