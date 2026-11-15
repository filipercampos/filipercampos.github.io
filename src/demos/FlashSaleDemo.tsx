import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { GateStrategy, simulateSale } from '../sim/flashSale';

export function FlashSaleDemo() {
  const [buyers, setBuyers] = useState(20000);
  const [stock, setStock] = useState(1000);
  const [tokens, setTokens] = useState(400);
  const [strategy, setStrategy] = useState<GateStrategy>('atomic');
  const t = useT();

  const result = useMemo(
    () => simulateSale({ buyers, stock, strategy, tokensPerTick: tokens }),
    [buyers, stock, strategy, tokens],
  );
  const peak = Math.max(stock, result.sold);

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>{t.flash.title}</strong>
        <span className="badge">{t.simulated}</span>
      </div>
      <div className="controls">
        <label>
          {t.flash.buyers}
          <input type="number" min={100} max={200000} step={1000} value={buyers} onChange={(e) => setBuyers(clamp(+e.target.value, 100, 200000))} />
        </label>
        <label>
          {t.flash.stock}
          <input type="number" min={1} max={10000} value={stock} onChange={(e) => setStock(clamp(+e.target.value, 1, 10000))} />
        </label>
        <label>
          {t.flash.rate}
          <input type="number" min={10} max={5000} value={tokens} onChange={(e) => setTokens(clamp(+e.target.value, 10, 5000))} />
        </label>
      </div>
      <div className="controls">
        <button className="btn" aria-pressed={strategy === 'check-then-act'} onClick={() => setStrategy('check-then-act')}>
          {t.flash.naive}
        </button>
        <button className="btn" aria-pressed={strategy === 'atomic'} onClick={() => setStrategy('atomic')}>
          {t.flash.atomic}
        </button>
      </div>

      <svg viewBox="0 0 400 120" preserveAspectRatio="none" width="100%" height="140" role="img" aria-label={t.flash.chart}>
        <line x1="0" x2="400" y1={120 - (stock / peak) * 110} y2={120 - (stock / peak) * 110} stroke="currentColor" strokeDasharray="4 4" opacity="0.4" vectorEffect="non-scaling-stroke" />
        <polyline
          fill="none"
          stroke={result.oversold > 0 ? 'var(--bad)' : 'var(--ok)'}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          points={[0, ...result.timeline]
            .map((sold, i, all) => `${(i / Math.max(1, all.length - 1)) * 400},${120 - (sold / peak) * 110}`)
            .join(' ')}
        />
      </svg>

      <div className="metrics">
        <div className="metric">
          <div className="v">{result.sold.toLocaleString()}</div>
          <div className="l">
            {t.flash.sold} ({t.flash.stock} {stock.toLocaleString()})
          </div>
        </div>
        <div className="metric">
          <div className={`v ${result.oversold > 0 ? 'bad' : 'ok'}`}>{result.oversold.toLocaleString()}</div>
          <div className="l">{t.flash.oversold}</div>
        </div>
        <div className="metric">
          <div className="v">{result.rateLimited.toLocaleString()}</div>
          <div className="l">{t.flash.limited}</div>
        </div>
      </div>
      <p className="note">{t.flash.note}</p>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;
}
