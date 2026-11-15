import { useMemo, useState } from 'react';
import { useT } from '../i18n';
import { sloReport } from '../sim/slo';

const PRESETS = [99, 99.5, 99.9, 99.95, 99.99];

export function SloDemo() {
  const [target, setTarget] = useState(99.9);
  const report = useMemo(() => sloReport(target), [target]);
  const t = useT();

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>{t.slo.title}</strong>
        <span className="badge">{t.slo.badge}</span>
      </div>
      <div className="controls">
        {PRESETS.map((preset) => (
          <button key={preset} className="btn" aria-pressed={target === preset} onClick={() => setTarget(preset)}>
            {preset}%
          </button>
        ))}
      </div>
      <p>
        {t.slo.budget}: <strong>{(report.errorBudget * 100).toFixed(3)}%</strong> {t.slo.ofRequests}{' '}
        <strong>{formatMinutes(report.allowedDowntimeMinutes)}</strong> {t.slo.downtime}
      </p>
      <table className="data">
        <thead>
          <tr>
            {t.slo.cols.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.windows.map((w) => (
            <tr key={w.longWindow}>
              <td>
                <span className={w.severity === 'page' ? 'pill-bad' : 'pill-warn'}>{w.severity}</span>
              </td>
              <td>
                {w.longWindow} + {w.shortWindow}
              </td>
              <td>{w.burnRate}×</td>
              <td>{w.budgetConsumed * 100}%</td>
              <td>{(w.errorRateThreshold * 100).toFixed(3)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{t.slo.note}</p>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes >= 120) return `${(minutes / 60).toFixed(1)} h`;
  return `${minutes.toFixed(1)} min`;
}
