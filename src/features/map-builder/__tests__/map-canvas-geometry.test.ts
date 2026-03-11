import { describe, expect, it } from 'vitest'

import {
  axialToPixel,
  createViewportForDocument,
  getHexRadiusForDocument,
  getVisibleHexes,
  pixelToAxial,
} from '@/features/map-builder/map-canvas-geometry'
import type { MapDocument } from '@/features/core/types'

const document: MapDocument = {
  id: 'doc-1',
  campaignId: 'campaign-1',
  kind: 'world',
  summaryMapId: null,
  name: 'Geometry Test',
  regionName: 'Geometry Test',
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
      elevation: 0,
      climate: 'temperate',
      travelDifficulty: 1,
      notes: '',
      tags: [],
      resource: null,
    },
    {
      id: 'hex-1-0',
      q: 1,
      r: 0,
      terrain: 'forest',
      elevation: 0,
      climate: 'temperate',
      travelDifficulty: 1,
      notes: '',
      tags: [],
      resource: null,
    },
    {
      id: 'hex-0-1',
      q: 0,
      r: 1,
      terrain: 'hills',
      elevation: 0,
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
    settlementDensity: 0.2,
    civilizationAge: 'frontier',
    fantasyIntensity: 0.1,
  },
  cultureSummary: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
}

describe('map-canvas geometry', () => {
  it('converts axial centers to pixel positions', () => {
    const radius = getHexRadiusForDocument(document)
    const center = axialToPixel({ q: 1, r: 0 }, radius)

    expect(center.x).toBeGreaterThan(radius)
    expect(center.y).toBe(0)
  })

  it('round-trips pixel positions back to the nearest axial hex', () => {
    const radius = getHexRadiusForDocument(document)
    const center = axialToPixel({ q: 1, r: 0 }, radius)

    expect(pixelToAxial(center, radius)).toEqual({ q: 1, r: 0 })
  })

  it('culls visible hexes against the current viewport', () => {
    const radius = getHexRadiusForDocument(document)
    const viewport = createViewportForDocument(document, 1000, 640)
    const visible = getVisibleHexes(document.hexes, viewport, radius, 1000, 640)

    expect(visible.map((hex) => hex.id)).toContain('hex-0-0')
    expect(visible.map((hex) => hex.id)).toContain('hex-1-0')
  })
})
