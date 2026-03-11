import type {
  HexTerrain,
  MapDocument,
  MapFeature,
  MapRecord,
} from '@/features/core/types'

import type { MapBuilderMode, ResolvedMapDocument } from './types'

const buildHexGrid = (
  width: number,
  height: number,
  terrain: HexTerrain,
) =>
  Array.from({ length: width * height }, (_, index) => {
    const q = index % width
    const r = Math.floor(index / width)

    return {
      id: `hex-${q}-${r}`,
      q,
      r,
      terrain,
      elevation: terrain === 'mountains' ? 0.6 : 0.2,
      climate: 'temperate' as const,
      travelDifficulty: terrain === 'mountains' ? 3 : 1,
      notes: '',
      tags: [],
      resource: null,
    }
  })

export const paintHexTerrain = (
  document: ResolvedMapDocument,
  hexId: string,
  terrain: HexTerrain,
): Pick<ResolvedMapDocument, 'hexes'> => ({
  hexes: document.hexes.map((hex) =>
    hex.id === hexId ? { ...hex, terrain } : hex,
  ),
})

export const eraseHexContent = (
  document: ResolvedMapDocument,
  hexId: string,
): Pick<ResolvedMapDocument, 'childMapIdsByHex' | 'features' | 'hexes' | 'labels'> => {
  const nextChildMaps = { ...document.childMapIdsByHex }
  delete nextChildMaps[hexId]

  return {
    childMapIdsByHex: nextChildMaps,
    features: document.features.filter((feature) => feature.hexId !== hexId),
    hexes: document.hexes.map((hex) =>
      hex.id === hexId ? { ...hex, terrain: 'plains' } : hex,
    ),
    labels: document.labels.filter((label) => label.hexId !== hexId),
  }
}

export const addLabelToHex = (
  document: ResolvedMapDocument,
  hexId: string,
  text: string,
  id: string,
): Pick<ResolvedMapDocument, 'labels'> => ({
  labels: [
    ...document.labels,
    {
      id,
      text,
      hexId,
      offsetX: 0,
      offsetY: 0,
    },
  ],
})

export const createLocationPin = ({
  document,
  hexId,
  id,
  linkedMapDocumentId,
  name,
}: {
  document: ResolvedMapDocument
  hexId: string
  id: string
  linkedMapDocumentId: string | null
  name: string
}): {
  feature: MapFeature
  patch: Pick<ResolvedMapDocument, 'childMapIdsByHex' | 'features'>
} => {
  const feature: MapFeature = {
    id,
    kind: 'location-pin',
    label: name,
    hexId,
    linkedNpcIds: [],
    linkedPinIds: [],
    linkedMapDocumentId,
    notes: linkedMapDocumentId ? 'Linked session map pin.' : 'Standalone location pin.',
  }

  return {
    feature,
    patch: {
      childMapIdsByHex:
        linkedMapDocumentId && document.kind === 'world'
          ? {
              ...document.childMapIdsByHex,
              [hexId]: linkedMapDocumentId,
            }
          : document.childMapIdsByHex,
      features: [...document.features, feature],
    },
  }
}

export const createMapScaffold = (
  campaignId: string,
  kind: MapBuilderMode,
): {
  document: MapDocument
  map: MapRecord
} => {
  const idSuffix = Math.random().toString(36).slice(2, 9)
  const mapId = `map-${kind}-${idSuffix}`
  const documentId = `mapdoc-${kind}-${idSuffix}`
  const now = new Date().toISOString()
  const isWorld = kind === 'world'
  const generationSettings: MapDocument['generationSettings'] = {
    biomeBias: 'temperate',
    coastlineMode: isWorld ? 'coastal' : 'inland',
    terrainRoughness: 0.35,
    riverDensity: 0.2,
    forestDensity: 0.35,
    swampDensity: 0.1,
    desertDensity: 0.05,
    settlementDensity: isWorld ? 0.4 : 0.2,
    civilizationAge: 'frontier',
    fantasyIntensity: 0.15,
  }

  return {
    document: {
      id: documentId,
      campaignId,
      kind,
      summaryMapId: mapId,
      name: isWorld ? 'New World Map' : 'New Session Map',
      regionName: isWorld ? 'Untamed Frontier' : 'Session Region',
      scale: isWorld ? ('kingdom' as const) : ('provincial' as const),
      hexSizeMiles: isWorld ? 6 : 1,
      width: isWorld ? 6 : 4,
      height: isWorld ? 5 : 4,
      seed: Date.now(),
      parentMapId: null,
      parentHexId: null,
      childMapIdsByHex: {},
      hexes: buildHexGrid(isWorld ? 6 : 4, isWorld ? 5 : 4, isWorld ? 'plains' : 'hills'),
      labels: [],
      features: [],
      generationSettings,
      cultureSummary: isWorld
        ? 'A blank frontier map ready for continents, nations, and trade roads.'
        : 'A local session map ready for rooms, encounters, and tactical detail.',
      createdAt: now,
      updatedAt: now,
      tags: [kind],
    },
    map: {
      id: mapId,
      campaignId,
      kind,
      name: isWorld ? 'New World Map' : 'New Session Map',
      region: isWorld ? 'Frontier' : 'Local Region',
      description: isWorld
        ? 'A fresh world canvas for broad geography.'
        : 'A fresh session canvas for local detail.',
      imageUrl: '',
      usedNpcIds: [],
      linkedPinIds: [],
      usedInStory: false,
      createdAt: now,
      updatedAt: now,
      tags: [kind],
    },
  }
}
