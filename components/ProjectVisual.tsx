const labels: Record<string, string> = {
  "04": "Hand gestures becoming musical notes",
  "05": "Evidence checked through a text classifier",
  "06": "A model reading a chest radiograph",
  "07": "Gaze estimation around an eye",
  "08": "Sound waves becoming a visual field",
  "09": "A sensor-informed irrigation system",
  spectra: "A layered signal landscape with a shifted distribution",
  kube: "A model-serving core distributing work to replicas",
  aeo: "Retrieved documents grounding a cited answer",
  "01": "Two advocates meeting around a shared decision",
  "02": "Candidate and role embeddings connected by relevance",
  "03": "A globe with a route connecting retrieved places",
};
export default function ProjectVisual({ project }: { project: string }) {
  const metal = `metal-${project}`,
    warm = `warm-${project}`,
    glow = `glow-${project}`;
  return (
    <figure
      className={`project-visual visual-${project}`}
      aria-label={labels[project]}
    >
      <svg viewBox="0 0 640 280" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--art-light)" />
            <stop offset=".28" stopColor="var(--art-mid)" />
            <stop offset=".65" stopColor="var(--art-dark)" />
            <stop offset="1" stopColor="var(--ink-900)" />
          </linearGradient>
          <linearGradient id={warm} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="var(--warm-light)" />
            <stop offset=".3" stopColor="var(--amber)" />
            <stop offset="1" stopColor="var(--warm-dark)" />
          </linearGradient>
          <radialGradient id={glow}>
            <stop stopColor="var(--cyan)" stopOpacity=".15" />
            <stop offset="1" stopColor="var(--cyan)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="320" cy="160" rx="270" ry="120" fill={`url(#${glow})`} />
        {project === "spectra" ? (
          <g>
            {Array.from({ length: 17 }, (_, i) => {
              const shift = i > 10 ? 65 : 0,
                y = 215 - i * 6;
              const points = Array.from({ length: 61 }, (_, n) => {
                const x = 100 + n * 7;
                return `${n ? "L" : "M"}${x + i * 1.7} ${y - Math.exp(-(((x - 275 - shift) / 76) ** 2)) * (80 + i * 1.5)}`;
              }).join(" ");
              return (
                <path
                  key={i}
                  d={points}
                  stroke={i === 12 ? "var(--amber)" : "var(--cyan)"}
                  strokeOpacity={i === 12 ? 1 : 0.14 + i * 0.028}
                  strokeWidth={i === 12 ? 2.6 : 1.1}
                />
              );
            })}
            <path
              d="M420 58h62m-9-7 9 7-9 7"
              stroke="var(--amber)"
              strokeWidth="2"
            />
          </g>
        ) : project === "kube" ? (
          <g>
            <ellipse
              cx="320"
              cy="160"
              rx="167"
              ry="78"
              stroke="var(--cyan)"
              strokeOpacity=".2"
              strokeDasharray="3 8"
            />
            {[
              [-160, -20],
              [-83, -83],
              [95, -65],
              [166, 23],
              [65, 85],
              [-102, 76],
            ].map(([x, y], i) => (
              <g key={i}>
                <path
                  d={`M320 145L${320 + x} ${145 + y}`}
                  stroke="var(--cyan)"
                  strokeOpacity=".3"
                />
                <rect
                  x={300 + x}
                  y={122 + y}
                  width="40"
                  height="47"
                  rx="18"
                  fill={`url(#${i % 2 ? metal : warm})`}
                  stroke="var(--art-light)"
                  strokeOpacity=".3"
                />
                <ellipse
                  cx={320 + x}
                  cy={123 + y}
                  rx="19"
                  ry="8"
                  fill="var(--art-light)"
                  fillOpacity=".15"
                />
              </g>
            ))}
            <circle
              cx="320"
              cy="145"
              r="43"
              fill={`url(#${metal})`}
              stroke="var(--art-light)"
              strokeOpacity=".5"
            />
            <path
              d="M307 145h26m-18-8 8 8-8 8"
              stroke="var(--text)"
              strokeWidth="2"
            />
          </g>
        ) : project === "aeo" ? (
          <g>
            {[0, 1, 2].map((i) => (
              <g
                key={i}
                transform={`translate(${135 + i * 92} ${45 + i * 12}) rotate(${i * 7 - 13} 80 90)`}
              >
                <rect
                  x="4"
                  y="8"
                  width="132"
                  height="169"
                  rx="17"
                  fill="var(--ink-900)"
                  fillOpacity=".65"
                />
                <rect
                  width="132"
                  height="169"
                  rx="17"
                  fill={`url(#${metal})`}
                  stroke="var(--cyan)"
                  strokeOpacity=".35"
                />
                {[0, 1, 2, 3, 4].map((n) => (
                  <path
                    key={n}
                    d={`M23 ${38 + n * 22}h${n % 2 ? 65 : 86}`}
                    stroke="var(--text)"
                    strokeOpacity=".35"
                    strokeWidth="3"
                  />
                ))}
                <path
                  d="M23 104h66"
                  stroke="var(--amber)"
                  strokeWidth="7"
                  strokeOpacity=".65"
                />
              </g>
            ))}
            <g transform="translate(411 133) rotate(8)">
              <rect
                width="91"
                height="75"
                rx="18"
                fill={`url(#${warm})`}
                stroke="var(--warm-light)"
                strokeOpacity=".6"
              />
              <path
                d="M24 29h43M24 40h34M24 51h23"
                stroke="var(--ink-900)"
                strokeWidth="3"
              />
            </g>
          </g>
        ) : project === "01" ? (
          <g>
            <path
              d="M175 179C103 57 319 21 367 128S558 232 485 104"
              stroke="var(--ink-900)"
              strokeWidth="35"
              transform="translate(6 9)"
            />
            <path
              d="M175 179C103 57 319 21 367 128"
              stroke={`url(#${metal})`}
              strokeWidth="32"
              strokeLinecap="round"
            />
            <path
              d="M367 128C415 235 558 232 485 104"
              stroke={`url(#${warm})`}
              strokeWidth="32"
              strokeLinecap="round"
            />
            <circle
              cx="329"
              cy="131"
              r="9"
              fill="var(--text)"
              fillOpacity=".8"
            />
          </g>
        ) : project === "02" ? (
          <g>
            {Array.from({ length: 7 }, (_, i) => {
              const y = 52 + i * 28,
                other = 52 + ((i * 3) % 7) * 28;
              return (
                <g key={i}>
                  <path
                    d={`M190 ${y}C280 ${y} 350 ${other} 450 ${other}`}
                    stroke={i === 2 ? "var(--amber)" : "var(--cyan)"}
                    strokeOpacity={i === 2 ? 1 : 0.2}
                    strokeWidth={i === 2 ? 2 : 1}
                  />
                  <circle
                    cx="190"
                    cy={y}
                    r={i === 2 ? 10 : 6}
                    fill={`url(#${metal})`}
                  />
                  <circle
                    cx="450"
                    cy={y}
                    r={i === 6 ? 10 : 6}
                    fill={`url(#${warm})`}
                  />
                </g>
              );
            })}
            <ellipse
              cx="190"
              cy="136"
              rx="68"
              ry="112"
              stroke="var(--cyan)"
              strokeOpacity=".18"
            />
            <ellipse
              cx="450"
              cy="136"
              rx="68"
              ry="112"
              stroke="var(--amber)"
              strokeOpacity=".18"
            />
          </g>
        ) : project === "04" ? (
          <g>
            <path
              d="M255 223V123q0-17 13-17t13 17V72q0-18 13-18t13 18v48V52q0-17 13-17t13 17v70V68q0-17 13-17t13 17v85l17-28q10-16 22-8t3 25l-31 64q-15 35-57 35Z"
              fill={`url(#${metal})`}
              stroke="var(--art-light)"
              strokeOpacity=".6"
            />
            <path
              d="M410 66v78m0-65 46-12v62"
              stroke="var(--amber)"
              strokeWidth="5"
            />
            <ellipse cx="398" cy="148" rx="13" ry="9" fill="var(--amber)" />
            <ellipse cx="444" cy="133" rx="13" ry="9" fill="var(--amber)" />
          </g>
        ) : project === "05" ? (
          <g>
            <rect
              x="234"
              y="34"
              width="172"
              height="210"
              rx="22"
              fill={`url(#${metal})`}
              stroke="var(--art-light)"
              strokeOpacity=".5"
            />
            {[70, 103, 136, 169].map((y) => (
              <path
                key={y}
                d={`M263 ${y}h108`}
                stroke="var(--text)"
                strokeOpacity=".4"
                strokeWidth="3"
              />
            ))}
            <circle cx="405" cy="191" r="42" fill={`url(#${warm})`} />
            <path
              d="m386 191 13 13 25-29"
              stroke="var(--ink-900)"
              strokeWidth="5"
            />
          </g>
        ) : project === "06" ? (
          <g>
            <rect
              x="205"
              y="28"
              width="230"
              height="220"
              rx="20"
              fill={`url(#${metal})`}
              stroke="var(--cyan)"
              strokeOpacity=".5"
            />
            <path d="M320 61v142" stroke="var(--art-light)" strokeWidth="5" />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i}>
                <path
                  d={`M309 ${74 + i * 26}Q235 ${57 + i * 26} 250 ${95 + i * 26}Q276 ${115 + i * 26} 309 ${93 + i * 26}`}
                  stroke="var(--art-light)"
                  strokeOpacity=".65"
                  strokeWidth="2"
                />
                <path
                  d={`M331 ${74 + i * 26}Q405 ${57 + i * 26} 390 ${95 + i * 26}Q364 ${115 + i * 26} 331 ${93 + i * 26}`}
                  stroke="var(--art-light)"
                  strokeOpacity=".65"
                  strokeWidth="2"
                />
              </g>
            ))}
          </g>
        ) : project === "07" ? (
          <g>
            <path
              d="M154 141Q320-16 486 141Q320 298 154 141Z"
              fill={`url(#${metal})`}
              stroke="var(--cyan)"
              strokeOpacity=".5"
            />
            <circle cx="320" cy="141" r="65" fill={`url(#${warm})`} />
            <circle cx="320" cy="141" r="24" fill="var(--ink-900)" />
            <circle cx="300" cy="120" r="8" fill="var(--text)" />
            <path
              d="M320 35v30m0 152v30M213 141h30m154 0h30"
              stroke="var(--amber)"
              strokeWidth="2"
            />
          </g>
        ) : project === "08" ? (
          <g>
            {Array.from({ length: 21 }, (_, i) => {
              const h = 25 + Math.abs(Math.sin(i * 0.7)) * 140;
              return (
                <rect
                  key={i}
                  x={130 + i * 18}
                  y={140 - h / 2}
                  width="9"
                  height={h}
                  rx="4"
                  fill={`url(#${i % 3 ? metal : warm})`}
                />
              );
            })}
            <path
              d="M120 140Q200 55 280 140T440 140T520 140"
              stroke="var(--art-light)"
              strokeOpacity=".7"
              strokeWidth="2"
            />
          </g>
        ) : project === "09" ? (
          <g>
            <path d="M320 240V107" stroke="var(--cyan)" strokeWidth="5" />
            <path
              d="M320 164Q196 180 200 59Q316 52 320 164"
              fill={`url(#${metal})`}
              stroke="var(--cyan)"
              strokeOpacity=".6"
            />
            <path
              d="M320 121Q335 20 443 44Q444 147 320 149"
              fill={`url(#${warm})`}
              stroke="var(--amber)"
              strokeOpacity=".7"
            />
            <path
              d="M239 102l81 62 81-83"
              stroke="var(--text)"
              strokeOpacity=".4"
              strokeWidth="2"
            />
            <ellipse
              cx="320"
              cy="240"
              rx="91"
              ry="12"
              fill="var(--cyan)"
              fillOpacity=".13"
            />
          </g>
        ) : (
          <g>
            <circle
              cx="320"
              cy="139"
              r="107"
              fill={`url(#${metal})`}
              stroke="var(--cyan)"
              strokeOpacity=".45"
            />
            {[35, 70].map((n) => (
              <ellipse
                key={n}
                cx="320"
                cy="139"
                rx={n}
                ry="107"
                stroke="var(--art-light)"
                strokeOpacity=".22"
              />
            ))}
            {[85, 139, 193].map((y) => (
              <path
                key={y}
                d={`M${y === 139 ? 213 : 228} ${y}Q320 ${y + 32} ${y === 139 ? 427 : 412} ${y}`}
                stroke="var(--art-light)"
                strokeOpacity=".25"
              />
            ))}
            <path
              d="M243 164Q312 19 404 110"
              stroke="var(--amber)"
              strokeWidth="2.5"
            />
            <circle cx="243" cy="164" r="5" fill="var(--amber)" />
            <circle cx="404" cy="110" r="5" fill="var(--amber)" />
          </g>
        )}
      </svg>
    </figure>
  );
}
