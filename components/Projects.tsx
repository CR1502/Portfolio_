"use client";
/** Sticky scroll layout adapted from Componentry Sticky Scroll Cards.
 * Card material adapted from Componentry Orbit Card Stack.
 * MIT © 2026 Harsh Jadhav. License: /vendor/componentry-LICENSE.txt */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import ProjectVisual from "./ProjectVisual";
import { projects, type Project } from "@/lib/data";
/** The newest projects play as the sticky sequence; the rest hang below as static posters. */
const featured = projects.slice(0, 4);
const archive = projects.slice(4);
function CardBody({ project, index, artReady, onOpen }: {
  project: Project;
  index: number;
  artReady: boolean;
  onOpen: (project: Project, button: HTMLButtonElement) => void;
}) {
  return (
    <>
      <div className="orbit-art">
        {artReady && <ProjectVisual project={project.num} />}
        <span className="orbit-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="orbit-open-icon" aria-hidden="true">
          ↗
        </span>
      </div>
      <div className="orbit-copy">
        <p className="orbit-date">{project.date}</p>
        <h3 id={`project-${project.num}`}>{project.name}</h3>
        <p className="orbit-sub">{project.sub}</p>
        <p className="orbit-tags">{project.tags.slice(0, 3).join(" / ")}</p>
        <span className="orbit-read">
          View project <span aria-hidden="true">↗</span>
        </span>
      </div>
      <button
        className="project-open orbit-card-open"
        aria-labelledby={`project-${project.num}`}
        aria-haspopup="dialog"
        onClick={(event) => onOpen(project, event.currentTarget)}
      >
        <span className="sr-only">Open project notes</span>
      </button>
    </>
  );
}
export default function Projects() {
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLButtonElement | null>(null),
    stage = useRef<HTMLDivElement>(null);
  const [artReady, setArtReady] = useState(false);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArtReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "900px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [selected, setSelected] = useState<Project | null>(null);
  const [front, setFront] = useState(0);
  useEffect(() => {
    const host = stage.current;
    if (!host) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let reduced = preference.matches;
    const update = () => {
      frame = 0;
      const largeType = parseFloat(getComputedStyle(document.documentElement).fontSize) > 20;
      const flat = reduced || largeType || window.innerHeight < 700;
      const steps = Array.from(host.querySelectorAll<HTMLElement>(".sticky-project-step"));
      const progress = Math.max(0, Math.min(1, -host.getBoundingClientRect().top / Math.max(1, host.offsetHeight - innerHeight)));
      let foremost = 0;
      steps.forEach((step, index) => {
        if (step.getBoundingClientRect().top <= innerHeight * 0.18) foremost = index;
        const start = index / (featured.length + 1);
        const local = Math.max(0, Math.min(1, (progress - start) / (1 - start)));
        const resting = Math.max(0.56, 1 - (featured.length - index - 1) * 0.095);
        step.style.setProperty("--stack-scale", String(flat ? 1 : 1 - (1 - resting) * local));
      });
      steps.forEach((step, index) => { step.inert = !flat && index < foremost; });
      setFront(foremost);
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    const motion = (event: MediaQueryListEvent) => { reduced = event.matches; queue(); };
    const observer = new ResizeObserver(queue);
    observer.observe(host);
    observer.observe(document.documentElement);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
    preference.addEventListener("change", motion);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      preference.removeEventListener("change", motion);
    };
  }, []);
  useEffect(() => {
    if (!selected || !dialog.current) return;
    const modal = dialog.current,
      overflow = document.body.style.overflow;
    modal.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      if (modal.open) modal.close();
      opener.current?.focus({ preventScroll: true });
    };
  }, [selected]);
  const open = (project: Project, button: HTMLButtonElement) => {
    opener.current = button;
    setSelected(project);
  };
  return (
    <>
      <section
        id="projects"
        className="orbit-projects sticky-projects"
        aria-labelledby="projects-title"
      >
        <div className="section-heading orbit-heading">
          <div>
            <p className="eyebrow">
              Project archive · {projects.length} projects
            </p>
            <h2 id="projects-title">
              Selected <em>projects.</em>
            </h2>
          </div>
        </div>
        <div ref={stage} className="sticky-project-stack" role="list" aria-label="Latest projects">
          {featured.map((p, i) => {
            const style = {
              "--stack-tilt": `${[-1.25, 0.85, -0.65, 1.35, -0.9][i % 5]}deg`,
              "--stack-order": i,
              zIndex: i + 1,
            } as CSSProperties;
            return (
              <div className="sticky-project-step" key={p.num} style={style} role="listitem">
                <article
                  className={`orbit-card sticky-project-card${front === i ? " is-active" : ""}`}
                  aria-current={front === i ? "true" : undefined}
                >
                  <CardBody project={p} index={i} artReady={artReady} onOpen={open} />
                </article>
              </div>
            );
          })}
        </div>
        <div className="project-posters-wrap">
          <h3 className="project-posters-title">
            More projects <span>{archive.length}</span>
          </h3>
          <div className="project-posters" role="list" aria-label="More projects">
            {archive.map((p, i) => (
              <article className="orbit-card sticky-project-card project-poster" key={p.num} role="listitem">
                <CardBody project={p} index={featured.length + i} artReady={artReady} onOpen={open} />
              </article>
            ))}
          </div>
        </div>
      </section>
      <dialog
        ref={dialog}
        className="project-dialog"
        data-featured={selected && featured.includes(selected) ? "true" : undefined}
        aria-labelledby="dialog-project-title"
        aria-describedby="dialog-project-description"
        onClose={(event) => {
          if (!event.currentTarget.open) setSelected(null);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter(
            (element) =>
              element.tabIndex >= 0 &&
              element.getBoundingClientRect().width > 0 &&
              getComputedStyle(element).visibility !== "hidden",
          );
          const first = controls[0],
            last = controls[controls.length - 1];
          if (!first) {
            event.preventDefault();
            return;
          }
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              !event.currentTarget.contains(document.activeElement))
          ) {
            event.preventDefault();
            last.focus();
          } else if (
            !event.shiftKey &&
            (document.activeElement === last ||
              !event.currentTarget.contains(document.activeElement))
          ) {
            event.preventDefault();
            first.focus();
          }
        }}
        onClick={(event) => {
          const r = event.currentTarget.getBoundingClientRect();
          if (
            event.target === event.currentTarget &&
            (event.clientX < r.left ||
              event.clientX > r.right ||
              event.clientY < r.top ||
              event.clientY > r.bottom)
          )
            event.currentTarget.close();
        }}
      >
        {selected && (
          <>
            <div className="dialog-top">
              <p className="eyebrow">Project notes · {selected.date}</p>
              <button
                className="dialog-close neu"
                aria-label="Close project"
                onClick={() => dialog.current?.close()}
                autoFocus
              >
                ✕
              </button>
            </div>
            <h2 id="dialog-project-title">{selected.name}</h2>
            <p className="dialog-subtitle">{selected.sub}</p>
            <p id="dialog-project-description" className="dialog-description">
              {selected.desc}
            </p>
            {selected.metrics && (
              <div className="metrics">
                {selected.metrics.map((m) => (
                  <div key={m.label}>
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            )}
            {selected.note && <p className="benchmark-note">{selected.note}</p>}
            <div className="project-tags">
              {selected.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <div className="dialog-links">
              {selected.gh ? (
                <a
                  className="button primary"
                  href={selected.gh}
                  target="_blank"
                  rel="noreferrer"
                >
                  Explore the code ↗
                </a>
              ) : (
                <p className="repo-note">Public repository not listed</p>
              )}
              {selected.demo && (
                <a
                  className="button neu"
                  href={selected.demo}
                  target="_blank"
                  rel="noreferrer"
                >
                  Live demo ↗
                </a>
              )}
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
