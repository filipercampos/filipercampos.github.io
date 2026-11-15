import type { DemoId, Project } from './projects';

type Localized = Pick<Project, 'period' | 'tagline' | 'flow' | 'problems' | 'metrics' | 'metricsNote' | 'honestGaps'>;

/** Portuguese text for each project; stack, links and ids come from the English source. */
export const projectsPt: Record<DemoId, Localized> = {
  ledger: {
    period: 'Jan - Fev 2026',
    tagline: 'Livro-razão de partidas dobradas onde dinheiro não pode ser criado, perdido ou lançado duas vezes.',
    flow: ['Cliente', 'Idempotency-Key', 'FOR UPDATE (ordenado)', 'Diário + saldos + outbox', 'Relay (SKIP LOCKED)', 'EventBridge'],
    problems: [
      { problem: 'Transação desbalanceada por bug', solution: 'Invariante no domínio + trigger de constraint diferida no Postgres' },
      { problem: 'Saldo negativo e atualizações perdidas sob concorrência', solution: 'Locks de linha adquiridos em ordem: sem deadlock por construção' },
      { problem: 'Retentativas lançando duas vezes', solution: 'Idempotency-Key com lease e replay, mais referência de negócio única' },
      { problem: 'Evento perdido ou enviado para escrita desfeita', solution: 'Outbox transacional repassado ao EventBridge' },
      { problem: 'Razão diverge do provedor de pagamento', solution: 'Lambda de conciliação disparada pelo S3, com alarmes' },
    ],
    metrics: [
      { label: 'Lançamentos/s, contas distintas', value: '~300' },
      { label: 'Lançamentos/s, conta compartilhada', value: '~150' },
      { label: 'Divergência de saldo após 60 mil lançamentos', value: '0' },
    ],
    metricsNote: 'k6 em notebook de desenvolvimento (um processo Node, Postgres no Docker).',
    honestGaps: ['Meta de p99 de 150 ms não atingida localmente', 'Divisão de contas quentes proposta (ADR 0006), não implementada'],
  },
  platform: {
    period: 'Mar 2026',
    tagline: 'A base AWS onde os serviços são implantados, com SLOs como código.',
    flow: ['GitHub Actions', 'Role OIDC', 'Change set', 'VPC / EKS / ECR', 'Chart Helm de serviço', 'ADOT -> X-Ray + CloudWatch'],
    problems: [
      { problem: 'Credenciais de CI de longa duração', solution: 'OIDC do GitHub com condições de repo + branch na trust policy' },
      { problem: 'Alertas ruidosos ou atrasados', solution: 'Alarmes de SLO multi-janela e multi-taxa (14,4x / 6x / 1x)' },
      { problem: 'Cada serviço reinventando o deploy', solution: 'Chart Helm reutilizável e endurecido: IRSA, PDB, HPA, NetworkPolicy, não-root' },
      { problem: 'Configuração divergindo entre arquivos', solution: 'Testes de contrato: limites, parâmetros e config do coletor precisam bater' },
    ],
    metrics: [
      { label: 'Testes unitários', value: '93' },
      { label: 'Testes de deploy no LocalStack', value: '18' },
      { label: 'Cobertura de linhas', value: '98%' },
    ],
    metricsNote: 'EKS, ECR e Cognito validados só com cfn-lint (deploy exige LocalStack Pro).',
    honestGaps: ['Nunca implantado numa conta AWS real', 'Tabela de custos é estimativa por preço de lista'],
  },
  saga: {
    period: 'Abr - Mai 2026',
    tagline: 'Quatro microsserviços que mantêm um pedido consistente sem transações distribuídas.',
    flow: ['Order (orquestrador)', 'Inventory', 'Payment -> API do Ledger', 'Notification', 'Modelo de leitura (DocumentDB)'],
    problems: [
      { problem: 'Falha parcial entre serviços', solution: 'Máquina de estados da saga persistida, com compensações e timeouts' },
      { problem: 'Entrega duplicada de mensagens', solution: 'Outbox nos produtores, tabela inbox de deduplicação nos consumidores' },
      { problem: 'Mensagens inválidas travando filas', solution: 'DLQ com ferramenta de redrive; inválidas vão rápido para a DLQ, erros transitórios fazem backoff' },
      { problem: 'Ledger externo instável', solution: 'Timeout, retentativas com jitter e circuit breaker, estornos idempotentes' },
    ],
    metrics: [
      { label: 'Pedido -> CONFIRMED p50', value: '594 ms' },
      { label: 'Pedido -> modelo de leitura p95', value: '901 ms' },
      { label: 'Replay de 700 eventos', value: '1,4 s' },
    ],
    metricsNote: '100 pedidos em sequência, docker compose + LocalStack em notebook compartilhado.',
    honestGaps: ['Sem teste de vazão', 'Testado contra Mongo 5.0, não DocumentDB real'],
  },
  flash: {
    period: 'Jun - Jul 2026',
    tagline: '90 mil compradores, mil unidades, zero venda além do estoque.',
    flow: ['Sala de espera', 'Token bucket (Redis Lua)', 'Controle atômico de estoque', 'Escrita condicional no DynamoDB', 'SQS', 'Criação do pedido'],
    problems: [
      { problem: 'Vender além do estoque sob disputa extrema', solution: 'Controle atômico no Redis + escritas condicionais no DynamoDB como fonte da verdade' },
      { problem: 'Bots e picos de tráfego', solution: 'Limites por usuário e globais, tokens de sala de espera, 429 com Retry-After' },
      { problem: 'Partição quente num item', solution: 'Contadores de estoque particionados na escrita' },
      { problem: 'Redis indisponível', solution: 'Modo degradado direto no DynamoDB, ainda sem vender além do estoque' },
    ],
    metrics: [
      { label: 'Compradores distintos em 6 rodadas', value: '285.688' },
      { label: 'Unidades vendidas além do estoque', value: '0' },
      { label: 'p99 após esgotar @ 800 req/s', value: '33 ms' },
    ],
    metricsNote: 'Rodadas k6 em notebook, com LocalStack no lugar da AWS.',
    honestGaps: ['p99 de admissão ~3 s e atraso da fila ~5 s (limitados pelo LocalStack), a medir de novo na AWS'],
  },
  pipeline: {
    period: 'Ago 2026',
    tagline: 'Ingestão de documentos multi-tenant que sobrevive a duplicatas e arquivos inválidos.',
    flow: ['POST pré-assinado', 'S3', 'SQS', 'Lambda (falhas parciais de lote)', 'DynamoDB', 'EventBridge'],
    problems: [
      { problem: 'S3 entrega o mesmo evento duas vezes', solution: 'Idempotência do Powertools + transições de status condicionais' },
      { problem: 'Um arquivo ruim derrubando o lote inteiro', solution: 'ReportBatchItemFailures: só o registro inválido é retentado / vai para a DLQ' },
      { problem: 'Tenant lendo dados de outro tenant', solution: 'Chaves por tenant e condições IAM dynamodb:LeadingKeys' },
      { problem: 'Uploads maliciosos', solution: 'Condições de tamanho e content-type, validação pelos bytes do arquivo' },
    ],
    metrics: [
      { label: 'Testes unitários', value: '108' },
      { label: 'Testes de integração no LocalStack', value: '8' },
      { label: 'Leitura entre tenants', value: '404' },
    ],
    metricsNote: 'Fluxo completo verificado no LocalStack.',
    honestGaps: ['Isolamento IAM entre tenants não testável no LocalStack', 'Ainda não implantado na AWS'],
  },
  strangler: {
    period: 'Set - Out 2026',
    tagline: 'Migrando um sistema de faturamento em SQL Server para PostgreSQL sem virada big-bang.',
    flow: ['Fachada de roteamento', 'Legado (SQL Server)', 'Worker de sincronização CDC', 'Camada anticorrupção', 'Novo (Postgres)', 'Leituras em sombra + paridade'],
    problems: [
      { problem: 'Risco de reescrita big-bang', solution: 'Strangler fig: rollout percentual fixo por cliente, kill switch instantâneo' },
      { problem: 'Escrita dupla divergindo', solution: 'Regra de um escritor por entidade, com sincronização reversa e supressão de eco' },
      { problem: 'Divergência silenciosa de dados', solution: 'Leituras em sombra + verificador de paridade por checksum e partição' },
      { problem: 'Vícios do legado vazando', solution: 'Camada anticorrupção traduzindo códigos, datas e status' },
    ],
    metrics: [
      { label: 'Carga inicial de 15 mil linhas', value: '5,3 s' },
      { label: 'Leituras em sombra comparadas', value: '6.000 / 0 dif.' },
      { label: 'Atraso de replicação p50', value: '941 ms' },
    ],
    metricsNote: 'Execução local com 3 mil clientes / 12 mil faturas; atraso dominado pelo polling de 1 s.',
    honestGaps: ['Congelamento de escrita por tenant é manual', 'API administrativa usa token compartilhado'],
  },
};
