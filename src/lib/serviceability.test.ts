import { describe, it, expect } from 'vitest';
import { computeServiceability } from './serviceability';

describe('serviceability (rough)', () => {
  it('is roughly serviceable for the example baseline', () => {
    // Example: debt $1,000,000, gross income $199,000.
    const r = computeServiceability({
      totalDebt: 1_000_000,
      grossIncome: 199_000,
      livingExpenses: 45_000,
      stressRate: 8.5,
      taxRate: 30,
    });
    expect(r.stressedAnnual).toBeGreaterThan(90_000);
    expect(r.stressedAnnual).toBeLessThan(95_000);
    expect(r.netIncome).toBeCloseTo(139_300, 0);
    expect(r.serviceable).toBe(true);
    expect(r.surplus).toBeGreaterThan(0);
    expect(r.incomeNeeded).toBeLessThan(199_000);
  });

  it('tips into shortfall as the debt rises', () => {
    const r = computeServiceability({
      totalDebt: 1_600_000,
      grossIncome: 199_000,
      livingExpenses: 45_000,
      stressRate: 8.5,
      taxRate: 30,
    });
    expect(r.serviceable).toBe(false);
    expect(r.surplus).toBeLessThan(0);
    expect(r.incomeNeeded).toBeGreaterThan(199_000);
  });

  it('falls back to straight-line principal at a 0% stress rate', () => {
    const r = computeServiceability({
      totalDebt: 360_000,
      grossIncome: 1_000_000,
      livingExpenses: 0,
      stressRate: 0,
      taxRate: 0,
      termYears: 30,
    });
    expect(r.stressedAnnual).toBeCloseTo(12_000, 0); // 360k / 30yr
    expect(r.serviceable).toBe(true);
  });
});
