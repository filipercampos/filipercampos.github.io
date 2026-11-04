import { seededRandom, shuffle } from './random';

export interface Entry {
  account: string;
  /** Minor units. Positive = debit, negative = credit. */
  amount: number;
}

export type ValidationResult = { ok: true } | { ok: false; reason: string };

/** Same invariant as ledger-service: at least two legs, no zero legs, sum = 0. */
export function validateTransaction(entries: Entry[]): ValidationResult {
  if (entries.length < 2) return { ok: false, reason: 'A transaction needs at least two entries' };
  if (entries.some((e) => !Number.isInteger(e.amount))) {
    return { ok: false, reason: 'Amounts must be integers in minor units (no floats)' };
  }
  if (entries.some((e) => e.amount === 0)) return { ok: false, reason: 'Zero-amount entries are not allowed' };
  const total = entries.reduce((sum, e) => sum + e.amount, 0);
  if (total !== 0) return { ok: false, reason: `Unbalanced: off by ${total}` };
  return { ok: true };
}

export type Strategy = 'naive' | 'locked';

export interface PurchaseEvent {
  buyer: number;
  outcome: 'committed' | 'rejected';
  balanceAfter: number;
}

export interface PurchaseRun {
  events: PurchaseEvent[];
  committed: number;
  rejected: number;
  finalBalance: number;
}

/**
 * N concurrent purchases against one wallet.
 * naive: read balance, check, then write later (interleaved) - lost updates and overdraft.
 * locked: SELECT ... FOR UPDATE serializes check+write per account.
 */
export function simulatePurchases(
  buyers: number,
  price: number,
  initialBalance: number,
  strategy: Strategy,
  seed = 7,
): PurchaseRun {
  const random = seededRandom(seed);
  const events: PurchaseEvent[] = [];

  if (strategy === 'locked') {
    let balance = initialBalance;
    for (const buyer of shuffle([...Array(buyers).keys()], random)) {
      if (balance - price >= 0) {
        balance -= price;
        events.push({ buyer, outcome: 'committed', balanceAfter: balance });
      } else {
        events.push({ buyer, outcome: 'rejected', balanceAfter: balance });
      }
    }
    return summarize(events, balance);
  }

  // Naive: every buyer reads the balance in a first phase, then writes in random order.
  let balance = initialBalance;
  const order = shuffle([...Array(buyers).keys()], random);
  const reads = new Map<number, number>();
  // Reads happen in batches before writes land, which is what concurrency does to check-then-act.
  const batch = Math.max(2, Math.ceil(buyers / 3));
  for (let start = 0; start < order.length; start += batch) {
    const group = order.slice(start, start + batch);
    for (const buyer of group) reads.set(buyer, balance);
    for (const buyer of group) {
      const seen = reads.get(buyer) ?? 0;
      if (seen - price >= 0) {
        // Each request applies a relative update: the check passed on a stale read.
        balance -= price;
        events.push({ buyer, outcome: 'committed', balanceAfter: balance });
      } else {
        events.push({ buyer, outcome: 'rejected', balanceAfter: balance });
      }
    }
  }
  return summarize(events, balance);
}

function summarize(events: PurchaseEvent[], finalBalance: number): PurchaseRun {
  const committed = events.filter((e) => e.outcome === 'committed').length;
  return { events, committed, rejected: events.length - committed, finalBalance };
}
