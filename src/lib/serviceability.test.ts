import { describe, it, expect } from 'vitest';
import { computeServiceability } from './serviceability';

describe('serviceability (rough)', () => {
  it('flags the default scenario as a shortfall at the stress rate', () => {
    // Default scenario: debt $2,800,000, gross income $400,650.
    const r = computeServiceability({
      totalDebt: 2_800_000,
      grossIncome: 400_650,
      livingExpenses: 100_000,
      stressRate: 8.5,
      taxRate: 30,
    });
    expect(r.stressedAnnual).toBeGreaterThan(255_000);
    expect(r.stressedAnnual).toBeLessThan(262_000);
    expect(r.netIncome).toBeCloseTo(280_455, 0);
    expect(r.serviceable).toBe(false);
    expect(r.surplus).toBeLessThan(0);
    // Serviceability needs more income than the DTI cap (~$400k) here.
    expect(r.incomeNeeded).toBeGreaterThan(500_000);
  });

  it('becomes serviceable with enough income', () => {
    const r = computeServiceability({
      totalDebt: 2_800_000,
      grossIncome: 600_000,
      livingExpenses: 100_000,
      stressRate: 8.5,
      taxRate: 30,
    });
    expect(r.serviceable).toBe(true);
    expect(r.surplus).toBeGreaterThan(0);
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
