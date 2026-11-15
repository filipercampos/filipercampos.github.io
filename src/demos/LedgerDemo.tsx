import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { simulatePurchases, Strategy, validateTransaction } from '../sim/ledger';

const DEFAULT_ENTRIES = [
  { account: 'customer', amount: '-10000' },
  { account: 'merchant', amount: '9700' },
  { account: 'fees', amount: '300' },
];

export function LedgerDemo() {
  const [entries, setEntries] = useState(DEFAULT_ENTRIES);
  const [strategy, setStrategy] = useState<Strategy>('locked');
  const [seed, setSeed] = useState(7);
  const t = useT();

  const validation = useMemo(
    () => validateTransaction(entries.map((e) => ({ account: e.account, amount: Number(e.amount) }))),
    [entries],
  );
  const run = useMemo(() => simulatePurchases(50, 100, 1000, strategy, seed), [strategy, seed]);

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>{t.ledger.title}</strong>
        <span className="badge">{t.simulated}</span>
      </div>

      <div className="grid-2">
        <div>
          <table className="data">
            <thead>
              <tr>
                <th>{t.ledger.account}</th>
                <th>{t.ledger.amount}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.account}>
                  <td>{entry.account}</td>
                  <td>
                    <input
                      type="text"
                      aria-label={`amount for ${entry.account}`}
                      value={entry.amount}
                      onChange={(event) =>
                        setEntries(entries.map((e, i) => (i === index ? { ...e, amount: event.target.value } : e)))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            {validation.ok ? (
              <span className="pill-ok">{t.ledger.created}</span>
            ) : (
              <span className="pill-bad">
                422 · {t.ledger.reasons[validation.code]}
                {validation.code === 'unbalanced' ? ` ${validation.total}` : ''}
              </span>
            )}
          </p>
          <p className="note">{t.ledger.invariantNote}</p>
        </div>

        <div>
          <div className="controls">
            <button className="btn" aria-pressed={strategy === 'naive'} onClick={() => setStrategy('naive')}>
              check-then-act
            </button>
            <button className="btn" aria-pressed={strategy === 'locked'} onClick={() => setStrategy('locked')}>
              FOR UPDATE (ordered)
            </button>
            <button className="btn" onClick={() => setSeed((s) => s + 1)}>
              {t.rerun}
            </button>
          </div>
          <p className="note">{t.ledger.setup}</p>
          <div className="cells" aria-label="purchase outcomes">
            {run.events.map((event) => (
              <div
                key={event.buyer}
                className={`cell ${event.outcome === 'committed' ? (event.balanceAfter < 0 ? 'bad' : 'ok') : 'muted'}`}
                title={`buyer ${event.buyer}: ${event.outcome}, balance ${event.balanceAfter}`}
              />
            ))}
          </div>
          <p>
            {t.ledger.committed} <strong>{run.committed}</strong> · {t.ledger.rejected} <strong>{run.rejected}</strong> ·{' '}
            {t.ledger.finalBalance}{' '}
            <strong className={run.finalBalance < 0 ? 'bad' : 'ok'}>{run.finalBalance}</strong>
          </p>
          <p className="note">
            {strategy === 'naive' ? t.ledger.naiveNote : t.ledger.lockedNote}
          </p>
        </div>
      </div>
    </div>
  );
}
