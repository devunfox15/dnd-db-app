import type {
  AppState,
  Campaign,
  DmNote,
  LookupEntry,
  MapRecord,
  NpcCharacter,
  StoryPin,
  TimelineEvent,
} from './types'

const now = () => new Date().toISOString()

export const DEFAULT_CAMPAIGN_ID = 'campaign-default'

const defaultCampaign: Campaign = {
  id: DEFAULT_CAMPAIGN_ID,
  campaignId: DEFAULT_CAMPAIGN_ID,
  name: 'Default Campaign',
  description: 'Starter campaign for DM workspace',
  rpgSystem: 'dnd-5e',
  createdAt: now(),
  updatedAt: now(),
  tags: ['starter'],
}

const starterNotes: DmNote[] = [
  {
    id: 'note-1',
    campaignId: DEFAULT_CAMPAIGN_ID,
    title: 'Session Zero Setup',
    body: 'Outline party goals and establish table expectations.',
    area: 'Town of Greenhollow',
    linkedPinIds: [],
    createdAt: now(),
    updatedAt: now(),
    tags: ['session-zero'],
  },
]

const starterPins: StoryPin[] = [
  {
    id: 'pin-1',
    campaignId: DEFAULT_CAMPAIGN_ID,
    title: 'Missing Caravan Hook',
    summary: 'The mayor asks the party to find a vanished caravan.',
    status: 'active',
    sourceType: 'note',
    sourceId: 'note-1',
    createdAt: now(),
    updatedAt: now(),
    tags: ['hook'],
  },
]

const starterMaps: MapRecord[] = [
  {
    id: 'map-1',
    campaignId: DEFAULT_CAMPAIGN_ID,
    name: 'Greenhollow Road',
    region: 'Frontier',
    description: 'Road section where the caravan disappeared.',
    imageUrl: '',
    usedNpcIds: [],
    linkedPinIds: ['pin-1'],
    usedInStory: true,
    createdAt: now(),
    updatedAt: now(),
    tags: ['road'],
  },
]

const starterNpcs: NpcCharacter[] = [
  {
    id: 'npc-1',
    campaignId: DEFAULT_CAMPAIGN_ID,
    name: 'Mayor Ilra',
    role: 'Quest Giver',
    faction: 'Town Council',
    notes: 'Worried about trade disruption.',
    usedInMapIds: ['map-1'],
    usedInTimelineEventIds: [],
    createdAt: now(),
    updatedAt: now(),
    tags: ['town'],
  },
]

const starterTimeline: TimelineEvent[] = [
  {
    id: 'event-1',
    campaignId: DEFAULT_CAMPAIGN_ID,
    title: 'Caravan Disappears',
    details: 'Start of mystery arc.',
    sessionNumber: 1,
    orderIndex: 1,
    status: 'active',
    isCurrent: true,
    relatedNpcIds: ['npc-1'],
    relatedNoteIds: ['note-1'],
    createdAt: now(),
    updatedAt: now(),
    tags: ['arc-one'],
  },
]

const starterLookup: LookupEntry[] = [
  {
    id: 'lookup-1',
    campaignId: DEFAULT_CAMPAIGN_ID,
    title: 'Opportunity Attack',
    category: 'Combat Rule',
    summary: 'Make a melee attack when a hostile creature leaves your reach.',
    details: 'Use your reaction to make one melee attack against the provoking creature.',
    createdAt: now(),
    updatedAt: now(),
    tags: ['combat'],
  },
  {
    id: 'lookup-2',
    campaignId: DEFAULT_CAMPAIGN_ID,
    title: 'Goblin',
    category: 'Monster',
    summary: 'Small humanoid, nimble and opportunistic.',
    details: 'Often found in raiding bands and ambushes.',
    createdAt: now(),
    updatedAt: now(),
    tags: ['monster'],
  },
]

export function createSampleState(version: number): AppState {
  return {
    version,
    activeCampaignId: DEFAULT_CAMPAIGN_ID,
    campaigns: [defaultCampaign],
    notes: starterNotes,
    pins: starterPins,
    maps: starterMaps,
    npcs: starterNpcs,
    playerCharacters: [],
    timelineEvents: starterTimeline,
    lookupEntries: starterLookup,
  }
}
