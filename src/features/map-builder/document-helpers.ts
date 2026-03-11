import type { AppState, MapDocument, MapRecord } from '@/features/core/types'

import type {
  MapBuilderMode,
  MapBuilderWorkspaceState,
  ResolvedMapDocument,
} from './types'

export const getCampaignMaps = (state: AppState, campaignId: string) =>
  state.maps.filter((map) => map.campaignId === campaignId)

export const getCampaignMapDocuments = (state: AppState, campaignId: string) =>
  state.mapDocuments.filter(
    (document): document is ResolvedMapDocument =>
      document.campaignId === campaignId,
  )

export const getDocumentsByMode = (
  documents: ResolvedMapDocument[],
  mode: MapBuilderMode,
) => documents.filter((document) => document.kind === mode)

export const resolveSelectedDocument = ({
  defaultMapDocumentId,
  documents,
  selectedMode,
  workspaceState,
}: {
  defaultMapDocumentId?: string | null
  documents: ResolvedMapDocument[]
  selectedMode: MapBuilderMode
  workspaceState: MapBuilderWorkspaceState
}) => {
  const documentsById = new Map(documents.map((document) => [document.id, document]))
  const preferredId =
    defaultMapDocumentId ??
    workspaceState.selectedMapDocumentId ??
    (selectedMode === 'world'
      ? workspaceState.selectedWorldMapDocumentId
      : workspaceState.selectedSessionMapDocumentId)

  const preferredDocument = preferredId ? documentsById.get(preferredId) : null
  if (preferredDocument) {
    return preferredDocument
  }

  const sameModeDocument = documents.find(
    (document) => document.kind === selectedMode,
  )
  if (sameModeDocument) {
    return sameModeDocument
  }

  return documents[0] ?? null
}

export const getSummaryMap = (
  maps: MapRecord[],
  document: MapDocument | null,
) => {
  if (!document?.summaryMapId) {
    return null
  }

  return maps.find((map) => map.id === document.summaryMapId) ?? null
}

export const getLinkedSessionDocuments = (
  documents: ResolvedMapDocument[],
  currentDocument: ResolvedMapDocument | null,
) => {
  if (!currentDocument) {
    return []
  }

  if (currentDocument.kind === 'session') {
    return documents.filter((document) => document.id === currentDocument.id)
  }

  const linkedIds = new Set(Object.values(currentDocument.childMapIdsByHex))
  return documents.filter(
    (document) =>
      document.kind === 'session' &&
      (linkedIds.has(document.id) || document.parentMapId === currentDocument.id),
  )
}
