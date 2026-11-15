import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Lang = 'en' | 'pt';

const STORAGE_KEY = 'lang';

const en = {
  htmlLang: 'en',
  title: 'Filipe Campos · Backend Architecture',
  eyebrow: '// backend · distributed systems · aws',
  lead:
    'Senior backend engineer focused on systems that must stay correct under concurrency, retries and partial failure. Six projects, each with its decisions written down, tests that prove them, and numbers that were actually measured.',
  seeProjects: 'See the projects ↓',
  themeToDark: 'Switch to dark theme',
  themeToLight: 'Switch to light theme',
  navLabel: 'Projects',
  flow: 'Flow',
  problemsSolved: 'Problems solved',
  measured: 'Measured',
  knownGaps: 'Known gaps',
  codeLink: 'Code, ADRs and runbook →',
  footer:
    'Demos run entirely in your browser with simplified models of each system; the real implementations, tests, ADRs and IaC are in the linked repositories. Metrics come from local runs described in each repo.',
  simulated: 'simulated in your browser',
  rerun: '↻ rerun',
  ledger: {
    title: 'Try it: post a transaction, then race 50 buyers',
    account: 'account',
    amount: 'amount (cents)',
    created: '201 Created · balanced',
    invariantNote:
      'Debits must equal credits. In the real service a deferred Postgres trigger enforces this even if application code is wrong.',
    setup: 'Wallet balance 1,000 · 50 concurrent purchases of 100',
    committed: 'committed',
    rejected: 'rejected',
    finalBalance: 'final balance',
    naiveNote:
      'Requests read a stale balance before others write: overdraft. Red cells moved money that did not exist.',
    lockedNote:
      'Row locks serialize check + write per account: exactly 10 succeed, balance never negative. Same as the Testcontainers test in the repo.',
    reasons: {
      legs: 'A transaction needs at least two entries',
      integers: 'Amounts must be integers in minor units (no floats)',
      zero: 'Zero-amount entries are not allowed',
      unbalanced: 'Unbalanced: off by',
    },
  },
  flash: {
    title: 'Try it: a sale storm against the stock gate',
    buyers: 'buyers',
    stock: 'stock',
    rate: 'rate limit / tick',
    naive: 'read stock, then decrement',
    atomic: 'atomic gate (Lua DECR + conditional write)',
    sold: 'units sold',
    oversold: 'oversold',
    limited: '429 responses (retried)',
    chart: 'units sold over time',
    note: 'Dashed line = stock. The real engine was hit by 285k distinct buyers in k6 storms; the post-run audit found 0 oversold units.',
  },
  saga: {
    title: 'Try it: step through the orchestrated saga',
    scenarios: {
      happy: 'happy path',
      'out-of-stock': 'out of stock',
      'payment-declined': 'payment declined',
      'payment-timeout': 'payment timeout',
    },
    step: 'step ›',
    state: 'saga state',
    note: 'Commands and replies travel over SNS/SQS FIFO through a transactional outbox; consumers dedupe with an inbox table. On timeout the refund first replays the charge with the same Idempotency-Key to learn the real outcome.',
  },
  pipeline: {
    title: 'Try it: throw documents at the pipeline',
    actions: {
      valid: 'upload valid CSV',
      duplicate: 'S3 delivers same event twice',
      spoofed: 'upload .exe renamed to .pdf',
      poison: 'upload corrupt PDF',
    },
    empty: 'Pick an action above.',
    notes: {
      processed: 'Checksum + metadata stored, DocumentProcessed published once.',
      first: 'First delivery.',
      deduplicated: 'Same S3 event delivered again: Powertools idempotency record hit, no second event.',
      rejected: 'Declared content type does not match magic bytes: marked REJECTED, not retried.',
      dlq: 'Parser throws 3x. Only this record is reported in batchItemFailures; the rest of the batch succeeds.',
    },
  },
  strangler: {
    title: 'Try it: shift traffic from legacy to modern',
    rollout: 'rollout',
    killOn: 'kill switch ON',
    kill: 'kill switch',
    pilot: 'pilot tenant cust-7',
    lookup: 'look up customer',
    bucket: 'bucket',
    note: "Sticky hashing: a customer's bucket never changes, so raising the percentage only ever moves customers forward and nobody flips back and forth. The kill switch is an instant rollback. Meanwhile shadow reads compare both sides; the local run compared 6,000 reads with 0 mismatches.",
  },
  slo: {
    title: 'Try it: SLO burn-rate alert thresholds',
    badge: "same math as the repo's slo-calc",
    budget: '30-day error budget',
    ofRequests: 'of requests ≈',
    downtime: 'of full downtime',
    cols: ['alert', 'windows', 'burn rate', 'budget spent', 'error rate threshold'],
    note: 'Both windows must breach (CloudWatch composite alarm): the long window proves it matters, the short one makes the alert reset quickly once fixed.',
  },
};

export type Strings = typeof en;

const pt: Strings = {
  htmlLang: 'pt-BR',
  title: 'Filipe Campos · Arquitetura Backend',
  eyebrow: '// backend · sistemas distribuídos · aws',
  lead:
    'Engenheiro backend sênior focado em sistemas que precisam continuar corretos sob concorrência, retentativas e falhas parciais. Seis projetos, cada um com as decisões documentadas, testes que as comprovam e números realmente medidos.',
  seeProjects: 'Ver os projetos ↓',
  themeToDark: 'Mudar para tema escuro',
  themeToLight: 'Mudar para tema claro',
  navLabel: 'Projetos',
  flow: 'Fluxo',
  problemsSolved: 'Problemas resolvidos',
  measured: 'Medido',
  knownGaps: 'Limitações conhecidas',
  codeLink: 'Código, ADRs e runbook →',
  footer:
    'As demos rodam inteiramente no seu navegador com modelos simplificados de cada sistema; as implementações reais, testes, ADRs e IaC estão nos repositórios. As métricas vêm de execuções locais descritas em cada repo.',
  simulated: 'simulado no seu navegador',
  rerun: '↻ rodar de novo',
  ledger: {
    title: 'Teste: faça um lançamento e depois coloque 50 compradores para disputar',
    account: 'conta',
    amount: 'valor (centavos)',
    created: '201 Created · balanceado',
    invariantNote:
      'Débitos precisam igualar créditos. No serviço real, uma trigger diferida do Postgres garante isso mesmo se o código da aplicação estiver errado.',
    setup: 'Saldo da carteira 1.000 · 50 compras simultâneas de 100',
    committed: 'aprovadas',
    rejected: 'recusadas',
    finalBalance: 'saldo final',
    naiveNote:
      'As requisições leem um saldo desatualizado antes das outras escreverem: saldo negativo. Células vermelhas movimentaram dinheiro que não existia.',
    lockedNote:
      'Locks de linha serializam verificação + escrita por conta: exatamente 10 passam e o saldo nunca fica negativo. Igual ao teste com Testcontainers do repo.',
    reasons: {
      legs: 'Uma transação precisa de pelo menos dois lançamentos',
      integers: 'Valores devem ser inteiros em centavos (sem ponto flutuante)',
      zero: 'Lançamentos com valor zero não são permitidos',
      unbalanced: 'Desbalanceado: diferença de',
    },
  },
  flash: {
    title: 'Teste: uma tempestade de compras contra o controle de estoque',
    buyers: 'compradores',
    stock: 'estoque',
    rate: 'limite / ciclo',
    naive: 'ler estoque e depois decrementar',
    atomic: 'controle atômico (Lua DECR + escrita condicional)',
    sold: 'unidades vendidas',
    oversold: 'vendidas além do estoque',
    limited: 'respostas 429 (retentadas)',
    chart: 'unidades vendidas ao longo do tempo',
    note: 'Linha tracejada = estoque. O sistema real recebeu 285 mil compradores distintos em testes k6; a auditoria pós-teste encontrou 0 unidades vendidas além do estoque.',
  },
  saga: {
    title: 'Teste: execute a saga orquestrada passo a passo',
    scenarios: {
      happy: 'caminho feliz',
      'out-of-stock': 'sem estoque',
      'payment-declined': 'pagamento recusado',
      'payment-timeout': 'timeout no pagamento',
    },
    step: 'passo ›',
    state: 'estado da saga',
    note: 'Comandos e respostas trafegam por SNS/SQS FIFO via outbox transacional; consumidores eliminam duplicatas com uma tabela inbox. No timeout, o estorno primeiro repete a cobrança com a mesma Idempotency-Key para descobrir o resultado real.',
  },
  pipeline: {
    title: 'Teste: envie documentos para o pipeline',
    actions: {
      valid: 'enviar CSV válido',
      duplicate: 'S3 entrega o mesmo evento duas vezes',
      spoofed: 'enviar .exe renomeado para .pdf',
      poison: 'enviar PDF corrompido',
    },
    empty: 'Escolha uma ação acima.',
    notes: {
      processed: 'Checksum + metadados salvos, DocumentProcessed publicado uma única vez.',
      first: 'Primeira entrega.',
      deduplicated: 'O mesmo evento do S3 chegou de novo: registro de idempotência do Powertools encontrado, nenhum segundo evento.',
      rejected: 'O content type declarado não bate com os bytes do arquivo: marcado como REJECTED, sem retentativa.',
      dlq: 'O parser falha 3x. Só este registro vai em batchItemFailures; o resto do lote é processado.',
    },
  },
  strangler: {
    title: 'Teste: migre o tráfego do legado para o novo sistema',
    rollout: 'rollout',
    killOn: 'kill switch LIGADO',
    kill: 'kill switch',
    pilot: 'cliente piloto cust-7',
    lookup: 'consultar cliente',
    bucket: 'bucket',
    note: 'Hash fixo: o bucket de um cliente nunca muda, então aumentar o percentual só move clientes para frente e ninguém alterna entre os sistemas. O kill switch é um rollback instantâneo. Enquanto isso, leituras em sombra comparam os dois lados; a execução local comparou 6.000 leituras com 0 divergências.',
  },
  slo: {
    title: 'Teste: limites de alerta por taxa de consumo do SLO',
    badge: 'mesma matemática do slo-calc do repo',
    budget: 'Orçamento de erro em 30 dias',
    ofRequests: 'das requisições ≈',
    downtime: 'de indisponibilidade total',
    cols: ['alerta', 'janelas', 'taxa de consumo', 'orçamento gasto', 'limite de taxa de erro'],
    note: 'As duas janelas precisam estourar (alarme composto no CloudWatch): a longa prova que importa, a curta faz o alerta resetar rápido depois da correção.',
  },
};

export const STRINGS: Record<Lang, Strings> = { en, pt };

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'pt') return saved;
  } catch {
    // Storage unavailable (private mode): fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

const LangContext = createContext<{ lang: Lang; setLang: (lang: Lang) => void }>({
  lang: 'en',
  setLang: () => undefined,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = STRINGS[lang].htmlLang;
    document.title = STRINGS[lang].title;
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference just won't persist.
    }
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT(): Strings {
  return STRINGS[useContext(LangContext).lang];
}

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Language / Idioma">
      <button className="btn" aria-pressed={lang === 'pt'} onClick={() => setLang('pt')}>
        PT
      </button>
      <button className="btn" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
        EN
      </button>
    </div>
  );
}
