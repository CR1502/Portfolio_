const captions: Record<string, string> = {
  spectra: "Signal · Score · Detect",
  kube: "Model · Serve · Scale",
  aeo: "Retrieve · Generate · Evaluate",
  "01": "Advocate · Decide · Explain",
  "02": "Embed · Match · Summarize",
  "03": "Collect · Retrieve · Discover",
};
/** Quiet orthographic sketch, not a second animated signature. */
export default function ProjectArchitecture({ project }: { project: string }) {
  return (
    <div className="project-architecture" aria-hidden="true">
      <div className="iso-stage">
        <div className="iso">
          <i className="iso-link" />
          {[0, 1, 2].map((index) => (
            <span className="iso-node" key={index}>
              <i className="iso-face" />
              <i className="iso-side" />
              <i className="iso-front" />
            </span>
          ))}
        </div>
      </div>
      <span className="architecture-caption">
        {captions[project] || "Build · Measure · Ship"}
      </span>
    </div>
  );
}
