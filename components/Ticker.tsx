import { tickerItems } from '@/lib/data';

export default function Ticker() {
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <div className="ticker">
      <div className="ticker-track">
        {doubled.map((item, i) => (
          <span key={i} className="ticker-item">
            <b>◆</b>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
