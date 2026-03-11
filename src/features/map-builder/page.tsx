import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { appRepository, useAppState } from '@/features/core/store'

import { useCampaignStorageState } from '@/features/session-workspace/storage'

import {
  addLabelToHex,
  createLocationPin,
  createMapScaffold,
  eraseHexContent,
  expandHexGrid,
  paintHexTerrain,
  removeHexFromGrid,
} from './document-actions'
import {
  getCampaignMapDocuments,
  getCampaignMaps,
  getLinkedSessionDocuments,
  getSummaryMap,
  resolveSelectedDocument,
} from './document-helpers'
import { MapCanvas } from './components/map-canvas'
import { MapInspector } from './components/map-inspector'
import { ToolPalette } from './components/tool-palette'
import type {
  MapBuilderMode,
  MapBuilderProps,
  ResolvedMapDocument,
} from './types'
import {
  createMapBuilderSelectionState,
  createMapBuilderWorkspaceState,
} from './workspace-state'
import { normalizeSelectionState } from './page-state'

function createLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export default function MapBuilderPage({
  campaignId,
  initialMode,
  defaultMapDocumentId = null,
}: MapBuilderProps) {
  const appState = useAppState()
  const maps = useMemo(
    () => getCampaignMaps(appState, campaignId),
    [appState, campaignId],
  )
  const documents = useMemo(
    () => getCampaignMapDocuments(appState, campaignId),
    [appState, campaignId],
  )
  const [workspaceState, setWorkspaceState] = useCampaignStorageState(
    campaignId,
    'workspace-locations',
    createMapBuilderWorkspaceState(initialMode),
  )
  const [selectionState, setSelectionState] = useState(
    createMapBuilderSelectionState,
  )
  const syncedModeRef = useRef(initialMode)

  useEffect(() => {
    if (syncedModeRef.current === initialMode) {
      return
    }

    syncedModeRef.current = initialMode
    setWorkspaceState((current) => ({
      ...current,
      selectedMode: initialMode,
    }))
  }, [initialMode, setWorkspaceState])

  const selectedMode = workspaceState.selectedMode
  const selectedDocument = resolveSelectedDocument({
    defaultMapDocumentId,
    documents,
    selectedMode,
    workspaceState,
  })
  const summaryMap = getSummaryMap(maps, selectedDocument)
  const selectedFeature =
    selectedDocument?.features.find(
      (feature) => feature.id === selectionState.selectedFeatureId,
    ) ?? null
  const linkedDocument = selectedFeature?.linkedMapDocumentId
    ? (documents.find(
        (document) => document.id === selectedFeature.linkedMapDocumentId,
      ) ?? null)
    : null
  const linkedSessions = useMemo(
    () => getLinkedSessionDocuments(documents, selectedDocument),
    [documents, selectedDocument],
  )

  const rememberDocument = (
    document: ResolvedMapDocument,
    nextMode = selectedMode,
  ) => {
    setWorkspaceState((current) => ({
      ...current,
      selectedMode: nextMode,
      selectedMapDocumentId: document.id,
      selectedMapId: document.summaryMapId,
      selectedWorldMapDocumentId:
        document.kind === 'world'
          ? document.id
          : current.selectedWorldMapDocumentId,
      selectedSessionMapDocumentId:
        document.kind === 'session'
          ? document.id
          : current.selectedSessionMapDocumentId,
    }))
  }

  if (documents.length === 0) {
    const handleCreateMap = (mode: MapBuilderMode) => {
      const scaffold = createMapScaffold(campaignId, mode)
      const createdMap = appRepository.create('maps', scaffold.map)
      appRepository.create('mapDocuments', {
        ...scaffold.document,
        summaryMapId: createdMap.id,
      })
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Hex Map Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Create campaign map documents to start drawing a world or a session
            map.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => handleCreateMap('world')}>
              Create World Map
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCreateMap('session')}
            >
              Create Session Map
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!selectedDocument) {
    return null
  }

  const updateCurrentDocument = (patch: Partial<ResolvedMapDocument>) => {
    appRepository.update('mapDocuments', selectedDocument.id, patch)
  }

  const updateSummaryMap = (patch: Record<string, unknown>) => {
    if (!summaryMap) {
      return
    }

    appRepository.update('maps', summaryMap.id, patch)
  }

  const handleCreateMap = (mode: MapBuilderMode) => {
    const scaffold = createMapScaffold(campaignId, mode)
    const parentMapId =
      mode === 'session' && selectedDocument.kind === 'world'
        ? selectedDocument.id
        : null
    const parentHexId =
      mode === 'session' && selectedDocument.kind === 'world'
        ? selectionState.selectedHexId
        : null

    const createdMap = appRepository.create('maps', scaffold.map)
    const createdDocument = appRepository.create('mapDocuments', {
      ...scaffold.document,
      summaryMapId: createdMap.id,
      parentHexId,
      parentMapId,
    }) as ResolvedMapDocument

    if (
      mode === 'session' &&
      selectedDocument.kind === 'world' &&
      parentHexId
    ) {
      updateCurrentDocument({
        childMapIdsByHex: {
          ...selectedDocument.childMapIdsByHex,
          [parentHexId]: createdDocument.id,
        },
      })
    }

    rememberDocument(createdDocument, mode)
  }

  useEffect(() => {
    if (workspaceState.selectedMapDocumentId !== selectedDocument.id) {
      rememberDocument(selectedDocument)
    }
  }, [selectedDocument, workspaceState.selectedMapDocumentId])

  useEffect(() => {
    setSelectionState((current) =>
      normalizeSelectionState(
        current,
        selectedDocument,
        linkedSessions.map((document) => document.id),
      ),
    )
  }, [linkedSessions, selectedDocument])

  const handleModeChange = (mode: MapBuilderMode) => {
    const preferredDocument =
      documents.find(
        (document) =>
          document.id ===
          (mode === 'world'
            ? workspaceState.selectedWorldMapDocumentId
            : workspaceState.selectedSessionMapDocumentId),
      ) ??
      documents.find((document) => document.kind === mode) ??
      selectedDocument
    rememberDocument(preferredDocument, mode)
  }

  const setSelectedTool = (tool: typeof workspaceState.selectedTool) => {
    setWorkspaceState((current) => ({
      ...current,
      selectedTool: tool,
    }))
  }

  const setSelectedHex = (hexId: string | null) => {
    setSelectionState((current) => ({
      ...current,
      selectedHexId: hexId,
    }))
  }

  const setSelectedFeature = (featureId: string | null) => {
    setSelectionState((current) => ({
      ...current,
      selectedFeatureId: featureId,
    }))
  }

  const handlePaintHex = (hexId: string) => {
    updateCurrentDocument(
      paintHexTerrain(selectedDocument, hexId, selectionState.selectedTerrain),
    )
    setSelectedHex(hexId)
  }

  const handleExpandHex = (axial: { q: number; r: number }) => {
    const patch = expandHexGrid(
      selectedDocument,
      axial,
      selectionState.selectedTerrain,
    )

    if (!patch) {
      return
    }

    updateCurrentDocument(patch)
    setSelectionState((current) => ({
      ...current,
      selectedHexId: `hex-${axial.q}-${axial.r}`,
      selectedFeatureId: null,
    }))
  }

  const handleRemoveHex = (hexId: string) => {
    const patch = removeHexFromGrid(selectedDocument, hexId)
    if (!patch) {
      return
    }

    updateCurrentDocument(patch)
    setSelectionState((current) => ({
      ...current,
      selectedHexId: current.selectedHexId === hexId ? null : current.selectedHexId,
      selectedFeatureId: current.selectedFeatureId,
    }))
  }

  const handleEraseHex = (hexId: string) => {
    updateCurrentDocument(eraseHexContent(selectedDocument, hexId))
    setSelectionState((current) => ({
      ...current,
      selectedHexId: hexId,
      selectedFeatureId: null,
    }))
  }

  const handleAddLabel = (hexId: string) => {
    if (selectionState.draftLabelText.trim().length === 0) {
      return
    }

    updateCurrentDocument(
      addLabelToHex(
        selectedDocument,
        hexId,
        selectionState.draftLabelText.trim(),
        createLocalId('label'),
      ),
    )
    setSelectedHex(hexId)
  }

  const handleAddPin = (hexId: string) => {
    if (selectionState.draftPinName.trim().length === 0) {
      return
    }

    const created = createLocationPin({
      document: selectedDocument,
      hexId,
      id: createLocalId('feature'),
      linkedMapDocumentId: selectionState.linkedSessionDocumentId,
      name: selectionState.draftPinName.trim(),
    })

    updateCurrentDocument(created.patch)
    setSelectionState((current) => ({
      ...current,
      selectedHexId: hexId,
      selectedFeatureId: created.feature.id,
    }))
  }

  return (
    <div className="space-y-4">
      <Card className="ring-1 ring-border/70">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Hex Map Builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Shadcn-first editor shell for world cartography and session map
                detail.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => handleCreateMap('world')}
              >
                Create World Map
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleCreateMap('session')}
              >
                Create Session Map
              </Button>
              <Badge variant="outline">{selectedDocument.kind}</Badge>
              <Badge variant="outline">{selectedDocument.regionName}</Badge>
              <Badge variant="secondary">
                {selectedDocument.hexSizeMiles} mi / hex
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Tabs value={selectedMode} className="gap-3">
            <TabsList>
              <TabsTrigger
                value="world"
                onClick={() => handleModeChange('world')}
              >
                World
              </TabsTrigger>
              <TabsTrigger
                value="session"
                onClick={() => handleModeChange('session')}
              >
                Session
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ResizablePanelGroup
            dir="horizontal"
            className="min-h-180 rounded-xl border bg-muted/15"
          >
            <ResizablePanel defaultSize={9} minSize={8}>
              <div className="flex h-full items-start justify-center p-3">
                <ToolPalette
                  activeTool={workspaceState.selectedTool}
                  onToolChange={setSelectedTool}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={61} minSize={40}>
              <div className="space-y-3 p-4">
                {selectedMode === 'session' &&
                selectedDocument.kind !== 'session' ? (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    No session map is linked yet. Showing world context until
                    you open or link one.
                  </div>
                ) : null}

                <MapCanvas
                  activeTool={workspaceState.selectedTool}
                  currentDocument={selectedDocument}
                  draftLabelText={selectionState.draftLabelText}
                  draftPinName={selectionState.draftPinName}
                  linkedSessionDocumentId={
                    selectionState.linkedSessionDocumentId
                  }
                  selectedFeatureId={selectionState.selectedFeatureId}
                  selectedHexId={selectionState.selectedHexId}
                  selectedTerrain={selectionState.selectedTerrain}
                  onAddLabel={handleAddLabel}
                  onAddPin={handleAddPin}
                  onEraseHex={handleEraseHex}
                  onExpandHex={handleExpandHex}
                  onFeatureSelect={setSelectedFeature}
                  onHexSelect={setSelectedHex}
                  onPaintHex={handlePaintHex}
                  onRemoveHex={handleRemoveHex}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={30} minSize={22}>
              <div className="h-full p-4">
                <MapInspector
                  activeTool={workspaceState.selectedTool}
                  currentDocument={selectedDocument}
                  linkedDocument={linkedDocument}
                  selectedFeature={selectedFeature}
                  selectedTerrain={selectionState.selectedTerrain}
                  sessionCandidates={linkedSessions}
                  summaryMap={summaryMap}
                  draftLabelText={selectionState.draftLabelText}
                  draftPinName={selectionState.draftPinName}
                  linkedSessionDocumentId={
                    selectionState.linkedSessionDocumentId
                  }
                  onDescriptionChange={(value) =>
                    updateSummaryMap({ description: value })
                  }
                  onDraftLabelTextChange={(value) =>
                    setSelectionState((current) => ({
                      ...current,
                      draftLabelText: value,
                    }))
                  }
                  onDraftPinNameChange={(value) =>
                    setSelectionState((current) => ({
                      ...current,
                      draftPinName: value,
                    }))
                  }
                  onLinkedSessionChange={(documentId) =>
                    setSelectionState((current) => ({
                      ...current,
                      linkedSessionDocumentId: documentId,
                    }))
                  }
                  onMapNameChange={(value) => updateSummaryMap({ name: value })}
                  onOpenLinkedSession={() => {
                    if (linkedDocument) {
                      rememberDocument(linkedDocument, 'session')
                    }
                  }}
                  onTerrainChange={(terrain) =>
                    setSelectionState((current) => ({
                      ...current,
                      selectedTerrain: terrain,
                    }))
                  }
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </CardContent>
      </Card>
    </div>
  )
}
