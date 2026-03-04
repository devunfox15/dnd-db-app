import { describe, expect, it } from 'vitest'

import { Route as HomeRoute } from '@/routes/index'
import { Route as RpgRulesRoute } from '@/routes/rpg-rules'
import { Route as CampaignsRoute } from '@/routes/campaigns'
import { Route as CampaignPinsRoute } from '@/routes/campaigns.story-pins'
import { Route as CampaignMapsRoute } from '@/routes/campaigns.map-builder'
import { Route as CampaignNpcRoute } from '@/routes/campaigns.npc-characters'
import { Route as CampaignTimelineRoute } from '@/routes/campaigns.game-timeline'
import { Route as CampaignByIdRoute } from '@/routes/campaigns.$campaignId'

describe('route smoke tests', () => {
  it('exports all DM workspace routes', () => {
    expect(HomeRoute).toBeDefined()
    expect(RpgRulesRoute).toBeDefined()
    expect(CampaignsRoute).toBeDefined()
    expect(CampaignPinsRoute).toBeDefined()
    expect(CampaignMapsRoute).toBeDefined()
    expect(CampaignNpcRoute).toBeDefined()
    expect(CampaignTimelineRoute).toBeDefined()
    expect(CampaignByIdRoute).toBeDefined()
  })
})
