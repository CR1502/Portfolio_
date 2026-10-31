export default function About() {
  return (
    <section
      id="about"
      className="section about-section about-editorial panel"
      aria-labelledby="about-title"
    >
      <div className="about-editorial-inner">
        <div className="section-heading">
          <div>
            <p className="eyebrow">About</p>
            <h2 id="about-title">
              The person
              <br />
              <em>behind the systems.</em>
            </h2>
          </div>
        </div>
        <div className="about-copy">
          <p>
            I’m Craig, an AI engineer based in Boston and an MS in Artificial
            Intelligence student at Northeastern University.
          </p>
          <p>
            At Staples, I worked on multi-agent document extraction, retrieval
            assistants, and the validation and evaluation layers around them. At
            Northeastern, I’ve helped graduate students turn AI and NLP concepts
            into working implementations.
          </p>
          <p>
            My projects follow that same thread: understand the problem, measure
            the behavior, and build something that can be inspected and
            reproduced.
          </p>
        </div>
      </div>
    </section>
  );
}
