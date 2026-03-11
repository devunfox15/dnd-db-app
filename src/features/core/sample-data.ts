import type {
  AppState,
  Campaign,
  DmNote,
  LookupEntry,
  MapDocument,
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
    kind: 'world',
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
  {
    id: 'map-2',
    campaignId: DEFAULT_CAMPAIGN_ID,
    kind: 'session',
    name: 'Ruined Watchtower',
    region: 'Greenhollow March',
    description: 'Local detail map for the ruined tower approach.',
    imageUrl: '',
    usedNpcIds: ['npc-1'],
    linkedPinIds: ['pin-1'],
    usedInStory: true,
    createdAt: now(),
    updatedAt: now(),
    tags: ['tower', 'session'],
  },
]

const starterMapDocuments: MapDocument[] = [
  {
    id: 'mapdoc-1',
    campaignId: DEFAULT_CAMPAIGN_ID,
    kind: 'world',
    summaryMapId: 'map-1',
    name: 'Greenhollow Road',
    regionName: 'Greenhollow March',
    scale: 'provincial',
    hexSizeMiles: 1,
    width: 5,
    height: 5,
    seed: 7,
    parentMapId: null,
    parentHexId: null,
    childMapIdsByHex: {
      'hex-0-0': 'mapdoc-2',
    },
    hexes: [
      {
        id: 'hex-0-0',
        q: 0,
        r: 0,
        terrain: 'forest',
        elevation: 0.4,
        climate: 'temperate',
        travelDifficulty: 2,
        notes: '',
        tags: [],
        resource: 'timber',
      },
    ],
    labels: [
      {
        id: 'label-1',
        text: 'Greenhollow March',
        hexId: 'hex-0-0',
        offsetX: 0,
        offsetY: 0,
      },
    ],
    features: [
      {
        id: 'feature-1',
        kind: 'location-pin',
        label: 'Greenhollow',
        hexId: 'hex-0-0',
        linkedNpcIds: ['npc-1'],
        linkedPinIds: ['pin-1'],
        linkedMapDocumentId: 'mapdoc-2',
        notes: 'Trade stop near the road.',
      },
    ],
    generationSettings: {
      biomeBias: 'temperate',
      coastlineMode: 'inland',
      terrainRoughness: 0.35,
      riverDensity: 0.25,
      forestDensity: 0.45,
      swampDensity: 0.1,
      desertDensity: 0,
      settlementDensity: 0.45,
      civilizationAge: 'frontier',
      fantasyIntensity: 0.1,
    },
    cultureSummary: 'A road-and-river frontier supporting a small trade village.',
    createdAt: now(),
    updatedAt: now(),
    tags: ['starter', 'provincial'],
  },
  {
    id: 'mapdoc-2',
    campaignId: DEFAULT_CAMPAIGN_ID,
    kind: 'session',
    summaryMapId: 'map-2',
    name: 'Ruined Watchtower',
    regionName: 'Ruined Watchtower',
    scale: 'provincial',
    hexSizeMiles: 1,
    width: 4,
    height: 4,
    seed: 13,
    parentMapId: 'mapdoc-1',
    parentHexId: 'hex-0-0',
    childMapIdsByHex: {},
    hexes: [
      {
        id: 'session-hex-0-0',
        q: 0,
        r: 0,
        terrain: 'hills',
        elevation: 0.5,
        climate: 'temperate',
        travelDifficulty: 2,
        notes: '',
        tags: [],
        resource: null,
      },
    ],
    labels: [
      {
        id: 'label-2',
        text: 'Ruined Watchtower',
        hexId: 'session-hex-0-0',
        offsetX: 0,
        offsetY: 0,
      },
    ],
    features: [
      {
        id: 'feature-2',
        kind: 'dungeon',
        label: 'Collapsed Gate',
        hexId: 'session-hex-0-0',
        linkedNpcIds: [],
        linkedPinIds: [],
        linkedMapDocumentId: null,
        notes: 'A broken entrance at the hill crest.',
      },
    ],
    generationSettings: {
      biomeBias: 'temperate',
      coastlineMode: 'inland',
      terrainRoughness: 0.4,
      riverDensity: 0.15,
      forestDensity: 0.3,
      swampDensity: 0.05,
      desertDensity: 0,
      settlementDensity: 0.2,
      civilizationAge: 'frontier',
      fantasyIntensity: 0.2,
    },
    cultureSummary: 'The remains of an old tower overlooking the road.',
    createdAt: now(),
    updatedAt: now(),
    tags: ['starter', 'session'],
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
    mapDocuments: starterMapDocuments,
    npcs: starterNpcs,
    playerCharacters: [],
    timelineEvents: starterTimeline,
    lookupEntries: starterLookup,
  }
}
