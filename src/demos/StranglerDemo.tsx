import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { bucketOf, distribution, route } from '../sim/strangler';

const CUSTOMERS = Array.from({ length: 5000 }, (_, i) => `cust-${i + 1}`);

export function StranglerDemo() {
  const [percent, setPercent] = useState(25);
  const [killSwitch, setKillSwitch] = useState(false);
  const [customer, setCustomer] = useState('cust-42');
  const [pilot, setPilot] = useState(true);
  const t = useT();

  const config = useMemo(
    () => ({ rolloutPercent: percent, killSwitch, overrides: new Set(pilot ? ['cust-7'] : []) }),
    [percent, killSwitch, pilot],
  );
  const split = useMemo(() => distribution(CUSTOMERS, config), [config]);
  const modernShare = (split.modern / CUSTOMERS.length) * 100;

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>{t.strangler.title}</strong>
        <span className="badge">{t.simulated}</span>
      </div>
      <div className="controls">
        <label>
          {t.strangler.rollout} {percent}%
          <input type="range" min={0} max={100} value={percent} onChange={(e) => setPercent(+e.target.value)} />
        </label>
        <button className="btn" aria-pressed={killSwitch} onClick={() => setKillSwitch((k) => !k)}>
          {killSwitch ? t.strangler.killOn : t.strangler.kill}
        </button>
        <button className="btn" aria-pressed={pilot} onClick={() => setPilot((p) => !p)}>
          {t.strangler.pilot}
        </button>
      </div>

      <div className="bar" aria-label={`${split.modern} customers on modern, ${split.legacy} on legacy`}>
        <div className="modern" style={{ width: `${modernShare}%` }}>
          {modernShare >= 12 ? `modern ${split.modern}` : ''}
        </div>
        <div className="legacy" style={{ width: `${100 - modernShare}%` }}>
          {100 - modernShare >= 12 ? `legacy ${split.legacy}` : ''}
        </div>
      </div>

      <div className="controls" style={{ marginTop: 14 }}>
        <label>
          {t.strangler.lookup}
          <input type="text" value={customer} onChange={(e) => setCustomer(e.target.value)} />
        </label>
        <span>
          {t.strangler.bucket} <code>{bucketOf(customer)}</code> →{' '}
          <span className={route(customer, config) === 'modern' ? 'pill-ok' : 'pill-warn'}>{route(customer, config)}</span>
        </span>
      </div>
      <p className="note">{t.strangler.note}</p>
    </div>
  );
}
