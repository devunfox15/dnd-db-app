export type DrawToolId =
  | 'select'
  | 'pan'
  | 'pencil'
  | 'paintbrush'
  | 'eraser'
  | 'text'
export type ToggleToolId = 'grid' | 'undo'
export type ToolId = DrawToolId | ToggleToolId

export interface PencilOptions {
  color: string
  strokeWidth: number
}

export type BrushShape = 'circle' | 'square'

export interface PaintbrushOptions {
  color: string
  brushSize: number
  brushShape: BrushShape
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
  base: string // primary fill color; used as swatch and lookup key
  hi: string // highlight/speck color (lighter)
  lo: string // shadow/speck color (darker)
  speckCount: number // base number of specks at brushSize=16
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
      {
        name: 'Deep Ocean',
        base: '#1a5088',
        hi: '#2868a0',
        lo: '#0e3460',
        speckCount: 6,
        gradient: 'radial-out',
      },
      {
        name: 'Sea',
        base: '#2e90cc',
        hi: '#48a8e0',
        lo: '#1a6ea0',
        speckCount: 6,
        gradient: 'radial-out',
      },
      {
        name: 'Shallows',
        base: '#48c4b8',
        hi: '#68dcd2',
        lo: '#30a090',
        speckCount: 6,
        gradient: 'radial-out',
      },
    ],
  },
  {
    label: 'Vegetation',
    entries: [
      {
        name: 'Forest',
        base: '#287838',
        hi: '#3c9048',
        lo: '#185828',
        speckCount: 12,
      },
      {
        name: 'Jungle',
        base: '#186028',
        hi: '#2c7838',
        lo: '#0c4018',
        speckCount: 14,
      },
      {
        name: 'Grassland',
        base: '#60b030',
        hi: '#78c848',
        lo: '#449020',
        speckCount: 10,
      },
      {
        name: 'Savanna',
        base: '#c0a030',
        hi: '#d8b848',
        lo: '#988018',
        speckCount: 10,
      },
    ],
  },
  {
    label: 'Highland',
    entries: [
      {
        name: 'Mountains',
        base: '#706878',
        hi: '#8a8294',
        lo: '#504858',
        speckCount: 8,
      },
      {
        name: 'Snow',
        base: '#c8d8e8',
        hi: '#e0ecf4',
        lo: '#a0b8cc',
        speckCount: 6,
      },
    ],
  },
  {
    label: 'Arid',
    entries: [
      {
        name: 'Desert',
        base: '#d0a040',
        hi: '#e8b858',
        lo: '#a87828',
        speckCount: 8,
      },
      {
        name: 'Badlands',
        base: '#b06030',
        hi: '#c87848',
        lo: '#884420',
        speckCount: 8,
      },
    ],
  },
  {
    label: 'Special',
    entries: [
      {
        name: 'Swamp',
        base: '#4a6e38',
        hi: '#5e8848',
        lo: '#304e24',
        speckCount: 12,
      },
      {
        name: 'Lava',
        base: '#c83818',
        hi: '#e05028',
        lo: '#901808',
        speckCount: 6,
      },
    ],
  },
]

// Flat lookup keyed by base color hex — used by canvas renderer
export const TERRAIN_TEXTURE_MAP: Record<string, TerrainEntry> =
  Object.fromEntries(
    TERRAIN_GROUPS.flatMap((g) => g.entries.map((e) => [e.base, e])),
  )

// Kept for legacy / default color access
export const TERRAIN_COLORS: Record<string, string> = Object.fromEntries(
  TERRAIN_GROUPS.flatMap((g) => g.entries.map((e) => [e.name, e.base])),
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
export type GridSize = 10 | 25 | 40

export const GRID_SIZES: GridSize[] = [10, 25, 40]
export const DEFAULT_GRID_TYPE: GridType = 'square'
export const DEFAULT_GRID_SIZE: GridSize = 10

export const STROKE_WIDTHS = [1, 2, 4, 8]
export const BRUSH_SIZES = [8, 16, 32, 64]
export const ERASER_SIZES = [8, 16, 32, 64]
export const FONT_SIZES = [12, 16, 20, 28, 36]

export const SIZE_LABELS = ['XS', 'S', 'M', 'L']

export const DEFAULT_TOOL_OPTIONS: ToolOptions = {
  pencil: { color: '#1a0f00', strokeWidth: 2 },
  paintbrush: {
    color: '#60b030',
    brushSize: 16,
    brushShape: 'circle' as BrushShape,
  },
  eraser: { size: 16 },
  text: { color: '#1a0f00', fontSize: 16 },
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'labels', name: 'Labels', visible: true, locked: false },
  { id: 'icons', name: 'Icons', visible: true, locked: false },
  { id: 'paths', name: 'Paths', visible: true, locked: false },
  { id: 'terrain', name: 'Terrain', visible: true, locked: false },
]
