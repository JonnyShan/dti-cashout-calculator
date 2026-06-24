import { computeDti, type DtiInputs } from '../lib/dti';
import { money, dtiText } from '../lib/format';

const AMOUNTS = [0, 300_000, 500_000];

export function ScenarioCompare({
  inputs,
  onPick,
}: {
  inputs: DtiInputs;
  onPick: (cashOut: number) => void;
}) {
  const amounts = AMOUNTS.filter((a) => a <= inputs.salePrice);

  return (
    <section className="card section">
      <div className="section-head">
        <h2 className="section-title">Compare cash-out scenarios</h2>
        <span className="section-desc">Tap one to apply it</span>
      </div>
      <div className="section-body">
        <div className="scenarios">
          {amounts.map((amount) => {
            const r = computeDti({ ...inputs, cashOut: amount });
            const active = inputs.cashOut === amount;
            return (
              <button
                key={amount}
                type="button"
                className="scenario"
                data-active={active || undefined}
                onClick={() => onPick(amount)}
              >
                <span className="scenario-amt tnum">{money(amount)}</span>
                <span className="scenario-dti tnum">DTI {dtiText(r.dti)}</span>
                <span className={`scenario-chip ${r.pass ? 'is-pass' : 'is-fail'}`}>
                  {!r.hasIncome ? 'No income' : r.pass ? 'Within cap' : 'Over cap'}
                </span>
                <span className="scenario-meta tnum">Into RI {money(r.intoRockIsle)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
