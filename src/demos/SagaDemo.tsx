import { useEffect, useState } from 'react';
import { useT } from '../i18n';
import { sagaSteps, Scenario, Service } from '../sim/saga';

const SERVICES: Service[] = ['order', 'inventory', 'payment', 'notification'];
const SCENARIOS: Scenario[] = ['happy', 'out-of-stock', 'payment-declined', 'payment-timeout'];

const KIND_CLASS = { command: '', reply: '', event: 'ok', compensation: 'bad', timeout: 'bad' } as const;

export function SagaDemo() {
  const [scenario, setScenario] = useState<Scenario>('payment-timeout');
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const t = useT();
  const steps = sagaSteps(scenario);
  const current = steps[Math.min(cursor, steps.length - 1)];

  useEffect(() => {
    if (!playing) return;
    if (cursor >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setCursor((c) => c + 1), 900);
    return () => clearTimeout(timer);
  }, [playing, cursor, steps.length]);

  function choose(next: Scenario) {
    setScenario(next);
    setCursor(0);
    setPlaying(true);
  }

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>{t.saga.title}</strong>
        <span className="badge">{t.simulated}</span>
      </div>
      <div className="controls">
        {SCENARIOS.map((id) => (
          <button key={id} className="btn" aria-pressed={scenario === id} onClick={() => choose(id)}>
            {t.saga.scenarios[id]}
          </button>
        ))}
        <button className="btn" onClick={() => setCursor((c) => Math.min(c + 1, steps.length - 1))}>
          {t.saga.step}
        </button>
      </div>

      <div className="lanes">
        {SERVICES.map((service) => (
          <div key={service} className={`lane ${current && (current.from === service || current.to === service) ? 'active' : ''}`}>
            {service}
          </div>
        ))}
      </div>

      <p>
        {t.saga.state}: <span className={current?.state === 'CONFIRMED' ? 'pill-ok' : current?.state === 'CANCELLED' || current?.state === 'REJECTED' ? 'pill-bad' : 'pill-warn'}>{current?.state}</span>
      </p>

      <div className="log" aria-live="polite">
        {steps.slice(0, cursor + 1).map((step, i) => (
          <div key={i} className={KIND_CLASS[step.kind]}>
            {String(i + 1).padStart(2, '0')} {step.from} → {step.to}: {step.message}
          </div>
        ))}
      </div>
      <p className="note">{t.saga.note}</p>
    </div>
  );
}
