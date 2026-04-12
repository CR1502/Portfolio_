import { dataStreamItems } from '@/lib/data';

export default function DataStream() {
  const doubled = [...dataStreamItems, ...dataStreamItems];

  return (
    <div className="ds">
      <div className="ds-track">
        {doubled.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}
