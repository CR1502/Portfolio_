import { experience } from "@/lib/data";
export default function Experience() {
  return (
    <section
      id="experience"
      className="section experience-section panel"
      aria-labelledby="experience-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Experience</p>
          <h2 id="experience-title">
            Engineering.
            <br />
            <em>And teaching.</em>
          </h2>
        </div>
        <p>
          Building with teams.
          <br />
          Teaching what I learn.
        </p>
      </div>
      <div className="experience-groups">
      {[
        {
          title: "Technical experience",
          items: experience.filter((item) => !item.role.includes("Teaching")),
        },
        {
          title: "Teaching",
          items: experience.filter((item) => item.role.includes("Teaching")),
        },
      ].map((group) => (
        <div className="experience-category" key={group.title}>
          <h3 className="experience-category-title">{group.title}</h3>
          <div className="timeline">
            {group.items.map((item) => (
              <article key={`${item.role}-${item.date}`} className="experience-row">
                <div className="experience-date">
                  <span>{item.date}</span>
                  <span>{item.loc}</span>
                </div>
                <div className="experience-body">
                  <p className="company">{item.company}</p>
                  <h3>{item.role}</h3>
                  {item.company === "Staples" ? (
                    <>
                      <p>{item.details[0]}</p>
                      <details>
                        <summary>
                          Explore the work <span aria-hidden="true">＋</span>
                        </summary>
                        <ul>
                          {item.details.slice(1).map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </details>
                    </>
                  ) : (
                    <ul>
                      {item.details.map((d) => (
                        <li key={d}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
      </div>
    </section>
  );
}
