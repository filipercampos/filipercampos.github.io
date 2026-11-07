import { useMemo, useState } from 'react';
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

  const validation = useMemo(
    () => validateTransaction(entries.map((e) => ({ account: e.account, amount: Number(e.amount) }))),
    [entries],
  );
  const run = useMemo(() => simulatePurchases(50, 100, 1000, strategy, seed), [strategy, seed]);

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>Try it: post a transaction, then race 50 buyers</strong>
        <span className="badge">simulated in your browser</span>
      </div>

      <div className="grid-2">
        <div>
          <table className="data">
            <thead>
              <tr>
                <th>account</th>
                <th>amount (cents)</th>
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
              <span className="pill-ok">201 Created · balanced</span>
            ) : (
              <span className="pill-bad">422 · {validation.reason}</span>
            )}
          </p>
          <p className="note">
            Debits must equal credits. In the real service a deferred Postgres trigger enforces this even if
            application code is wrong.
          </p>
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
              ↻ rerun
            </button>
          </div>
          <p className="note">Wallet balance 1,000 · 50 concurrent purchases of 100</p>
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
            committed <strong>{run.committed}</strong> · rejected <strong>{run.rejected}</strong> · final balance{' '}
            <strong className={run.finalBalance < 0 ? 'bad' : 'ok'}>{run.finalBalance}</strong>
          </p>
          <p className="note">
            {strategy === 'naive'
              ? 'Requests read a stale balance before others write: overdraft. Red cells moved money that did not exist.'
              : 'Row locks serialize check + write per account: exactly 10 succeed, balance never negative. Same as the Testcontainers test in the repo.'}
          </p>
        </div>
      </div>
    </div>
  );
}
