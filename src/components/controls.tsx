import { useId, useState, type ReactNode } from 'react';
import { decimal, group, parseLoose } from '../lib/format';

/* --- Section ------------------------------------------------------------- */
export function Section({
  title,
  desc,
  aside,
  alert,
  children,
}: {
  title: string;
  desc?: string;
  aside?: ReactNode;
  /** When set, the card turns red (alert state) and shows this note at the bottom. */
  alert?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card section" data-alert={alert ? true : undefined}>
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {aside}
      </div>
      {desc && <p className="section-desc">{desc}</p>}
      <div className="section-body">{children}</div>
      {alert ? <div className="section-alert">{alert}</div> : null}
    </section>
  );
}

/* --- NumberField --------------------------------------------------------- */
interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  decimals?: number;
  hint?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  prefix = '$',
  suffix,
  min = 0,
  max,
  decimals = 0,
  hint,
}: NumberFieldProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const [buf, setBuf] = useState('');

  const formatted = decimals > 0 ? decimal(value, decimals) : group(value);
  const display = focused ? buf : formatted;

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="field-control">
        {prefix && <span className="adorn">{prefix}</span>}
        <input
          id={id}
          className={`field-input tnum${prefix ? ' has-prefix' : ''}`}
          inputMode="decimal"
          value={display}
          onFocus={() => {
            setBuf(decimals > 0 ? String(value) : String(Math.round(value)));
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const raw = e.target.value;
            setBuf(raw);
            const parsed = parseLoose(raw);
            if (parsed === null) return;
            let v = parsed;
            if (min !== undefined) v = Math.max(min, v);
            if (max !== undefined) v = Math.min(max, v);
            onChange(v);
          }}
        />
        {suffix && <span className="adorn adorn-suffix">{suffix}</span>}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

/* --- SegmentedControl ---------------------------------------------------- */
interface SegOption<T> {
  label: string;
  value: T;
  sub?: string;
}

export function SegmentedControl<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T | null;
  options: SegOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      {label && <span className="field-label">{label}</span>}
      <div className="seg" role="group" aria-label={label}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button
              key={String(o.value)}
              type="button"
              className="seg-btn"
              data-on={on || undefined}
              aria-pressed={on}
              onClick={() => onChange(o.value)}
            >
              <span>{o.label}</span>
              {o.sub && <span className="seg-sub">{o.sub}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --- RangeSlider --------------------------------------------------------- */
export function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  format?: (n: number) => string;
}) {
  const id = useId();
  return (
    <div className="field">
      <div className="range-head">
        <label htmlFor={id} className="field-label">
          {label}
        </label>
        <span className="range-val tnum">{format ? format(value) : value}</span>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
