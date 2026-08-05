import { skills } from '@/lib/data';

export default function Skills() {
  return (
    <section id="skills" className="ed-section">
      <div className="ed-section-header">
        <div className="ed-label">§ 04 · Stack</div>
      </div>
      {skills.map((group) => (
        <div key={group.t} className="ed-skill-item">
          <div className="ed-skill-group">{group.t}</div>
          <div className="ed-skill-items">{group.items.join(' · ')}</div>
        </div>
      ))}
    </section>
  );
}
