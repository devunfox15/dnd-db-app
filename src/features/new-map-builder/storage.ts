const KEY = (mapId: string, layerId: string) => `map-canvas-${mapId}-layer-${layerId}`

export function saveLayer(mapId: string, layerId: string, canvas: HTMLCanvasElement): void {
  try {
    localStorage.setItem(KEY(mapId, layerId), canvas.toDataURL())
  } catch {
    // localStorage quota exceeded — silently ignore
  }
}

export function loadLayer(mapId: string, layerId: string, canvas: HTMLCanvasElement): void {
  const data = localStorage.getItem(KEY(mapId, layerId))
  if (!data) return
  const img = new Image()
  img.onload = () => canvas.getContext('2d')?.drawImage(img, 0, 0)
  img.src = data
}

export function clearMap(mapId: string, layerIds: string[]): void {
  layerIds.forEach(id => localStorage.removeItem(KEY(mapId, id)))
}
