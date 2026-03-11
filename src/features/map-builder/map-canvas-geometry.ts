import type { MapDocument, MapHexCell, MapScale } from '@/features/core/types'

export interface CanvasPoint {
  x: number
  y: number
}

export interface CanvasViewport {
  offsetX: number
  offsetY: number
  scale: number
}

const SQRT3 = Math.sqrt(3)
const HEX_PADDING = 64

const HEX_RADIUS_BY_SCALE: Record<MapScale, number> = {
  provincial: 30,
  kingdom: 38,
  continental: 46,
}

export const getHexRadiusForDocument = (document: Pick<MapDocument, 'scale'>) =>
  HEX_RADIUS_BY_SCALE[document.scale]

export const axialToPixel = (
  axial: Pick<MapHexCell, 'q' | 'r'>,
  radius: number,
): CanvasPoint => ({
  x: radius * SQRT3 * (axial.q + axial.r / 2),
  y: radius * 1.5 * axial.r,
})

export const pixelToFractionalAxial = (
  point: CanvasPoint,
  radius: number,
): CanvasPoint => ({
  x: ((SQRT3 / 3) * point.x - point.y / 3) / radius,
  y: ((2 / 3) * point.y) / radius,
})

export const roundAxial = ({
  q,
  r,
}: {
  q: number
  r: number
}): {
  q: number
  r: number
} => {
  let x = q
  let z = r
  let y = -x - z

  let rx = Math.round(x)
  let ry = Math.round(y)
  let rz = Math.round(z)

  const xDiff = Math.abs(rx - x)
  const yDiff = Math.abs(ry - y)
  const zDiff = Math.abs(rz - z)

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz
  } else if (yDiff > zDiff) {
    ry = -rx - rz
  } else {
    rz = -rx - ry
  }

  return { q: rx, r: rz }
}

export const pixelToAxial = (point: CanvasPoint, radius: number) => {
  const fractional = pixelToFractionalAxial(point, radius)
  return roundAxial({ q: fractional.x, r: fractional.y })
}

export const getHexCornerPoints = (
  center: CanvasPoint,
  radius: number,
): CanvasPoint[] =>
  Array.from({ length: 6 }, (_, index) => {
    const angle = (Math.PI / 180) * (60 * index - 30)
    return {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle),
    }
  })

export const getDocumentBounds = (hexes: MapHexCell[], radius: number) => {
  if (hexes.length === 0) {
    return {
      minX: -radius,
      minY: -radius,
      maxX: radius,
      maxY: radius,
      width: radius * 2,
      height: radius * 2,
    }
  }

  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const hex of hexes) {
    const center = axialToPixel(hex, radius)
    minX = Math.min(minX, center.x - radius)
    minY = Math.min(minY, center.y - radius)
    maxX = Math.max(maxX, center.x + radius)
    maxY = Math.max(maxY, center.y + radius)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export const createViewportForDocument = (
  document: Pick<MapDocument, 'hexes' | 'scale'>,
  canvasWidth: number,
  canvasHeight: number,
): CanvasViewport => {
  const radius = getHexRadiusForDocument(document)
  const bounds = getDocumentBounds(document.hexes, radius)
  const availableWidth = Math.max(canvasWidth - HEX_PADDING * 2, radius * 2)
  const availableHeight = Math.max(canvasHeight - HEX_PADDING * 2, radius * 2)
  const fitScale = Math.min(
    1,
    availableWidth / Math.max(bounds.width, radius * 2),
    availableHeight / Math.max(bounds.height, radius * 2),
  )

  return {
    scale: fitScale,
    offsetX: canvasWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * fitScale,
    offsetY: canvasHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * fitScale,
  }
}

export const worldToScreen = (
  point: CanvasPoint,
  viewport: CanvasViewport,
): CanvasPoint => ({
  x: point.x * viewport.scale + viewport.offsetX,
  y: point.y * viewport.scale + viewport.offsetY,
})

export const screenToWorld = (
  point: CanvasPoint,
  viewport: CanvasViewport,
): CanvasPoint => ({
  x: (point.x - viewport.offsetX) / viewport.scale,
  y: (point.y - viewport.offsetY) / viewport.scale,
})

export const getVisibleHexes = (
  hexes: MapHexCell[],
  viewport: CanvasViewport,
  radius: number,
  canvasWidth: number,
  canvasHeight: number,
) =>
  hexes.filter((hex) => {
    const center = worldToScreen(axialToPixel(hex, radius), viewport)
    const drawRadius = radius * viewport.scale

    return (
      center.x >= -drawRadius &&
      center.x <= canvasWidth + drawRadius &&
      center.y >= -drawRadius &&
      center.y <= canvasHeight + drawRadius
    )
  })
