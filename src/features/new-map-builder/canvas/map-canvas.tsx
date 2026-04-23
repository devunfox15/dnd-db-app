import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { loadLayer, saveLayer } from '../storage'
import type { DrawToolId, GridSize, GridType, Layer, ToolOptions } from '../types'
import { TERRAIN_TEXTURE_MAP } from '../types'
import { getTerrainPattern, initTerrainPatterns } from './terrain-patterns'

export interface MapCanvasHandle {
  undo: () => void
  exportPNG: () => void
  saveAll: () => void
}

const CANVAS_SIZE = 800
const MIN_ZOOM    = 0.25
const MAX_ZOOM    = 8
const ZOOM_STEP   = 0.12

interface MapCanvasProps {
  mapId: string
  activeTool: DrawToolId
  showGrid: boolean
  gridType: GridType
  gridSize: GridSize
  toolOptions: ToolOptions
  layers: Layer[]
  activeLayerId: string
  onZoomChange: (zoom: number) => void
}

interface TextInputState {
  canvasX: number
  canvasY: number
  screenX: number
  screenY: number
  value: string
}

function paintTerrainSegment(
  ctx: CanvasRenderingContext2D,
  prev: { x: number; y: number } | null,
  curr: { x: number; y: number },
  brushSize: number,
  color: string,
  brushShape: 'circle' | 'square' = 'circle',
) {
  const fill: string | CanvasPattern =
    getTerrainPattern(color) ?? TERRAIN_TEXTURE_MAP[color]?.base ?? color
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  ctx.filter = 'none'

  if (brushShape === 'square') {
    ctx.fillStyle = fill
    // Stamp axis-aligned squares along the segment
    const p = prev ?? curr
    const dx = curr.x - p.x
    const dy = curr.y - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const steps = Math.max(1, Math.ceil(dist / (brushSize * 0.5)))
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps
      const x = p.x + dx * t - brushSize
      const y = p.y + dy * t - brushSize
      ctx.fillRect(x, y, brushSize * 2, brushSize * 2)
    }
  } else {
    ctx.strokeStyle = fill
    ctx.lineWidth   = brushSize * 2
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.beginPath()
    ctx.moveTo(prev?.x ?? curr.x, prev?.y ?? curr.y)
    ctx.lineTo(curr.x, curr.y)
    ctx.stroke()
  }
}

const CURSOR_MAP: Record<DrawToolId, string> = {
  select:     'default',
  pan:        'grab',
  pencil:     'crosshair',
  paintbrush: 'crosshair',
  eraser:     'cell',
  text:       'text',
}

export const MapCanvas = forwardRef<MapCanvasHandle, MapCanvasProps>(function MapCanvas(
  { mapId, activeTool, showGrid, gridType, gridSize, toolOptions, layers, activeLayerId, onZoomChange },
  ref,
) {
  const outerRef       = useRef<HTMLDivElement>(null)
  const innerRef       = useRef<HTMLDivElement>(null)
  const gridCanvasRef  = useRef<HTMLCanvasElement>(null)
  const layerCanvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const layerHistoryRef = useRef<Record<string, ImageData[]>>({})

  // Mirror mutable props into refs so stable callbacks can access current values
  const activeLayerIdRef = useRef(activeLayerId)
  const activeToolRef    = useRef(activeTool)
  const toolOptionsRef   = useRef(toolOptions)
  const layersRef        = useRef(layers)
  const mapIdRef         = useRef(mapId)
  const onZoomChangeRef  = useRef(onZoomChange)

  const gridTypeRef = useRef(gridType)
  const gridSizeRef = useRef(gridSize)

  useEffect(() => { activeLayerIdRef.current = activeLayerId }, [activeLayerId])
  useEffect(() => { activeToolRef.current    = activeTool    }, [activeTool])
  useEffect(() => { toolOptionsRef.current   = toolOptions   }, [toolOptions])
  useEffect(() => { layersRef.current        = layers        }, [layers])
  useEffect(() => { mapIdRef.current         = mapId         }, [mapId])
  useEffect(() => { onZoomChangeRef.current  = onZoomChange  }, [onZoomChange])
  useEffect(() => { gridTypeRef.current      = gridType      }, [gridType])
  useEffect(() => { gridSizeRef.current      = gridSize      }, [gridSize])

  const isDrawingRef       = useRef(false)
  const isScratchingRef    = useRef(false)
  const scratchCanvasRef   = useRef<HTMLCanvasElement | null>(null)
  const prevPaintPointRef  = useRef<{ x: number; y: number } | null>(null)
  const zoomRef         = useRef(1)
  const panOffsetRef  = useRef({ x: 0, y: 0 })
  const panOriginRef  = useRef<{ mouseX: number; mouseY: number; tx: number; ty: number } | null>(null)
  const [textInput, setTextInput] = useState<TextInputState | null>(null)
  const [zoomDisplay, setZoomDisplay] = useState(1)
  const [initialized, setInitialized] = useState(false)
  const [toolCursor, setToolCursor] = useState<{ x: number; y: number } | null>(null)

  // Clear cursor preview when switching away from tools that show it
  useEffect(() => {
    if (activeTool !== 'eraser' && activeTool !== 'paintbrush') setToolCursor(null)
  }, [activeTool])

  const applyTransform = useCallback((zoom: number, panX: number, panY: number) => {
    if (innerRef.current) {
      innerRef.current.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`
    }
  }, [])

  // Center map on first mount
  useEffect(() => {
    const outer = outerRef.current
    if (!outer) return
    const { width, height } = outer.getBoundingClientRect()
    panOffsetRef.current = {
      x: (width  - CANVAS_SIZE) / 2,
      y: (height - CANVAS_SIZE) / 2,
    }
    applyTransform(1, panOffsetRef.current.x, panOffsetRef.current.y)
    setInitialized(true)
  }, [applyTransform])

  // Load layer data from localStorage after mount
  useEffect(() => {
    if (!initialized) return
    layersRef.current.forEach(layer => {
      const canvas = layerCanvasRefs.current[layer.id]
      if (canvas) loadLayer(mapIdRef.current, layer.id, canvas)
    })
  }, [initialized]) // intentionally runs once after init

  // Generate terrain texture patterns once
  useEffect(() => {
    if (!initialized) return
    const scratch = scratchCanvasRef.current
    const sCtx = scratch?.getContext('2d')
    if (sCtx) initTerrainPatterns(sCtx)
  }, [initialized])

  // Reload newly-added layers that don't have canvas data yet
  useEffect(() => {
    if (!initialized) return
    layers.forEach(layer => {
      const canvas = layerCanvasRefs.current[layer.id]
      if (canvas) loadLayer(mapId, layer.id, canvas)
    })
  }, [layers.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Grid overlay
  useEffect(() => {
    const canvas = gridCanvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    if (!showGrid) return

    ctx.strokeStyle = 'rgba(30,30,30,0.45)'
    ctx.lineWidth = 1

    if (gridType === 'square') {
      const cell = CANVAS_SIZE / gridSize
      ctx.setLineDash([4, 4])
      for (let i = 1; i < gridSize; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, CANVAS_SIZE); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(CANVAS_SIZE, i * cell); ctx.stroke()
      }
      ctx.setLineDash([])
    } else {
      // Pointy-top hexagons
      // gridSize = number of hex columns across the canvas
      const hexWidth   = CANVAS_SIZE / gridSize
      const r          = hexWidth / Math.sqrt(3)   // circumradius
      const horizStep  = hexWidth                  // column spacing
      const vertStep   = 1.5 * r                   // row spacing

      const cols = gridSize + 1
      const rows = Math.ceil(CANVAS_SIZE / vertStep) + 2

      ctx.setLineDash([])
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const cx = col * horizStep + (row % 2 === 1 ? horizStep / 2 : 0)
          const cy = row * vertStep
          ctx.beginPath()
          for (let v = 0; v < 6; v++) {
            const angle = (Math.PI / 180) * (60 * v - 30)
            const vx = cx + r * Math.cos(angle)
            const vy = cy + r * Math.sin(angle)
            v === 0 ? ctx.moveTo(vx, vy) : ctx.lineTo(vx, vy)
          }
          ctx.closePath()
          ctx.stroke()
        }
      }
    }
  }, [showGrid, gridType, gridSize])

  // Wheel zoom (non-passive)
  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const oldZoom = zoomRef.current
      const step = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, oldZoom + step))
      if (newZoom === oldZoom) return
      const rect = el.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const scale = newZoom / oldZoom
      panOffsetRef.current = {
        x: mouseX - scale * (mouseX - panOffsetRef.current.x),
        y: mouseY - scale * (mouseY - panOffsetRef.current.y),
      }
      zoomRef.current = newZoom
      applyTransform(newZoom, panOffsetRef.current.x, panOffsetRef.current.y)
      setZoomDisplay(newZoom)
      onZoomChangeRef.current(newZoom)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [applyTransform])

  // Helpers — use refs so they work in stable callbacks
  function getActiveCanvas() {
    return layerCanvasRefs.current[activeLayerIdRef.current] ?? null
  }

  function getPointInMap(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const rect = innerRef.current?.getBoundingClientRect()
    if (!rect) return null
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function isInsideMap(e: { clientX: number; clientY: number }): boolean {
    const rect = innerRef.current?.getBoundingClientRect()
    if (!rect) return false
    return e.clientX >= rect.left && e.clientX <= rect.right &&
           e.clientY >= rect.top  && e.clientY <= rect.bottom
  }

  const saveSnapshot = useCallback(() => {
    const canvas = getActiveCanvas()
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    const lid = activeLayerIdRef.current
    if (!layerHistoryRef.current[lid]) layerHistoryRef.current[lid] = []
    const history = layerHistoryRef.current[lid]!
    history.push(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE))
    if (history.length > 50) history.shift()
  }, [])

  const autoSave = useCallback(() => {
    const canvas = getActiveCanvas()
    if (canvas) saveLayer(mapIdRef.current, activeLayerIdRef.current, canvas)
  }, [])

  useImperativeHandle(ref, () => ({
    undo() {
      const canvas = getActiveCanvas()
      const ctx = canvas?.getContext('2d')
      const history = layerHistoryRef.current[activeLayerIdRef.current]
      if (!ctx || !canvas || !history?.length) return
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.putImageData(history.pop()!, 0, 0)
      saveLayer(mapIdRef.current, activeLayerIdRef.current, canvas)
    },
    exportPNG() {
      const offscreen = document.createElement('canvas')
      offscreen.width  = CANVAS_SIZE
      offscreen.height = CANVAS_SIZE
      const ctx = offscreen.getContext('2d')!
      ctx.fillStyle = '#f5e6c8'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      // Draw layers bottom → top (reverse of DOM order)
      ;[...layersRef.current].reverse().forEach(layer => {
        if (!layer.visible) return
        const canvas = layerCanvasRefs.current[layer.id]
        if (canvas) ctx.drawImage(canvas, 0, 0)
      })
      const link = document.createElement('a')
      link.download = 'map.png'
      link.href = offscreen.toDataURL('image/png')
      link.click()
    },
    saveAll() {
      layersRef.current.forEach(layer => {
        const canvas = layerCanvasRefs.current[layer.id]
        if (canvas) saveLayer(mapIdRef.current, layer.id, canvas)
      })
    },
  }))

  // ── Mouse handlers (on outer workspace) ────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeToolRef.current === 'pan') {
      panOriginRef.current = {
        mouseX: e.clientX, mouseY: e.clientY,
        tx: panOffsetRef.current.x, ty: panOffsetRef.current.y,
      }
      return
    }

    if (!isInsideMap(e)) return

    if (activeToolRef.current === 'text') {
      const outerRect = outerRef.current?.getBoundingClientRect()
      if (!outerRect) return
      const pt = getPointInMap(e)
      if (!pt) return
      setTextInput({
        canvasX: pt.x, canvasY: pt.y,
        screenX: e.clientX - outerRect.left,
        screenY: e.clientY - outerRect.top,
        value: '',
      })
      return
    }

    if (activeToolRef.current === 'select') return

    saveSnapshot()
    isDrawingRef.current = true

    if (activeToolRef.current === 'paintbrush') {
      const scratch = scratchCanvasRef.current
      const sCtx = scratch?.getContext('2d')
      if (sCtx && scratch) {
        sCtx.clearRect(0, 0, scratch.width, scratch.height)
        prevPaintPointRef.current = null
        isScratchingRef.current = true
      }
    }

    if (activeToolRef.current === 'pencil') {
      const canvas = getActiveCanvas()
      const ctx = canvas?.getContext('2d')
      const pt = getPointInMap(e)
      if (!ctx || !pt) return
      ctx.beginPath()
      ctx.moveTo(pt.x, pt.y)
    }
  }, [saveSnapshot])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Always track cursor position for tools that show a preview circle
    const trackedTool = activeToolRef.current
    if ((trackedTool === 'eraser' || trackedTool === 'paintbrush') && outerRef.current) {
      const outerRect = outerRef.current.getBoundingClientRect()
      setToolCursor({ x: e.clientX - outerRect.left, y: e.clientY - outerRect.top })
    }

    if (activeToolRef.current === 'pan' && panOriginRef.current) {
      const { mouseX, mouseY, tx, ty } = panOriginRef.current
      panOffsetRef.current = { x: tx + (e.clientX - mouseX), y: ty + (e.clientY - mouseY) }
      applyTransform(zoomRef.current, panOffsetRef.current.x, panOffsetRef.current.y)
      return
    }

    if (!isDrawingRef.current) return
    const canvas = getActiveCanvas()
    const ctx = canvas?.getContext('2d')
    const pt = getPointInMap(e)
    if (!ctx || !pt) return

    const tool = activeToolRef.current
    const opts = toolOptionsRef.current

    if (tool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.strokeStyle = opts.pencil.color
      ctx.lineWidth   = opts.pencil.strokeWidth
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.lineTo(pt.x, pt.y)
      ctx.stroke()
    } else if (tool === 'paintbrush') {
      const scratch = scratchCanvasRef.current
      const sCtx = scratch?.getContext('2d')
      if (!sCtx) return
      paintTerrainSegment(sCtx, prevPaintPointRef.current, pt, opts.paintbrush.brushSize, opts.paintbrush.color, opts.paintbrush.brushShape)
      prevPaintPointRef.current = pt
    } else if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, opts.eraser.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'source-over'
    }
  }, [applyTransform])

  const handleMouseUp = useCallback(() => {
    panOriginRef.current = null
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      const canvas = getActiveCanvas()
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
      }

      // Merge scratch canvas into terrain on paintbrush release
      if (isScratchingRef.current) {
        isScratchingRef.current = false
        const terrainCanvas = layerCanvasRefs.current['terrain']
        const tCtx = terrainCanvas?.getContext('2d')
        const scratch = scratchCanvasRef.current
        if (tCtx && scratch) {
          tCtx.globalCompositeOperation = 'source-over'
          tCtx.globalAlpha = 1
          tCtx.drawImage(scratch, 0, 0)
          scratch.getContext('2d')?.clearRect(0, 0, scratch.width, scratch.height)
          prevPaintPointRef.current = null
        }
      }

      autoSave()
    }
  }, [autoSave])

  const commitText = useCallback(() => {
    setTextInput(prev => {
      if (!prev) return null
      const canvas = getActiveCanvas()
      const ctx = canvas?.getContext('2d')
      if (!ctx || !prev.value.trim()) return null
      saveSnapshot()
      const opts = toolOptionsRef.current
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.font      = `${opts.text.fontSize}px serif`
      ctx.fillStyle = opts.text.color
      ctx.fillText(prev.value, prev.canvasX, prev.canvasY)
      autoSave()
      return null
    })
  }, [saveSnapshot, autoSave])

  const workspaceCursor = activeTool === 'pan'
    ? 'grab'
    : (activeTool === 'eraser' || activeTool === 'paintbrush') && toolCursor
      ? 'none'
      : 'default'

  // Layers rendered bottom→top: reverse array so index-0 (top layer) renders last in DOM
  const layersBottomToTop = [...layers].reverse()
  // Grid sits above terrain+paths but below icons+labels
  const BELOW_GRID_IDS = new Set(['terrain', 'paths'])
  const layersBelowGrid = layersBottomToTop.filter(l => BELOW_GRID_IDS.has(l.id))
  const layersAboveGrid = layersBottomToTop.filter(l => !BELOW_GRID_IDS.has(l.id))

  return (
    <div
      ref={outerRef}
      style={{
        flex: 1,
        background: '#2c2c2c',
        overflow: 'hidden',
        position: 'relative',
        cursor: workspaceCursor,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => { handleMouseUp(); setToolCursor(null) }}
    >
      {/* Map document — 800×800 parchment, transformed for zoom/pan */}
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          width: CANVAS_SIZE,
          height: CANVAS_SIZE,
          background: '#f5e6c8',
          transformOrigin: '0 0',
          transform: 'translate(0px,0px) scale(1)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          pointerEvents: 'none',
        }}
      >
        {/* Layers below grid: terrain, paths */}
        {layersBelowGrid.map(layer => (
          <canvas
            key={layer.id}
            ref={el => { layerCanvasRefs.current[layer.id] = el }}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{
              position: 'absolute',
              inset: 0,
              display: layer.visible ? 'block' : 'none',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Scratch canvas — accumulates current paintbrush stroke, cleared after merge */}
        <canvas
          ref={scratchCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />

        {/* Grid overlay — above terrain+paths, below icons+labels */}
        <canvas
          ref={gridCanvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />

        {/* Layers above grid: icons, labels */}
        {layersAboveGrid.map(layer => (
          <canvas
            key={layer.id}
            ref={el => { layerCanvasRefs.current[layer.id] = el }}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{
              position: 'absolute',
              inset: 0,
              display: layer.visible ? 'block' : 'none',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      {/* Floating text input — positioned in workspace coords */}
      {textInput && (
        <input
          autoFocus
          value={textInput.value}
          onChange={e => setTextInput(prev => prev && { ...prev, value: e.target.value })}
          onKeyDown={e => {
            if (e.key === 'Enter') commitText()
            if (e.key === 'Escape') setTextInput(null)
          }}
          onBlur={commitText}
          placeholder="Type and press Enter…"
          style={{
            position: 'absolute',
            left: textInput.screenX,
            top: textInput.screenY,
            zIndex: 100,
            background: 'rgba(245,230,200,0.95)',
            border: '1px solid #0096ff',
            borderRadius: 4,
            padding: '2px 8px',
            outline: 'none',
            fontSize: toolOptions.text.fontSize,
            color: toolOptions.text.color,
            fontFamily: 'serif',
            minWidth: 120,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
      )}

      {/* Brush cursor preview (eraser + paintbrush) */}
      {(activeTool === 'eraser' || activeTool === 'paintbrush') && toolCursor && (() => {
        const isEraser = activeTool === 'eraser'
        const radius = isEraser ? toolOptions.eraser.size : toolOptions.paintbrush.brushSize
        const fill   = isEraser ? 'rgba(255,255,255,0.06)' : `${toolOptions.paintbrush.color}40`
        const isSquare = !isEraser && toolOptions.paintbrush.brushShape === 'square'
        return (
          <div
            style={{
              position: 'absolute',
              left: toolCursor.x,
              top: toolCursor.y,
              width:  radius * 2 * zoomDisplay,
              height: radius * 2 * zoomDisplay,
              transform: 'translate(-50%, -50%)',
              borderRadius: isSquare ? '0' : '50%',
              border: '1.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.5)',
              background: fill,
              pointerEvents: 'none',
              zIndex: 200,
            }}
          />
        )
      })()}

      {/* Zoom indicator */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12,
        background: 'rgba(0,0,0,0.45)',
        color: '#999',
        fontSize: 11,
        padding: '3px 8px',
        borderRadius: 4,
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        {Math.round(zoomDisplay * 100)}%
      </div>
    </div>
  )
})
