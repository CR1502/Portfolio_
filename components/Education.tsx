import { education } from "@/lib/data";

export default function Education() {
  return (
    <section
      id="education"
      className="section panel"
      aria-labelledby="education-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Academic background</p>
          <h2 id="education-title">Education.</h2>
        </div>
      </div>
      <div className="education-list">
        {education.map((item) => (
          <article className="education-entry" key={item.deg}>
            <div className="education-dates">
              <p>{item.meta[0]}</p>
              <p>{item.meta[1]}</p>
            </div>
            <div className="education-details">
              <h3>{item.deg}</h3>
              <p className="education-school">{item.school}</p>
              <p className="education-grade">
                GPA <span>{item.gpa}</span>
              </p>
              <details className="education-coursework">
                <summary>
                  Coursework <span aria-hidden="true">＋</span>
                </summary>
                <p>{item.courses}</p>
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
