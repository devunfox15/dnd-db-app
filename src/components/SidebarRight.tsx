type Props = {
  chatInput: string;
  setChatInput: (value: string) => void;
  chatLog: Array<{ role: string; msg: string }>;
  onSendChat: () => void;
  npcSeed: string;
  setNpcSeed: (value: string) => void;
  onNpcGenerate: () => void;
  npcOutput: string;
};

export default function SidebarRight(props: Props) {
  const { chatInput, setChatInput, chatLog, onSendChat, npcSeed, setNpcSeed, onNpcGenerate, npcOutput } = props;

  return (
    <aside className="sidebar right">
      <div className="sidebar-header">
        <h2>AI Chatting</h2>
        <p>Right sidebar assistant</p>
      </div>

      <div className="chat-log">
        {chatLog.map((entry, idx) => (
          <div className="chat-msg" key={`${entry.role}-${idx}`}>
            <span>{entry.role}:</span> {entry.msg}
          </div>
        ))}
      </div>

      <div className="chat-controls">
        <input
          className="input"
          placeholder="Ask for quests, hooks, stat ideas..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button className="btn" onClick={onSendChat}>Send</button>
      </div>

      <hr />
      <h3>NPC Generator</h3>
      <input className="input" placeholder="suspicious innkeeper" value={npcSeed} onChange={(e) => setNpcSeed(e.target.value)} />
      <button className="btn secondary" onClick={onNpcGenerate}>Generate NPC</button>
      <pre className="muted">{npcOutput}</pre>
    </aside>
  );
}
