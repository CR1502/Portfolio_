export default function Hero() {
  return (
    <section className="ed-hero">
      <div className="ed-hero-grid">
        <div>
          <h1 className="ed-h1">
            The <em>hard</em> part isn't the <br /> model.<br />
            It's everything that ships<br />
            with it.
          </h1>
          <p className="ed-lede">
            MS in Artificial Intelligence at Northeastern. I architect multi-agent
            orchestration, design retrieval-augmented pipelines, and deploy production
            AI — from CNNs in clinical imaging to LLM-powered conversational memory.
          </p>
        </div>
        <div className="ed-sidebar">
          <div className="ed-sidebar-label">Currently</div>
          <div>
            <span className="ed-sidebar-strong">AI Engineer Co-op</span>
            <br />
            Staples · Framingham
          </div>
          <div style={{ marginTop: 12 }}>
            <span className="ed-sidebar-strong">MS in AI</span>
            <br />
            Northeastern · grad Dec 2026
          </div>
          <div className="ed-sidebar-divider">
            <a href="/Craig_Roberts_Resume.pdf" target="_blank" rel="noreferrer">Read CV →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
