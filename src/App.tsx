import type { ComponentType } from 'react';
import { DemoId, localizedProjects, Project } from './data/projects';
import { FlashSaleDemo } from './demos/FlashSaleDemo';
import { LedgerDemo } from './demos/LedgerDemo';
import { PipelineDemo } from './demos/PipelineDemo';
import { SagaDemo } from './demos/SagaDemo';
import { SloDemo } from './demos/SloDemo';
import { StranglerDemo } from './demos/StranglerDemo';
import { LangSwitch, useLang, useT } from './i18n';
import { ThemeToggle } from './theme';

const MOBILE_REPO = 'https://github.com/filipercampos/vehicle-inspection-checklist';
const MOBILE_DEMO = 'https://filipercampos.github.io/vehicle-inspection-checklist/';
const MOBILE_STACK = ['Flutter', 'Dart', 'Riverpod', 'go_router', 'Blender (Cycles)'];

const CONTACT = {
  github: 'https://github.com/filipercampos',
  linkedin: 'https://www.linkedin.com/in/filipercampos',
  email: 'filipecampos123@hotmail.com',
};

const DEMOS: Record<DemoId, ComponentType> = {
  ledger: LedgerDemo,
  platform: SloDemo,
  saga: SagaDemo,
  flash: FlashSaleDemo,
  pipeline: PipelineDemo,
  strangler: StranglerDemo,
};

export function App() {
  const { lang } = useLang();
  const t = useT();
  const projects = localizedProjects(lang);
  return (
    <>
      <header className="hero wrap">
        <div className="hero-top">
          <div className="eyebrow">{t.eyebrow}</div>
          <div className="toolbar">
            <ThemeToggle />
            <LangSwitch />
          </div>
        </div>
        <h1>Filipe Campos</h1>
        <p className="lead">{t.lead}</p>
        <div className="links">
          <a className="btn primary" href={CONTACT.github}>
            GitHub
          </a>
          <a className="btn" href={CONTACT.linkedin}>
            LinkedIn
          </a>
          <a className="btn" href={`mailto:${CONTACT.email}`}>
            {t.email}
          </a>
          <a className="btn" href="#ledger">
            {t.seeProjects}
          </a>
        </div>
      </header>

      <nav className="toc" aria-label={t.navLabel}>
        <div className="wrap">
          {projects.map((project) => (
            <a key={project.id} href={`#${project.id}`}>
              {project.title}
            </a>
          ))}
          <a href="#mobile">{t.mobile.nav}</a>
        </div>
      </nav>

      <main className="wrap">
        {projects.map((project) => (
          <ProjectSection key={project.id} project={project} />
        ))}
        <section id="mobile" className="project">
          <div className="meta">{t.mobile.meta}</div>
          <h2>{t.mobile.title}</h2>
          <p className="tagline">{t.mobile.tagline}</p>
          <div className="chips">
            {MOBILE_STACK.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
          <img
            className="mobile-shot"
            src="/vehicle-inspection.webp"
            alt={t.mobile.imageAlt}
            width={800}
            height={420}
            loading="lazy"
          />
          <p>{t.mobile.body}</p>
          <p>
            <a href={MOBILE_DEMO} target="_blank" rel="noreferrer">
              {t.mobile.demoLink}
            </a>
            {' · '}
            <a href={MOBILE_REPO}>{t.mobile.codeLink}</a>
          </p>
        </section>
      </main>

      <footer className="wrap">
        <p>{t.footer}</p>
        <p className="contact">
          <a href={CONTACT.github}>GitHub</a> · <a href={CONTACT.linkedin}>LinkedIn</a> ·{' '}
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
        </p>
      </footer>
    </>
  );
}

function ProjectSection({ project }: { project: Project }) {
  const Demo = DEMOS[project.id];
  const t = useT();
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

      <h3>{t.flow}</h3>
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
          <h3>{t.problemsSolved}</h3>
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
          <h3>{t.measured}</h3>
          <div className="metrics">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="metric">
                <div className="v">{metric.value}</div>
                <div className="l">{metric.label}</div>
              </div>
            ))}
          </div>
          <p className="note">{project.metricsNote}</p>
          <h3>{t.knownGaps}</h3>
          <ul className="gaps">
            {project.honestGaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
          <p>
            <a href={project.repo}>{t.codeLink}</a>
          </p>
        </div>
      </div>

      <Demo />
    </section>
  );
}
