/** A diagram of the work itself, with no decorative 3D or invented telemetry. */
export default function SystemFlow() {
  const steps = [
    ["Retrieve", "Ground answers in sources"],
    ["Reason", "Connect models and agents"],
    ["Evaluate", "Check quality before release"],
    ["Serve", "Deliver through reliable APIs"],
  ];
  return (
    <figure className="system-flow" aria-label="AI engineering workflow">
      <figcaption className="eyebrow">The systems I build</figcaption>
      <ol>
        {steps.map(([title, description]) => (
          <li key={title}>
            <span className="flow-point" aria-hidden="true" />
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
