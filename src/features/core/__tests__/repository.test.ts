import { beforeEach, describe, expect, it } from 'vitest'

import { createEmptyState } from '@/features/core/migrations'
import { appRepository, resetRepositoryStateForTests } from '@/features/core/repository'

const campaignId = 'campaign-test'

function baseState() {
  const state = createEmptyState()
  const now = new Date().toISOString()
  state.campaigns = [
    {
      id: campaignId,
      campaignId,
      name: 'Test Campaign',
      description: '',
      rpgSystem: 'dnd-5e',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
  ]
  state.activeCampaignId = campaignId
  return state
}

describe('appRepository', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(baseState())
  })

  it('creates and updates notes', () => {
    const created = appRepository.create('notes', {
      campaignId,
      title: 'Test note',
      body: 'body',
      area: 'area',
      linkedPinIds: [],
      tags: [],
    })

    expect(created.id).toBeTruthy()

    const updated = appRepository.update('notes', created.id, { title: 'Updated note' })
    expect(updated?.title).toBe('Updated note')
  })

  it('cleans dangling linked references when pin is deleted', () => {
    const pin = appRepository.create('pins', {
      campaignId,
      title: 'Pin',
      summary: 'Pin',
      status: 'active',
      sourceType: 'note',
      sourceId: 'missing-note',
      tags: [],
    })

    const note = appRepository.create('notes', {
      campaignId,
      title: 'Note',
      body: '',
      area: '',
      linkedPinIds: [pin.id],
      tags: [],
    })

    appRepository.delete('pins', pin.id)

    const refreshed = appRepository.list('notes').find((item) => item.id === note.id)
    expect(refreshed?.linkedPinIds).toEqual([])
  })

  it('keeps only one current timeline event', () => {
    appRepository.create('timelineEvents', {
      campaignId,
      title: 'Event 1',
      details: '',
      sessionNumber: 1,
      orderIndex: 1,
      status: 'active',
      isCurrent: true,
      relatedNpcIds: [],
      relatedNoteIds: [],
      tags: [],
    })

    appRepository.create('timelineEvents', {
      campaignId,
      title: 'Event 2',
      details: '',
      sessionNumber: 2,
      orderIndex: 2,
      status: 'planned',
      isCurrent: true,
      relatedNpcIds: [],
      relatedNoteIds: [],
      tags: [],
    })

    const currentEvents = appRepository.list('timelineEvents').filter((item) => item.isCurrent)
    expect(currentEvents).toHaveLength(1)
    expect(currentEvents[0]?.title).toBe('Event 2')
  })

  it('updates active campaign id', () => {
    appRepository.setActiveCampaign(campaignId)
    expect(appRepository.getActiveCampaignId()).toBe(campaignId)
  })

  it('deletes campaign with cascading related entities', () => {
    appRepository.create('notes', {
      campaignId,
      title: 'Note',
      body: '',
      area: '',
      linkedPinIds: [],
      tags: [],
    })
    appRepository.create('pins', {
      campaignId,
      title: 'Pin',
      summary: 'Summary',
      status: 'active',
      sourceType: 'note',
      sourceId: '',
      tags: [],
    })
    appRepository.create('maps', {
      campaignId,
      kind: 'world',
      name: 'Map',
      region: '',
      description: '',
      imageUrl: '',
      usedNpcIds: [],
      linkedPinIds: [],
      usedInStory: false,
      tags: [],
    })

    const deleted = appRepository.deleteCampaignCascade(campaignId)
    expect(deleted).toBe(true)

    const state = appRepository.getState()
    expect(state.campaigns).toHaveLength(0)
    expect(state.notes).toHaveLength(0)
    expect(state.pins).toHaveLength(0)
    expect(state.maps).toHaveLength(0)
    expect(state.activeCampaignId).toBeNull()
  })

  it('cleans linked session map references from world pins when a child map document is deleted', () => {
    const worldMap = appRepository.create('maps', {
      campaignId,
      kind: 'world',
      name: 'World Map',
      region: 'Frontier',
      description: '',
      imageUrl: '',
      usedNpcIds: [],
      linkedPinIds: [],
      usedInStory: true,
      tags: [],
    })
    const sessionMap = appRepository.create('maps', {
      campaignId,
      kind: 'session',
      name: 'Ruined Tower',
      region: 'Tower',
      description: '',
      imageUrl: '',
      usedNpcIds: [],
      linkedPinIds: [],
      usedInStory: true,
      tags: [],
    })

    appRepository.create('mapDocuments', {
      id: 'world-doc',
      campaignId,
      kind: 'world',
      summaryMapId: worldMap.id,
      name: 'World Map',
      regionName: 'Frontier',
      scale: 'kingdom',
      hexSizeMiles: 6,
      width: 3,
      height: 3,
      seed: 1,
      parentMapId: null,
      parentHexId: null,
      childMapIdsByHex: { 'hex-0-0': 'session-doc' },
      hexes: [],
      labels: [],
      features: [
        {
          id: 'feature-1',
          kind: 'location-pin',
          label: 'Ruined Tower',
          hexId: 'hex-0-0',
          linkedNpcIds: [],
          linkedPinIds: [],
          linkedMapDocumentId: 'session-doc',
          notes: '',
        },
      ],
      generationSettings: {
        biomeBias: 'temperate',
        coastlineMode: 'inland',
        terrainRoughness: 0.3,
        riverDensity: 0.2,
        forestDensity: 0.4,
        swampDensity: 0.1,
        desertDensity: 0,
        settlementDensity: 0.4,
        civilizationAge: 'frontier',
        fantasyIntensity: 0.1,
      },
      cultureSummary: '',
      tags: [],
    })

    appRepository.create('mapDocuments', {
      id: 'session-doc',
      campaignId,
      kind: 'session',
      summaryMapId: sessionMap.id,
      name: 'Ruined Tower',
      regionName: 'Tower',
      scale: 'provincial',
      hexSizeMiles: 1,
      width: 3,
      height: 3,
      seed: 2,
      parentMapId: 'world-doc',
      parentHexId: 'hex-0-0',
      childMapIdsByHex: {},
      hexes: [],
      labels: [],
      features: [],
      generationSettings: {
        biomeBias: 'temperate',
        coastlineMode: 'inland',
        terrainRoughness: 0.3,
        riverDensity: 0.2,
        forestDensity: 0.4,
        swampDensity: 0.1,
        desertDensity: 0,
        settlementDensity: 0.4,
        civilizationAge: 'frontier',
        fantasyIntensity: 0.1,
      },
      cultureSummary: '',
      tags: [],
    })

    appRepository.delete('mapDocuments', 'session-doc')

    const refreshed = appRepository.list('mapDocuments').find((entry) => entry.id === 'world-doc')
    expect(refreshed?.childMapIdsByHex).toEqual({})
    expect(refreshed?.features[0]?.linkedMapDocumentId).toBeNull()
  })
})
