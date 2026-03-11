import type {
  EntityId,
  HexTerrain,
  MapDocument,
  MapLabel,
} from '@/features/core/types'

export type MapBuilderMode = 'world' | 'session'

export type MapBuilderTool =
  | 'pan'
  | 'select'
  | 'terrain'
  | 'erase'
  | 'label'
  | 'pin'

export interface MapBuilderProps {
  campaignId: string
  initialMode: MapBuilderMode
  defaultMapDocumentId?: EntityId | null
}

export interface MapBuilderWorkspaceState {
  selectedMode: MapBuilderMode
  selectedMapDocumentId: EntityId | null
  selectedWorldMapDocumentId: EntityId | null
  selectedSessionMapDocumentId: EntityId | null
  selectedMapId: EntityId | null
  selectedRoomByMapId: Record<string, string>
  selectedTool: MapBuilderTool
}

export interface MapBuilderSelectionState {
  selectedHexId: string | null
  selectedFeatureId: string | null
  draftLabelText: string
  draftPinName: string
  selectedTerrain: HexTerrain
  linkedSessionDocumentId: EntityId | null
}

export interface ResolvedMapDocument extends MapDocument {
  labels: MapLabel[]
}
