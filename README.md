# Property Restructure · DTI Cash-Out Calculator

A single-screen calculator for a NZ property investor deciding how much cash to
pull out of a property sale vs. tip into a loan, while staying under their bank's
Debt-to-Income (DTI) cap. Cross-border NZD + AUD income supported. Everything
recalculates instantly; no backend.

> **Not financial advice — a planning tool.** DTI caps apply to new/increased
> lending. Overseas-income shading % and the FX rate banks use are bank-specific
> and not publicly published.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest — asserts the spec §9 worked examples
npm run build      # production build to dist/
npm run typecheck  # tsc --noEmit
```

## Layout

- `src/lib/dti.ts` — pure calculation logic (spec §4). No UI deps; unit-tested.
- `src/lib/dti.test.ts` — Vitest cases for the §9 worked examples + edge cases.
- `src/lib/format.ts` — currency / number formatting + loose parsing.
- `src/lib/fx.ts` — optional live FX fetch (open.er-api.com, no key) for NZD/AUD.
- `src/lib/state.ts` — defaults, sanitising, URL + localStorage persistence.
- `src/components/*` — controls, gauge, results card, scenario compare, footer.
- `src/App.tsx` — state, hero cash-out control, two-column layout.

## Features

- Hero cash-out slider synced with an exact number field.
- Live DTI verdict, 0→15 gauge with a marker at the cap, figures table with an
  income breakdown (NZ salary + AUD-converted + rent).
- Income-gap, max-cash-out (with a "Set" jump), and cost-of-cash-out strips.
- Segmented toggles: income preset (single/dual), rent 100/75, cap 7×/6×.
- Overseas-income section (FX + shading 60–100%) shown only when AUD income > 0.
- Live FX fetch with manual override and an "as at" timestamp.
- $0 / $300k / $500k scenario compare (tap to apply).
- Shareable URL state + localStorage persistence; reset to defaults.
- Light fintech theme, tabular numerals, `prefers-reduced-motion` respected.

## Note on spec §9, Example 3

The spec text states "DTI ≈ 7.16" for the single-income $300k case, but the §4
formulas give **8.05** (`2,705,000 / 336,000`). The example's own "over the cap"
verdict and `+50,400` income gap both corroborate 8.05, so 7.16 is treated as a
typo. The unit test asserts 8.05.
