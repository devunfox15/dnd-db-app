import type { EntityId } from '@/features/core/types'

import type {
  MapBuilderSelectionState,
  ResolvedMapDocument,
} from './types'

export function normalizeSelectionState(
  current: MapBuilderSelectionState,
  selectedDocument: ResolvedMapDocument,
  linkedSessionIds: EntityId[],
): MapBuilderSelectionState {
  const nextSelectedHexId = selectedDocument.hexes.some(
    (hex) => hex.id === current.selectedHexId,
  )
    ? current.selectedHexId
    : null

  const nextSelectedFeatureId = selectedDocument.features.some(
    (feature) => feature.id === current.selectedFeatureId,
  )
    ? current.selectedFeatureId
    : null

  const nextLinkedSessionDocumentId =
    current.linkedSessionDocumentId &&
    linkedSessionIds.includes(current.linkedSessionDocumentId)
      ? current.linkedSessionDocumentId
      : (linkedSessionIds[0] ?? null)

  if (
    nextSelectedHexId === current.selectedHexId &&
    nextSelectedFeatureId === current.selectedFeatureId &&
    nextLinkedSessionDocumentId === current.linkedSessionDocumentId
  ) {
    return current
  }

  return {
    ...current,
    selectedHexId: nextSelectedHexId,
    selectedFeatureId: nextSelectedFeatureId,
    linkedSessionDocumentId: nextLinkedSessionDocumentId,
  }
}
