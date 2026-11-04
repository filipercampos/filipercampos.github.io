export interface BurnRateWindow {
  severity: 'page' | 'ticket';
  longWindow: string;
  shortWindow: string;
  burnRate: number;
  budgetConsumed: number;
  errorRateThreshold: number;
}

export interface SloReport {
  errorBudget: number;
  allowedDowntimeMinutes: number;
  windows: BurnRateWindow[];
}

const PERIOD_HOURS = 30 * 24;

/**
 * Multi-window, multi-burn-rate alerting (Google SRE workbook, ch. 5).
 * burnRate = budgetConsumed * periodHours / longWindowHours.
 */
const POLICY = [
  { severity: 'page', longHours: 1, shortLabel: '5m', budgetConsumed: 0.02 },
  { severity: 'page', longHours: 6, shortLabel: '30m', budgetConsumed: 0.05 },
  { severity: 'ticket', longHours: 72, shortLabel: '6h', budgetConsumed: 0.1 },
] as const;

export function sloReport(targetPercent: number): SloReport {
  if (!(targetPercent > 0 && targetPercent < 100)) throw new Error('SLO must be between 0 and 100');
  const errorBudget = 1 - targetPercent / 100;
  return {
    errorBudget,
    allowedDowntimeMinutes: errorBudget * PERIOD_HOURS * 60,
    windows: POLICY.map((policy) => {
      const burnRate = (policy.budgetConsumed * PERIOD_HOURS) / policy.longHours;
      return {
        severity: policy.severity,
        longWindow: `${policy.longHours}h`,
        shortWindow: policy.shortLabel,
        burnRate,
        budgetConsumed: policy.budgetConsumed,
        errorRateThreshold: Math.min(1, burnRate * errorBudget),
      };
    }),
  };
}
