import type { DtiResults } from '../lib/dti';
import type { ServiceabilityResult } from '../lib/serviceability';
import { SERVICEABILITY_TERM_YEARS } from '../lib/serviceability';
import type { AppInputs } from '../lib/state';
import { money } from '../lib/format';

export function ServiceabilityCard({
  inputs,
  results,
  svc,
}: {
  inputs: AppInputs;
  results: DtiResults;
  svc: ServiceabilityResult;
}) {
  const taxAmount = results.assessedIncome - svc.netIncome;
  const dtiNeeded = results.requiredIncome;
  const svcNeeded = svc.incomeNeeded;
  const floor = Math.max(dtiNeeded, svcNeeded);
  const svcBinds = svcNeeded > dtiNeeded;

  return (
    <section className="card section">
      <div className="section-head">
        <h2 className="section-title">Serviceability — can you afford it?</h2>
        <span className="section-desc">Rough estimate · separate from the DTI cap</span>
      </div>

      <div className="section-body">
        <div className="grid gap-5 md:grid-cols-2">
          {/* After-tax surplus waterfall */}
          <table className="figures">
            <tbody>
              <tr>
                <td className="fig-label">Assessable income (gross)</td>
                <td className="fig-val tnum">{money(results.assessedIncome)}</td>
              </tr>
              <tr>
                <td className="fig-label">Less tax @ {inputs.taxRate}%</td>
                <td className="fig-val tnum">−{money(taxAmount)}</td>
              </tr>
              <tr data-strong>
                <td className="fig-label">Net income</td>
                <td className="fig-val tnum">{money(svc.netIncome)}</td>
              </tr>
              <tr>
                <td className="fig-label">Less living expenses</td>
                <td className="fig-val tnum">−{money(inputs.livingExpenses)}</td>
              </tr>
              <tr>
                <td className="fig-label">
                  Less stressed repayments
                  <span className="fig-sub">
                    P&amp;I {SERVICEABILITY_TERM_YEARS}yr @ {inputs.stressRate}%
                  </span>
                </td>
                <td className="fig-val tnum">−{money(svc.stressedAnnual)}</td>
              </tr>
              <tr data-strong data-tone={svc.serviceable ? 'pass' : 'fail'}>
                <td className="fig-label">Annual surplus</td>
                <td className="fig-val tnum">{money(svc.surplus)}</td>
              </tr>
            </tbody>
          </table>

          {/* Verdict + which test binds */}
          <div className="grid gap-3 content-start">
            <div className={`strip ${svc.serviceable ? 'strip-pass' : 'strip-fail'}`}>
              <span>
                {svc.serviceable ? (
                  <>
                    Likely serviceable — about <strong>{money(svc.surplus)}/yr</strong> spare after
                    stressed repayments and living costs.
                  </>
                ) : (
                  <>
                    Shortfall of <strong>{money(-svc.surplus)}/yr</strong> at the stress rate —
                    over-committed on these assumptions.
                  </>
                )}
              </span>
            </div>

            <table className="figures">
              <tbody>
                <tr>
                  <td className="fig-label">Income to service (gross)</td>
                  <td className="fig-val tnum">{money(svcNeeded)}</td>
                </tr>
                <tr>
                  <td className="fig-label">Income for the DTI cap</td>
                  <td className="fig-val tnum">{money(dtiNeeded)}</td>
                </tr>
                <tr data-strong>
                  <td className="fig-label">
                    Your real floor
                    <span className="fig-sub">
                      the higher of the two — {svcBinds ? 'serviceability' : 'the DTI cap'} binds
                    </span>
                  </td>
                  <td className="fig-val tnum">{money(floor)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="strip strip-neutral">
          <span>
            Rough estimate, not a bank quote. Banks test P&amp;I over ~{SERVICEABILITY_TERM_YEARS}yr
            at a stressed rate (~8–9%) on after-tax income, and investment loans are often
            interest-only — tweak the stress rate, tax % and outgoings to match your bank. Rental
            income is already inside the gross figure (shaded at {inputs.rentTreatment}%).
          </span>
        </div>
      </div>
    </section>
  );
}
