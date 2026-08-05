import ThemeToggle from '@/components/ThemeToggle';

export default function Nav() {
  const links = [
    ['#experience', 'Experience'],
    ['#projects',   'Projects'],
    ['#education',  'Education'],
    ['#skills',     'Stack'],
    ['#connect',    'Connect'],
  ] as const;

  return (
    <header className="ed-nav">
      <div className="ed-nav-brand">
        <span className="ed-nav-name">Craig Lionel Roberts</span>
      </div>
      <ul className="ed-nav-links">
        {links.map(([href, label]) => (
          <li key={href}>
            <a href={href}>{label}</a>
          </li>
        ))}
      </ul>
      <div className="ed-nav-right">
        <span>Boston</span>
        <span>·</span>
        <span className="ed-nav-open">Open to work</span>
        <span>·</span>
        <ThemeToggle />
      </div>
    </header>
  );
}
