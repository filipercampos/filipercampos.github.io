import { useRef, useState } from 'react';
import { DocKind, DocTrace, traceDocument } from '../sim/pipeline';

const ACTIONS: { kind: DocKind; label: string }[] = [
  { kind: 'valid', label: 'upload valid CSV' },
  { kind: 'duplicate', label: 'S3 delivers same event twice' },
  { kind: 'spoofed', label: 'upload .exe renamed to .pdf' },
  { kind: 'poison', label: 'upload corrupt PDF' },
];

export function PipelineDemo() {
  const processed = useRef(new Set<string>());
  const counter = useRef(0);
  const [traces, setTraces] = useState<DocTrace[]>([]);

  function send(kind: DocKind) {
    counter.current += 1;
    const id = `doc-${String(counter.current).padStart(3, '0')}`;
    const next =
      kind === 'duplicate'
        ? [traceDocument(id, 'duplicate', processed.current), traceDocument(id, 'duplicate', processed.current)]
        : [traceDocument(id, kind, processed.current)];
    setTraces((all) => [...next.reverse(), ...all].slice(0, 8));
  }

  return (
    <div className="demo">
      <div className="demo-title">
        <strong>Try it: throw documents at the pipeline</strong>
        <span className="badge">simulated in your browser</span>
      </div>
      <div className="controls">
        {ACTIONS.map((action) => (
          <button key={action.kind} className="btn" onClick={() => send(action.kind)}>
            {action.label}
          </button>
        ))}
      </div>
      {traces.length === 0 && <p className="note">Pick an action above.</p>}
      {traces.map((trace, i) => (
        <div key={`${trace.id}-${i}`} style={{ marginBottom: 14 }}>
          <div style={{ marginBottom: 4 }}>
            <code>{trace.id}</code>{' '}
            <span className={trace.status === 'PROCESSED' ? 'pill-ok' : trace.status === 'DEDUPLICATED' ? 'pill-warn' : 'pill-bad'}>
              {trace.status}
            </span>
          </div>
          <div className="stages">
            {trace.path.map((stage, j) => (
              <span key={j} style={{ display: 'contents' }}>
                {j > 0 && <span className="arrow">→</span>}
                <span className={`stage ${stage}`}>{stage}</span>
              </span>
            ))}
          </div>
          <div className="note">{trace.note}</div>
        </div>
      ))}
    </div>
  );
}
