import { describe, it, expect } from 'vitest';
import { computeDti, type DtiInputs } from './dti';

// Base case = the dual-income default situation from spec §3.
const base: DtiInputs = {
  salePrice: 1_800_000,
  cashOut: 300_000,
  nzSalary: 150_000,
  audIncome: 180_000,
  fxRate: 1.21,
  audShading: 100,
  rentFHWeekly: 1_000,
  rentRIWeekly: 2_000,
  rentTreatment: 100,
  fhLoan: 665_000,
  riLoan: 3_540_000,
  dtiCap: 7,
  interestRate: 4.9,
};

describe('spec §9 worked examples', () => {
  it('Example 1 — dual income, market rate, gross rent, $300k cash-out', () => {
    const r = computeDti(base);
    expect(r.assessedIncome).toBeCloseTo(523_800, 0);
    expect(r.newTotalDebt).toBe(2_705_000);
    expect(r.dti).toBeCloseTo(5.16, 2);
    expect(r.pass).toBe(true);
    expect(r.maxCashOut).toBeCloseTo(1_261_600, 0);
    expect(r.maxCashOutFlag).toBe('normal');
  });

  it('Example 2 — dual income, harsh bank treatment, $300k cash-out', () => {
    const r = computeDti({ ...base, fxRate: 1.15, audShading: 60, rentTreatment: 75 });
    expect(r.assessedIncome).toBeCloseTo(391_200, 0);
    expect(r.dti).toBeCloseTo(6.91, 2);
    expect(r.pass).toBe(true); // just under the 7× cap
    expect(r.maxCashOut).toBeCloseTo(333_400, 0);
    expect(r.maxCashOutFlag).toBe('normal');
  });

  it('Example 3 — single NZ income $180k, gross rent, $300k cash-out (over cap)', () => {
    const r = computeDti({ ...base, audIncome: 0, nzSalary: 180_000, rentTreatment: 100 });
    expect(r.assessedIncome).toBe(336_000);
    // NB: spec text says "DTI ≈ 7.16" but the §4 formulas give 8.05 here
    // (2,705,000 / 336,000). The "over the cap" verdict and +50,400 income gap
    // in the spec both corroborate 8.05, so 7.16 is treated as a typo.
    expect(r.dti).toBeCloseTo(8.05, 2);
    expect(r.pass).toBe(false);
    expect(r.incomeGap).toBeCloseTo(50_429, 0);
  });
});

describe('edge cases', () => {
  it('clamps cash-out to the sale price', () => {
    const r = computeDti({ ...base, cashOut: 5_000_000 });
    expect(r.intoRockIsle).toBe(0);
    expect(r.newRILoan).toBe(base.riLoan); // nothing paid down
  });

  it('clamps negative cash-out to zero (full paydown)', () => {
    const r = computeDti({ ...base, cashOut: -100_000 });
    expect(r.intoRockIsle).toBe(base.salePrice);
  });

  it('floors the new Rock Isle loan at zero when paydown exceeds the loan', () => {
    const r = computeDti({ ...base, cashOut: 0, riLoan: 1_000_000 });
    // intoRockIsle = 1.8M > 1.0M loan -> floored at 0, surplus ignored
    expect(r.newRILoan).toBe(0);
    expect(r.newTotalDebt).toBe(base.fhLoan);
  });

  it('reports no DTI when there is no assessable income', () => {
    const r = computeDti({
      ...base,
      nzSalary: 0,
      audIncome: 0,
      rentFHWeekly: 0,
      rentRIWeekly: 0,
    });
    expect(r.hasIncome).toBe(false);
    expect(Number.isFinite(r.dti)).toBe(false);
    expect(r.pass).toBe(false);
  });

  it('flags "alreadyUnder" when even a full cash-out stays within the cap', () => {
    // Huge income -> cap is never binding.
    const r = computeDti({ ...base, nzSalary: 5_000_000 });
    expect(r.maxCashOutFlag).toBe('alreadyUnder');
    expect(r.maxCashOut).toBe(base.salePrice);
  });

  it('flags "cantReach" when even a full paydown cannot reach the cap', () => {
    // Tiny income -> cap unreachable.
    const r = computeDti({
      ...base,
      nzSalary: 1_000,
      audIncome: 0,
      rentFHWeekly: 0,
      rentRIWeekly: 0,
    });
    expect(r.maxCashOutFlag).toBe('cantReach');
    expect(r.maxCashOut).toBe(0);
  });

  it('owner-occupier cap (6×) is stricter than investor (7×)', () => {
    const investor = computeDti({ ...base, dtiCap: 7 });
    const owner = computeDti({ ...base, dtiCap: 6 });
    expect(owner.requiredIncome).toBeGreaterThan(investor.requiredIncome);
    expect(owner.maxCashOut).toBeLessThan(investor.maxCashOut);
  });
});

describe('default scenario (app defaults)', () => {
  const scenario: DtiInputs = {
    salePrice: 1_800_000,
    cashOut: 350_000,
    nzSalary: 180_000,
    audIncome: 120_000,
    fxRate: 1.1,
    audShading: 80,
    rentFHWeekly: 950,
    rentRIWeekly: 2_000,
    rentTreatment: 75,
    fhLoan: 650_000,
    riLoan: 3_600_000,
    dtiCap: 7,
    interestRate: 4.5,
  };

  it('starts at DTI ~6.99, just within the cap', () => {
    const r = computeDti(scenario);
    expect(r.assessedIncome).toBe(400_650);
    expect(r.newTotalDebt).toBe(2_800_000);
    expect(r.dti).toBeCloseTo(6.99, 2);
    expect(r.pass).toBe(true);
    expect(r.maxCashOut).toBeCloseTo(354_550, 0);
  });

  it('tips over the cap once cash-out exceeds the ~354k ceiling', () => {
    const under = computeDti({ ...scenario, cashOut: 350_000 });
    expect(under.pass).toBe(true);

    const over = computeDti({ ...scenario, cashOut: 400_000 });
    expect(over.pass).toBe(false);
    expect(over.incomeGap).toBeGreaterThan(0); // drives the red income state
  });
});
