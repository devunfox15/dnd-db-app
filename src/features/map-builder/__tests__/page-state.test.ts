import { describe, expect, it } from 'vitest'

import { normalizeSelectionState } from '@/features/map-builder/page-state'
import type { MapBuilderSelectionState, ResolvedMapDocument } from '@/features/map-builder/types'

function buildDocument(): ResolvedMapDocument {
  const now = new Date().toISOString()

  return {
    id: 'doc-world',
    campaignId: 'campaign-1',
    kind: 'world',
    summaryMapId: 'map-world',
    name: 'Greenhollow March',
    regionName: 'Greenhollow March',
    scale: 'kingdom',
    hexSizeMiles: 6,
    width: 3,
    height: 3,
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
    cultureSummary: 'A rugged borderland.',
    createdAt: now,
    updatedAt: now,
    tags: ['frontier'],
  }
}

describe('normalizeSelectionState', () => {
  it('returns the same object when nothing needs to change', () => {
    const document = buildDocument()
    const current: MapBuilderSelectionState = {
      selectedHexId: 'hex-0-0',
      selectedFeatureId: null,
      draftLabelText: '',
      draftPinName: '',
      selectedTerrain: 'forest',
      linkedSessionDocumentId: null,
    }

    const next = normalizeSelectionState(current, document, [])

    expect(next).toBe(current)
  })

  it('clears stale selections and falls back to the first linked session', () => {
    const document = buildDocument()
    const current: MapBuilderSelectionState = {
      selectedHexId: 'missing-hex',
      selectedFeatureId: 'missing-feature',
      draftLabelText: '',
      draftPinName: '',
      selectedTerrain: 'forest',
      linkedSessionDocumentId: 'missing-session',
    }

    const next = normalizeSelectionState(current, document, ['session-1', 'session-2'])

    expect(next.selectedHexId).toBeNull()
    expect(next.selectedFeatureId).toBeNull()
    expect(next.linkedSessionDocumentId).toBe('session-1')
  })
})
