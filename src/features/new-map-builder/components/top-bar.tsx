import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Download, Save } from 'lucide-react'

const MAPS_KEY = 'dnd-db.maps'

interface MapRecord {
  id: string
  name: string
  [key: string]: unknown
}

function readMapName(mapId: string): string {
  try {
    const raw = localStorage.getItem(MAPS_KEY)
    if (!raw) return 'Untitled Map'
    const { maps } = JSON.parse(raw) as { maps: MapRecord[] }
    return maps.find(m => m.id === mapId)?.name ?? 'Untitled Map'
  } catch {
    return 'Untitled Map'
  }
}

function writeMapName(mapId: string, name: string): void {
  try {
    const raw = localStorage.getItem(MAPS_KEY)
    if (!raw) return
    const state = JSON.parse(raw) as { maps: MapRecord[] }
    state.maps = state.maps.map(m => m.id === mapId ? { ...m, name } : m)
    localStorage.setItem(MAPS_KEY, JSON.stringify(state))
  } catch {}
}

interface TopBarProps {
  mapId: string
  zoom: number
  onSave: () => void
  onExport: () => void
}

export function TopBar({ mapId, zoom, onSave, onExport }: TopBarProps) {
  const navigate = useNavigate()
  const [name, setName] = useState(() => readMapName(mapId))
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commitName() {
    const trimmed = name.trim() || 'Untitled Map'
    setName(trimmed)
    writeMapName(mapId, trimmed)
    setEditing(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 48,
      background: '#1e1e1e',
      borderBottom: '1px solid #3a3a3a',
      padding: '0 12px',
      gap: 8,
      flexShrink: 0,
    }}>
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/maps' })}
        title="Back to maps"
        style={btnBase}
        onMouseEnter={e => (e.currentTarget.style.background = '#2c2c2c')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <ArrowLeft size={15} />
      </button>

      <div style={{ width: 1, height: 20, background: '#3a3a3a' }} />

      {/* Map name */}
      {editing ? (
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={e => {
            if (e.key === 'Enter') commitName()
            if (e.key === 'Escape') { setName(readMapName(mapId)); setEditing(false) }
          }}
          style={{
            background: '#2c2c2c',
            border: '1px solid #0096ff',
            borderRadius: 4,
            color: '#e5e5e5',
            fontSize: 13,
            fontWeight: 500,
            padding: '3px 8px',
            outline: 'none',
            minWidth: 160,
          }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          title="Click to rename"
          style={{ ...btnBase, fontWeight: 500, fontSize: 13, color: '#e5e5e5', padding: '3px 6px' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2c2c2c')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {name}
        </button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Zoom level */}
      <span style={{ color: '#666', fontSize: 12, minWidth: 36, textAlign: 'center' }}>
        {Math.round(zoom * 100)}%
      </span>

      {/* Save */}
      <button
        onClick={onSave}
        style={actionBtn}
        onMouseEnter={e => (e.currentTarget.style.background = '#3a3a3a')}
        onMouseLeave={e => (e.currentTarget.style.background = '#2c2c2c')}
      >
        <Save size={13} />
        Save
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        style={{ ...actionBtn, background: '#0096ff', border: '1px solid transparent' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#007ddb')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0096ff')}
      >
        <Download size={13} />
        Export PNG
      </button>
    </div>
  )
}

const btnBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
  background: 'transparent',
  border: 'none',
  color: '#a0a0a0',
  borderRadius: 5,
  padding: '4px 8px',
  fontSize: 13,
  cursor: 'pointer',
}

const actionBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  background: '#2c2c2c',
  border: '1px solid #3a3a3a',
  color: '#e5e5e5',
  borderRadius: 5,
  padding: '4px 10px',
  fontSize: 12,
  cursor: 'pointer',
}
