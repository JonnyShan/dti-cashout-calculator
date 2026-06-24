import type { DtiInputs, DtiResults } from '../lib/dti';
import { money, dtiText } from '../lib/format';
import { Gauge } from './Gauge';

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'fail';
}) {
  return (
    <tr data-strong={strong || undefined} data-tone={tone || undefined}>
      <td className="fig-label">{label}</td>
      <td className="fig-val tnum">{value}</td>
    </tr>
  );
}

function GapStrip({ results }: { results: DtiResults }) {
  if (!results.hasIncome) {
    return <div className="strip strip-neutral">Enter some income to see the gap to the cap.</div>;
  }
  if (results.incomeGap > 0) {
    return (
      <div className="strip strip-fail">
        <span>
          You'd need <strong>{money(results.incomeGap)}</strong> more gross income to take this much
          out and stay at the cap.
        </span>
      </div>
    );
  }
  return (
    <div className="strip strip-pass">
      <span>
        You're <strong>{money(-results.incomeGap)}</strong> under — you have headroom.
      </span>
    </div>
  );
}

function MaxCashOutStrip({
  inputs,
  results,
  onJump,
}: {
  inputs: DtiInputs;
  results: DtiResults;
  onJump: (amount: number) => void;
}) {
  if (results.maxCashOutFlag === 'alreadyUnder') {
    return (
      <div className="strip strip-pass">
        <span>
          You're under the cap even taking the full sale as cash — max cash-out{' '}
          <strong>{money(inputs.salePrice)}</strong>.
        </span>
      </div>
    );
  }
  if (results.maxCashOutFlag === 'cantReach') {
    return (
      <div className="strip strip-fail">
        <span>
          Even paying the entire sale into Rock Isle won't reach the cap at this income.
        </span>
      </div>
    );
  }
  const snapped = Math.floor(results.maxCashOut / 5000) * 5000;
  return (
    <div className="strip strip-warn">
      <span>
        Max cash-out at this income while staying ≤ cap:{' '}
        <strong>{money(results.maxCashOut)}</strong>.
      </span>
      <button
        type="button"
        className="btn-link strip-action"
        onClick={() => onJump(snapped)}
        title={`Set cash-out to ${money(snapped)}`}
      >
        Set
      </button>
    </div>
  );
}

function CostStrip({ inputs, results }: { inputs: DtiInputs; results: DtiResults }) {
  return (
    <div className="strip strip-neutral">
      <span>
        Taking <strong>{money(inputs.cashOut)}</strong> out instead of paying it down keeps you
        paying <strong>{money(results.costPerWeek)}/wk</strong> ({money(results.costPerYear)}/yr) in
        interest at {inputs.interestRate}%. The paydown still saves{' '}
        <strong>{money(results.savedPerWeek)}/wk</strong> ({money(results.savedPerYear)}/yr).
      </span>
    </div>
  );
}

export function ResultsCard({
  inputs,
  results,
  onJumpCashOut,
}: {
  inputs: DtiInputs;
  results: DtiResults;
  onJumpCashOut: (amount: number) => void;
}) {
  const state = !results.hasIncome ? 'none' : results.pass ? 'pass' : 'fail';
  const overCap = results.hasIncome && !results.pass;
  const label =
    state === 'none' ? 'No income entered' : state === 'pass' ? 'Within the cap' : 'Over the cap';

  return (
    <div className="card section">
      <div className="section-head">
        <h2 className="section-title">Result</h2>
        <span className="section-title" style={{ color: 'var(--brand)' }}>
          {money(inputs.cashOut)} out
        </span>
      </div>

      <div className="section-body">
        <div className="verdict">
          <div className="verdict-num tnum" data-state={state}>
            {dtiText(results.dti)}
          </div>
          <div className="verdict-meta">
            <p className="verdict-label" data-state={state}>
              {label}
            </p>
            <p className="verdict-cap">
              Cap {inputs.dtiCap}× ({inputs.dtiCap === 7 ? 'investor' : 'owner-occupier'})
            </p>
          </div>
        </div>

        <Gauge dti={results.dti} cap={inputs.dtiCap} pass={results.pass} />

        <table className="figures">
          <tbody>
            <Row label="Into Rock Isle" value={money(results.intoRockIsle)} />
            <Row label="New Rock Isle loan" value={money(results.newRILoan)} />
            <Row label="New total debt" value={money(results.newTotalDebt)} strong />
            <Row label="Income needed at cap" value={money(results.requiredIncome)} />
            <Row
              label="Income you have"
              value={money(results.assessedIncome)}
              strong
              tone={overCap ? 'fail' : undefined}
            />
          </tbody>
        </table>

        <div className="breakdown">
          <span className="tnum">NZ salary {money(inputs.nzSalary)}</span>
          {inputs.audIncome > 0 && (
            <span className="tnum">AUD→NZD {money(results.audIncomeNZD)}</span>
          )}
          <span className="tnum">Rent {money(results.assessedRent)}</span>
        </div>

        <GapStrip results={results} />
        <MaxCashOutStrip inputs={inputs} results={results} onJump={onJumpCashOut} />
        <CostStrip inputs={inputs} results={results} />
      </div>
    </div>
  );
}
