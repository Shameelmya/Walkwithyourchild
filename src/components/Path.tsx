import { meta } from '../lib/content';

/** Winding dotted path with 5 coloured stops, one per part. `filled` = 0..1 progress. */
export function PathMotif({ filled = 0, active, onStop, labels, className = '', height = 120 }: { filled?: number; active?: number; onStop?: (n: number) => void; labels?: string[]; className?: string; height?: number }) {
  const d = 'M20 90 C 70 90, 70 30, 130 30 S 190 95, 250 80 S 320 20, 380 35 S 450 95, 500 70';
  const stops = [[20, 90], [130, 30], [250, 80], [380, 35], [500, 70]] as const;
  return (
    <svg viewBox="0 0 520 120" className={className} style={{ height, width: '100%' }} role="img" aria-hidden={!labels}>
      <path d={d} fill="none" stroke="rgb(var(--border))" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 12" />
      <path d={d} fill="none" stroke="var(--pi)" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 12" pathLength={1000}
        style={{ strokeDasharray: `1 12`, clipPath: `inset(0 ${100 - Math.round(filled * 100)}% 0 0)`, transition: 'clip-path 0.8s ease' }} />
      {stops.map(([x, y], i) => {
        const n = i + 1; const on = active === n;
        return (
          <g key={n} onClick={onStop ? () => onStop(n) : undefined} style={{ cursor: onStop ? 'pointer' : undefined }}>
            <circle cx={x} cy={y} r={on ? 17 : 13} fill={`var(--p${n})`} stroke="rgb(var(--surface))" strokeWidth="4" />
            <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff" fontFamily="Nunito">{n}</text>
            {labels && <title>{labels[i]}</title>}
          </g>
        );
      })}
    </svg>
  );
}

export const partHex = (n: number) => meta.parts[n - 1]?.color ?? meta.introColor.color;
