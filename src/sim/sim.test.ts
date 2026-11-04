import { describe, expect, it } from 'vitest';
import { simulateSale } from './flashSale';
import { simulatePurchases, validateTransaction } from './ledger';
import { traceDocument } from './pipeline';
import { sagaSteps, TERMINAL_STATES } from './saga';
import { sloReport } from './slo';
import { bucketOf, distribution, route } from './strangler';

describe('ledger', () => {
  it('accepts only balanced integer transactions', () => {
    expect(validateTransaction([{ account: 'a', amount: -100 }, { account: 'b', amount: 100 }]).ok).toBe(true);
    expect(validateTransaction([{ account: 'a', amount: -100 }, { account: 'b', amount: 99 }]).ok).toBe(false);
    expect(validateTransaction([{ account: 'a', amount: -0.1 }, { account: 'b', amount: 0.1 }]).ok).toBe(false);
  });

  it('locking never overdraws; naive check-then-act does', () => {
    const locked = simulatePurchases(50, 100, 1000, 'locked');
    expect(locked.committed).toBe(10);
    expect(locked.finalBalance).toBe(0);
    const naive = simulatePurchases(50, 100, 1000, 'naive');
    expect(naive.finalBalance).toBeLessThan(0);
  });
});

describe('flash sale', () => {
  it('atomic gate never oversells, check-then-act does', () => {
    const base = { buyers: 5000, stock: 200, tokensPerTick: 120 };
    expect(simulateSale({ ...base, strategy: 'atomic' }).oversold).toBe(0);
    expect(simulateSale({ ...base, strategy: 'atomic' }).sold).toBe(200);
    expect(simulateSale({ ...base, strategy: 'check-then-act' }).oversold).toBeGreaterThan(0);
  });
});

describe('saga', () => {
  it('every scenario ends in a terminal state', () => {
    for (const scenario of ['happy', 'out-of-stock', 'payment-declined', 'payment-timeout'] as const) {
      const steps = sagaSteps(scenario);
      expect(TERMINAL_STATES).toContain(steps.at(-1)?.state);
    }
  });

  it('compensations run in reverse order on timeout', () => {
    const comps = sagaSteps('payment-timeout').filter((s) => s.kind === 'compensation');
    expect(comps.map((s) => s.to)).toEqual(['payment', 'inventory']);
  });
});

describe('pipeline', () => {
  it('deduplicates repeated delivery and dead-letters poison files', () => {
    const processed = new Set<string>();
    expect(traceDocument('d1', 'duplicate', processed).status).toBe('PROCESSED');
    expect(traceDocument('d1', 'duplicate', processed).status).toBe('DEDUPLICATED');
    expect(traceDocument('d2', 'poison', processed).path.at(-1)).toBe('dlq');
  });
});

describe('strangler routing', () => {
  const customers = Array.from({ length: 2000 }, (_, i) => `cust-${i}`);

  it('is sticky and monotonic as rollout grows', () => {
    const at10 = customers.filter((c) => route(c, { rolloutPercent: 10, killSwitch: false, overrides: new Set() }) === 'modern');
    const at50 = new Set(customers.filter((c) => route(c, { rolloutPercent: 50, killSwitch: false, overrides: new Set() }) === 'modern'));
    expect(at10.every((c) => at50.has(c))).toBe(true);
    expect(bucketOf('cust-1')).toBe(bucketOf('cust-1'));
  });

  it('kill switch sends everyone to legacy, overrides pin pilots', () => {
    expect(distribution(customers, { rolloutPercent: 100, killSwitch: true, overrides: new Set() }).modern).toBe(0);
    expect(route('pilot', { rolloutPercent: 0, killSwitch: false, overrides: new Set(['pilot']) })).toBe('modern');
  });
});

describe('slo', () => {
  it('matches the SRE workbook burn rates for a 99.9% SLO', () => {
    const report = sloReport(99.9);
    expect(report.windows.map((w) => w.burnRate)).toEqual([14.4, 6, 1]);
    expect(report.allowedDowntimeMinutes).toBeCloseTo(43.2, 1);
    expect(report.windows[0]?.errorRateThreshold).toBeCloseTo(0.0144, 4);
  });
});
