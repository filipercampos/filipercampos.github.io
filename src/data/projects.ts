export type DemoId = 'ledger' | 'platform' | 'saga' | 'flash' | 'pipeline' | 'strangler';

export interface Metric {
  label: string;
  value: string;
}

export interface Project {
  id: DemoId;
  repo: string;
  title: string;
  period: string;
  tagline: string;
  stack: string[];
  flow: string[];
  problems: { problem: string; solution: string }[];
  metrics: Metric[];
  metricsNote: string;
  honestGaps: string[];
}

const GITHUB = 'https://github.com/filipercampos';

export const projects: Project[] = [
  {
    id: 'ledger',
    repo: `${GITHUB}/ledger-service`,
    title: 'Ledger Service',
    period: 'Jan - Feb 2026',
    tagline: 'Double-entry ledger where money cannot be created, lost or posted twice.',
    stack: ['NestJS', 'PostgreSQL / Aurora', 'EventBridge', 'Cognito M2M', 'Lambda', 'ECS Fargate', 'CloudFormation + SAM'],
    flow: ['Client', 'Idempotency-Key', 'FOR UPDATE (ordered)', 'Journal + balances + outbox', 'Relay (SKIP LOCKED)', 'EventBridge'],
    problems: [
      { problem: 'Unbalanced transaction from a bug', solution: 'Domain invariant + deferred constraint trigger in Postgres' },
      { problem: 'Overdraft and lost updates under concurrency', solution: 'Row locks acquired in sorted order: deadlock-free by construction' },
      { problem: 'Retries posting twice', solution: 'Idempotency-Key with leases and replay, plus unique business reference' },
      { problem: 'Event lost or sent for a rolled-back write', solution: 'Transactional outbox relayed to EventBridge' },
      { problem: 'Ledger disagrees with payment provider', solution: 'S3-triggered reconciliation Lambda with alarms' },
    ],
    metrics: [
      { label: 'Postings/s, disjoint accounts', value: '~300' },
      { label: 'Postings/s, shared hot account', value: '~150' },
      { label: 'Balance drift after 60k postings', value: '0' },
    ],
    metricsNote: 'k6 on a developer laptop (single Node process, Postgres in Docker).',
    honestGaps: ['p99 target of 150 ms not met locally', 'Hot-account sharding proposed (ADR 0006), not implemented'],
  },
  {
    id: 'platform',
    repo: `${GITHUB}/platform-infra`,
    title: 'Platform Infra',
    period: 'Mar 2026',
    tagline: 'The AWS foundation the services deploy onto, with SLOs as code.',
    stack: ['CloudFormation', 'EKS (EC2 + Fargate)', 'Helm', 'ADOT / OpenTelemetry', 'CloudWatch', 'GitHub OIDC', 'Cognito'],
    flow: ['GitHub Actions', 'OIDC role', 'Change set', 'VPC / EKS / ECR', 'Helm service chart', 'ADOT -> X-Ray + CloudWatch'],
    problems: [
      { problem: 'Long-lived CI credentials', solution: 'GitHub OIDC with repo + branch conditions on the trust policy' },
      { problem: 'Noisy or late alerts', solution: 'Multi-window, multi-burn-rate SLO alarms (14.4x / 6x / 1x)' },
      { problem: 'Every service reinventing deployment', solution: 'Hardened reusable Helm chart: IRSA, PDB, HPA, NetworkPolicy, non-root' },
      { problem: 'Config drift between files', solution: 'Contract tests: thresholds, params and collector config must agree' },
    ],
    metrics: [
      { label: 'Unit tests', value: '93' },
      { label: 'LocalStack deploy tests', value: '18' },
      { label: 'Line coverage', value: '98%' },
    ],
    metricsNote: 'EKS, ECR and Cognito validated with cfn-lint only (LocalStack Pro needed to deploy).',
    honestGaps: ['Never deployed to a real AWS account', 'Cost table is an estimate from list prices'],
  },
  {
    id: 'saga',
    repo: `${GITHUB}/order-saga-platform`,
    title: 'Order Saga Platform',
    period: 'Apr - May 2026',
    tagline: 'Four microservices that keep an order consistent without distributed transactions.',
    stack: ['NestJS monorepo', 'SNS / SQS FIFO', 'PostgreSQL', 'DocumentDB (Mongo 5.0 API)', 'EKS', 'Helm'],
    flow: ['Order (orchestrator)', 'Inventory', 'Payment -> Ledger API', 'Notification', 'Read model (DocumentDB)'],
    problems: [
      { problem: 'Partial failure across services', solution: 'Persisted saga state machine with compensations and timeouts' },
      { problem: 'Duplicate message delivery', solution: 'Outbox in producers, inbox dedup table in consumers' },
      { problem: 'Poison messages blocking queues', solution: 'DLQ with redrive tool; poison goes to DLQ fast, transient errors back off' },
      { problem: 'Unreliable downstream ledger', solution: 'Timeout, jittered retries and circuit breaker, idempotent refunds' },
    ],
    metrics: [
      { label: 'Order -> CONFIRMED p50', value: '594 ms' },
      { label: 'Order -> read model p95', value: '901 ms' },
      { label: 'Replay 700 events', value: '1.4 s' },
    ],
    metricsNote: '100 sequential orders, docker compose + LocalStack on a shared laptop.',
    honestGaps: ['No throughput test', 'Tested against Mongo 5.0, not real DocumentDB'],
  },
  {
    id: 'flash',
    repo: `${GITHUB}/flash-sale-engine`,
    title: 'Flash Sale Engine',
    period: 'Jun - Jul 2026',
    tagline: '90k buyers, 1k units, zero oversell.',
    stack: ['NestJS', 'Redis (Lua)', 'DynamoDB single-table', 'SQS', 'ECS Fargate autoscaling', 'k6'],
    flow: ['Waiting room', 'Token bucket (Redis Lua)', 'Atomic stock gate', 'DynamoDB conditional write', 'SQS', 'Order creation'],
    problems: [
      { problem: 'Overselling under extreme contention', solution: 'Redis atomic gate + DynamoDB conditional writes as source of truth' },
      { problem: 'Bots and traffic spikes', solution: 'Per-user and global rate limits, waiting-room tokens, 429 with Retry-After' },
      { problem: 'Hot partition on one item', solution: 'Write-sharded stock counters' },
      { problem: 'Redis unavailable', solution: 'Degraded mode straight to DynamoDB, still no oversell' },
    ],
    metrics: [
      { label: 'Distinct buyers across 6 storms', value: '285,688' },
      { label: 'Oversold units', value: '0' },
      { label: 'p99 after sell-out @ 800 req/s', value: '33 ms' },
    ],
    metricsNote: 'k6 storms on a laptop with LocalStack in place of AWS.',
    honestGaps: ['Admission p99 ~3 s and queue lag ~5 s (LocalStack-bound), to re-measure on AWS'],
  },
  {
    id: 'pipeline',
    repo: `${GITHUB}/serverless-doc-pipeline`,
    title: 'Serverless Doc Pipeline',
    period: 'Aug 2026',
    tagline: 'Multi-tenant document ingestion that survives duplicates and poison files.',
    stack: ['AWS SAM', 'Lambda (TypeScript)', 'API Gateway + Cognito', 'S3', 'SQS', 'DynamoDB', 'EventBridge', 'Powertools'],
    flow: ['Presigned POST', 'S3', 'SQS', 'Lambda (partial batch failures)', 'DynamoDB', 'EventBridge'],
    problems: [
      { problem: 'S3 delivers the same event twice', solution: 'Powertools idempotency + conditional status transitions' },
      { problem: 'One bad file failing the whole batch', solution: 'ReportBatchItemFailures: only the poison record is retried / dead-lettered' },
      { problem: 'Tenant reading another tenant\'s data', solution: 'Tenant-scoped keys and dynamodb:LeadingKeys IAM conditions' },
      { problem: 'Malicious uploads', solution: 'Size and content-type conditions, magic-byte validation' },
    ],
    metrics: [
      { label: 'Unit tests', value: '108' },
      { label: 'LocalStack integration tests', value: '8' },
      { label: 'Cross-tenant read', value: '404' },
    ],
    metricsNote: 'End-to-end flow verified on LocalStack.',
    honestGaps: ['IAM tenant isolation not testable on LocalStack', 'Not deployed to AWS yet'],
  },
  {
    id: 'strangler',
    repo: `${GITHUB}/legacy-strangler-migration`,
    title: 'Legacy Strangler Migration',
    period: 'Sep - Oct 2026',
    tagline: 'Moving a SQL Server billing system to PostgreSQL without a big-bang cutover.',
    stack: ['NestJS', 'SQL Server', 'Aurora PostgreSQL', 'Change Tracking / CDC', 'Feature flags', 'CloudFormation'],
    flow: ['Routing facade', 'Legacy (SQL Server)', 'CDC sync worker', 'Anti-corruption layer', 'Modern (Postgres)', 'Shadow reads + parity'],
    problems: [
      { problem: 'Big-bang rewrite risk', solution: 'Strangler fig: sticky percentage rollout per customer, instant kill switch' },
      { problem: 'Dual writes diverging', solution: 'Single-writer-per-entity rule with reverse sync and echo suppression' },
      { problem: 'Silent data drift', solution: 'Shadow reads + checksum parity checker per partition' },
      { problem: 'Legacy smells leaking', solution: 'Anti-corruption layer translating codes, dates and statuses' },
    ],
    metrics: [
      { label: 'Backfill 15k rows', value: '5.3 s' },
      { label: 'Shadow reads compared', value: '6,000 / 0 diffs' },
      { label: 'Replication lag p50', value: '941 ms' },
    ],
    metricsNote: 'Local compose run with 3k customers / 12k invoices; lag dominated by the 1 s poll.',
    honestGaps: ['Per-tenant write freeze is a manual step', 'Admin API uses a shared token'],
  },
];
