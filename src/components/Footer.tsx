export function Footer() {
  return (
    <footer
      style={{
        marginTop: 8,
        padding: '4px 4px 8px',
        fontSize: '0.76rem',
        lineHeight: 1.55,
        color: 'var(--muted)',
      }}
    >
      <p style={{ fontWeight: 700, color: 'var(--ink-2)' }}>Not financial advice — a planning tool.</p>
      <p style={{ marginTop: 6 }}>
        DTI caps apply to <em>new or increased</em> lending, not existing loans. The overseas-income
        shading % and the FX rate banks use are bank-specific and not publicly published — confirm
        with the bank or a trans-Tasman mortgage broker. As an NZ-resident citizen, overseas-person
        LVR / deposit penalties shouldn't apply; only income shading does. Investor cap 7× and
        owner-occupier cap 6× are the compliance lines (banks hold a 20% speed-limit allowance above
        them). Live FX is indicative and updates daily — never hard-trust it.
      </p>
    </footer>
  );
}
