import {
  Eraser,
  Grid3x3,
  Hand,
  MousePointer2,
  Paintbrush,
  Pencil,
  Type,
  Undo2,
} from 'lucide-react'

import type { ToolId } from '../types'

interface ToolDef {
  id: ToolId
  icon: React.ElementType
  label: string
  description: string
}

const TOOL_GROUPS: { tools: ToolDef[] }[] = [
  {
    tools: [
      {
        id: 'select',
        icon: MousePointer2,
        label: 'Select',
        description: 'Select and move elements on the map.',
      },
      {
        id: 'pan',
        icon: Hand,
        label: 'Pan',
        description: 'Click and drag to pan the canvas view.',
      },
    ],
  },
  {
    tools: [
      {
        id: 'pencil',
        icon: Pencil,
        label: 'Pencil',
        description: 'Freehand draw paths, walls, and borders.',
      },
      {
        id: 'paintbrush',
        icon: Paintbrush,
        label: 'Paint Brush',
        description: 'Paint terrain and fill areas with color.',
      },
      {
        id: 'eraser',
        icon: Eraser,
        label: 'Eraser',
        description: 'Erase drawn strokes and painted areas.',
      },
      {
        id: 'text',
        icon: Type,
        label: 'Text',
        description: 'Click the map to add labels and annotations.',
      },
    ],
  },
  {
    tools: [
      {
        id: 'grid',
        icon: Grid3x3,
        label: 'Grid',
        description: 'Toggle the 10×10 grid overlay on or off.',
      },
    ],
  },
  {
    tools: [
      {
        id: 'undo',
        icon: Undo2,
        label: 'Undo',
        description: 'Undo the last drawn stroke or placed text.',
      },
    ],
  },
]

interface MapToolkitPageProps {
  activeTool: ToolId
  showGrid: boolean
  onToolClick: (toolId: ToolId) => void
}

export default function MapToolkitPage({ activeTool, showGrid, onToolClick }: MapToolkitPageProps) {
  function isActive(tool: ToolDef) {
    if (tool.id === 'grid') return showGrid
    return activeTool === tool.id
  }

  return (
    <div style={{
      width: 44,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      borderRight: '1px solid #3a3a3a',
      paddingTop: 8,
      paddingBottom: 8,
      gap: 0,
    }}>
      {TOOL_GROUPS.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div style={{ margin: '6px 8px', borderTop: '1px solid #3a3a3a' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px' }}>
            {group.tools.map(tool => {
              const Icon = tool.icon
              const active = isActive(tool)
              return (
                <div key={tool.id} style={{ position: 'relative' }} className="group/tool">
                  <button
                    onClick={() => onToolClick(tool.id)}
                    aria-label={tool.label}
                    title={tool.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      border: 'none',
                      cursor: 'pointer',
                      background: active ? '#0096ff' : 'transparent',
                      color: active ? '#fff' : '#888',
                      transition: 'background 0.1s, color 0.1s',
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.background = '#2c2c2c'
                        e.currentTarget.style.color = '#e5e5e5'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#888'
                      }
                    }}
                  >
                    <Icon size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
