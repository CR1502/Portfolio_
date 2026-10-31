import PointCloudBrain from "./PointCloudBrain";

export default function Hero() {
  return (
    <section className="scene-hero" id="home" aria-labelledby="hero-title">
      <div className="hero hero-cinematic hero-soffit">
        <p className="hero-identity">
          <strong>Craig Lionel Roberts</strong>
          <span>AI Engineer</span>
        </p>
        <div className="hero-main">
        <div className="hero-scene">
          <h1 id="hero-title">
            Intelligence,<em>engineered</em>
            <span>for the real world.</span>
          </h1>
          <p className="hero-context eyebrow">Context becomes evidence.</p>
        </div>
        <PointCloudBrain />
        </div>
        <div className="cinematic-hero-footer">
          <p className="hero-description">
            I build the systems around the model. Retrieval, agents, evaluation,
            and infrastructure — connected with care, built to ship.
          </p>
        </div>
        <p className="hero-location">
          Boston, MA <span>/</span> MS in AI · Northeastern ’26
        </p>
      </div>
    </section>
  );
}
