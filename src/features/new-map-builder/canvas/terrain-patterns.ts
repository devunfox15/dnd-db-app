import { TERRAIN_GROUPS } from '../types'

const TILE = 128

function hexToRGB(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

function lerpColor(c1: string, c2: string, t: number): string {
  const a = hexToRGB(c1)
  const b = hexToRGB(c2)
  const r = Math.round(a.r + (b.r - a.r) * t)
  const g = Math.round(a.g + (b.g - a.g) * t)
  const bl = Math.round(a.b + (b.b - a.b) * t)
  return `rgb(${r},${g},${bl})`
}

/** Seamlessly-wrapping value noise grid. gridCells = TILE / scale */
function makeNoiseGrid(gridCells: number): Float32Array {
  const grid = new Float32Array(gridCells * gridCells)
  for (let i = 0; i < grid.length; i++) grid[i] = Math.random()
  return grid
}

function sampleNoise(grid: Float32Array, gridCells: number, scale: number, x: number, y: number): number {
  const gx = x / scale
  const gy = y / scale
  const ix = Math.floor(gx)
  const iy = Math.floor(gy)
  const fx = gx - ix
  const fy = gy - iy
  const sf = (t: number) => t * t * (3 - 2 * t) // smoothstep
  const wrap = (v: number) => ((v % gridCells) + gridCells) % gridCells
  const idx = (r: number, c: number) => wrap(r) * gridCells + wrap(c)
  const v00 = grid[idx(iy, ix)]!
  const v10 = grid[idx(iy, ix + 1)]!
  const v01 = grid[idx(iy + 1, ix)]!
  const v11 = grid[idx(iy + 1, ix + 1)]!
  const top = v00 + sf(fx) * (v10 - v00)
  const bot = v01 + sf(fx) * (v11 - v01)
  return top + sf(fy) * (bot - top)
}

/** Multi-octave seamless value noise 0..1. Scales must divide TILE evenly. */
function fbm(x: number, y: number, octaves: number, grids: Float32Array[], gridCells: number[], scales: number[]): number {
  let val = 0
  let amp = 1
  let total = 0
  for (let i = 0; i < octaves; i++) {
    val += sampleNoise(grids[i]!, gridCells[i]!, scales[i]!, x, y) * amp
    total += amp
    amp *= 0.5
  }
  return val / total
}

/** Create noise layers with scales that divide TILE evenly */
function makeNoiseLayers(scales: number[]): { grids: Float32Array[]; gridCells: number[]; scales: number[] } {
  const gridCells = scales.map(s => TILE / s)
  const grids = gridCells.map(c => makeNoiseGrid(c))
  return { grids, gridCells, scales }
}

function createTile(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = TILE
  c.height = TILE
  return [c, c.getContext('2d')!]
}

// ── Terrain-specific generators ──────────────────────────────────────────────
// All scales must divide TILE (128) evenly: 4, 8, 16, 32, 64

function generateWater(base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([32, 16, 8])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      const t = n
      ctx.fillStyle = t < 0.4 ? lerpColor(lo, base, t / 0.4)
        : t < 0.65 ? base
          : lerpColor(base, hi, (t - 0.65) / 0.35)
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return tile
}

function generateForest(base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([32, 16, 4])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      ctx.fillStyle = lerpColor(lo, hi, n)
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Tree canopy blobs — draw at wrapped positions for seamless tiling
  const blobCount = 12 + Math.floor(Math.random() * 6)
  for (let i = 0; i < blobCount; i++) {
    const cx = Math.random() * TILE
    const cy = Math.random() * TILE
    const r = 4 + Math.random() * 8
    const shade = Math.random()
    const color = shade < 0.3 ? lo : shade < 0.7 ? base : hi
    ctx.globalAlpha = 0.25 + Math.random() * 0.3
    ctx.fillStyle = color
    // Draw blob at original + wrapped positions for seamless edges
    for (const ox of [0, TILE, -TILE]) {
      for (const oy of [0, TILE, -TILE]) {
        ctx.beginPath()
        ctx.moveTo(cx + ox + r, cy + oy)
        for (let a = 0; a < Math.PI * 2; a += 0.4) {
          const wobble = r * (0.7 + Math.random() * 0.6)
          ctx.lineTo(cx + ox + Math.cos(a) * wobble, cy + oy + Math.sin(a) * wobble)
        }
        ctx.closePath()
        ctx.fill()
      }
    }
  }
  ctx.globalAlpha = 1
  return tile
}

function generateGrassland(_base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([32, 16, 8])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      ctx.fillStyle = lerpColor(lo, hi, n)
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Grass blade streaks
  ctx.globalAlpha = 0.15
  for (let i = 0; i < 40; i++) {
    const sx = Math.random() * TILE
    const sy = Math.random() * TILE
    const len = 3 + Math.random() * 6
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8
    ctx.strokeStyle = Math.random() < 0.5 ? hi : lo
    ctx.lineWidth = 0.5 + Math.random()
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return tile
}

function generateMountain(_base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([32, 16, 4])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      const sharp = Math.abs(n - 0.5) * 2
      ctx.fillStyle = lerpColor(lo, hi, sharp)
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Rocky crack lines
  ctx.globalAlpha = 0.2
  ctx.strokeStyle = lo
  ctx.lineWidth = 0.5
  for (let i = 0; i < 15; i++) {
    let cx = Math.random() * TILE
    let cy = Math.random() * TILE
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    const segments = 3 + Math.floor(Math.random() * 5)
    for (let s = 0; s < segments; s++) {
      cx += (Math.random() - 0.5) * 12
      cy += (Math.random() - 0.5) * 12
      ctx.lineTo(cx, cy)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return tile
}

function generateDesert(_base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([64, 16, 8])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      ctx.fillStyle = lerpColor(lo, hi, n)
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Fine sand grain dots
  ctx.globalAlpha = 0.08
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? hi : lo
    ctx.fillRect(
      Math.floor(Math.random() * TILE),
      Math.floor(Math.random() * TILE),
      1, 1,
    )
  }
  ctx.globalAlpha = 1
  return tile
}

function generateSwamp(_base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([32, 16, 4])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      ctx.fillStyle = lerpColor(lo, hi, n)
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Dark murky pools — wrapped for seamless tiling
  ctx.globalAlpha = 0.3
  for (let i = 0; i < 6; i++) {
    const cx = Math.random() * TILE
    const cy = Math.random() * TILE
    const rx = 4 + Math.random() * 10
    const ry = 3 + Math.random() * 7
    ctx.fillStyle = lo
    for (const ox of [0, TILE, -TILE]) {
      for (const oy of [0, TILE, -TILE]) {
        ctx.beginPath()
        ctx.ellipse(cx + ox, cy + oy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  ctx.globalAlpha = 1
  return tile
}

function generateLava(base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([32, 16, 4])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      ctx.fillStyle = n < 0.35 ? lerpColor(lo, base, n / 0.35)
        : n < 0.7 ? lerpColor(base, hi, (n - 0.35) / 0.35)
          : hi
      ctx.fillRect(x, y, 1, 1)
    }
  }

  // Dark crust cracks
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = lo
  ctx.lineWidth = 1
  for (let i = 0; i < 10; i++) {
    let cx = Math.random() * TILE
    let cy = Math.random() * TILE
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    const segments = 2 + Math.floor(Math.random() * 4)
    for (let s = 0; s < segments; s++) {
      cx += (Math.random() - 0.5) * 16
      cy += (Math.random() - 0.5) * 16
      ctx.lineTo(cx, cy)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  return tile
}

function generateSnow(_base: string, hi: string, lo: string): HTMLCanvasElement {
  const [tile, ctx] = createTile()
  const nl = makeNoiseLayers([32, 16, 8])

  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = fbm(x, y, 3, nl.grids, nl.gridCells, nl.scales)
      const t = 0.3 + n * 0.7
      ctx.fillStyle = lerpColor(lo, hi, t)
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return tile
}

// ── Terrain name → generator mapping ─────────────────────────────────────────

type Generator = (base: string, hi: string, lo: string) => HTMLCanvasElement

const GENERATORS: Record<string, Generator> = {
  'Deep Ocean': generateWater,
  'Sea': generateWater,
  'Shallows': generateWater,
  'Forest': generateForest,
  'Jungle': generateForest,
  'Grassland': generateGrassland,
  'Savanna': generateGrassland,
  'Mountains': generateMountain,
  'Snow': generateSnow,
  'Desert': generateDesert,
  'Badlands': generateDesert,
  'Swamp': generateSwamp,
  'Lava': generateLava,
}

// ── Cache + public API ───────────────────────────────────────────────────────

const patternCache = new Map<string, CanvasPattern>()
let isInit = false

export function initTerrainPatterns(ctx: CanvasRenderingContext2D): void {
  if (isInit) return
  for (const group of TERRAIN_GROUPS) {
    for (const entry of group.entries) {
      const gen = GENERATORS[entry.name] ?? generateGrassland
      const tile = gen(entry.base, entry.hi, entry.lo)
      const pattern = ctx.createPattern(tile, 'repeat')
      if (pattern) patternCache.set(entry.base, pattern)
    }
  }
  isInit = true
}

export function getTerrainPattern(baseColor: string): CanvasPattern | null {
  return patternCache.get(baseColor) ?? null
}
