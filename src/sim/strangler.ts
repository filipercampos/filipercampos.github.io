import { fnv1a } from './random';

export interface RoutingConfig {
  /** 0-100: share of customers whose reads go to the modern service. */
  rolloutPercent: number;
  killSwitch: boolean;
  /** Customers pinned to modern regardless of percentage (pilot tenants). */
  overrides: Set<string>;
}

export type Target = 'legacy' | 'modern';

/** Sticky bucketing: a customer always lands in the same bucket, so rollout only ever grows. */
export function bucketOf(customerId: string): number {
  return fnv1a(customerId) % 100;
}

export function route(customerId: string, config: RoutingConfig): Target {
  if (config.killSwitch) return 'legacy';
  if (config.overrides.has(customerId)) return 'modern';
  return bucketOf(customerId) < config.rolloutPercent ? 'modern' : 'legacy';
}

export function distribution(customers: string[], config: RoutingConfig) {
  let modern = 0;
  for (const customer of customers) if (route(customer, config) === 'modern') modern += 1;
  return { modern, legacy: customers.length - modern };
}
