import { experience } from '@/lib/data';

const companyLogos: Record<string, string> = {
  'Staples': '/logos/staples.svg',
  'Northeastern University': '/logos/northeastern.svg',
};

export default function Experience() {
  return (
    <section id="experience" className="ed-section">
      <div className="ed-section-header">
        <div className="ed-label">§ 01 · Experience</div>
      </div>
      {experience.map((item, i) => (
        <div key={i} className="ed-exp-item">
          <div className="ed-exp-left">
            <div>{item.date}</div>
            <div>{item.loc}</div>
          </div>
          <div>
            <div className="ed-exp-role">{item.role}</div>
            <div className="ed-exp-company">
              {companyLogos[item.company] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={companyLogos[item.company]} alt={item.company} className="ed-exp-logo" />
              ) : (
                item.company
              )}
            </div>
            <ul className="ed-exp-details">
              {item.details.map((d, j) => (
                <li key={j}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </section>
  );
}
