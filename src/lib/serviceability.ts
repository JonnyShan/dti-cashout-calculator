// Rough serviceability / affordability check — SEPARATE from the DTI cap.
//
// The DTI cap is debt ÷ gross income. Serviceability is a different gate: can
// you actually afford the repayments at a stressed test rate, after living
// expenses and tax? Banks test P&I over ~30yr at a rate well above your actual
// one. This is a simplified, transparent estimate — not a bank quote. The exact
// stress rate, tax treatment and term are bank-specific.

export interface ServiceabilityParams {
  /** Annual living expenses / outgoings (NZD). */
  livingExpenses: number;
  /** Stressed test interest rate (percent p.a.) — banks test ~8–9%. */
  stressRate: number;
  /** Effective tax rate (percent) used to estimate after-tax income. */
  taxRate: number;
}

export interface ServiceabilityResult {
  stressedMonthly: number;
  stressedAnnual: number;
  netIncome: number;
  afterLiving: number;
  /** netIncome − livingExpenses − stressedAnnual. >=0 = serviceable. */
  surplus: number;
  serviceable: boolean;
  /** Gross assessable income that would bring the surplus to zero. */
  incomeNeeded: number;
}

/** Default loan term (years) used for the stressed P&I repayment. */
export const SERVICEABILITY_TERM_YEARS = 30;

export function computeServiceability(input: {
  totalDebt: number;
  grossIncome: number;
  livingExpenses: number;
  stressRate: number;
  taxRate: number;
  termYears?: number;
}): ServiceabilityResult {
  const termYears = input.termYears ?? SERVICEABILITY_TERM_YEARS;
  const totalDebt = Math.max(0, input.totalDebt);
  const r = input.stressRate / 100 / 12;
  const n = termYears * 12;

  // Standard P&I amortisation; falls back to straight-line principal at 0%.
  const stressedMonthly =
    r === 0 ? (n > 0 ? totalDebt / n : 0) : (totalDebt * r) / (1 - Math.pow(1 + r, -n));
  const stressedAnnual = stressedMonthly * 12;

  const netFactor = 1 - input.taxRate / 100;
  const netIncome = input.grossIncome * netFactor;
  const afterLiving = netIncome - input.livingExpenses;
  const surplus = afterLiving - stressedAnnual;
  const serviceable = surplus >= 0;

  // Gross income such that net − living − stressed repayment = 0.
  const incomeNeeded =
    netFactor > 0 ? (stressedAnnual + input.livingExpenses) / netFactor : Infinity;

  return { stressedMonthly, stressedAnnual, netIncome, afterLiving, surplus, serviceable, incomeNeeded };
}
