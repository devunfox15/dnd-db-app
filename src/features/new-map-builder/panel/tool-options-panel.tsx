import { Circle, Eye, EyeOff, Lock, Plus, Square, Trash2 } from 'lucide-react'

import type { DrawToolId, GridSize, GridType, Layer, ToolOptions } from '../types'
import {
  FONT_SIZES,
  GRID_SIZES,
  PENCIL_COLORS,
  SIZE_LABELS,
  STROKE_WIDTHS,
  TERRAIN_GROUPS,
  TEXT_COLORS,
} from '../types'

interface ToolOptionsPanelProps {
  activeTool: DrawToolId
  showGrid: boolean
  gridType: GridType
  gridSize: GridSize
  toolOptions: ToolOptions
  layers: Layer[]
  activeLayerId: string
  onToolOptionsChange: (patch: Partial<ToolOptions>) => void
  onGridTypeChange: (type: GridType) => void
  onGridSizeChange: (size: GridSize) => void
  onLayerVisibilityToggle: (layerId: string) => void
  onLayerSelect: (layerId: string) => void
  onLayerAdd: () => void
  onLayerDelete: (layerId: string) => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: '#666',
      marginBottom: 8,
    }}>
      {children}
    </p>
  )
}

function ColorSwatch({
  color,
  selected,
  label,
  onClick,
  round = false,
}: {
  color: string
  selected: boolean
  label?: string
  onClick: () => void
  round?: boolean
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      style={{
        width: 22,
        height: 22,
        backgroundColor: color,
        borderRadius: round ? '50%' : 3,
        border: selected ? '2px solid #0096ff' : '2px solid transparent',
        cursor: 'pointer',
        flexShrink: 0,
        outline: 'none',
        transition: 'transform 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    />
  )
}

function SizeButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        cursor: 'pointer',
        border: 'none',
        background: selected ? '#0096ff' : '#333',
        color: selected ? '#fff' : '#aaa',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      {label}
    </button>
  )
}

function SizeSlider({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#0096ff', cursor: 'pointer' }}
      />
      <span style={{ fontSize: 11, color: '#aaa', minWidth: 22, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

const DRAW_TOOLS: DrawToolId[] = ['pencil', 'paintbrush', 'eraser', 'text']

export function ToolOptionsPanel({
  activeTool,
  showGrid,
  gridType,
  gridSize,
  toolOptions,
  layers,
  activeLayerId,
  onToolOptionsChange,
  onGridTypeChange,
  onGridSizeChange,
  onLayerVisibilityToggle,
  onLayerSelect,
  onLayerAdd,
  onLayerDelete,
}: ToolOptionsPanelProps) {
  const showToolOptions = DRAW_TOOLS.includes(activeTool)

  return (
    <div style={{
      width: 220,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#252525',
      borderRight: '1px solid #3a3a3a',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* ── Grid options section ──────────────────────────────── */}
      {showGrid && (
        <div style={{ padding: 12, borderBottom: '1px solid #3a3a3a', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <SectionLabel>Grid</SectionLabel>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['square', 'hexagon'] as GridType[]).map(type => (
                <SizeButton
                  key={type}
                  label={type === 'square' ? 'Square' : 'Hex'}
                  selected={gridType === type}
                  onClick={() => onGridTypeChange(type)}
                />
              ))}
            </div>
          </div>
          <div>
            <SectionLabel>Size</SectionLabel>
            <div style={{ display: 'flex', gap: 4 }}>
              {GRID_SIZES.map(s => (
                <SizeButton
                  key={s}
                  label={`${s}`}
                  selected={gridSize === s}
                  onClick={() => onGridSizeChange(s)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Layers section ────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #3a3a3a' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px 6px',
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#666' }}>
            Layers
          </span>
          <button
            onClick={onLayerAdd}
            title="Add layer"
            style={{ ...iconBtn, color: '#666' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e5e5e5')}
            onMouseLeave={e => (e.currentTarget.style.color = '#666')}
          >
            <Plus size={13} />
          </button>
        </div>

        <div style={{ padding: '0 6px 8px' }}>
          {layers.map(layer => {
            const isActive = layer.id === activeLayerId
            return (
              <div
                key={layer.id}
                onClick={() => onLayerSelect(layer.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 6px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  background: isActive ? '#0096ff18' : 'transparent',
                  border: isActive ? '1px solid #0096ff44' : '1px solid transparent',
                  marginBottom: 2,
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = '#2c2c2c'
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Active indicator dot */}
                <div style={{
                  width: 6, height: 6,
                  borderRadius: '50%',
                  background: isActive ? '#0096ff' : '#444',
                  flexShrink: 0,
                }} />

                {/* Layer name */}
                <span style={{
                  flex: 1,
                  fontSize: 12,
                  color: layer.visible ? '#e5e5e5' : '#555',
                  textDecoration: layer.visible ? 'none' : 'line-through',
                  userSelect: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {layer.name}
                </span>

                {/* Visibility toggle */}
                <button
                  onClick={e => { e.stopPropagation(); if (!layer.locked) onLayerVisibilityToggle(layer.id) }}
                  disabled={layer.locked}
                  title={layer.locked ? 'Layer is locked' : layer.visible ? 'Hide layer' : 'Show layer'}
                  style={{ ...iconBtn, color: layer.visible ? '#888' : '#444' }}
                  onMouseEnter={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = '#e5e5e5' }}
                  onMouseLeave={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = layer.visible ? '#888' : '#444' }}
                >
                  {layer.locked ? <Lock size={12} /> : layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>

                {/* Delete (only shown on hover via JS, kept simple here) */}
                {!layer.locked && layers.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); onLayerDelete(layer.id) }}
                    title="Delete layer"
                    style={{ ...iconBtn, color: '#444' }}
                    onMouseEnter={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = '#e55' }}
                    onMouseLeave={e => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.color = '#444' }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Tool options section ───────────────────────────────── */}
      {showToolOptions && (
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {activeTool === 'pencil' && (
            <>
              <div>
                <SectionLabel>Color</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PENCIL_COLORS.map(c => (
                    <ColorSwatch
                      key={c} color={c} round
                      selected={toolOptions.pencil.color === c}
                      onClick={() => onToolOptionsChange({ pencil: { ...toolOptions.pencil, color: c } })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Stroke Width</SectionLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                  {STROKE_WIDTHS.map((w, i) => (
                    <SizeButton key={w} label={SIZE_LABELS[i]!}
                      selected={toolOptions.pencil.strokeWidth === w}
                      onClick={() => onToolOptionsChange({ pencil: { ...toolOptions.pencil, strokeWidth: w } })}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTool === 'paintbrush' && (
            <>
              {/* Terrain groups with gradient swatches */}
              {TERRAIN_GROUPS.map(group => (
                <div key={group.label}>
                  <SectionLabel>{group.label}</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {group.entries.map(entry => {
                      const selected = toolOptions.paintbrush.color === entry.base
                      return (
                        <button
                          key={entry.name}
                          title={entry.name}
                          onClick={() => onToolOptionsChange({ paintbrush: { ...toolOptions.paintbrush, color: entry.base } })}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 4,
                            border: selected ? '2px solid #0096ff' : '2px solid transparent',
                            cursor: 'pointer',
                            flexShrink: 0,
                            outline: 'none',
                            background: `radial-gradient(circle at 38% 38%, ${entry.hi}cc, ${entry.base} 55%, ${entry.lo}aa)`,
                            transition: 'transform 0.1s, border-color 0.1s',
                            boxShadow: selected ? '0 0 0 1px #0096ff44' : 'none',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.18)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}

              <div>
                <SectionLabel>Brush Shape</SectionLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['circle', 'square'] as const).map(shape => {
                    const selected = toolOptions.paintbrush.brushShape === shape
                    const Icon = shape === 'circle' ? Circle : Square
                    return (
                      <button
                        key={shape}
                        title={shape.charAt(0).toUpperCase() + shape.slice(1)}
                        onClick={() => onToolOptionsChange({ paintbrush: { ...toolOptions.paintbrush, brushShape: shape } })}
                        style={{
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          border: selected ? '2px solid #0096ff' : '1px solid rgba(255,255,255,0.15)',
                          background: selected ? 'rgba(0,150,255,0.15)' : 'rgba(255,255,255,0.06)',
                          color: selected ? '#0096ff' : 'rgba(255,255,255,0.7)',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <Icon size={16} />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <SectionLabel>Brush Size</SectionLabel>
                <SizeSlider
                  value={toolOptions.paintbrush.brushSize}
                  min={4}
                  max={80}
                  onChange={v => onToolOptionsChange({ paintbrush: { ...toolOptions.paintbrush, brushSize: v } })}
                />
              </div>
            </>
          )}

          {activeTool === 'eraser' && (
            <div>
              <SectionLabel>Eraser Size</SectionLabel>
              <SizeSlider
                value={toolOptions.eraser.size}
                min={4}
                max={80}
                onChange={v => onToolOptionsChange({ eraser: { size: v } })}
              />
            </div>
          )}

          {activeTool === 'text' && (
            <>
              <div>
                <SectionLabel>Color</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TEXT_COLORS.map(c => (
                    <ColorSwatch key={c} color={c} round
                      selected={toolOptions.text.color === c}
                      onClick={() => onToolOptionsChange({ text: { ...toolOptions.text, color: c } })}
                    />
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Font Size</SectionLabel>
                <div style={{ display: 'flex', gap: 4 }}>
                  {FONT_SIZES.map((s, i) => (
                    <SizeButton key={s} label={i < SIZE_LABELS.length ? SIZE_LABELS[i]! : 'XL'}
                      selected={toolOptions.text.fontSize === s}
                      onClick={() => onToolOptionsChange({ text: { ...toolOptions.text, fontSize: s } })}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

const iconBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 3,
  borderRadius: 3,
}
