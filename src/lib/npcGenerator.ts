export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type AbilityStat = {
  score: number;
  mod: number;
};

export type NpcStats = Record<AbilityKey, AbilityStat>;

export type NpcProfile = {
  name: string;
  brief: string;
  alignment: string;
  job: string;
  stats: NpcStats;
};

export type NpcGenerationResult = {
  profile: NpcProfile;
  warning: string;
  source: 'ai' | 'fallback';
};

const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const OLLAMA_API_URL = '/api/chat';
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b';

function scoreToMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function clampScore(score: number): number {
  return Math.min(18, Math.max(3, score));
}

function parseJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeStats(rawStats: unknown): NpcStats | null {
  if (!rawStats || typeof rawStats !== 'object') return null;
  const statsRecord = rawStats as Record<string, unknown>;
  const normalized = {} as NpcStats;

  for (const ability of ABILITIES) {
    const abilityRaw = statsRecord[ability];
    if (!abilityRaw || typeof abilityRaw !== 'object') return null;
    const scoreRaw = (abilityRaw as Record<string, unknown>).score;
    const parsedScore = toFiniteNumber(scoreRaw);
    if (parsedScore === null) return null;
    const score = clampScore(Math.round(parsedScore));
    normalized[ability] = { score, mod: scoreToMod(score) };
  }

  return normalized;
}

function normalizeNpc(raw: unknown): NpcProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const payload = raw as Record<string, unknown>;
  const name = safeString(payload.name);
  const brief = safeString(payload.brief);
  const alignment = safeString(payload.alignment);
  const job = safeString(payload.job);
  const stats = normalizeStats(payload.stats);

  if (!name || !brief || !alignment || !job || !stats) return null;
  return { name, brief, alignment, job, stats };
}

function stringHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function roll4d6DropLowest(rng: () => number): number {
  const rolls = [
    Math.floor(rng() * 6) + 1,
    Math.floor(rng() * 6) + 1,
    Math.floor(rng() * 6) + 1,
    Math.floor(rng() * 6) + 1,
  ].sort((a, b) => a - b);
  return rolls[1] + rolls[2] + rolls[3];
}

function generateFallbackStats(rng: () => number): NpcStats {
  const stats = {} as NpcStats;
  for (const ability of ABILITIES) {
    const score = clampScore(roll4d6DropLowest(rng));
    stats[ability] = { score, mod: scoreToMod(score) };
  }
  return stats;
}

export function generateNpcFallback(seed: string, context = ''): NpcProfile {
  const seedText = seed.trim();
  const contextText = context.trim();
  const combinedSeed = [seedText, contextText].filter(Boolean).join(' | ');
  const normalizedSeed = combinedSeed.toLowerCase() || 'wandering traveler';
  const rng = mulberry32(stringHash(normalizedSeed));
  const first = ['Ael', 'Bram', 'Ciri', 'Dorin', 'Elra', 'Fen', 'Garr', 'Hali', 'Ilya', 'Korr', 'Luma', 'Mira', 'Nym', 'Orin', 'Perr', 'Riva', 'Soren', 'Tali', 'Vara', 'Zane'];
  const last = ['Brightwood', 'Ashfall', 'Stonevale', 'Mournwell', 'Blacktide', 'Amberkeep', 'Reedbrook', 'Ironhollow', 'Valecrest', 'Dawnmarket', 'Frostmere', 'Ravenlock'];
  const alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
  const jobs = ['Innkeeper', 'Gravekeeper', 'Caravan Guard', 'Archivist', 'Fence', 'Temple Acolyte', 'Bounty Scout', 'Apothecary', 'Dock Foreman', 'Retired Soldier', 'Rat-Catcher', 'Smuggler Liaison'];
  const traits = ['speaks in careful whispers', 'keeps perfect eye contact', 'always smells faintly of smoke', 'wears immaculate gloves', 'never turns their back on a door', 'counts coins while thinking', 'quotes old battlefield proverbs', 'keeps a raven-feather charm'];
  const motives = ['is paying off a dangerous debt', 'is hiding a noble lineage', 'secretly works for a local faction', 'needs protection from a former ally', 'is searching for a missing sibling', 'wants revenge on a corrupt magistrate', 'hoards rumors for leverage'];

  const job = pick(rng, jobs);
  const alignment = pick(rng, alignments);
  const trait = pick(rng, traits);
  const motive = pick(rng, motives);
  const name = `${pick(rng, first)} ${pick(rng, last)}`;
  const hookSeed = combinedSeed || 'wandering traveler';
  const brief = `Built from "${hookSeed}", this ${job.toLowerCase()} ${trait} and ${motive}.`;

  return {
    name,
    brief,
    alignment,
    job,
    stats: generateFallbackStats(rng),
  };
}

async function generateNpcWithOllama(seed: string, context = ''): Promise<NpcProfile> {
  const model = import.meta.env.VITE_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_URL || DEFAULT_OLLAMA_URL;
  const url = `${ollamaBaseUrl.replace(/\/$/, '')}${OLLAMA_API_URL}`;
  const seedText = seed.trim() || 'mysterious traveler in a frontier town';
  const contextText = context.trim() || 'No extra context.';
  const prompt = [
    'Generate a D&D 5e NPC as strict JSON only.',
    'Use exact keys: name, brief, alignment, job, stats.',
    'stats must include exact lowercase keys: str, dex, con, int, wis, cha.',
    'For each ability include score and mod. score must be integer 3-18.',
    'brief must be 1-2 sentences.',
    `Theme seed: ${seedText}`,
    `Extra context: ${contextText}`,
  ].join(' ');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: 'You are an assistant that returns only valid JSON with no markdown.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed with status ${res.status}.`);
  }

  const payload = await res.json();
  const content = payload?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Ollama returned empty content.');
  }

  const parsed = parseJsonObject(content);
  const normalized = normalizeNpc(parsed);
  if (!normalized) {
    throw new Error('Ollama NPC payload failed validation.');
  }
  return normalized;
}

export async function generateNpcWithMeta(seed: string, context = ''): Promise<NpcGenerationResult> {
  try {
    const profile = await generateNpcWithOllama(seed, context);
    return { profile, warning: '', source: 'ai' };
  } catch (error) {
    console.error('NPC Ollama generation failed, using fallback.', error);
    return {
      profile: generateNpcFallback(seed, context),
      warning: 'Local model generation failed, so fallback content was used.',
      source: 'fallback',
    };
  }
}

export async function generateNpc(seed: string, context = ''): Promise<NpcProfile> {
  const result = await generateNpcWithMeta(seed, context);
  return result.profile;
}
