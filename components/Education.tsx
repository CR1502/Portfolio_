import { education } from '@/lib/data';

export default function Education() {
  return (
    <section id="education" className="ed-section">
      <div className="ed-section-header">
        <div className="ed-label">§ 03 · Education</div>

      </div>
      {education.map((item, i) => (
        <div key={i} className="ed-edu-item">
          <div className="ed-edu-meta">
            <div>{item.meta[0]}</div>
            <div>{item.meta[1]}</div>
            <div style={{ marginTop: 8 }}>GPA: {item.gpa}</div>
          </div>
          <div>
            <div className="ed-edu-deg">{item.deg}</div>
            <div className="ed-edu-school">{item.school}</div>
            <div className="ed-edu-courses">{item.courses}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
