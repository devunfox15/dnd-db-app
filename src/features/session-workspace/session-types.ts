// ─── Session Plan Block Types ─────────────────────────────────────────────────

export interface SceneBlock {
  kind: 'scene'
  id: string
  text: string
}

export interface EncounterBlock {
  kind: 'encounter'
  id: string
  monsterName: string
  monsterLookupId?: string
  notes: string
  count: number
}

export interface SecretBlock {
  kind: 'secret'
  id: string
  title: string
  content: string
  dc: number
  skill: string
}

export interface RewardBlock {
  kind: 'reward'
  id: string
  title: string
  xp: number
  loot: string
  notes: string
}

export interface HookBlock {
  kind: 'hook'
  id: string
  title: string
  description: string
  relatedNpcId?: string
}

export type SessionPlanItem =
  | SceneBlock
  | EncounterBlock
  | SecretBlock
  | RewardBlock
  | HookBlock

export interface SessionPlanState {
  items: SessionPlanItem[]
}

// ─── NPC Linking ──────────────────────────────────────────────────────────────

export interface SessionNpcLink {
  npcId: string
  sessionNotes: string
  addedAt: string
}

export interface SessionNpcRosterState {
  linkedNpcs: SessionNpcLink[]
}

// ─── Player Session Overrides ─────────────────────────────────────────────────

export interface SessionPlayerOverride {
  playerId: string
  currentHp: number
  tempHp: number
  conditions: string[]
  concentration: boolean
  deathSaves: { successes: number; failures: number }
  sessionNotes: string
}

export interface SessionPlayersState {
  overrides: SessionPlayerOverride[]
}

// ─── Combat / Initiative Tracker ──────────────────────────────────────────────

export interface CombatantEntry {
  id: string
  kind: 'player' | 'npc' | 'monster'
  sourceId: string
  displayName: string
  initiative: number
  initiativeRoll: number
  currentHp: number
  maxHp: number
  tempHp: number
  armorClass: number
  conditions: string[]
  concentration: boolean
  isActive: boolean
  deathSaves?: { successes: number; failures: number }
  spellSlotsUsed?: Record<number, number>
  notes: string
}

export interface SessionCombatState {
  isRunning: boolean
  round: number
  turn: number
  combatants: CombatantEntry[]
}

// ─── Session Extras ───────────────────────────────────────────────────────────

export interface LootEntry {
  id: string
  description: string
  value: string
  assignedTo: string
  addedAt: string
}

export interface SessionExtrasState {
  xpAwarded: number
  milestoneNote: string
  lootLog: LootEntry[]
  sessionStartedAt: string | null
  sessionEndedAt: string | null
  totalPausedMs: number
}

// ─── D&D Constants ────────────────────────────────────────────────────────────

export const DND_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhaustion 1',
  'Exhaustion 2',
  'Exhaustion 3',
  'Exhaustion 4',
  'Exhaustion 5',
  'Exhaustion 6',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
] as const

export type DndCondition = (typeof DND_CONDITIONS)[number]
