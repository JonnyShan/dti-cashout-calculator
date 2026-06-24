// Pure DTI cash-out calculation logic.
//
// This module encodes the NZ RBNZ Debt-to-Income framework as described in the
// build spec (§4). It has no UI or framework dependencies so it can be unit
// tested directly against the worked examples (§9).

export type RentTreatment = 100 | 75;
export type DtiCap = 7 | 6;

export interface DtiInputs {
  /** Sale price, net of selling costs (NZD). */
  salePrice: number;
  /** Cash pulled out of the sale instead of paid down (NZD). Clamped to [0, salePrice]. */
  cashOut: number;
  /** Local salary / drawings (NZD, gross). */
  nzSalary: number;
  /** Australian income (AUD, gross). */
  audIncome: number;
  /** FX rate expressed as NZD per 1 AUD. */
  fxRate: number;
  /** Foreign-income haircut, 60–100 (percent). */
  audShading: number;
  /** Forrest Hill weekly rent (NZD/wk). */
  rentFHWeekly: number;
  /** Rock Isle weekly rent (NZD/wk). */
  rentRIWeekly: number;
  /** Rent servicing treatment: 100 (gross) or 75 (shaded). */
  rentTreatment: RentTreatment;
  /** Forrest Hill current loan (NZD). */
  fhLoan: number;
  /** Rock Isle current loan (NZD) — receives the paydown. */
  riLoan: number;
  /** DTI cap: 7 (investor) or 6 (owner-occupier). */
  dtiCap: DtiCap;
  /** Interest rate for cashflow / cost-of-cash-out calc (percent p.a.). */
  interestRate: number;
}

export type MaxCashOutFlag = 'normal' | 'alreadyUnder' | 'cantReach';

export interface DtiResults {
  audIncomeNZD: number;
  annualRent: number;
  assessedRent: number;
  assessedIncome: number;
  intoRockIsle: number;
  newRILoan: number;
  newTotalDebt: number;
  /** DTI ratio. Infinity when there is no assessable income. */
  dti: number;
  /** True when assessedIncome > 0 (used to render "—" instead of garbage). */
  hasIncome: boolean;
  requiredIncome: number;
  /** >0 = need more income to stay at cap; <=0 = headroom. */
  incomeGap: number;
  pass: boolean;
  maxDebt: number;
  maxRILoan: number;
  minPaydown: number;
  maxCashOut: number;
  maxCashOutFlag: MaxCashOutFlag;
  wkRate: number;
  costPerWeek: number;
  savedPerWeek: number;
  costPerYear: number;
  savedPerYear: number;
}

const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/**
 * Run the full DTI cash-out model. Implements the formulas in spec §4 exactly.
 * `cashOut` is clamped to [0, salePrice] and `salePrice` floored at 0 defensively.
 */
export function computeDti(input: DtiInputs): DtiResults {
  const salePrice = Math.max(0, input.salePrice);
  const cashOut = clamp(input.cashOut, 0, salePrice);

  const audIncomeNZD = input.audIncome * input.fxRate * (input.audShading / 100);
  const annualRent = (input.rentFHWeekly + input.rentRIWeekly) * 52;
  const assessedRent = annualRent * (input.rentTreatment / 100);
  const assessedIncome = input.nzSalary + audIncomeNZD + assessedRent;

  const intoRockIsle = Math.max(0, salePrice - cashOut);
  const newRILoan = Math.max(0, input.riLoan - intoRockIsle);
  const newTotalDebt = newRILoan + input.fhLoan;

  const hasIncome = assessedIncome > 0;
  const dti = hasIncome ? newTotalDebt / assessedIncome : Infinity;
  const requiredIncome = newTotalDebt / input.dtiCap;
  const incomeGap = requiredIncome - assessedIncome; // >0 = need more; <0 = headroom
  const pass = dti <= input.dtiCap + 1e-9;

  // Max cash-out at current income while staying <= cap.
  const maxDebt = input.dtiCap * assessedIncome;
  const maxRILoan = maxDebt - input.fhLoan;
  const minPaydown = input.riLoan - maxRILoan; // paydown into RI needed to reach cap

  let maxCashOut: number;
  let maxCashOutFlag: MaxCashOutFlag;
  if (minPaydown <= 0) {
    maxCashOut = salePrice; // already compliant even taking the full sale as cash
    maxCashOutFlag = 'alreadyUnder';
  } else if (minPaydown > salePrice) {
    maxCashOut = 0; // can't reach cap even with the full sale paid down
    maxCashOutFlag = 'cantReach';
  } else {
    maxCashOut = salePrice - minPaydown;
    maxCashOutFlag = 'normal';
  }

  // Cashflow (interest-based, honest).
  const wkRate = input.interestRate / 100 / 52;
  const costPerWeek = cashOut * wkRate; // interest you keep paying by NOT tipping the cash in
  const savedPerWeek = intoRockIsle * wkRate; // interest saved by the paydown
  const costPerYear = (cashOut * input.interestRate) / 100;
  const savedPerYear = (intoRockIsle * input.interestRate) / 100;

  return {
    audIncomeNZD,
    annualRent,
    assessedRent,
    assessedIncome,
    intoRockIsle,
    newRILoan,
    newTotalDebt,
    dti,
    hasIncome,
    requiredIncome,
    incomeGap,
    pass,
    maxDebt,
    maxRILoan,
    minPaydown,
    maxCashOut,
    maxCashOutFlag,
    wkRate,
    costPerWeek,
    savedPerWeek,
    costPerYear,
    savedPerYear,
  };
}
