import { useEffect, useMemo, useState } from 'react';
import { computeDti } from './lib/dti';
import {
  APP_DEFAULTS,
  DUAL_INCOME,
  SINGLE_INCOME,
  activePreset,
  clearStored,
  loadInitialInputs,
  saveStored,
  serializeToQuery,
  type AppInputs,
  type IncomePreset,
} from './lib/state';
import { computeServiceability } from './lib/serviceability';
import { fetchAudNzd, type FxResult } from './lib/fx';
import { decimal, dtiText, money } from './lib/format';
import { NumberField, RangeSlider, SegmentedControl, Section } from './components/controls';
import { ResultsCard } from './components/ResultsCard';
import { ServiceabilityCard } from './components/ServiceabilityCard';
import { ScenarioCompare } from './components/ScenarioCompare';
import { Footer } from './components/Footer';

export default function App() {
  const [inputs, setInputs] = useState<AppInputs>(loadInitialInputs);
  const [fxMeta, setFxMeta] = useState<FxResult | null>(null);
  const [fxState, setFxState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => computeDti(inputs), [inputs]);
  const svc = useMemo(
    () =>
      computeServiceability({
        totalDebt: results.newTotalDebt,
        grossIncome: results.assessedIncome,
        livingExpenses: inputs.livingExpenses,
        stressRate: inputs.stressRate,
        taxRate: inputs.taxRate,
      }),
    [
      results.newTotalDebt,
      results.assessedIncome,
      inputs.livingExpenses,
      inputs.stressRate,
      inputs.taxRate,
    ],
  );

  // Persist to localStorage + reflect state in the URL (shareable link).
  useEffect(() => {
    saveStored(inputs);
    const query = serializeToQuery(inputs);
    window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
  }, [inputs]);

  function update<K extends keyof AppInputs>(key: K, value: AppInputs[K]) {
    setInputs((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'salePrice') next.cashOut = Math.min(next.cashOut, next.salePrice);
      return next;
    });
  }

  function setCashOut(value: number) {
    setInputs((prev) => ({ ...prev, cashOut: Math.max(0, Math.min(value, prev.salePrice)) }));
  }

  function applyPreset(preset: IncomePreset) {
    setInputs((prev) => ({ ...prev, ...(preset === 'single' ? SINGLE_INCOME : DUAL_INCOME) }));
  }

  function reset() {
    clearStored();
    setInputs({ ...APP_DEFAULTS });
    setFxMeta(null);
    setFxState('idle');
  }

  async function fetchFx() {
    setFxState('loading');
    try {
      const r = await fetchAudNzd();
      setFxMeta(r);
      setFxState('idle');
      update('fxRate', Number(r.rate.toFixed(4)));
    } catch {
      setFxState('error');
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const preset = activePreset(inputs);
  const showOverseas = inputs.audIncome > 0;
  const overCap = results.hasIncome && !results.pass;

  return (
    <div className="mx-auto w-full max-w-[1140px] px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[1.35rem] sm:text-[1.7rem] font-extrabold tracking-tight leading-tight">
            Property Restructure · DTI Cash-Out
          </h1>
          <p className="text-[0.9rem] mt-1" style={{ color: 'var(--ink-2)' }}>
            How much cash can you pull from the sale and still clear the bank's debt-to-income cap?
          </p>
        </div>
        <div className="flex items-center gap-2 flex-none">
          <button type="button" className="btn btn-ghost" onClick={copyLink}>
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
          <button type="button" className="btn" onClick={reset}>
            Reset
          </button>
        </div>
      </header>

      {/* Hero — cash-out is the decision */}
      <section className="card hero mb-6">
        <div className="hero-top">
          <div>
            <p className="hero-kicker">Cash out of the sale</p>
            <div className="hero-amount tnum">{money(inputs.cashOut)}</div>
            <p className="hero-sub">
              Into Rock Isle paydown: <strong className="tnum">{money(results.intoRockIsle)}</strong>
            </p>
          </div>
          <VerdictChip dti={results.dti} pass={results.pass} hasIncome={results.hasIncome} />
        </div>
        <div className="hero-range-wrap">
          <input
            type="range"
            className="range range-hero"
            min={0}
            max={inputs.salePrice}
            step={5000}
            value={inputs.cashOut}
            onChange={(e) => setCashOut(Number(e.target.value))}
            aria-label="Cash out amount"
          />
          <div className="hero-scale tnum">
            <span>$0</span>
            <span>{money(inputs.salePrice)}</span>
          </div>
        </div>
        <div className="hero-numwrap">
          <NumberField
            label="Exact cash-out"
            value={inputs.cashOut}
            onChange={setCashOut}
            min={0}
            max={inputs.salePrice}
          />
        </div>
      </section>

      {/* Two-column: inputs left, sticky results right */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,400px)] items-start">
        <div className="grid gap-6 min-w-0">
          <Section title="The sale & loans">
            <div className="grid-2">
              <NumberField
                label="Sale price (net)"
                value={inputs.salePrice}
                onChange={(v) => update('salePrice', v)}
                hint="Net of selling costs"
              />
              <div />
              <NumberField
                label="Forrest Hill loan"
                value={inputs.fhLoan}
                onChange={(v) => update('fhLoan', v)}
              />
              <NumberField
                label="Rock Isle loan"
                value={inputs.riLoan}
                onChange={(v) => update('riLoan', v)}
                hint="Receives the paydown"
              />
            </div>
          </Section>

          <Section
            title="Income"
            alert={
              overCap ? (
                <span>
                  Income is short by{' '}
                  <strong className="tnum">{money(results.incomeGap)}</strong> at this cash-out —
                  raise income or take less out.
                </span>
              ) : undefined
            }
          >
            <SegmentedControl<IncomePreset>
              label="Income scenario"
              value={preset}
              options={[
                { label: 'Single (NZ)', value: 'single', sub: '$180k' },
                { label: 'Dual (NZ+AU)', value: 'dual', sub: '$180k + A$120k' },
              ]}
              onChange={applyPreset}
            />
            <div className="grid-2">
              <NumberField
                label="NZ salary / drawings"
                value={inputs.nzSalary}
                onChange={(v) => update('nzSalary', v)}
              />
              <NumberField
                label="Australian income"
                value={inputs.audIncome}
                onChange={(v) => update('audIncome', v)}
                prefix="A$"
              />
            </div>
          </Section>

          {showOverseas && (
            <Section
              title="Overseas income"
              desc="Banks convert foreign income at a buffered rate below spot, then shade it for currency risk."
            >
              <div className="grid-2">
                <NumberField
                  label="FX rate (NZD per AUD)"
                  value={inputs.fxRate}
                  onChange={(v) => update('fxRate', v)}
                  prefix=""
                  decimals={4}
                  hint={
                    fxState === 'error'
                      ? 'Live fetch failed — enter manually'
                      : fxMeta
                        ? `Live ${fxMeta.rate.toFixed(4)} as at ${fxMeta.asAt}`
                        : 'Editable — or fetch live'
                  }
                />
                <div className="field" style={{ justifyItems: 'start' }}>
                  <span className="field-label">Live rate</span>
                  <button
                    type="button"
                    className="btn"
                    onClick={fetchFx}
                    disabled={fxState === 'loading'}
                    style={{ marginTop: 2 }}
                  >
                    {fxState === 'loading' ? 'Fetching…' : 'Fetch live FX'}
                  </button>
                </div>
              </div>
              <RangeSlider
                label="AUD income shading"
                value={inputs.audShading}
                min={60}
                max={100}
                step={5}
                onChange={(v) => update('audShading', v)}
                format={(v) => `${v}%`}
              />
              <p className="field-hint tnum">
                A${decimal(inputs.audIncome, 0)} × {inputs.fxRate} × {inputs.audShading}% ={' '}
                <strong>{money(results.audIncomeNZD)}</strong> assessable
              </p>
            </Section>
          )}

          <Section title="Rent">
            <div className="grid-2">
              <NumberField
                label="Forrest Hill rent"
                value={inputs.rentFHWeekly}
                onChange={(v) => update('rentFHWeekly', v)}
                suffix="/wk"
              />
              <NumberField
                label="Rock Isle rent"
                value={inputs.rentRIWeekly}
                onChange={(v) => update('rentRIWeekly', v)}
                suffix="/wk"
              />
            </div>
            <SegmentedControl<number>
              label="Servicing treatment"
              value={inputs.rentTreatment}
              options={[
                { label: 'Gross', value: 100, sub: '100%' },
                { label: 'Shaded', value: 75, sub: '75%' },
              ]}
              onChange={(v) => update('rentTreatment', v === 75 ? 75 : 100)}
            />
          </Section>

          <Section title="Cap & rate">
            <SegmentedControl<number>
              label="DTI cap"
              value={inputs.dtiCap}
              options={[
                { label: 'Investor', value: 7, sub: '7×' },
                { label: 'Owner-occ.', value: 6, sub: '6×' },
              ]}
              onChange={(v) => update('dtiCap', v === 6 ? 6 : 7)}
            />
            <div className="grid-2">
              <NumberField
                label="Interest rate"
                value={inputs.interestRate}
                onChange={(v) => update('interestRate', v)}
                prefix=""
                suffix="%"
                decimals={2}
              />
              <div />
            </div>
          </Section>

          <Section
            title="Outgoings & serviceability"
            desc="A rough serviceability check — separate from the DTI cap. Banks test repayments at a stressed rate on your after-tax income."
          >
            <NumberField
              label="Living expenses (outgoings)"
              value={inputs.livingExpenses}
              onChange={(v) => update('livingExpenses', v)}
              suffix="/yr"
              hint="Food, petrol, insurance, kids, etc."
            />
            <div className="grid-2">
              <NumberField
                label="Stress test rate"
                value={inputs.stressRate}
                onChange={(v) => update('stressRate', v)}
                prefix=""
                suffix="%"
                decimals={2}
                hint="Banks test ~8–9%, not your actual rate"
              />
              <NumberField
                label="Effective tax rate"
                value={inputs.taxRate}
                onChange={(v) => update('taxRate', v)}
                prefix=""
                suffix="%"
                decimals={0}
                hint="To estimate after-tax income"
              />
            </div>
          </Section>
        </div>

        {/* Sticky results */}
        <aside className="lg:sticky lg:top-6 min-w-0">
          <ResultsCard inputs={inputs} results={results} onJumpCashOut={setCashOut} />
        </aside>
      </div>

      <div className="mt-6">
        <ServiceabilityCard inputs={inputs} results={results} svc={svc} />
      </div>

      <div className="mt-6">
        <ScenarioCompare inputs={inputs} onPick={setCashOut} />
      </div>

      <Footer />
    </div>
  );
}

function VerdictChip({
  dti,
  pass,
  hasIncome,
}: {
  dti: number;
  pass: boolean;
  hasIncome: boolean;
}) {
  const cls = !hasIncome ? 'chip chip-muted' : pass ? 'chip chip-pass' : 'chip chip-fail';
  const label = !hasIncome ? 'Enter income' : pass ? 'Within the cap' : 'Over the cap';
  return (
    <div className={cls}>
      <span className="chip-dti tnum">DTI {dtiText(dti)}</span>
      <span className="chip-label">{label}</span>
    </div>
  );
}
