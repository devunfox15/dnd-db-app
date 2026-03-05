import { localStorageAdapter } from '@/features/core/storage'
import { useCampaignStorageState } from '@/features/session-workspace/storage'

export type SessionBoardColumnId =
  | 'active-scene'
  | 'key-npcs'
  | 'possible-locations'
  | 'upcoming-encounters'
  | 'hidden-secrets'
  | 'session-notes'

export interface SessionBoardItem {
  id: string
  title: string
  kind: 'scene' | 'npc' | 'location' | 'encounter' | 'secret' | 'note'
  sourceId?: string
}

export interface SessionBoardState {
  columns: Record<SessionBoardColumnId, SessionBoardItem[]>
}

export const SESSION_BOARD_COLUMNS: Array<{
  id: SessionBoardColumnId
  label: string
}> = [
  { id: 'active-scene', label: 'Active Scene' },
  { id: 'key-npcs', label: 'Key NPCs' },
  { id: 'possible-locations', label: 'Possible Locations' },
  { id: 'upcoming-encounters', label: 'Upcoming Encounters' },
  { id: 'hidden-secrets', label: 'Hidden Secrets' },
  { id: 'session-notes', label: 'Session Notes' },
]

export function defaultSessionBoardState(): SessionBoardState {
  return {
    columns: {
      'active-scene': [],
      'key-npcs': [],
      'possible-locations': [],
      'upcoming-encounters': [],
      'hidden-secrets': [],
      'session-notes': [],
    },
  }
}

function storageKey(campaignId: string) {
  return `dnd-db.workspace.session-board.${campaignId}`
}

export function readSessionBoard(campaignId: string): SessionBoardState {
  const raw = localStorageAdapter.getItem(storageKey(campaignId))
  if (!raw) {
    return defaultSessionBoardState()
  }

  try {
    const parsed = JSON.parse(raw) as SessionBoardState
    if (!parsed?.columns) {
      return defaultSessionBoardState()
    }

    return {
      columns: {
        ...defaultSessionBoardState().columns,
        ...parsed.columns,
      },
    }
  } catch {
    return defaultSessionBoardState()
  }
}

function writeSessionBoard(campaignId: string, state: SessionBoardState) {
  localStorageAdapter.setItem(storageKey(campaignId), JSON.stringify(state))
}

export function addItemToSessionBoard(
  campaignId: string,
  columnId: SessionBoardColumnId,
  item: SessionBoardItem,
) {
  const current = readSessionBoard(campaignId)
  const nextColumn = current.columns[columnId]

  if (nextColumn.some((entry) => entry.id === item.id)) {
    return
  }

  writeSessionBoard(campaignId, {
    columns: {
      ...current.columns,
      [columnId]: [...nextColumn, item],
    },
  })
}

export function useSessionBoard(campaignId: string) {
  const [state, setState] = useCampaignStorageState<SessionBoardState>(
    campaignId,
    'session-board',
    defaultSessionBoardState(),
  )

  return {
    state,
    setState,
  }
}
