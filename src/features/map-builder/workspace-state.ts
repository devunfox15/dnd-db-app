import type { MapBuilderMode, MapBuilderSelectionState, MapBuilderWorkspaceState } from './types'

export const createMapBuilderWorkspaceState = (
  initialMode: MapBuilderMode,
): MapBuilderWorkspaceState => ({
  selectedMode: initialMode,
  selectedMapDocumentId: null,
  selectedWorldMapDocumentId: null,
  selectedSessionMapDocumentId: null,
  selectedMapId: null,
  selectedRoomByMapId: {},
  selectedTool: 'pan',
})

export const createMapBuilderSelectionState = (): MapBuilderSelectionState => ({
  selectedHexId: null,
  selectedFeatureId: null,
  draftLabelText: '',
  draftPinName: '',
  selectedTerrain: 'forest',
  linkedSessionDocumentId: null,
})
