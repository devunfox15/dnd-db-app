import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'

import { MapCanvas } from '@/features/map-builder/components/map-canvas'
import { MapInspector } from '@/features/map-builder/components/map-inspector'
import {
  addLabelToHex,
  createMapScaffold,
  createLocationPin,
  eraseHexContent,
  expandHexGrid,
  paintHexTerrain,
  removeHexFromGrid,
} from '@/features/map-builder/document-actions'
import MapBuilderPage from '@/features/map-builder/page'
import { createEmptyState } from '@/features/core/migrations'
import { resetRepositoryStateForTests } from '@/features/core/repository'

function buildMapState() {
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
  state.activeCampaignId = 'campaign-1'
  state.maps = [
    {
      id: 'map-world',
      campaignId: 'campaign-1',
      kind: 'world',
      name: 'Greenhollow March',
      region: 'Marches',
      description: 'World overview',
      imageUrl: '',
      usedNpcIds: [],
      linkedPinIds: [],
      usedInStory: true,
      createdAt: now,
      updatedAt: now,
      tags: ['frontier'],
    },
    {
      id: 'map-session',
      campaignId: 'campaign-1',
      kind: 'session',
      name: 'Ruined Tower',
      region: 'Tower',
      description: 'Session site',
      imageUrl: '',
      usedNpcIds: [],
      linkedPinIds: [],
      usedInStory: true,
      createdAt: now,
      updatedAt: now,
      tags: ['dungeon'],
    },
  ]
  state.mapDocuments = [
    {
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
      childMapIdsByHex: { 'hex-0-0': 'doc-session' },
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
        {
          id: 'hex-1-0',
          q: 1,
          r: 0,
          terrain: 'forest',
          elevation: 0.2,
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
          label: 'Ruined Tower',
          hexId: 'hex-0-0',
          linkedNpcIds: [],
          linkedPinIds: [],
          linkedMapDocumentId: 'doc-session',
          notes: 'Entrance to the tower',
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
      cultureSummary: 'A rugged borderland.',
      createdAt: now,
      updatedAt: now,
      tags: ['frontier'],
    },
    {
      id: 'doc-session',
      campaignId: 'campaign-1',
      kind: 'session',
      summaryMapId: 'map-session',
      name: 'Ruined Tower',
      regionName: 'Tower Grounds',
      scale: 'provincial',
      hexSizeMiles: 1,
      width: 3,
      height: 3,
      seed: 2,
      parentMapId: 'doc-world',
      parentHexId: 'hex-0-0',
      childMapIdsByHex: {},
      hexes: [
        {
          id: 'hex-s-0-0',
          q: 0,
          r: 0,
          terrain: 'hills',
          elevation: 0.2,
          climate: 'temperate',
          travelDifficulty: 2,
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
      cultureSummary: 'A crumbling watchtower and its grounds.',
      createdAt: now,
      updatedAt: now,
      tags: ['dungeon'],
    },
  ]

  return state
}

function buildEmptyCampaignState() {
  const state = createEmptyState()
  const now = new Date().toISOString()
  state.campaigns = [
    {
      id: 'campaign-1',
      campaignId: 'campaign-1',
      name: 'Empty Campaign',
      description: '',
      rpgSystem: 'dnd-5e',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
  ]
  state.activeCampaignId = 'campaign-1'
  return state
}

describe('MapBuilderPage', () => {
  beforeEach(() => {
    resetRepositoryStateForTests(buildMapState())
  })

  it('renders the document-driven builder shell', () => {
    const markup = renderToStaticMarkup(
      <MapBuilderPage campaignId="campaign-1" initialMode="world" />,
    )

    expect(markup).toContain('Hex Map Builder')
    expect(markup).toContain('Map Inspector')
    expect(markup).toContain('Pan Tool')
    expect(markup).toContain('Expand Tool')
    expect(markup).toContain('Carve Tool')
    expect(markup).toContain('data-testid="map-canvas"')
  })

  it('renders the linked-session quick view inside the inspector', () => {
    const state = buildMapState()
    const document = state.mapDocuments[0]
    const sessionDocument = state.mapDocuments[1]
    const summaryMap = state.maps[0]
    const markup = renderToStaticMarkup(
      <MapInspector
        activeTool="pin"
        currentDocument={document}
        draftLabelText=""
        draftPinName="Bandit Camp"
        linkedDocument={sessionDocument}
        linkedSessionDocumentId={sessionDocument.id}
        selectedFeature={document.features[0] ?? null}
        selectedTerrain="forest"
        sessionCandidates={[sessionDocument]}
        summaryMap={summaryMap}
        onDescriptionChange={() => {}}
        onDraftLabelTextChange={() => {}}
        onDraftPinNameChange={() => {}}
        onLinkedSessionChange={() => {}}
        onMapNameChange={() => {}}
        onOpenLinkedSession={() => {}}
        onTerrainChange={() => {}}
      />,
    )

    expect(markup).toContain('Map Inspector')
    expect(markup).toContain('Linked Session')
    expect(markup).toContain('Open Session')
    expect(markup).toContain('Ruined Tower')
  })

  it('updates terrain, labels, pins, and erase patches through document actions', () => {
    const document = buildMapState().mapDocuments[0]
    const terrainPatch = paintHexTerrain(document, 'hex-0-0', 'mountains')
    const labelPatch = addLabelToHex(document, 'hex-0-0', 'North Gate', 'label-1')
    const pinPatch = createLocationPin({
      document,
      hexId: 'hex-0-0',
      id: 'feature-2',
      linkedMapDocumentId: 'doc-session',
      name: 'Bandit Camp',
    })
    const erasePatch = eraseHexContent(document, 'hex-0-0')

    expect(terrainPatch.hexes[0]?.terrain).toBe('mountains')
    expect(labelPatch.labels[0]?.text).toBe('North Gate')
    expect(pinPatch.feature.linkedMapDocumentId).toBe('doc-session')
    expect(erasePatch.hexes[0]?.terrain).toBe('plains')
    expect(erasePatch.features).toHaveLength(0)
  })

  it('adds adjacent hexes through the expand action', () => {
    const document = buildMapState().mapDocuments[0]
    const patch = expandHexGrid(document, { q: 0, r: 1 }, 'hills')

    expect(patch).not.toBeNull()
    expect(patch?.hexes.some((hex) => hex.q === 0 && hex.r === 1)).toBe(true)
    expect(patch?.hexes.find((hex) => hex.q === 0 && hex.r === 1)?.terrain).toBe(
      'hills',
    )
  })

  it('ignores non-adjacent or duplicate expansion targets', () => {
    const document = buildMapState().mapDocuments[0]

    expect(expandHexGrid(document, { q: 5, r: 5 }, 'hills')).toBeNull()
    expect(expandHexGrid(document, { q: 0, r: 0 }, 'hills')).toBeNull()
  })

  it('removes filled hexes and their linked content through the carve action', () => {
    const document = buildMapState().mapDocuments[0]
    const patch = removeHexFromGrid(document, 'hex-0-0')

    expect(patch).not.toBeNull()
    expect(patch?.hexes.some((hex) => hex.id === 'hex-0-0')).toBe(false)
    expect(patch?.features).toHaveLength(0)
    expect(patch?.childMapIdsByHex['hex-0-0']).toBeUndefined()
  })

  it('does not remove the last remaining hex', () => {
    const document = buildMapState().mapDocuments[1]

    expect(removeHexFromGrid(document, 'hex-s-0-0')).toBeNull()
  })

  it('renders a document-driven map canvas shell', () => {
    const document = buildMapState().mapDocuments[0]
    const markup = renderToStaticMarkup(
      <MapCanvas
        activeTool="label"
        currentDocument={document}
        draftLabelText=""
        draftPinName=""
        linkedSessionDocumentId={null}
        selectedFeatureId={null}
        selectedHexId={null}
        selectedTerrain="forest"
        onAddLabel={() => {}}
        onAddPin={() => {}}
        onEraseHex={() => {}}
        onExpandHex={() => {}}
        onFeatureSelect={() => {}}
        onHexSelect={() => {}}
        onRemoveHex={() => {}}
        onPaintHex={() => {}}
      />,
    )

    expect(markup).toContain('data-testid="map-canvas"')
    expect(markup).toContain('forest')
    expect(markup).toContain('kingdom')
  })

  it('renders create actions for campaigns that do not have any maps yet', () => {
    resetRepositoryStateForTests(buildEmptyCampaignState())

    const markup = renderToStaticMarkup(
      <MapBuilderPage campaignId="campaign-1" initialMode="world" />,
    )

    expect(markup).toContain('Create World Map')
    expect(markup).toContain('Create Session Map')
  })

  it('creates sensible world and session map scaffolds for new campaigns', () => {
    const worldScaffold = createMapScaffold('campaign-1', 'world')
    const sessionScaffold = createMapScaffold('campaign-1', 'session')

    expect(worldScaffold.map.kind).toBe('world')
    expect(worldScaffold.document.kind).toBe('world')
    expect(worldScaffold.document.hexes.length).toBeGreaterThan(0)
    expect(sessionScaffold.map.kind).toBe('session')
    expect(sessionScaffold.document.kind).toBe('session')
    expect(sessionScaffold.document.width).toBeLessThanOrEqual(
      worldScaffold.document.width,
    )
  })
})
