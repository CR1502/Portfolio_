export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-grid"></div>
      <div className="hero-label">AI Engineer / Machine Learning</div>
      <h1 className="hero-name">
        <span className="out">Craig</span>
        <br />
        <span className="acc">Roberts</span>
      </h1>
      <p className="hero-sub">Building intelligent systems that matter</p>
      <p className="hero-desc">
        MS in Artificial Intelligence at Northeastern University. I architect multi-agent
        orchestration systems, design retrieval-augmented pipelines, and deploy production-grade
        AI — from CNNs in clinical imaging to LLM-powered conversational memory systems.
      </p>
      <div className="hero-cta">
        <a href="#projects" className="btn-p">View Projects ↓</a>
        <a href="mailto:roberts.cr@northeastern.edu" className="btn-s">Get In Touch →</a>
      </div>
      <div className="hero-scroll">
        <span>scroll</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  );
}
