type Props = {
  accent: string;
  onAccentChange: (value: string) => void;
};

export default function SidebarLeft({ accent, onAccentChange }: Props) {
  return (
    <aside className="sidebar left">
      <div className="sidebar-header">
        <h1>DM Dashboard</h1>
        <p>sidebar-07 style layout</p>
      </div>
      <nav className="sidebar-nav">
        <button className="nav-btn active">Dashboard</button>
        <button className="nav-btn">Encounter</button>
        <button className="nav-btn">Notes</button>
        <button className="nav-btn">NPCs</button>
      </nav>
      <div className="sidebar-footer">
        <label htmlFor="accent-picker">Accent color</label>
        <input id="accent-picker" type="color" value={accent} onChange={(e) => onAccentChange(e.target.value)} />
      </div>
    </aside>
  );
}
