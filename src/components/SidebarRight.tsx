type ChatEntry = {
  id: string;
  role: 'You' | 'AI';
  msg: string;
  bookmarked?: boolean;
};

type Props = {
  chatInput: string;
  setChatInput: (value: string) => void;
  chatLog: ChatEntry[];
  onSendChat: (overridePrompt?: string) => void | Promise<void>;
  chatLoading: boolean;
  chatWarning: string;
  onQuickPrompt: (kind: 'encounter' | 'npc' | 'area') => void;
  onSaveAiToNotes: (messageId: string) => void;
  onBookmarkAiToNotes: (messageId: string) => void;
};

export default function SidebarRight(props: Props) {
  const {
    chatInput,
    setChatInput,
    chatLog,
    onSendChat,
    chatLoading,
    chatWarning,
    onQuickPrompt,
    onSaveAiToNotes,
    onBookmarkAiToNotes,
  } = props;
  const bookmarkedItems = chatLog.filter((entry) => entry.role === 'AI' && entry.bookmarked);

  return (
    <aside className="sidebar right dm-chat-sidebar">
      <div className="sidebar-header">
        <h2>DM AI Assistant</h2>
        <p>Encounter, NPC, and area generator</p>
      </div>

      <div className="dm-quick-row">
        <button className="btn secondary dm-quick-btn" onClick={() => onQuickPrompt('encounter')} disabled={chatLoading}>Encounter</button>
        <button className="btn secondary dm-quick-btn" onClick={() => onQuickPrompt('npc')} disabled={chatLoading}>NPC</button>
        <button className="btn secondary dm-quick-btn" onClick={() => onQuickPrompt('area')} disabled={chatLoading}>Area</button>
      </div>

      <div className="dm-chat-log">
        {chatLog.map((entry) => (
          <div className={`dm-chat-row ${entry.role === 'You' ? 'user' : 'assistant'}`} key={entry.id}>
            <div className="dm-chat-bubble">
              <div className="dm-chat-role">{entry.role === 'You' ? 'You' : 'DM AI'}</div>
              <div className="dm-chat-text">{entry.msg}</div>
            </div>
            {entry.role === 'AI' ? (
              <div className="dm-chat-actions">
                <button className="btn secondary" onClick={() => onSaveAiToNotes(entry.id)}>Save</button>
                <button className="btn secondary" onClick={() => onBookmarkAiToNotes(entry.id)} disabled={entry.bookmarked}>
                  {entry.bookmarked ? 'Bookmarked' : 'Bookmark to Notes'}
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {chatLoading ? <div className="muted">Generating DM response...</div> : null}
      </div>

      <form
        className="dm-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void onSendChat();
        }}
      >
        <textarea
          className="dm-composer-input"
          placeholder="Message DM assistant..."
          value={chatInput}
          rows={3}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button className="btn dm-send-btn" type="submit" disabled={chatLoading} aria-label="Send message" title="Send">
          ↑
        </button>
      </form>

      {chatWarning ? <div className="muted">{chatWarning}</div> : null}

      <h3>Bookmarked Outputs</h3>
      {bookmarkedItems.length ? (
        <ul className="list">
          {bookmarkedItems.map((entry) => (
            <li key={`bookmark-${entry.id}`}>{entry.msg.split('\n')[0]}</li>
          ))}
        </ul>
      ) : (
        <div className="muted">No bookmarks yet.</div>
      )}
    </aside>
  );
}
