import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { appRepository, useAppState } from '@/features/core/store'
import GameTimelinePage from '@/features/game-timeline/page'
import MapBuilderPage from '@/features/map-builder/page'
import NpcCharactersPage from '@/features/npc-characters/page'
import StoryPinsPage from '@/features/story-pins/page'

const campaignSections = [
  { id: 'npc-characters', label: 'NPC Characters' },
  { id: 'game-timeline', label: 'Game Timeline' },
  { id: 'map-builder', label: 'Map Builder' },
  { id: 'story-pins', label: 'Story Pins' },
] as const

type CampaignSectionId = (typeof campaignSections)[number]['id']

export const Route = createFileRoute('/campaigns/$campaignId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { campaignId } = Route.useParams()
  const state = useAppState()
  const campaign = useMemo(
    () => state.campaigns.find((item) => item.id === campaignId) ?? null,
    [campaignId, state.campaigns],
  )
  const [activeSection, setActiveSection] =
    useState<CampaignSectionId>('npc-characters')

  useEffect(() => {
    if (campaign && state.activeCampaignId !== campaign.id) {
      appRepository.setActiveCampaign(campaign.id)
    }
  }, [campaign?.id, state.activeCampaignId])

  let sectionComponent: ReactNode
  switch (activeSection) {
    case 'npc-characters':
      sectionComponent = <NpcCharactersPage campaignIdOverride={campaignId} />
      break
    case 'game-timeline':
      sectionComponent = <GameTimelinePage campaignIdOverride={campaignId} />
      break
    case 'map-builder':
      sectionComponent = <MapBuilderPage campaignIdOverride={campaignId} />
      break
    case 'story-pins':
      sectionComponent = <StoryPinsPage campaignIdOverride={campaignId} />
      break
    default:
      sectionComponent = <NpcCharactersPage campaignIdOverride={campaignId} />
      break
  }

  if (!campaign) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campaign Not Found</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>No campaign exists with ID: {campaignId}</p>
          <div>
            <a className="underline underline-offset-2" href="/campaigns">
              Back to campaigns dashboard
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap gap-2">
        {campaignSections.map((section) => (
          <Button
            key={section.id}
            variant={activeSection === section.id ? 'default' : 'outline'}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </div>
      <div className="w-full rounded border">{sectionComponent}</div>
    </div>
  )
}
