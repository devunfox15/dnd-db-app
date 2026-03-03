import { useEffect, useMemo, useState } from 'react';
import SidebarLeft from '../components/SidebarLeft';
import SidebarRight from '../components/SidebarRight';
import NotesPanel from '../components/NotesPanel';
import ApiLookupPanel from '../components/ApiLookupPanel';
import { DiceArena, DiceFab, buildRolls } from '../components/DiceWidgets';
import { DIE_ORDER, type DieSides } from '../lib/dice';

type Note = { id: string; title: string; body: string };
type ApiItem = { name: string; url: string };

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
  const [chatLog, setChatLog] = useState<Array<{ role: string; msg: string }>>([
    { role: 'AI', msg: 'Welcome! Use the bottom-left d20 to build a roll and animate in the Dice Arena.' },
  ]);
  const [npcSeed, setNpcSeed] = useState('');
  const [npcOutput, setNpcOutput] = useState('');

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

  const onSendChat = () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatLog((prev) => [...prev, { role: 'You', msg }, { role: 'AI', msg: `Idea: link this to [[${msg.split(' ')[0] || 'Quest'}]].` }]);
    setChatInput('');
  };

  const onNpcGenerate = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const npc = {
      name: `${pick(['Ael', 'Brom', 'Cira'])}${pick(['wyn', 'ric', 'dan'])}`,
      role: pick(['Innkeeper', 'Spy', 'Priest']),
      quirk: pick(['never blinks', 'collects teeth', 'hums old war songs']),
      hook: npcSeed || 'No seed provided',
    };
    setNpcOutput(JSON.stringify(npc, null, 2));
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
        npcSeed={npcSeed}
        setNpcSeed={setNpcSeed}
        onNpcGenerate={onNpcGenerate}
        npcOutput={npcOutput}
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
