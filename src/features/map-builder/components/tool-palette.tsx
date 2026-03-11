import {
  Brush,
  Eraser,
  Hand,
  MapPin,
  MousePointer2,
  Type,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { MapBuilderTool } from '../types'

const toolDefinitions: Array<{
  tool: MapBuilderTool
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { tool: 'pan', label: 'Pan Tool', icon: Hand },
  { tool: 'select', label: 'Select Tool', icon: MousePointer2 },
  { tool: 'terrain', label: 'Terrain Brush', icon: Brush },
  { tool: 'erase', label: 'Erase Tool', icon: Eraser },
  { tool: 'label', label: 'Label Tool', icon: Type },
  { tool: 'pin', label: 'Pin Tool', icon: MapPin },
]

export const ToolPalette = ({
  activeTool,
  onToolChange,
}: {
  activeTool: MapBuilderTool
  onToolChange: (tool: MapBuilderTool) => void
}) => (
  <TooltipProvider>
    <div className="flex flex-col gap-2 rounded-xl border bg-card/80 p-2">
      {toolDefinitions.map(({ tool, label, icon: Icon }) => (
        <Tooltip key={tool}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={activeTool === tool ? 'default' : 'outline'}
              aria-label={label}
              onClick={() => onToolChange(tool)}
            >
              <Icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  </TooltipProvider>
)
