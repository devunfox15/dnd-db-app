import { useRef, useState } from 'react'
import { DownloadIcon, UploadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { exportState, importState } from '@/features/core/export-import'

export function DataPortabilityCard() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)

  function handleExport() {
    const json = exportState()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `dnd-db-export-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Exported.')
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = importState(text)
    setMessage(result.ok ? 'Imported.' : `Import failed: ${result.error}`)
    event.target.value = ''
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Portability</CardTitle>
        <CardDescription>
          Export your full state as JSON or restore from a previous export.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="secondary" className="gap-2">
            <DownloadIcon className="size-4" />
            Export
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            className="gap-2"
          >
            <UploadIcon className="size-4" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
