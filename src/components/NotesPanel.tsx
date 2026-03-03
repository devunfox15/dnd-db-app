type Note = { id: string; title: string; body: string };

type Props = {
  notes: Note[];
  currentNoteId: string | null;
  noteTitle: string;
  noteBody: string;
  onNew: () => void;
  onOpen: (id: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  linkedTitles: string[];
  onLinkClick: (title: string) => void;
};

export default function NotesPanel(props: Props) {
  const {
    notes,
    noteTitle,
    noteBody,
    onNew,
    onOpen,
    onSave,
    onDelete,
    onTitleChange,
    onBodyChange,
    linkedTitles,
    onLinkClick,
  } = props;

  return (
    <section className="card">
      <h2>Notes</h2>
      <div className="notes-grid">
        <div>
          <ul className="list">
            {notes.map((n) => (
              <li key={n.id}>
                <button className="btn secondary" onClick={() => onOpen(n.id)}>{n.title || '(untitled)'}</button>
              </li>
            ))}
          </ul>
          <button className="btn" onClick={onNew}>+ New note</button>
        </div>

        <div>
          <input className="input" placeholder="Note title" value={noteTitle} onChange={(e) => onTitleChange(e.target.value)} />
          <textarea className="input" rows={10} placeholder="Use [[Linked Note]]" value={noteBody} onChange={(e) => onBodyChange(e.target.value)} />
          <div className="row">
            <button className="btn" onClick={onSave}>Save</button>
            <button className="btn danger" onClick={onDelete}>Delete</button>
          </div>
          <div className="muted">
            <strong>Links:</strong>{' '}
            {linkedTitles.length ? linkedTitles.map((t) => (
              <button key={t} className="btn secondary" onClick={() => onLinkClick(t)}>{t}</button>
            )) : 'none'}
          </div>
        </div>
      </div>
    </section>
  );
}
