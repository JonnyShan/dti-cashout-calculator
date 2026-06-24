// Defaults, input sanitising, and URL + localStorage persistence.

import type { DtiInputs, DtiCap, RentTreatment } from './dti';
import type { ServiceabilityParams } from './serviceability';

/** Full app state: the DTI inputs plus the serviceability assumptions. */
export type AppInputs = DtiInputs & ServiceabilityParams;

/** Pre-loaded DTI defaults. */
export const DEFAULTS: DtiInputs = {
  salePrice: 1_750_000,
  cashOut: 0,
  nzSalary: 120_000,
  audIncome: 120_000,
  fxRate: 1.21,
  audShading: 80,
  rentFHWeekly: 950,
  rentRIWeekly: 2_000,
  rentTreatment: 75,
  fhLoan: 642_000,
  riLoan: 3_527_000,
  dtiCap: 7,
  interestRate: 4.47,
};

/** Serviceability assumption defaults — outgoings, stress rate, tax. */
export const SERVICEABILITY_DEFAULTS: ServiceabilityParams = {
  livingExpenses: 100_000,
  stressRate: 8.5,
  taxRate: 30,
};

export const APP_DEFAULTS: AppInputs = { ...DEFAULTS, ...SERVICEABILITY_DEFAULTS };

export type IncomePreset = 'single' | 'dual';

/** NZ income only — the "what if I lose the Aussie income" scenario. */
export const SINGLE_INCOME: Pick<DtiInputs, 'nzSalary' | 'audIncome'> = {
  nzSalary: 120_000,
  audIncome: 0,
};

/** The dual-income default (NZ + AU). */
export const DUAL_INCOME: Pick<DtiInputs, 'nzSalary' | 'audIncome'> = {
  nzSalary: 120_000,
  audIncome: 120_000,
};

/** Which preset (if any) the current income figures correspond to. */
export function activePreset(inputs: DtiInputs): IncomePreset | null {
  if (inputs.audIncome === SINGLE_INCOME.audIncome && inputs.nzSalary === SINGLE_INCOME.nzSalary) {
    return 'single';
  }
  if (inputs.audIncome === DUAL_INCOME.audIncome && inputs.nzSalary === DUAL_INCOME.nzSalary) {
    return 'dual';
  }
  return null;
}

// --- Sanitising -----------------------------------------------------------

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const asRentTreatment = (v: unknown): RentTreatment => (Number(v) === 75 ? 75 : 100);
const asDtiCap = (v: unknown): DtiCap => (Number(v) === 6 ? 6 : 7);
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Coerce a partial/untrusted object into valid, fully-populated AppInputs. */
export function sanitize(raw: Partial<AppInputs>): AppInputs {
  const salePrice = Math.max(0, num(raw.salePrice, APP_DEFAULTS.salePrice));
  return {
    salePrice,
    cashOut: Math.min(Math.max(0, num(raw.cashOut, APP_DEFAULTS.cashOut)), salePrice),
    nzSalary: Math.max(0, num(raw.nzSalary, APP_DEFAULTS.nzSalary)),
    audIncome: Math.max(0, num(raw.audIncome, APP_DEFAULTS.audIncome)),
    fxRate: Math.max(0, num(raw.fxRate, APP_DEFAULTS.fxRate)),
    audShading: clamp(num(raw.audShading, APP_DEFAULTS.audShading), 60, 100),
    rentFHWeekly: Math.max(0, num(raw.rentFHWeekly, APP_DEFAULTS.rentFHWeekly)),
    rentRIWeekly: Math.max(0, num(raw.rentRIWeekly, APP_DEFAULTS.rentRIWeekly)),
    rentTreatment: asRentTreatment(raw.rentTreatment ?? APP_DEFAULTS.rentTreatment),
    fhLoan: Math.max(0, num(raw.fhLoan, APP_DEFAULTS.fhLoan)),
    riLoan: Math.max(0, num(raw.riLoan, APP_DEFAULTS.riLoan)),
    dtiCap: asDtiCap(raw.dtiCap ?? APP_DEFAULTS.dtiCap),
    interestRate: Math.max(0, num(raw.interestRate, APP_DEFAULTS.interestRate)),
    livingExpenses: Math.max(0, num(raw.livingExpenses, APP_DEFAULTS.livingExpenses)),
    stressRate: clamp(num(raw.stressRate, APP_DEFAULTS.stressRate), 0, 20),
    taxRate: clamp(num(raw.taxRate, APP_DEFAULTS.taxRate), 0, 60),
  };
}

// --- URL query state ------------------------------------------------------

const KEYS: Record<keyof AppInputs, string> = {
  salePrice: 'sp',
  cashOut: 'co',
  nzSalary: 'ns',
  audIncome: 'ai',
  fxRate: 'fx',
  audShading: 'sh',
  rentFHWeekly: 'rfh',
  rentRIWeekly: 'rri',
  rentTreatment: 'rt',
  fhLoan: 'fh',
  riLoan: 'ri',
  dtiCap: 'cap',
  interestRate: 'ir',
  livingExpenses: 'le',
  stressRate: 'sr',
  taxRate: 'tx',
};

const INPUT_KEYS = Object.keys(KEYS) as (keyof AppInputs)[];

export function serializeToQuery(inputs: AppInputs): string {
  const p = new URLSearchParams();
  for (const k of INPUT_KEYS) p.set(KEYS[k], String(inputs[k]));
  return p.toString();
}

export function parseFromQuery(search: string): Partial<AppInputs> {
  const p = new URLSearchParams(search);
  const out: Partial<AppInputs> = {};
  for (const k of INPUT_KEYS) {
    const raw = p.get(KEYS[k]);
    if (raw == null) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) (out as Record<string, number>)[k] = n;
  }
  return out;
}

// --- localStorage ---------------------------------------------------------

const LS_KEY = 'dti-cashout-v2';

export function loadStored(): Partial<AppInputs> | null {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? (JSON.parse(s) as Partial<AppInputs>) : null;
  } catch {
    return null;
  }
}

export function saveStored(inputs: AppInputs): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(inputs));
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function clearStored(): void {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

/** Initial inputs, layering URL params over localStorage over defaults. */
export function loadInitialInputs(): AppInputs {
  const fromUrl = typeof location !== 'undefined' ? parseFromQuery(location.search) : {};
  const fromLs = loadStored() ?? {};
  return sanitize({ ...APP_DEFAULTS, ...fromLs, ...fromUrl });
}
