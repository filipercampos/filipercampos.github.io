export type Scenario = 'happy' | 'out-of-stock' | 'payment-declined' | 'payment-timeout';

export type Service = 'order' | 'inventory' | 'payment' | 'notification';

export interface SagaStep {
  from: Service;
  to: Service;
  message: string;
  kind: 'command' | 'reply' | 'compensation' | 'event' | 'timeout';
  state: string;
}

const steps: Record<Scenario, SagaStep[]> = {
  happy: [
    { from: 'order', to: 'order', message: 'OrderCreated (outbox)', kind: 'event', state: 'PENDING' },
    { from: 'order', to: 'inventory', message: 'ReserveStock', kind: 'command', state: 'RESERVING_STOCK' },
    { from: 'inventory', to: 'order', message: 'StockReserved', kind: 'reply', state: 'CHARGING_PAYMENT' },
    { from: 'order', to: 'payment', message: 'ChargePayment (Idempotency-Key)', kind: 'command', state: 'CHARGING_PAYMENT' },
    { from: 'payment', to: 'order', message: 'PaymentCharged', kind: 'reply', state: 'CONFIRMED' },
    { from: 'order', to: 'notification', message: 'OrderConfirmed', kind: 'event', state: 'CONFIRMED' },
  ],
  'out-of-stock': [
    { from: 'order', to: 'order', message: 'OrderCreated (outbox)', kind: 'event', state: 'PENDING' },
    { from: 'order', to: 'inventory', message: 'ReserveStock', kind: 'command', state: 'RESERVING_STOCK' },
    { from: 'inventory', to: 'order', message: 'StockUnavailable', kind: 'reply', state: 'REJECTED' },
    { from: 'order', to: 'notification', message: 'OrderRejected', kind: 'event', state: 'REJECTED' },
  ],
  'payment-declined': [
    { from: 'order', to: 'order', message: 'OrderCreated (outbox)', kind: 'event', state: 'PENDING' },
    { from: 'order', to: 'inventory', message: 'ReserveStock', kind: 'command', state: 'RESERVING_STOCK' },
    { from: 'inventory', to: 'order', message: 'StockReserved', kind: 'reply', state: 'CHARGING_PAYMENT' },
    { from: 'order', to: 'payment', message: 'ChargePayment', kind: 'command', state: 'CHARGING_PAYMENT' },
    { from: 'payment', to: 'order', message: 'PaymentDeclined', kind: 'reply', state: 'COMPENSATING' },
    { from: 'order', to: 'inventory', message: 'ReleaseStock', kind: 'compensation', state: 'COMPENSATING' },
    { from: 'inventory', to: 'order', message: 'StockReleased', kind: 'reply', state: 'CANCELLED' },
    { from: 'order', to: 'notification', message: 'OrderCancelled', kind: 'event', state: 'CANCELLED' },
  ],
  'payment-timeout': [
    { from: 'order', to: 'order', message: 'OrderCreated (outbox)', kind: 'event', state: 'PENDING' },
    { from: 'order', to: 'inventory', message: 'ReserveStock', kind: 'command', state: 'RESERVING_STOCK' },
    { from: 'inventory', to: 'order', message: 'StockReserved', kind: 'reply', state: 'CHARGING_PAYMENT' },
    { from: 'order', to: 'payment', message: 'ChargePayment', kind: 'command', state: 'CHARGING_PAYMENT' },
    { from: 'order', to: 'order', message: 'Deadline exceeded (SKIP LOCKED scanner)', kind: 'timeout', state: 'COMPENSATING' },
    { from: 'order', to: 'payment', message: 'RefundPayment (replay key first)', kind: 'compensation', state: 'COMPENSATING' },
    { from: 'payment', to: 'order', message: 'PaymentRefunded', kind: 'reply', state: 'COMPENSATING' },
    { from: 'order', to: 'inventory', message: 'ReleaseStock', kind: 'compensation', state: 'COMPENSATING' },
    { from: 'inventory', to: 'order', message: 'StockReleased', kind: 'reply', state: 'CANCELLED' },
    { from: 'order', to: 'notification', message: 'OrderCancelled', kind: 'event', state: 'CANCELLED' },
  ],
};

export function sagaSteps(scenario: Scenario): SagaStep[] {
  return steps[scenario];
}

export const TERMINAL_STATES = ['CONFIRMED', 'REJECTED', 'CANCELLED'];
