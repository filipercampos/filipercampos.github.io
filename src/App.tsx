import type { ComponentType } from 'react';
import { DemoId, Project, projects } from './data/projects';
import { FlashSaleDemo } from './demos/FlashSaleDemo';
import { LedgerDemo } from './demos/LedgerDemo';
import { PipelineDemo } from './demos/PipelineDemo';
import { SagaDemo } from './demos/SagaDemo';
import { SloDemo } from './demos/SloDemo';
import { StranglerDemo } from './demos/StranglerDemo';

const DEMOS: Record<DemoId, ComponentType> = {
  ledger: LedgerDemo,
  platform: SloDemo,
  saga: SagaDemo,
  flash: FlashSaleDemo,
  pipeline: PipelineDemo,
  strangler: StranglerDemo,
};

export function App() {
  return (
    <>
      <header className="hero wrap">
        <div className="eyebrow">// backend · distributed systems · aws</div>
        <h1>Filipe Campos</h1>
        <p className="lead">
          Senior backend engineer focused on systems that must stay correct under concurrency, retries and partial
          failure. Six projects, each with its decisions written down, tests that prove them, and numbers that were
          actually measured.
        </p>
        <div className="links">
          <a className="btn primary" href="https://github.com/filipercampos">
            GitHub
          </a>
          <a className="btn" href="#ledger">
            See the projects ↓
          </a>
        </div>
      </header>

      <nav className="toc" aria-label="Projects">
        <div className="wrap">
          {projects.map((project) => (
            <a key={project.id} href={`#${project.id}`}>
              {project.title}
            </a>
          ))}
        </div>
      </nav>

      <main className="wrap">
        {projects.map((project) => (
          <ProjectSection key={project.id} project={project} />
        ))}
      </main>

      <footer className="wrap">
        Demos run entirely in your browser with simplified models of each system; the real implementations, tests,
        ADRs and IaC are in the linked repositories. Metrics come from local runs described in each repo.
      </footer>
    </>
  );
}

function ProjectSection({ project }: { project: Project }) {
  const Demo = DEMOS[project.id];
  return (
    <section id={project.id} className="project">
      <div className="meta">{project.period}</div>
      <h2>{project.title}</h2>
      <p className="tagline">{project.tagline}</p>
      <div className="chips">
        {project.stack.map((item) => (
          <span key={item} className="chip">
            {item}
          </span>
        ))}
      </div>

      <h3>Flow</h3>
      <div className="flow">
        {project.flow.map((node, i) => (
          <span key={node} style={{ display: 'contents' }}>
            {i > 0 && <span className="arrow">→</span>}
            <span className="node">{node}</span>
          </span>
        ))}
      </div>

      <div className="grid-2">
        <div>
          <h3>Problems solved</h3>
          <table className="pt">
            <tbody>
              {project.problems.map((row) => (
                <tr key={row.problem}>
                  <td>{row.problem}</td>
                  <td>{row.solution}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3>Measured</h3>
          <div className="metrics">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="metric">
                <div className="v">{metric.value}</div>
                <div className="l">{metric.label}</div>
              </div>
            ))}
          </div>
          <p className="note">{project.metricsNote}</p>
          <h3>Known gaps</h3>
          <ul className="gaps">
            {project.honestGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
          <p>
            <a href={project.repo}>Code, ADRs and runbook →</a>
          </p>
        </div>
      </div>

      <Demo />
    </section>
  );
}
