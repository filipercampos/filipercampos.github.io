import { seededRandom } from './random';

export type GateStrategy = 'check-then-act' | 'atomic';

export interface SaleResult {
  sold: number;
  oversold: number;
  rejected: number;
  rateLimited: number;
  timeline: number[];
}

export interface SaleOptions {
  buyers: number;
  stock: number;
  strategy: GateStrategy;
  /** Requests allowed per tick by the token bucket in front of the gate. */
  tokensPerTick: number;
  seed?: number;
}

/**
 * Buyers arrive over ticks. A token bucket admits a bounded number per tick
 * (the rest get 429 and retry next tick). Admitted requests then hit the stock gate.
 * check-then-act: all requests admitted in the same tick read stock before anyone writes.
 * atomic: Redis DECR / DynamoDB conditional write - the check and the write are one step.
 */
export function simulateSale(options: SaleOptions): SaleResult {
  const random = seededRandom(options.seed ?? 42);
  let stock = options.stock;
  let sold = 0;
  let rejected = 0;
  let rateLimited = 0;
  const timeline: number[] = [];

  let waiting = options.buyers;
  while (waiting > 0) {
    const arriving = Math.min(waiting, Math.ceil(options.tokensPerTick * (1.5 + random())));
    const admitted = Math.min(arriving, options.tokensPerTick);
    rateLimited += arriving - admitted;
    // Rate-limited buyers retry; admitted ones leave the queue either way.
    waiting -= admitted;

    if (options.strategy === 'atomic') {
      for (let i = 0; i < admitted; i += 1) {
        if (stock > 0) {
          stock -= 1;
          sold += 1;
        } else {
          rejected += 1;
        }
      }
    } else {
      const seen = stock;
      for (let i = 0; i < admitted; i += 1) {
        // Everyone in this tick saw the same stale value.
        if (seen - Math.floor(i / 4) > 0) {
          stock -= 1;
          sold += 1;
        } else {
          rejected += 1;
        }
      }
    }
    timeline.push(sold);
  }

  return {
    sold,
    oversold: Math.max(0, sold - options.stock),
    rejected,
    rateLimited,
    timeline,
  };
}
