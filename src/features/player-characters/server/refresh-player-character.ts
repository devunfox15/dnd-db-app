import { createServerFn } from '@tanstack/react-start'

import { mapDndBeyondCharacter, requestDndBeyondCharacter } from '@/features/player-characters/server/import-service'
import type { RefreshPlayerCharacterInput } from '@/features/player-characters/types'

export const refreshPlayerCharacter = createServerFn({ method: 'POST' })
  .inputValidator((input: RefreshPlayerCharacterInput) => input)
  .handler(async ({ data }) => {
    const payload = await requestDndBeyondCharacter(data.dndBeyondCharacterId)
    return {
      playerCharacterId: data.playerCharacterId,
      character: mapDndBeyondCharacter({
        campaignId: data.campaignId,
        sourceUrl: data.sourceUrl,
        payload,
      }),
    }
  })
