import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import WorkspaceLocationsPage from '@/features/session-workspace/locations-page'
import { createEmptyState } from '@/features/core/migrations'
import { resetRepositoryStateForTests } from '@/features/core/repository'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

describe('Workspace locations page module', () => {
  beforeEach(() => {
    const state = createEmptyState()
    const now = new Date().toISOString()
    state.campaigns = [
      {
        id: 'campaign-1',
        campaignId: 'campaign-1',
        name: 'Test Campaign',
        description: '',
        rpgSystem: 'dnd-5e',
        createdAt: now,
        updatedAt: now,
        tags: [],
      },
    ]
    state.maps = [
      {
        id: 'map-1',
        campaignId: 'campaign-1',
        kind: 'world',
        name: 'Greenhollow March',
        region: 'Provincial',
        description: '1 hex = 1 mile',
        imageUrl: '',
        usedNpcIds: [],
        linkedPinIds: [],
        usedInStory: true,
        createdAt: now,
        updatedAt: now,
        tags: ['provincial'],
      },
    ]
    state.mapDocuments = [
      {
        id: 'doc-1',
        campaignId: 'campaign-1',
        kind: 'world',
        summaryMapId: 'map-1',
        name: 'Greenhollow March',
        regionName: 'Greenhollow March',
        scale: 'provincial',
        hexSizeMiles: 1,
        width: 4,
        height: 4,
        seed: 1,
        parentMapId: null,
        parentHexId: null,
        childMapIdsByHex: {},
        hexes: [
          {
            id: 'hex-0-0',
            q: 0,
            r: 0,
            terrain: 'plains',
            elevation: 0.1,
            climate: 'temperate',
            travelDifficulty: 1,
            notes: '',
            tags: [],
            resource: null,
          },
        ],
        labels: [],
        features: [
          {
            id: 'feature-1',
            kind: 'location-pin',
            label: 'Greenhollow',
            hexId: 'hex-1',
            linkedNpcIds: [],
            linkedPinIds: [],
            linkedMapDocumentId: null,
            notes: 'Village',
          },
        ],
        generationSettings: {
          biomeBias: 'temperate',
          coastlineMode: 'inland',
          terrainRoughness: 0.3,
          riverDensity: 0.3,
          forestDensity: 0.4,
          swampDensity: 0.1,
          desertDensity: 0,
          settlementDensity: 0.5,
          civilizationAge: 'frontier',
          fantasyIntensity: 0.1,
        },
        cultureSummary: 'River village',
        createdAt: now,
        updatedAt: now,
        tags: ['provincial'],
      },
    ]
    resetRepositoryStateForTests(state)
  })

  it('renders map scale and notable features instead of fake room structures', () => {
    const markup = renderToStaticMarkup(
      createElement(WorkspaceLocationsPage, { campaignId: 'campaign-1' }),
    )

    expect(markup).toContain('Hex Map Builder')
    expect(markup).toContain('Map Hierarchy')
    expect(markup).toContain('World')
    expect(markup).toContain('Session')
    expect(markup).toContain('Map Inspector')
    expect(markup).toContain('Greenhollow March')
    expect(markup).not.toContain('Open Location Database')
  })
})
