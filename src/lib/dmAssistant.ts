export type DmTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export type DmAssistantResult = {
  reply: string;
  warning: string;
};

const OLLAMA_API_URL = '/api/chat';
const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b';

function fallbackReply(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('encounter')) {
    return [
      '## Encounter: Bridge Ambush',
      '- Party level: 3-4',
      '- Enemies: 4 bandits, 1 bandit captain',
      '- Twist: Cracked bridge sections require DC 12 Acrobatics after every dash.',
      '- Reward: Smuggler map fragment + 45 gp mixed coin.',
    ].join('\n');
  }

  if (lower.includes('npc')) {
    return [
      '## NPC: Marla Thorne',
      '- Role: Retired scout turned ferrymaster',
      '- Personality: Dry humor, suspicious of uniforms',
      '- Secret: She once served the enemy general and recognizes old war signs.',
      '- Hook: Will guide the party to hidden ford routes for a favor.',
    ].join('\n');
  }

  if (lower.includes('area') || lower.includes('description')) {
    return [
      '## Area: The Ashglass Market',
      'Lantern smoke hangs low over crowded stone alleys.',
      'Brass chimes and clipped haggling echo between black-glass stalls.',
      'At the center fountain, a silent crowd watches a masked preacher paint runes in ash.',
    ].join('\n');
  }

  return [
    '## DM Assist Output',
    '- Ask for: encounter design, NPC generation, or area descriptions.',
    '- Include party level, region, tone, and constraints for better detail.',
  ].join('\n');
}

export async function askDungeonMasterAssistant(prompt: string, history: DmTurn[]): Promise<DmAssistantResult> {
  const model = import.meta.env.VITE_OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
  const ollamaBaseUrl = import.meta.env.VITE_OLLAMA_URL || DEFAULT_OLLAMA_URL;
  const url = `${ollamaBaseUrl.replace(/\/$/, '')}${OLLAMA_API_URL}`;

  const messages = [
    {
      role: 'system',
      content:
        'You are a Dungeon Master assistant. Produce tabletop-ready outputs for encounters, NPCs, and area descriptions. Keep replies scannable with concise markdown headings and bullets.',
    },
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
    { role: 'user', content: prompt },
  ];

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages,
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama request failed with status ${res.status}.`);
    }

    const payload = await res.json();
    const reply = payload?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) {
      throw new Error('Ollama returned empty content.');
    }

    return { reply: reply.trim(), warning: '' };
  } catch (error) {
    console.error('DM assistant call failed, using fallback.', error);
    return {
      reply: fallbackReply(prompt),
      warning: 'Local model request failed, fallback DM content was used.',
    };
  }
}

