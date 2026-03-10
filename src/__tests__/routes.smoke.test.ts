import { describe, expect, it } from 'vitest'

import { Route as HomeRoute } from '@/routes/index'
import { Route as RpgRulesRoute } from '@/routes/rpgs'
import { Route as CampaignsRoute } from '@/routes/campaigns'
import { Route as CampaignByIdRoute } from '@/routes/campaigns.$campaignId'
import { Route as CampaignWorkspaceRoute } from '@/routes/campaigns.$campaignId.workspace'
import { Route as CampaignWorkspacePlayersRoute } from '@/routes/campaigns.$campaignId.workspace.player-characters'

describe('route smoke tests', () => {
  it('exports all DM workspace routes', () => {
    expect(HomeRoute).toBeDefined()
    expect(RpgRulesRoute).toBeDefined()
    expect(CampaignsRoute).toBeDefined()
    expect(CampaignByIdRoute).toBeDefined()
    expect(CampaignWorkspaceRoute).toBeDefined()
    expect(CampaignWorkspacePlayersRoute).toBeDefined()
  })
})
