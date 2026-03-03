import { DIE_ORDER, randomRoll, type DieSides } from '../lib/dice';

type Roll = { sides: DieSides; value: number };

type Props = {
  diceCounts: Record<DieSides, number>;
  menuOpen: boolean;
  rollResult: string;
  rollHistory: string[];
  diceRolls: Roll[];
  onToggleMenu: () => void;
  onAddDie: (sides: DieSides) => void;
  onReset: () => void;
  onRoll: () => void;
};

export function DiceArena({ diceRolls, rollResult, rollHistory }: Pick<Props, 'diceRolls' | 'rollResult' | 'rollHistory'>) {
  return (
    <section className="card dice-stage-card">
      <h2>Dice Arena</h2>
      <div className="dice-stage">
        {diceRolls.map((d, i) => (
          <div className="roll-die rolling" title={`d${d.sides}`} key={`${d.sides}-${d.value}-${i}`}>{d.value}</div>
        ))}
      </div>
      <div className="muted">{rollResult}</div>
      <ul className="list">
        {rollHistory.map((r, i) => <li key={`${r}-${i}`}>{r}</li>)}
      </ul>
    </section>
  );
}

export function DiceFab(props: Props) {
  const { diceCounts, menuOpen, onToggleMenu, onAddDie, onReset, onRoll } = props;

  return (
    <div className="dice-fab-wrap">
      {menuOpen && (
        <div className="dice-menu">
          <div className="dice-grid">
            {DIE_ORDER.map((sides) => {
              const count = diceCounts[sides];
              return (
                <button key={sides} className={`die-btn ${count > 0 ? 'active' : ''}`} onClick={() => onAddDie(sides)}>
                  <div className={`die-face face-d${sides}`}>d{sides}</div>
                  <div className="die-count">{count > 0 ? count : ''}</div>
                </button>
              );
            })}
          </div>
          <div className="row">
            <button className="btn secondary" onClick={onReset}>Reset</button>
            <button className="btn" onClick={onRoll}>Roll</button>
          </div>
        </div>
      )}
      <button className="dice-fab" title="Open dice roller" onClick={onToggleMenu}>d20</button>
    </div>
  );
}

export function buildRolls(counts: Record<DieSides, number>) {
  const rolls: Roll[] = [];
  DIE_ORDER.forEach((sides) => {
    for (let i = 0; i < counts[sides]; i += 1) {
      rolls.push({ sides, value: randomRoll(sides) });
    }
  });
  return rolls;
}
