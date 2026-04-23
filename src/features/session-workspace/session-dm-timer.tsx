import { useEffect, useMemo, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

interface TimerState {
  running: boolean
  /** ms accumulated while running, up to lastTickAt */
  accumulatedMs: number
  /** ISO timestamp of last tick start, or null when paused */
  lastTickAt: string | null
}

const initial: TimerState = {
  running: false,
  accumulatedMs: 0,
  lastTickAt: null,
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`
}

interface SessionDmTimerProps {
  campaignId: string
  sessionId: string
}

export function SessionDmTimer({ campaignId, sessionId }: SessionDmTimerProps) {
  const [state, setState] = useCampaignStorageState<TimerState>(
    campaignId,
    `session-timer-${sessionId}`,
    initial,
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!state.running) return
    const interval = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(interval)
  }, [state.running])

  const elapsed = useMemo(() => {
    if (!state.running || !state.lastTickAt) return state.accumulatedMs
    const started = Date.parse(state.lastTickAt)
    if (Number.isNaN(started)) return state.accumulatedMs
    return state.accumulatedMs + (now - started)
  }, [now, state.accumulatedMs, state.lastTickAt, state.running])

  function start() {
    setState({
      running: true,
      accumulatedMs: state.accumulatedMs,
      lastTickAt: new Date().toISOString(),
    })
  }

  function pause() {
    setState({
      running: false,
      accumulatedMs: elapsed,
      lastTickAt: null,
    })
  }

  function reset() {
    setState(initial)
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg border bg-card px-2 py-1 shadow-sm">
      <Timer className="size-3.5 text-muted-foreground" />
      <span className="min-w-[4.5rem] text-center font-mono text-sm tabular-nums">
        {formatDuration(elapsed)}
      </span>
      {state.running ? (
        <Button
          size="icon"
          variant="ghost"
          onClick={pause}
          aria-label="Pause timer"
          className="size-7"
        >
          <Pause className="size-3.5" />
        </Button>
      ) : (
        <Button
          size="icon"
          variant="ghost"
          onClick={start}
          aria-label="Start timer"
          className="size-7"
        >
          <Play className="size-3.5" />
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={reset}
        aria-label="Reset timer"
        className="size-7"
      >
        <RotateCcw className="size-3.5" />
      </Button>
    </div>
  )
}
