import { useEffect, useMemo, useState } from 'react';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import NotesPanel from '../components/NotesPanel';
import ApiLookupPanel from '../components/ApiLookupPanel';
import { DiceArena, DiceFab, buildRolls } from '../components/DiceWidgets';
import { DIE_ORDER, type DieSides } from '../lib/dice';
import { askDungeonMasterAssistant, type DmTurn } from '../lib/dmAssistant';

type Note = { id: string; title: string; body: string };
type ApiItem = { name: string; url: string };
type ChatEntry = { id: string; role: 'You' | 'AI'; msg: string; bookmarked?: boolean };

const API_BASE = 'https://www.dnd5eapi.co/api';
const emptyCounts: Record<DieSides, number> = { 20: 0, 12: 0, 100: 0, 10: 0, 8: 0, 6: 0, 4: 0 };

export default function DashboardPage() {
  const [accent, setAccent] = useState(localStorage.getItem('dm_accent') || '#7c3aed');
  const [notes, setNotes] = useState<Note[]>(JSON.parse(localStorage.getItem('dm_notes') || '[]'));
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(notes[0]?.id ?? null);
  const currentNote = notes.find((n) => n.id === currentNoteId) || null;
  const [noteTitle, setNoteTitle] = useState(currentNote?.title || '');
  const [noteBody, setNoteBody] = useState(currentNote?.body || '');

  const [resourceType, setResourceType] = useState('monsters');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiItem[]>([]);
  const [detail, setDetail] = useState('Ready.');

  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    {
      id: crypto.randomUUID(),
      role: 'AI',
      msg: 'Dungeon Master assistant ready. Ask for an encounter, NPC, or an area description.',
      bookmarked: false,
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatWarning, setChatWarning] = useState('');

  const [diceCounts, setDiceCounts] = useState<Record<DieSides, number>>(emptyCounts);
  const [menuOpen, setMenuOpen] = useState(false);
  const [rollHistory, setRollHistory] = useState<string[]>([]);
  const [rollResult, setRollResult] = useState('Pick dice from the floating launcher and click Roll.');
  const [diceRolls, setDiceRolls] = useState<Array<{ sides: DieSides; value: number }>>([]);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    localStorage.setItem('dm_accent', accent);
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('dm_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    setNoteTitle(currentNote?.title || '');
    setNoteBody(currentNote?.body || '');
  }, [currentNoteId]);

  const linkedTitles = useMemo(() => [...noteBody.matchAll(/\[\[(.*?)\]\]/g)].map((m) => m[1]), [noteBody]);

  const onSearch = async () => {
    setDetail('Loading...');
    try {
      const res = await fetch(`${API_BASE}/${resourceType}`);
      const data = await res.json();
      const filtered = data.results.filter((r: ApiItem) => r.name.toLowerCase().includes(query.toLowerCase())).slice(0, 15);
      setResults(filtered);
      setDetail(filtered.length ? 'Pick one item.' : 'No matching results.');
    } catch {
      setDetail('Failed to fetch 5e API.');
    }
  };

  const onSelectApiItem = async (item: ApiItem) => {
    const detailRes = await fetch(`${API_BASE}${item.url}`);
    const payload = await detailRes.json();
    setDetail(JSON.stringify(payload, null, 2));
  };

  const buildNoteTitleFromText = (text: string, prefix: string): string => {
    const firstLine = text.split('\n').find((line) => line.trim()) || '';
    const cleaned = firstLine.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '').trim();
    if (!cleaned) return prefix;
    return cleaned.length > 45 ? `${cleaned.slice(0, 45).trim()}...` : cleaned;
  };

  const appendNote = (title: string, body: string) => {
    const id = crypto.randomUUID();
    setNotes((prev) => [...prev, { id, title, body }]);
    setCurrentNoteId(id);
  };

  const onSaveAiToNotes = (messageId: string) => {
    const entry = chatLog.find((item) => item.id === messageId && item.role === 'AI');
    if (!entry) return;
    const title = buildNoteTitleFromText(entry.msg, `AI Note ${notes.length + 1}`);
    appendNote(title, entry.msg);
  };

  const onBookmarkAiToNotes = (messageId: string) => {
    const entry = chatLog.find((item) => item.id === messageId && item.role === 'AI');
    if (!entry) return;

    const existingBookmarksNote = notes.find((n) => n.title === 'AI Bookmarks');
    const timestamp = new Date().toLocaleString();
    const snippet = `\n\n### ${buildNoteTitleFromText(entry.msg, 'AI Output')} (${timestamp})\n${entry.msg}`;

    if (existingBookmarksNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === existingBookmarksNote.id
            ? { ...n, body: `${n.body}${snippet}` }
            : n,
        ),
      );
      setCurrentNoteId(existingBookmarksNote.id);
    } else {
      appendNote('AI Bookmarks', snippet.trimStart());
    }

    setChatLog((prev) => prev.map((item) => (item.id === messageId ? { ...item, bookmarked: true } : item)));
  };

  const onSendChat = async (overridePrompt?: string) => {
    const userPrompt = (overridePrompt ?? chatInput).trim();
    if (!userPrompt || chatLoading) return;

    setChatWarning('');
    setChatLoading(true);
    setChatInput('');

    const nextUserEntry: ChatEntry = { id: crypto.randomUUID(), role: 'You', msg: userPrompt };
    setChatLog((prev) => [...prev, nextUserEntry]);

    try {
      const history: DmTurn[] = chatLog
        .slice(-10)
        .map((entry) => ({
          role: entry.role === 'You' ? 'user' : 'assistant',
          content: entry.msg,
        }));
      const result = await askDungeonMasterAssistant(userPrompt, history);
      const aiEntry: ChatEntry = {
        id: crypto.randomUUID(),
        role: 'AI',
        msg: result.reply,
        bookmarked: false,
      };
      setChatLog((prev) => [...prev, aiEntry]);
      setChatWarning(result.warning);
    } catch (error) {
      console.error('Unexpected chat error.', error);
      setChatWarning('Could not get assistant output.');
    } finally {
      setChatLoading(false);
    }
  };

  const onQuickPrompt = (kind: 'encounter' | 'npc' | 'area') => {
    const promptMap: Record<typeof kind, string> = {
      encounter: 'Generate a balanced combat encounter for a level 5 party of 4 in a ruined cathedral.',
      npc: 'Generate an NPC ally for a political intrigue campaign in a large trade city.',
      area: 'Describe a creepy swamp shrine area with sensory details and one hidden clue.',
    };
    void onSendChat(promptMap[kind]);
  };

  const onNewNote = () => {
    const id = crypto.randomUUID();
    const next = [...notes, { id, title: `Note ${notes.length + 1}`, body: '' }];
    setNotes(next);
    setCurrentNoteId(id);
  };

  const onOpenNote = (id: string) => setCurrentNoteId(id);

  const onSaveNote = () => {
    if (!currentNoteId) return;
    setNotes((prev) => prev.map((n) => (n.id === currentNoteId ? { ...n, title: noteTitle.trim(), body: noteBody } : n)));
  };

  const onDeleteNote = () => {
    if (!currentNoteId) return;
    const next = notes.filter((n) => n.id !== currentNoteId);
    setNotes(next);
    setCurrentNoteId(next[0]?.id ?? null);
  };

  const onLinkClick = (title: string) => {
    const existing = notes.find((n) => n.title.toLowerCase() === title.toLowerCase());
    if (existing) {
      setCurrentNoteId(existing.id);
      return;
    }
    const id = crypto.randomUUID();
    setNotes((prev) => [...prev, { id, title, body: '' }]);
    setCurrentNoteId(id);
  };

  const onAddDie = (sides: DieSides) => {
    setDiceCounts((prev) => ({ ...prev, [sides]: prev[sides] + 1 }));
  };

  const onResetDice = () => {
    setDiceCounts({ ...emptyCounts });
    setRollResult('Dice selection reset.');
  };

  const onRollDice = () => {
    const rolled = buildRolls(diceCounts);
    if (!rolled.length) {
      setRollResult('Choose at least one die first.');
      return;
    }
    setDiceRolls(rolled);
    const total = rolled.reduce((sum, d) => sum + d.value, 0);
    const formula = DIE_ORDER.filter((sides) => diceCounts[sides] > 0).map((sides) => `${diceCounts[sides]}d${sides}`).join(' + ');
    const text = `${formula} => [${rolled.map((d) => d.value).join(', ')}] = ${total}`;
    setRollResult(text);
    setRollHistory((prev) => [`${new Date().toLocaleTimeString()} • ${text}`, ...prev]);
  };

  return (
    <div className="app-shell">
      <SidebarLeft accent={accent} onAccentChange={setAccent} />

      <main className="content">
        <DiceArena diceRolls={diceRolls} rollResult={rollResult} rollHistory={rollHistory} />

        <NotesPanel
          notes={notes}
          currentNoteId={currentNoteId}
          noteTitle={noteTitle}
          noteBody={noteBody}
          onNew={onNewNote}
          onOpen={onOpenNote}
          onSave={onSaveNote}
          onDelete={onDeleteNote}
          onTitleChange={setNoteTitle}
          onBodyChange={setNoteBody}
          linkedTitles={linkedTitles}
          onLinkClick={onLinkClick}
        />

        <ApiLookupPanel
          resourceType={resourceType}
          query={query}
          detail={detail}
          results={results}
          setResourceType={setResourceType}
          setQuery={setQuery}
          onSearch={onSearch}
          onSelect={onSelectApiItem}
        />
      </main>

      <SidebarRight
        chatInput={chatInput}
        setChatInput={setChatInput}
        chatLog={chatLog}
        onSendChat={onSendChat}
        chatLoading={chatLoading}
        chatWarning={chatWarning}
        onQuickPrompt={onQuickPrompt}
        onSaveAiToNotes={onSaveAiToNotes}
        onBookmarkAiToNotes={onBookmarkAiToNotes}
      />

      <DiceFab
        diceCounts={diceCounts}
        menuOpen={menuOpen}
        rollResult={rollResult}
        rollHistory={rollHistory}
        diceRolls={diceRolls}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        onAddDie={onAddDie}
        onReset={onResetDice}
        onRoll={onRollDice}
      />
    </div>
  );
}
