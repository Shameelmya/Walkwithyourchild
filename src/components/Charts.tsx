/** Small hand-built SVG charts. Neutral colours only. */
export function BarChart({ data, color = 'var(--p1)', height = 120 }: { data: { label: string; v: number }[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  const w = 320, bw = w / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${height + 24}`} className="w-full" role="img" aria-label={data.map((d) => `${d.label}: ${d.v}`).join(', ')}>
      {data.map((d, i) => {
        const h = (d.v / max) * height;
        return (
          <g key={i}>
            <rect x={i * bw + bw * 0.18} y={height - h} width={bw * 0.64} height={Math.max(h, 1.5)} rx={4} fill={color} opacity={d.v ? 0.85 : 0.25} />
            {d.v > 0 && <text x={i * bw + bw / 2} y={height - h - 4} textAnchor="middle" fontSize="10" fill="rgb(var(--text))" fontWeight="700">{d.v}</text>}
            {i % 3 === 2 && <text x={i * bw + bw / 2} y={height + 16} textAnchor="middle" fontSize="9" fill="rgb(var(--muted))">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ points, min = 0, max = 4, color = 'var(--p1)', labels, height = 110 }: { points: { x: number; y: number }[]; min?: number; max?: number; color?: string; labels?: string[]; height?: number }) {
  const w = 320, pad = 14;
  if (!points.length) return null;
  const xs = points.map((p) => p.x); const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1);
  const X = (x: number) => pad + ((x - x0) / (x1 - x0)) * (w - 2 * pad);
  const Y = (y: number) => pad + (1 - (y - min) / Math.max(1e-6, max - min)) * (height - 2 * pad);
  let d = `M${X(points[0].x)},${Y(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i]; const mx = (X(a.x) + X(b.x)) / 2;
    d += ` C${mx},${Y(a.y)} ${mx},${Y(b.y)} ${X(b.x)},${Y(b.y)}`;
  }
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" role="img" aria-label={points.map((p) => p.y).join(', ')}>
      {[min, (min + max) / 2, max].map((g) => <line key={g} x1={pad} x2={w - pad} y1={Y(g)} y2={Y(g)} stroke="rgb(var(--border))" strokeDasharray="2 4" />)}
      {labels && [min, max].map((g, i) => <text key={g} x={pad} y={Y(g) + (i ? 10 : -3)} fontSize="9" fill="rgb(var(--muted))">{labels[i]}</text>)}
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="4" fill="rgb(var(--surface))" stroke={color} strokeWidth="2.5" />)}
    </svg>
  );
}
