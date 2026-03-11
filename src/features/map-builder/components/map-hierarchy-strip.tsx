import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { ResolvedMapDocument } from '../types'

export const MapHierarchyStrip = ({
  currentDocument,
  sessionDocuments,
  worldDocuments,
  onSelectDocument,
}: {
  currentDocument: ResolvedMapDocument | null
  sessionDocuments: ResolvedMapDocument[]
  worldDocuments: ResolvedMapDocument[]
  onSelectDocument: (document: ResolvedMapDocument) => void
}) => (
  <Card size="sm" className="ring-1 ring-border/70">
    <CardHeader className="border-b">
      <div className="flex items-center justify-between gap-3">
        <CardTitle>Map Hierarchy</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Worlds {worldDocuments.length}</Badge>
          <Badge variant="outline">Sessions {sessionDocuments.length}</Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent className="flex flex-wrap gap-2 pt-3">
      {worldDocuments.map((document) => (
        <Button
          key={document.id}
          type="button"
          size="sm"
          variant={currentDocument?.id === document.id ? 'default' : 'outline'}
          onClick={() => onSelectDocument(document)}
        >
          {document.name}
        </Button>
      ))}
      {sessionDocuments.map((document) => (
        <Button
          key={document.id}
          type="button"
          size="sm"
          variant={currentDocument?.id === document.id ? 'secondary' : 'outline'}
          onClick={() => onSelectDocument(document)}
        >
          {document.name}
        </Button>
      ))}
      {worldDocuments.length === 0 && sessionDocuments.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No campaign maps are available yet.
        </p>
      ) : null}
    </CardContent>
  </Card>
)
