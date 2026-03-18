export type DrawToolId = 'select' | 'pan' | 'pencil' | 'paintbrush' | 'eraser' | 'text'
export type ToggleToolId = 'grid' | 'undo'
export type ToolId = DrawToolId | ToggleToolId

export interface PencilOptions {
  color: string
  strokeWidth: number
}

export interface PaintbrushOptions {
  color: string
  brushSize: number
}

export interface EraserOptions {
  size: number
}

export interface TextOptions {
  color: string
  fontSize: number
}

export interface ToolOptions {
  pencil: PencilOptions
  paintbrush: PaintbrushOptions
  eraser: EraserOptions
  text: TextOptions
}

export interface Layer {
  id: string
  name: string
  visible: boolean
  locked: boolean
}

// ── Palettes ──────────────────────────────────────────────────────────────────

export const PENCIL_COLORS = [
  '#1a0f00',
  '#3f2b1a',
  '#7a4e2d',
  '#c0392b',
  '#1a3a5c',
  '#2d5a27',
  '#5c3d99',
  '#f5e6c8',
]

export interface TerrainEntry {
  name: string
  base: string        // primary fill color; used as swatch and lookup key
  hi: string          // highlight/speck color (lighter)
  lo: string          // shadow/speck color (darker)
  speckCount: number  // base number of specks at brushSize=16
  gradient?: 'radial-out' // optional gradient fill mode
}

export interface TerrainGroup {
  label: string
  entries: TerrainEntry[]
}

export const TERRAIN_GROUPS: TerrainGroup[] = [
  {
    label: 'Water',
    entries: [
      { name: 'Deep Ocean',     base: '#0e3d78', hi: '#1a5490', lo: '#071f45', speckCount: 6,  gradient: 'radial-out' },
      { name: 'Open Sea',       base: '#1a5890', hi: '#2872ac', lo: '#103868', speckCount: 6,  gradient: 'radial-out' },
      { name: 'Coastal Water',  base: '#3286ac', hi: '#4ea8cc', lo: '#1e6080', speckCount: 6,  gradient: 'radial-out' },
      { name: 'Shallow Lagoon', base: '#52b8b4', hi: '#78d4d0', lo: '#349090', speckCount: 6,  gradient: 'radial-out' },
    ],
  },
  {
    label: 'Forest',
    entries: [
      { name: 'Dense Forest', base: '#1a4c24', hi: '#286835', lo: '#0c2814', speckCount: 14 },
      { name: 'Woodland',     base: '#2a6832', hi: '#3c8044', lo: '#183820', speckCount: 14 },
      { name: 'Jungle',       base: '#0c4018', hi: '#185828', lo: '#061008', speckCount: 14 },
      { name: 'Shrubland',    base: '#547838', hi: '#6a9248', lo: '#385428', speckCount: 10 },
    ],
  },
  {
    label: 'Grassland',
    entries: [
      { name: 'Meadow',    base: '#44902c', hi: '#60b040', lo: '#2c6018', speckCount: 10 },
      { name: 'Grassland', base: '#6ea440', hi: '#88c050', lo: '#4c7828', speckCount: 10 },
      { name: 'Savanna',   base: '#a88828', hi: '#c0a83c', lo: '#785e18', speckCount: 10 },
    ],
  },
  {
    label: 'Mountains',
    entries: [
      { name: 'Foothills',   base: '#806040', hi: '#a07c55', lo: '#583c28', speckCount: 8 },
      { name: 'Highlands',   base: '#624e38', hi: '#7e6450', lo: '#3e2e20', speckCount: 8 },
      { name: 'Mountains',   base: '#525058', hi: '#706c7c', lo: '#363440', speckCount: 8 },
      { name: 'Snow Peaks',  base: '#c4d8e8', hi: '#e0eef8', lo: '#9ab0c8', speckCount: 6 },
    ],
  },
  {
    label: 'Desert',
    entries: [
      { name: 'Desert',     base: '#cc9830', hi: '#e8b848', lo: '#906818', speckCount: 8 },
      { name: 'Sand Dunes', base: '#d8ba60', hi: '#f0d888', lo: '#a88038', speckCount: 8 },
      { name: 'Red Rock',   base: '#985828', hi: '#b47040', lo: '#6c3414', speckCount: 8 },
    ],
  },
  {
    label: 'Special',
    entries: [
      { name: 'Tundra',   base: '#8ab0c4', hi: '#aacce0', lo: '#6890a8', speckCount: 10 },
      { name: 'Swamp',    base: '#365428', hi: '#4c6c38', lo: '#1e3015', speckCount: 14 },
      { name: 'Lava',     base: '#b83810', hi: '#d85c20', lo: '#780808', speckCount: 6  },
      { name: 'Farmland', base: '#b0a840', hi: '#ccc058', lo: '#808020', speckCount: 10 },
    ],
  },
]

// Flat lookup keyed by base color hex — used by canvas renderer
export const TERRAIN_TEXTURE_MAP: Record<string, TerrainEntry> = Object.fromEntries(
  TERRAIN_GROUPS.flatMap(g => g.entries.map(e => [e.base, e])),
)

// Kept for legacy / default color access
export const TERRAIN_COLORS: Record<string, string> = Object.fromEntries(
  TERRAIN_GROUPS.flatMap(g => g.entries.map(e => [e.name, e.base])),
)

export const TEXT_COLORS = [
  '#1a0f00',
  '#3f2b1a',
  '#c0392b',
  '#1a3a5c',
  '#2d5a27',
  '#f5e6c8',
]

export type GridType = 'square' | 'hexagon'
export type GridSize = 10 | 25 | 50 | 100

export const GRID_SIZES: GridSize[] = [10, 25, 50, 100]
export const DEFAULT_GRID_TYPE: GridType = 'square'
export const DEFAULT_GRID_SIZE: GridSize = 10

export const STROKE_WIDTHS = [1, 2, 4, 8]
export const BRUSH_SIZES   = [8, 16, 32, 64]
export const ERASER_SIZES  = [8, 16, 32, 64]
export const FONT_SIZES    = [12, 16, 20, 28, 36]

export const SIZE_LABELS = ['XS', 'S', 'M', 'L']

export const DEFAULT_TOOL_OPTIONS: ToolOptions = {
  pencil:     { color: '#1a0f00', strokeWidth: 2 },
  paintbrush: { color: '#44902c', brushSize: 16 },
  eraser:     { size: 16 },
  text:       { color: '#1a0f00', fontSize: 16 },
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'markers',  name: 'Markers',  visible: true, locked: false },
  { id: 'labels',   name: 'Labels',   visible: true, locked: false },
  { id: 'details',  name: 'Details',  visible: true, locked: false },
  { id: 'terrain',  name: 'Terrain',  visible: true, locked: false },
]
