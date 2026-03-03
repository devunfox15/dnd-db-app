type Result = { name: string; url: string };

type Props = {
  resourceType: string;
  query: string;
  detail: string;
  results: Result[];
  setResourceType: (v: string) => void;
  setQuery: (v: string) => void;
  onSearch: () => void;
  onSelect: (item: Result) => void;
};

export default function ApiLookupPanel(props: Props) {
  const { resourceType, query, detail, results, setResourceType, setQuery, onSearch, onSelect } = props;

  return (
    <section className="card">
      <h2>5e API Lookup</h2>
      <div className="grid two">
        <label>
          Resource
          <select className="input" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
            <option value="monsters">Monsters</option>
            <option value="spells">Spells</option>
            <option value="classes">Classes</option>
            <option value="equipment">Equipment</option>
          </select>
        </label>
        <label>
          Search
          <input className="input" placeholder="dragon" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>
      <button className="btn" onClick={onSearch}>Search 5e API</button>
      <ul className="list">
        {results.map((item) => (
          <li key={item.url}>
            <button className="btn secondary" onClick={() => onSelect(item)}>{item.name}</button>
          </li>
        ))}
      </ul>
      <pre className="muted">{detail}</pre>
    </section>
  );
}
