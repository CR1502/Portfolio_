import { projects } from '@/lib/data';

export default function Projects() {
  return (
    <section id="projects" className="ed-section">
      <div className="ed-section-header">
        <div className="ed-label">§ 02 · Projects</div>
        <div className="ed-meta">{projects.length} projects</div>
      </div>
      <div>
        {projects.map((p) => (
          <div key={p.num} className="ed-proj-row">
            <span className="ed-proj-num">{p.num}</span>
            <div>
              <div className="ed-proj-name">{p.name}</div>
              <div className="ed-proj-sub">{p.sub}</div>
            </div>
            <div className="ed-proj-stack">
              {p.tags.slice(0, 4).join(' · ')}
            </div>
            <div className="ed-proj-links">
              <a href={p.gh} target="_blank" rel="noreferrer" className="ed-proj-link">
                GitHub →
              </a>
              {p.demo && (
                <a href={p.demo} target="_blank" rel="noreferrer" className="ed-proj-link">
                  Live ⬈
                </a>
              )}
            </div>
            <div className="ed-proj-date">{p.date}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
