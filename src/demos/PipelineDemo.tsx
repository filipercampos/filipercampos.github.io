import { useRef, useState } from 'react';
import { Strings, useT } from '../i18n';
import { DocKind, DocTrace, traceDocument } from '../sim/pipeline';

const ACTIONS: DocKind[] = ['valid', 'duplicate', 'spoofed', 'poison'];

function noteFor(trace: DocTrace, t: Strings): string {
  const notes = t.pipeline.notes;
  switch (trace.status) {
    case 'PROCESSED':
      return trace.kind === 'duplicate' ? notes.first : notes.processed;
    case 'DEDUPLICATED':
      return notes.deduplicated;
    case 'REJECTED':
      return notes.rejected;
    case 'DLQ':
      return notes.dlq;
  }
}

export function PipelineDemo() {
  const processed = useRef(new Set<string>());
  const counter = useRef(0);
  const [traces, setTraces] = useState<DocTrace[]>([]);
  const t = useT();

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
        <strong>{t.pipeline.title}</strong>
        <span className="badge">{t.simulated}</span>
      </div>
      <div className="controls">
        {ACTIONS.map((kind) => (
          <button key={kind} className="btn" onClick={() => send(kind)}>
            {t.pipeline.actions[kind]}
          </button>
        ))}
      </div>
      {traces.length === 0 && <p className="note">{t.pipeline.empty}</p>}
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
          <div className="note">{noteFor(trace, t)}</div>
        </div>
      ))}
    </div>
  );
}
