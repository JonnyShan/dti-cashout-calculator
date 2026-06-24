// DTI gauge: a 0→15 scale bar with a marker at the cap.

const MAX = 15;

export function Gauge({ dti, cap, pass }: { dti: number; cap: number; pass: boolean }) {
  const finite = Number.isFinite(dti);
  const fillPct = finite ? (Math.min(dti, MAX) / MAX) * 100 : 0;
  const capPct = (cap / MAX) * 100;

  return (
    <div className="gauge" role="img" aria-label={`DTI ${finite ? dti.toFixed(2) : 'unavailable'} against a ${cap}× cap on a 0 to ${MAX} scale`}>
      <div className="gauge-track">
        <div
          className={`gauge-fill ${pass ? 'is-pass' : 'is-fail'}`}
          style={{ width: `${fillPct}%` }}
        />
        <div className="gauge-marker" style={{ left: `${capPct}%` }} aria-hidden />
      </div>
      <div className="gauge-scale tnum" aria-hidden>
        <span className="lo">0</span>
        <span className="gauge-cap" style={{ left: `${capPct}%` }}>
          cap {cap}×
        </span>
        <span className="hi">{MAX}</span>
      </div>
    </div>
  );
}
