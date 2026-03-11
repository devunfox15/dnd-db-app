import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'

import type { HexTerrain, MapFeature, MapRecord } from '@/features/core/types'

import type { MapBuilderTool, ResolvedMapDocument } from '../types'

const terrainOptions: HexTerrain[] = [
  'plains',
  'forest',
  'hills',
  'mountains',
  'water',
  'coast',
  'desert',
  'swamp',
  'tundra',
]

export const MapInspector = ({
  activeTool,
  currentDocument,
  linkedDocument,
  selectedFeature,
  selectedTerrain,
  sessionCandidates,
  summaryMap,
  draftLabelText,
  draftPinName,
  linkedSessionDocumentId,
  onDescriptionChange,
  onDraftLabelTextChange,
  onDraftPinNameChange,
  onLinkedSessionChange,
  onMapNameChange,
  onOpenLinkedSession,
  onTerrainChange,
}: {
  activeTool: MapBuilderTool
  currentDocument: ResolvedMapDocument
  linkedDocument: ResolvedMapDocument | null
  selectedFeature: MapFeature | null
  selectedTerrain: HexTerrain
  sessionCandidates: ResolvedMapDocument[]
  summaryMap: MapRecord | null
  draftLabelText: string
  draftPinName: string
  linkedSessionDocumentId: string | null
  onDescriptionChange: (value: string) => void
  onDraftLabelTextChange: (value: string) => void
  onDraftPinNameChange: (value: string) => void
  onLinkedSessionChange: (documentId: string | null) => void
  onMapNameChange: (value: string) => void
  onOpenLinkedSession: () => void
  onTerrainChange: (terrain: HexTerrain) => void
}) => (
  <Card className="h-full ring-1 ring-border/70">
    <CardHeader className="border-b">
      <CardTitle>Map Inspector</CardTitle>
      <CardDescription>
        {currentDocument.kind === 'world'
          ? 'World map editing controls'
          : 'Session map editing controls'}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 pt-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{currentDocument.kind}</Badge>
        <Badge variant="outline">{currentDocument.scale}</Badge>
        {summaryMap ? <Badge variant="secondary">{summaryMap.region}</Badge> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="map-name">Map Name</Label>
        <Input
          id="map-name"
          value={summaryMap?.name ?? currentDocument.name}
          onChange={(event) => onMapNameChange(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="map-description">Map Description</Label>
        <Textarea
          id="map-description"
          value={summaryMap?.description ?? ''}
          onChange={(event) => onDescriptionChange(event.target.value)}
        />
      </div>

      {selectedFeature && linkedDocument ? (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Linked Session
            </p>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="font-medium">{linkedDocument.name}</p>
              <p className="text-sm text-muted-foreground">
                {linkedDocument.regionName}
              </p>
              <p className="mt-2 text-sm">{selectedFeature.notes}</p>
            </div>
            <Button type="button" className="w-full" onClick={onOpenLinkedSession}>
              Open Session
            </Button>
          </div>
        </>
      ) : null}

      <Separator />

      {activeTool === 'terrain' ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Terrain Brush
          </p>
          <div className="flex flex-wrap gap-2">
            {terrainOptions.map((terrain) => (
              <Button
                key={terrain}
                type="button"
                size="sm"
                variant={selectedTerrain === terrain ? 'default' : 'outline'}
                aria-label={`${terrain[0].toUpperCase()}${terrain.slice(1)} terrain`}
                onClick={() => onTerrainChange(terrain)}
              >
                {terrain}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {activeTool === 'label' ? (
        <div className="space-y-2">
          <Label htmlFor="label-text">Label Text</Label>
          <Input
            id="label-text"
            value={draftLabelText}
            onChange={(event) => onDraftLabelTextChange(event.target.value)}
            placeholder="Add a place name to the next selected hex"
          />
        </div>
      ) : null}

      {activeTool === 'pin' ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pin-name">Pin Name</Label>
            <Input
              id="pin-name"
              value={draftPinName}
              onChange={(event) => onDraftPinNameChange(event.target.value)}
              placeholder="Name the location pin"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Link Session Map
            </p>
            <div className="flex flex-wrap gap-2">
              {sessionCandidates.map((document) => (
                <Button
                  key={document.id}
                  type="button"
                  size="sm"
                  variant={
                    linkedSessionDocumentId === document.id ? 'default' : 'outline'
                  }
                  aria-label={`Link to ${document.name}`}
                  onClick={() => onLinkedSessionChange(document.id)}
                >
                  {document.name}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={linkedSessionDocumentId ? 'outline' : 'default'}
                onClick={() => onLinkedSessionChange(null)}
              >
                No Link
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTool === 'pan' || activeTool === 'select' || activeTool === 'erase' ? (
        <p className="text-sm text-muted-foreground">
          {activeTool === 'erase'
            ? 'Click a hex to clear terrain back to plains and remove any labels or pins on that cell.'
            : 'Click a hex on the canvas to focus it in the editor.'}
        </p>
      ) : null}
    </CardContent>
  </Card>
)
