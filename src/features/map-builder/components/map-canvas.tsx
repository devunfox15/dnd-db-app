import type { HexTerrain, MapFeature } from '@/features/core/types'

import { cn } from '@/lib/utils'

import type { ResolvedMapDocument } from '../types'

const terrainClasses: Record<HexTerrain, string> = {
  water: 'bg-sky-600/80 text-white',
  coast: 'bg-cyan-300/70 text-slate-900',
  plains: 'bg-amber-100 text-slate-900',
  forest: 'bg-emerald-700/80 text-white',
  hills: 'bg-orange-300 text-slate-950',
  mountains: 'bg-slate-600 text-white',
  desert: 'bg-yellow-300 text-slate-950',
  swamp: 'bg-lime-700/70 text-white',
  tundra: 'bg-slate-200 text-slate-900',
}

const featureClass = (feature: MapFeature) =>
  feature.kind === 'location-pin'
    ? 'bg-primary text-primary-foreground'
    : 'bg-secondary text-secondary-foreground'

export const MapCanvas = ({
  document,
  selectedFeatureId,
  selectedHexId,
  onFeatureSelect,
  onHexSelect,
}: {
  document: ResolvedMapDocument
  selectedFeatureId: string | null
  selectedHexId: string | null
  onFeatureSelect: (featureId: string) => void
  onHexSelect: (hexId: string) => void
}) => (
  <div
    className="rounded-2xl border bg-muted/10 p-4"
    style={{
      backgroundImage:
        'linear-gradient(120deg, rgba(148,163,184,0.08) 25%, transparent 25%), linear-gradient(60deg, rgba(148,163,184,0.08) 25%, transparent 25%)',
      backgroundSize: '36px 20px',
    }}
  >
    <div
      className="grid gap-3"
      style={{
        gridTemplateColumns: `repeat(${Math.max(document.width, 1)}, minmax(88px, 1fr))`,
      }}
    >
      {document.hexes.map((hex) => {
        const labels = document.labels.filter((label) => label.hexId === hex.id)
        const features = document.features.filter((feature) => feature.hexId === hex.id)

        return (
          <div
            key={hex.id}
            data-testid={hex.id}
            data-terrain={hex.terrain}
            className={cn(
              'relative min-h-28 cursor-pointer overflow-hidden border border-black/10 p-3 shadow-sm transition-transform hover:-translate-y-0.5',
              terrainClasses[hex.terrain],
              selectedHexId === hex.id && 'ring-2 ring-primary ring-offset-2',
            )}
            style={{
              clipPath:
                'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)',
              marginTop: hex.q % 2 === 0 ? '0px' : '22px',
            }}
            onClick={() => onHexSelect(hex.id)}
          >
            <div className="flex items-start justify-between gap-2 text-[11px] uppercase tracking-wide">
              <span>{hex.terrain}</span>
              <span>
                {hex.q},{hex.r}
              </span>
            </div>

            <div className="mt-3 space-y-1">
              {labels.map((label) => (
                <p key={label.id} className="text-sm font-semibold">
                  {label.text}
                </p>
              ))}
            </div>

            <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  aria-label={`${feature.label} pin`}
                  className={cn(
                    'rounded-full px-2 py-1 text-[11px] font-medium shadow-sm',
                    featureClass(feature),
                    selectedFeatureId === feature.id && 'ring-2 ring-white/80',
                  )}
                  onClick={(event) => {
                    event.stopPropagation()
                    onFeatureSelect(feature.id)
                  }}
                >
                  {feature.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)
