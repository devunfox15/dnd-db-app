import type {
  EntityId,
  HexTerrain,
  MapFeature,
  MapDocument,
  MapLabel,
} from '@/features/core/types'

export type MapBuilderMode = 'world' | 'session'

export type MapBuilderTool =
  | 'pan'
  | 'select'
  | 'expand'
  | 'carve'
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

export interface MapCanvasProps {
  activeTool: MapBuilderTool
  currentDocument: ResolvedMapDocument
  draftLabelText: string
  draftPinName: string
  linkedSessionDocumentId: EntityId | null
  selectedFeatureId: MapFeature['id'] | null
  selectedHexId: string | null
  selectedTerrain: HexTerrain
  onAddLabel: (hexId: string) => void
  onAddPin: (hexId: string) => void
  onEraseHex: (hexId: string) => void
  onExpandHex: (axial: { q: number; r: number }) => void
  onFeatureSelect: (featureId: string | null) => void
  onHexSelect: (hexId: string | null) => void
  onPaintHex: (hexId: string) => void
  onRemoveHex: (hexId: string) => void
}
