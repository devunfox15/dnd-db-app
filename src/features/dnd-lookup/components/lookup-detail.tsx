import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LookupEntry } from '@/features/core/types'

interface LookupDetailProps {
  entry: LookupEntry | null
  onPin: () => void
}

export function LookupDetail({ entry, onPin }: LookupDetailProps) {
  if (!entry) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lookup Details</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground">Select a lookup entry to view details.</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entry.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs uppercase text-muted-foreground">{entry.category}</p>
        <p>{entry.summary}</p>
        <p className="text-sm text-muted-foreground">{entry.details}</p>
        <Button onClick={onPin}>Pin to Story</Button>
      </CardContent>
    </Card>
  )
}
