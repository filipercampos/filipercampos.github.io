import { useMemo, useState } from 'react';
import { GateStrategy, simulateSale } from '../sim/flashSale';

export function FlashSaleDemo() {
  const [buyers, setBuyers] = useState(20000);
  const [stock, setStock] = useState(1000);
  const [tokens, setTokens] = useState(400);
  const [strategy, setStrategy] = useState<GateStrategy>('atomic');

  const result = useMemo(
    () => simulateSale({ buyers, stock, strategy, tokensPerTick: tokens }),
    [buyers, stock, strategy, tokens],
  );
  const peak = Math.max(stock, result.sold);

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>Try it: a sale storm against the stock gate</strong>
        <span className="badge">simulated in your browser</span>
      </div>
      <div className="controls">
        <label>
          buyers
          <input type="number" min={100} max={200000} step={1000} value={buyers} onChange={(e) => setBuyers(clamp(+e.target.value, 100, 200000))} />
        </label>
        <label>
          stock
          <input type="number" min={1} max={10000} value={stock} onChange={(e) => setStock(clamp(+e.target.value, 1, 10000))} />
        </label>
        <label>
          rate limit / tick
          <input type="number" min={10} max={5000} value={tokens} onChange={(e) => setTokens(clamp(+e.target.value, 10, 5000))} />
        </label>
      </div>
      <div className="controls">
        <button className="btn" aria-pressed={strategy === 'check-then-act'} onClick={() => setStrategy('check-then-act')}>
          read stock, then decrement
        </button>
        <button className="btn" aria-pressed={strategy === 'atomic'} onClick={() => setStrategy('atomic')}>
          atomic gate (Lua DECR + conditional write)
        </button>
      </div>

      <svg viewBox="0 0 400 120" width="100%" height="140" role="img" aria-label="units sold over time">
        <line x1="0" x2="400" y1={120 - (stock / peak) * 110} y2={120 - (stock / peak) * 110} stroke="currentColor" strokeDasharray="4 4" opacity="0.4" />
        <polyline
          fill="none"
          stroke={result.oversold > 0 ? 'var(--bad)' : 'var(--ok)'}
          strokeWidth="2.5"
          points={result.timeline
            .map((sold, i) => `${(i / Math.max(1, result.timeline.length - 1)) * 400},${120 - (sold / peak) * 110}`)
            .join(' ')}
        />
      </svg>

      <div className="metrics">
        <div className="metric">
          <div className="v">{result.sold.toLocaleString()}</div>
          <div className="l">units sold (stock {stock.toLocaleString()})</div>
        </div>
        <div className="metric">
          <div className={`v ${result.oversold > 0 ? 'bad' : 'ok'}`}>{result.oversold.toLocaleString()}</div>
          <div className="l">oversold</div>
        </div>
        <div className="metric">
          <div className="v">{result.rateLimited.toLocaleString()}</div>
          <div className="l">429 responses (retried)</div>
        </div>
      </div>
      <p className="note">
        Dashed line = stock. The real engine was hit by 285k distinct buyers in k6 storms; the post-run audit found 0
        oversold units.
      </p>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;
}
