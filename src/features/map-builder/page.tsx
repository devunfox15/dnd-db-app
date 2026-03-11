import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { appRepository, useAppState } from '@/features/core/store'
import type { MapFeature } from '@/features/core/types'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

import {
  addLabelToHex,
  createMapScaffold,
  createLocationPin,
  eraseHexContent,
  paintHexTerrain,
} from './document-actions'
import { getCampaignMapDocuments, getCampaignMaps, getLinkedSessionDocuments, getSummaryMap, resolveSelectedDocument } from './document-helpers'
import { MapCanvas } from './components/map-canvas'
import { MapHierarchyStrip } from './components/map-hierarchy-strip'
import { MapInspector } from './components/map-inspector'
import { ToolPalette } from './components/tool-palette'
import type { MapBuilderMode, MapBuilderProps, ResolvedMapDocument } from './types'
import { createMapBuilderSelectionState, createMapBuilderWorkspaceState } from './workspace-state'

const generateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`

const terrainOrder = ['pan', 'select', 'terrain', 'erase', 'label', 'pin'] as const

export default function MapBuilderPage({
  campaignId,
  initialMode,
  defaultMapDocumentId = null,
}: MapBuilderProps) {
  const appState = useAppState()
  const maps = useMemo(() => getCampaignMaps(appState, campaignId), [appState, campaignId])
  const documents = useMemo(
    () => getCampaignMapDocuments(appState, campaignId),
    [appState, campaignId],
  )
  const [workspaceState, setWorkspaceState] = useCampaignStorageState(
    campaignId,
    'workspace-locations',
    createMapBuilderWorkspaceState(initialMode),
  )
  const [selectionState, setSelectionState] = useState(createMapBuilderSelectionState)
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
  const worldDocuments = documents.filter((document) => document.kind === 'world')
  const sessionDocuments = documents.filter((document) => document.kind === 'session')
  const selectedFeature = selectedDocument?.features.find(
    (feature) => feature.id === selectionState.selectedFeatureId,
  ) ?? null
  const linkedDocument = selectedFeature?.linkedMapDocumentId
    ? documents.find((document) => document.id === selectedFeature.linkedMapDocumentId) ?? null
    : null
  const linkedSessions = getLinkedSessionDocuments(documents, selectedDocument)

  const rememberDocument = (document: ResolvedMapDocument, nextMode = selectedMode) => {
    setWorkspaceState((current) => ({
      ...current,
      selectedMode: nextMode,
      selectedMapDocumentId: document.id,
      selectedMapId: document.summaryMapId,
      selectedWorldMapDocumentId:
        document.kind === 'world' ? document.id : current.selectedWorldMapDocumentId,
      selectedSessionMapDocumentId:
        document.kind === 'session' ? document.id : current.selectedSessionMapDocumentId,
    }))
  }

  const handleCreateMap = (mode: MapBuilderMode) => {
    const scaffold = createMapScaffold(campaignId, mode)
    const parentMapId =
      mode === 'session' && selectedDocument?.kind === 'world'
        ? selectedDocument.id
        : null
    const parentHexId =
      mode === 'session' && selectedDocument?.kind === 'world'
        ? selectionState.selectedHexId
        : null

    const createdMap = appRepository.create('maps', scaffold.map)
    const createdDocument = appRepository.create('mapDocuments', {
      ...scaffold.document,
      summaryMapId: createdMap.id,
      parentHexId,
      parentMapId,
    }) as ResolvedMapDocument

    if (mode === 'session' && selectedDocument?.kind === 'world' && parentHexId) {
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
    if (!selectedDocument) {
      return
    }

    if (workspaceState.selectedMapDocumentId !== selectedDocument.id) {
      rememberDocument(selectedDocument)
    }
  }, [selectedDocument])

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hex Map Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Create campaign map documents to start drawing a world or a session map.</p>
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

  const upsertFeatureRelations = (feature: MapFeature, hexId: string) => {
    if (selectedDocument.kind !== 'world' || !feature.linkedMapDocumentId) {
      return
    }

    const nextChildren = {
      ...selectedDocument.childMapIdsByHex,
      [hexId]: feature.linkedMapDocumentId,
    }
    updateCurrentDocument({ childMapIdsByHex: nextChildren })
    appRepository.update('mapDocuments', feature.linkedMapDocumentId, {
      parentMapId: selectedDocument.id,
      parentHexId: hexId,
    })
  }

  const handleHexSelect = (hexId: string) => {
    setSelectionState((current) => ({ ...current, selectedHexId: hexId, selectedFeatureId: null }))

    if (workspaceState.selectedTool === 'pan' || workspaceState.selectedTool === 'select') {
      return
    }

    if (workspaceState.selectedTool === 'terrain') {
      updateCurrentDocument(
        paintHexTerrain(selectedDocument, hexId, selectionState.selectedTerrain),
      )
      return
    }

    if (workspaceState.selectedTool === 'erase') {
      updateCurrentDocument(eraseHexContent(selectedDocument, hexId))
      return
    }

    if (workspaceState.selectedTool === 'label' && selectionState.draftLabelText.trim()) {
      updateCurrentDocument(
        addLabelToHex(
          selectedDocument,
          hexId,
          selectionState.draftLabelText.trim(),
          generateId('label'),
        ),
      )
      return
    }

    if (workspaceState.selectedTool !== 'pin' || !selectionState.draftPinName.trim()) {
      return
    }

    const { feature, patch } = createLocationPin({
      document: selectedDocument,
      hexId,
      id: generateId('feature'),
      linkedMapDocumentId:
        selectedDocument.kind === 'world'
          ? selectionState.linkedSessionDocumentId
          : null,
      name: selectionState.draftPinName.trim(),
    })

    updateCurrentDocument(patch)
    upsertFeatureRelations(feature, hexId)
    setSelectionState((current) => ({ ...current, selectedFeatureId: feature.id }))
  }

  const handleFeatureSelect = (featureId: string) => {
    setSelectionState((current) => ({
      ...current,
      selectedFeatureId: featureId,
      selectedHexId: selectedDocument.features.find((feature) => feature.id === featureId)?.hexId ?? current.selectedHexId,
    }))
  }

  const handleModeChange = (mode: MapBuilderMode) => {
    const preferredDocument =
      documents.find(
        (document) =>
          document.id ===
          (mode === 'world'
            ? workspaceState.selectedWorldMapDocumentId
            : workspaceState.selectedSessionMapDocumentId),
      ) ?? documents.find((document) => document.kind === mode) ?? selectedDocument
    rememberDocument(preferredDocument, mode)
  }

  return (
    <div className="space-y-4">
      <Card className="ring-1 ring-border/70">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Hex Map Builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Shadcn-first editor shell for world cartography and session map detail.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={() => handleCreateMap('world')}>
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
              <Badge variant="secondary">{selectedDocument.hexSizeMiles} mi / hex</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <Tabs value={selectedMode} className="gap-3">
            <TabsList>
              <TabsTrigger value="world" onClick={() => handleModeChange('world')}>
                World
              </TabsTrigger>
              <TabsTrigger value="session" onClick={() => handleModeChange('session')}>
                Session
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <MapHierarchyStrip
            currentDocument={selectedDocument}
            sessionDocuments={linkedSessions.length > 0 ? linkedSessions : sessionDocuments}
            worldDocuments={worldDocuments}
            onSelectDocument={(document) => rememberDocument(document, document.kind)}
          />

          <ResizablePanelGroup orientation="horizontal" className="min-h-[640px] rounded-xl border">
            <ResizablePanel defaultSize={13} minSize={10}>
              <div className="flex h-full items-start justify-center bg-card/70 p-3">
                <ToolPalette
                  activeTool={workspaceState.selectedTool}
                  onToolChange={(tool) =>
                    setWorkspaceState((current) => ({ ...current, selectedTool: tool }))
                  }
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={57} minSize={40}>
              <div className="space-y-3 p-4">
                {selectedMode === 'session' && selectedDocument.kind !== 'session' ? (
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    No session map is linked yet. Showing world context until you open or link one.
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedDocument.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {summaryMap?.description || selectedDocument.cultureSummary}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {terrainOrder.map((tool) => (
                      <Button
                        key={tool}
                        type="button"
                        size="xs"
                        variant={workspaceState.selectedTool === tool ? 'default' : 'outline'}
                        onClick={() =>
                          setWorkspaceState((current) => ({ ...current, selectedTool: tool }))
                        }
                      >
                        {tool}
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <MapCanvas
                  document={selectedDocument}
                  selectedFeatureId={selectionState.selectedFeatureId}
                  selectedHexId={selectionState.selectedHexId}
                  onFeatureSelect={handleFeatureSelect}
                  onHexSelect={handleHexSelect}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={22}>
              <div className="h-full bg-card/70 p-4">
                <MapInspector
                  activeTool={workspaceState.selectedTool}
                  currentDocument={selectedDocument}
                  draftLabelText={selectionState.draftLabelText}
                  draftPinName={selectionState.draftPinName}
                  linkedDocument={linkedDocument}
                  linkedSessionDocumentId={selectionState.linkedSessionDocumentId}
                  selectedFeature={selectedFeature}
                  selectedTerrain={selectionState.selectedTerrain}
                  sessionCandidates={sessionDocuments}
                  summaryMap={summaryMap}
                  onDescriptionChange={(value) => updateSummaryMap({ description: value })}
                  onDraftLabelTextChange={(value) =>
                    setSelectionState((current) => ({ ...current, draftLabelText: value }))
                  }
                  onDraftPinNameChange={(value) =>
                    setSelectionState((current) => ({ ...current, draftPinName: value }))
                  }
                  onLinkedSessionChange={(documentId) =>
                    setSelectionState((current) => ({
                      ...current,
                      linkedSessionDocumentId: documentId,
                    }))
                  }
                  onMapNameChange={(value) => updateSummaryMap({ name: value })}
                  onOpenLinkedSession={() => {
                    if (!linkedDocument) {
                      return
                    }

                    rememberDocument(linkedDocument, 'session')
                  }}
                  onTerrainChange={(terrain) =>
                    setSelectionState((current) => ({ ...current, selectedTerrain: terrain }))
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
