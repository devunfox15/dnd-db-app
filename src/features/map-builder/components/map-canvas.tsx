import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'

import type { MapFeature, MapHexCell } from '@/features/core/types'

import {
  axialToPixel,
  createViewportForDocument,
  getHexCornerPoints,
  getHexRadiusForDocument,
  getVisibleHexes,
  pixelToAxial,
  screenToWorld,
  type CanvasPoint,
  type CanvasViewport,
} from '../map-canvas-geometry'
import type { MapCanvasProps } from '../types'

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 640
const BACKGROUND_COLOR = '#f4efe1'
const GRID_COLOR = '#3f3628'
const LABEL_COLOR = '#20180f'
const PIN_COLOR = '#7a261d'

const TERRAIN_COLORS: Record<MapHexCell['terrain'], string> = {
  water: '#2f6f9f',
  coast: '#69b4c4',
  plains: '#b4bf63',
  forest: '#4c7b43',
  hills: '#9a8955',
  mountains: '#6d7480',
  desert: '#d7b46a',
  swamp: '#5d7052',
  tundra: '#d4ddd8',
}

function drawHexPath(
  ctx: CanvasRenderingContext2D,
  center: CanvasPoint,
  radius: number,
) {
  const corners = getHexCornerPoints(center, radius)
  ctx.beginPath()
  ctx.moveTo(corners[0]!.x, corners[0]!.y)
  for (const corner of corners.slice(1)) {
    ctx.lineTo(corner.x, corner.y)
  }
  ctx.closePath()
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  event:
    | React.MouseEvent<HTMLCanvasElement>
    | React.WheelEvent<HTMLCanvasElement>,
): CanvasPoint {
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  }
}

function featureAtHex(features: MapFeature[], hexId: string) {
  return features.find((feature) => feature.hexId === hexId) ?? null
}

const EXPAND_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
] as const

export const MapCanvas = ({
  activeTool,
  currentDocument,
  draftLabelText,
  draftPinName,
  linkedSessionDocumentId,
  selectedFeatureId,
  selectedHexId,
  selectedTerrain,
  onAddLabel,
  onAddPin,
  onEraseHex,
  onExpandHex,
  onFeatureSelect,
  onHexSelect,
  onPaintHex,
  onRemoveHex,
}: MapCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastAppliedHexRef = useRef<string | null>(null)
  const dragModeRef = useRef<'expand' | 'carve' | null>(null)
  const panStateRef = useRef<{
    origin: CanvasPoint
    viewport: CanvasViewport
  } | null>(null)
  const [viewport, setViewport] = useState<CanvasViewport>(() =>
    createViewportForDocument(currentDocument, CANVAS_WIDTH, CANVAS_HEIGHT),
  )

  const hexRadius = useMemo(
    () => getHexRadiusForDocument(currentDocument),
    [currentDocument],
  )

  useEffect(() => {
    setViewport(createViewportForDocument(currentDocument, CANVAS_WIDTH, CANVAS_HEIGHT))
    lastAppliedHexRef.current = null
  }, [currentDocument.id, currentDocument.scale])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = BACKGROUND_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const visibleHexes = getVisibleHexes(
      currentDocument.hexes,
      viewport,
      hexRadius,
      canvas.width,
      canvas.height,
    )

    for (const hex of visibleHexes) {
      const center = axialToPixel(hex, hexRadius)
      const screenCenter = {
        x: center.x * viewport.scale + viewport.offsetX,
        y: center.y * viewport.scale + viewport.offsetY,
      }
      const screenRadius = hexRadius * viewport.scale

      drawHexPath(ctx, screenCenter, screenRadius)
      ctx.fillStyle = TERRAIN_COLORS[hex.terrain]
      ctx.fill()

      ctx.lineWidth = selectedHexId === hex.id ? 3 : 1
      ctx.strokeStyle = selectedHexId === hex.id ? '#f6f0cb' : GRID_COLOR
      ctx.stroke()

      if (currentDocument.childMapIdsByHex[hex.id]) {
        ctx.beginPath()
        ctx.arc(screenCenter.x, screenCenter.y, screenRadius * 0.18, 0, Math.PI * 2)
        ctx.fillStyle = '#f6f0cb'
        ctx.fill()
      }
    }

    if (activeTool === 'expand') {
      const occupied = new Set(
        currentDocument.hexes.map((hex) => `${hex.q},${hex.r}`),
      )
      const candidateKeys = new Set<string>()
      const candidateHexes: Array<{ q: number; r: number }> = []

      for (const hex of currentDocument.hexes) {
        for (const direction of EXPAND_DIRECTIONS) {
          const q = hex.q + direction.q
          const r = hex.r + direction.r
          const key = `${q},${r}`

          if (occupied.has(key) || candidateKeys.has(key)) {
            continue
          }

          candidateKeys.add(key)
          candidateHexes.push({ q, r })
        }
      }

      ctx.setLineDash([8, 6])
      for (const candidate of candidateHexes) {
        const center = axialToPixel(candidate, hexRadius)
        const screenCenter = {
          x: center.x * viewport.scale + viewport.offsetX,
          y: center.y * viewport.scale + viewport.offsetY,
        }
        const screenRadius = hexRadius * viewport.scale

        drawHexPath(ctx, screenCenter, screenRadius)
        ctx.fillStyle = 'rgba(246, 240, 203, 0.18)'
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(63, 54, 40, 0.55)'
        ctx.stroke()
      }
      ctx.setLineDash([])
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.max(12, 14 * viewport.scale)}px sans-serif`

    for (const label of currentDocument.labels) {
      const hex = currentDocument.hexes.find((entry) => entry.id === label.hexId)
      if (!hex) {
        continue
      }

      const center = axialToPixel(hex, hexRadius)
      const screenCenter = {
        x: center.x * viewport.scale + viewport.offsetX,
        y: center.y * viewport.scale + viewport.offsetY,
      }

      ctx.fillStyle = LABEL_COLOR
      ctx.fillText(
        label.text,
        screenCenter.x + label.offsetX * viewport.scale,
        screenCenter.y - hexRadius * viewport.scale * 0.45 + label.offsetY * viewport.scale,
      )
    }

    for (const feature of currentDocument.features) {
      const hex = currentDocument.hexes.find((entry) => entry.id === feature.hexId)
      if (!hex) {
        continue
      }

      const center = axialToPixel(hex, hexRadius)
      const screenCenter = {
        x: center.x * viewport.scale + viewport.offsetX,
        y: center.y * viewport.scale + viewport.offsetY,
      }
      const pinRadius = Math.max(6, hexRadius * viewport.scale * 0.16)

      ctx.beginPath()
      ctx.arc(screenCenter.x, screenCenter.y, pinRadius, 0, Math.PI * 2)
      ctx.fillStyle = feature.id === selectedFeatureId ? '#f5d76e' : PIN_COLOR
      ctx.fill()

      ctx.fillStyle = LABEL_COLOR
      ctx.fillText(
        feature.label,
        screenCenter.x,
        screenCenter.y + hexRadius * viewport.scale * 0.4,
      )
    }
  }, [currentDocument, hexRadius, selectedFeatureId, selectedHexId, viewport])

  const resolveHexId = (
    event: React.MouseEvent<HTMLCanvasElement>,
  ): string | null => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }

    const point = getCanvasPoint(canvas, event)
    const worldPoint = screenToWorld(point, viewport)
    const axial = pixelToAxial(worldPoint, hexRadius)
    const hitHex =
      currentDocument.hexes.find(
        (hex) => hex.q === axial.q && hex.r === axial.r,
      ) ?? null

    return hitHex?.id ?? null
  }

  const applyHexInteraction = (hexId: string | null) => {
    if (!hexId) {
      return
    }

    onHexSelect(hexId)

    if (activeTool === 'terrain') {
      if (lastAppliedHexRef.current !== hexId) {
        lastAppliedHexRef.current = hexId
        onPaintHex(hexId)
      }
      return
    }

    if (activeTool === 'erase') {
      if (lastAppliedHexRef.current !== hexId) {
        lastAppliedHexRef.current = hexId
        onEraseHex(hexId)
      }
      return
    }

    if (activeTool === 'label') {
      if (draftLabelText.trim().length > 0) {
        onAddLabel(hexId)
      }
      return
    }

    if (activeTool === 'pin') {
      if (draftPinName.trim().length > 0) {
        onAddPin(hexId)
      }
      return
    }

    if (activeTool === 'expand') {
      return
    }

    if (activeTool === 'carve') {
      if (lastAppliedHexRef.current !== hexId) {
        lastAppliedHexRef.current = hexId
        onRemoveHex(hexId)
      }
      return
    }

    const feature = featureAtHex(currentDocument.features, hexId)
    onFeatureSelect(feature?.id ?? null)
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    if (activeTool === 'pan') {
      const point = getCanvasPoint(canvas, event)
      panStateRef.current = {
        origin: point,
        viewport,
      }
      return
    }

    lastAppliedHexRef.current = null
    const hexId = resolveHexId(event)
    if (activeTool === 'expand' && !hexId) {
      dragModeRef.current = 'expand'
      const point = getCanvasPoint(canvas, event)
      const worldPoint = screenToWorld(point, viewport)
      const axial = pixelToAxial(worldPoint, hexRadius)
      lastAppliedHexRef.current = `${axial.q},${axial.r}`
      onExpandHex(axial)
      onFeatureSelect(null)
      onHexSelect(null)
      return
    }

    if (activeTool === 'carve' && hexId) {
      dragModeRef.current = 'carve'
    }

    applyHexInteraction(hexId)
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    if (panStateRef.current) {
      const point = getCanvasPoint(canvas, event)
      const deltaX = point.x - panStateRef.current.origin.x
      const deltaY = point.y - panStateRef.current.origin.y

      setViewport({
        ...panStateRef.current.viewport,
        offsetX: panStateRef.current.viewport.offsetX + deltaX,
        offsetY: panStateRef.current.viewport.offsetY + deltaY,
      })
      return
    }

    if (event.buttons !== 1) {
      return
    }

    if (
      activeTool === 'terrain' ||
      activeTool === 'erase' ||
      activeTool === 'carve'
    ) {
      applyHexInteraction(resolveHexId(event))
      return
    }

    if (activeTool === 'expand' && dragModeRef.current === 'expand') {
      const point = getCanvasPoint(canvas, event)
      const worldPoint = screenToWorld(point, viewport)
      const axial = pixelToAxial(worldPoint, hexRadius)
      const hitHex = currentDocument.hexes.find(
        (hex) => hex.q === axial.q && hex.r === axial.r,
      )

      if (!hitHex) {
        const key = `${axial.q},${axial.r}`
        if (lastAppliedHexRef.current !== key) {
          lastAppliedHexRef.current = key
          onExpandHex(axial)
          onFeatureSelect(null)
          onHexSelect(null)
        }
      }
    }
  }

  const handleMouseUp = () => {
    panStateRef.current = null
    lastAppliedHexRef.current = null
    dragModeRef.current = null
  }

  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const point = getCanvasPoint(canvas, event)
    const anchor = screenToWorld(point, viewport)
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.92
    const nextScale = Math.min(2.5, Math.max(0.45, viewport.scale * zoomFactor))

    setViewport({
      scale: nextScale,
      offsetX: point.x - anchor.x * nextScale,
      offsetY: point.y - anchor.y * nextScale,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">{currentDocument.scale}</Badge>
        <Badge variant="outline">{selectedTerrain}</Badge>
        {linkedSessionDocumentId ? (
          <Badge variant="secondary">Linked session ready</Badge>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <canvas
          ref={canvasRef}
          data-testid="map-canvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          style={{
            display: 'block',
            width: '100%',
            cursor: activeTool === 'pan' ? 'grab' : 'crosshair',
          }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
      </div>
    </div>
  )
}
