import { useMemo, useState } from 'react';
import { sloReport } from '../sim/slo';

const PRESETS = [99, 99.5, 99.9, 99.95, 99.99];

export function SloDemo() {
  const [target, setTarget] = useState(99.9);
  const report = useMemo(() => sloReport(target), [target]);

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>Try it: SLO burn-rate alert thresholds</strong>
        <span className="badge">same math as the repo's slo-calc</span>
      </div>
      <div className="controls">
        {PRESETS.map((preset) => (
          <button key={preset} className="btn" aria-pressed={target === preset} onClick={() => setTarget(preset)}>
            {preset}%
          </button>
        ))}
      </div>
      <p>
        30-day error budget: <strong>{(report.errorBudget * 100).toFixed(3)}%</strong> of requests ≈{' '}
        <strong>{formatMinutes(report.allowedDowntimeMinutes)}</strong> of full downtime
      </p>
      <table className="data">
        <thead>
          <tr>
            <th>alert</th>
            <th>windows</th>
            <th>burn rate</th>
            <th>budget spent</th>
            <th>error rate threshold</th>
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
      <p className="note">
        Both windows must breach (CloudWatch composite alarm): the long window proves it matters, the short one makes
        the alert reset quickly once fixed.
      </p>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes >= 120) return `${(minutes / 60).toFixed(1)} h`;
  return `${minutes.toFixed(1)} min`;
}
