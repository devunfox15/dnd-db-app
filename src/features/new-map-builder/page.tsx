import { useRef, useState } from 'react'
import { useParams } from '@tanstack/react-router'

import { MapCanvas, type MapCanvasHandle } from './canvas/map-canvas'
import { TopBar } from './components/top-bar'
import { ToolOptionsPanel } from './panel/tool-options-panel'
import MapToolkitPage from './toolkit/page'
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_GRID_TYPE,
  DEFAULT_LAYERS,
  DEFAULT_TOOL_OPTIONS,
  type DrawToolId,
  type GridSize,
  type GridType,
  type Layer,
  type ToolId,
  type ToolOptions,
} from './types'

export default function NewMapBuilderPage() {
  const { mapId } = useParams({ from: '/maps/$mapId' })

  const canvasRef = useRef<MapCanvasHandle>(null)

  const [activeTool, setActiveTool]   = useState<DrawToolId>('select')
  const [showGrid, setShowGrid]       = useState(false)
  const [gridType, setGridType]       = useState<GridType>(DEFAULT_GRID_TYPE)
  const [gridSize, setGridSize]       = useState<GridSize>(DEFAULT_GRID_SIZE)
  const [toolOptions, setToolOptions] = useState<ToolOptions>(DEFAULT_TOOL_OPTIONS)
  const [layers, setLayers]           = useState<Layer[]>(DEFAULT_LAYERS)
  const [activeLayerId, setActiveLayerId] = useState<string>(DEFAULT_LAYERS[0]!.id)
  const [zoom, setZoom]               = useState(1)

  function handleToolClick(toolId: ToolId) {
    if (toolId === 'grid') { setShowGrid(prev => !prev); return }
    if (toolId === 'undo') { canvasRef.current?.undo(); return }
    if (toolId === 'paintbrush') {
      setActiveTool('paintbrush')
      setActiveLayerId('terrain')
      return
    }
    setActiveTool(toolId as DrawToolId)
  }

  function handleToolOptionsChange(patch: Partial<ToolOptions>) {
    setToolOptions(current => ({ ...current, ...patch }))
  }

  function handleLayerVisibilityToggle(layerId: string) {
    setLayers(current =>
      current.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l),
    )
  }

  function handleLayerAdd() {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
    }
    // Prepend so it sits on top of the stack
    setLayers(current => [newLayer, ...current])
    setActiveLayerId(newLayer.id)
  }

  function handleLayerDelete(layerId: string) {
    setLayers(current => {
      const next = current.filter(l => l.id !== layerId)
      if (activeLayerId === layerId && next.length > 0) {
        setActiveLayerId(next[0]!.id)
      }
      return next
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
    }}>
      {/* Top bar */}
      <TopBar
        mapId={mapId}
        zoom={zoom}
        onSave={() => canvasRef.current?.saveAll()}
        onExport={() => canvasRef.current?.exportPNG()}
      />

      {/* Main row */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Icon toolbar */}
        <MapToolkitPage
          activeTool={activeTool}
          showGrid={showGrid}
          onToolClick={handleToolClick}
        />

        {/* Options + layers panel */}
        <ToolOptionsPanel
          activeTool={activeTool}
          showGrid={showGrid}
          gridType={gridType}
          gridSize={gridSize}
          toolOptions={toolOptions}
          layers={layers}
          activeLayerId={activeLayerId}
          onToolOptionsChange={handleToolOptionsChange}
          onGridTypeChange={setGridType}
          onGridSizeChange={setGridSize}
          onLayerVisibilityToggle={handleLayerVisibilityToggle}
          onLayerSelect={setActiveLayerId}
          onLayerAdd={handleLayerAdd}
          onLayerDelete={handleLayerDelete}
        />

        {/* Canvas workspace */}
        <MapCanvas
          ref={canvasRef}
          mapId={mapId}
          activeTool={activeTool}
          showGrid={showGrid}
          gridType={gridType}
          gridSize={gridSize}
          toolOptions={toolOptions}
          layers={layers}
          activeLayerId={activeLayerId}
          onZoomChange={setZoom}
        />
      </div>
    </div>
  )
}
