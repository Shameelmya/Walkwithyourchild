import { useId } from 'react';

/** Illustrated themes for story books. Drawn as SVG so they work offline, print sharply and fill any box. */
export const THEMES = ['meadow', 'night', 'sea', 'garden', 'sky', 'forest', 'space'] as const;
export type ThemeId = (typeof THEMES)[number];

/** paper: page colour · ink: text · accent: headings and ornaments · deep: strong cover colour · onDeep: text on it */
export const PALETTE: Record<ThemeId, { paper: string; ink: string; accent: string; deep: string; onDeep: string }> = {
  meadow: { paper: '#FFFBF0', ink: '#2D3A22', accent: '#4E8A3A', deep: '#3F7A34', onDeep: '#FFFBF0' },
  night: { paper: '#F7F5FF', ink: '#24264A', accent: '#4B4FA8', deep: '#1E2552', onDeep: '#FFE9A8' },
  sea: { paper: '#FFF8F0', ink: '#1F3540', accent: '#1F7F9A', deep: '#17627A', onDeep: '#FFF3E2' },
  garden: { paper: '#FFF7F8', ink: '#47233A', accent: '#C2477E', deep: '#A63A6B', onDeep: '#FFF2F6' },
  sky: { paper: '#F6FBFF', ink: '#1E3150', accent: '#2F6FD6', deep: '#2459B5', onDeep: '#FFFFFF' },
  forest: { paper: '#F8FBF2', ink: '#1F3A2C', accent: '#2E7D5B', deep: '#235F45', onDeep: '#F4FBEF' },
  space: { paper: '#FAF7FF', ink: '#2A1F4A', accent: '#7A4FD0', deep: '#2B1A5C', onDeep: '#FFE08A' },
};

type P = { theme: ThemeId; className?: string; flip?: boolean };

/** The picture for a theme. It always fills its box (cropping a little if needed). */
export function Scene({ theme, className, flip }: P) {
  const id = useId().replace(/:/g, '');
  const g = (n: string) => `${id}${n}`;
  const S = SCENES[theme];
  return (
    <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className={className} style={{ display: 'block', width: '100%', height: '100%', transform: flip ? 'scaleX(-1)' : undefined }} aria-hidden>
      <S g={g} />
    </svg>
  );
}

type G = { g: (n: string) => string };
const Cloud = ({ x, y, s = 1, o = 0.95 }: { x: number; y: number; s?: number; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity={o}>
    <ellipse cx="0" cy="8" rx="34" ry="12" /><circle cx="-12" cy="0" r="14" /><circle cx="8" cy="-6" r="18" /><circle cx="24" cy="4" r="11" />
  </g>
);
const Flower = ({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0 V22" stroke="#4E8A3A" strokeWidth="2.2" />
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-6" rx="4.2" ry="6.5" fill={c} transform={`rotate(${a})`} />)}
    <circle r="3.4" fill="#FFD45C" />
  </g>
);
const Star = ({ x, y, r = 1.6, o = 1 }: { x: number; y: number; r?: number; o?: number }) => <circle cx={x} cy={y} r={r} fill="#FFF7D6" opacity={o} />;
const Sparkle = ({ x, y, s = 1, c = '#FFE9A8' }: { x: number; y: number; s?: number; c?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -7 L1.6 -1.6 L7 0 L1.6 1.6 L0 7 L-1.6 1.6 L-7 0 L-1.6 -1.6Z" fill={c} />
);
const Pine = ({ x, y, s = 1, c = '#2E7D5B' }: { x: number; y: number; s?: number; c?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-3" y="0" width="6" height="14" fill="#7A5134" />
    <path d="M0 -62 L22 -22 H12 L28 4 H-28 L-12 -22 H-22Z" fill={c} />
  </g>
);
const Butterfly = ({ x, y, c, s = 1 }: { x: number; y: number; c: string; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(-12)`}>
    <ellipse cx="-7" cy="-4" rx="8" ry="6" fill={c} /><ellipse cx="7" cy="-4" rx="8" ry="6" fill={c} />
    <ellipse cx="-5" cy="5" rx="5" ry="4" fill={c} opacity="0.8" /><ellipse cx="5" cy="5" rx="5" ry="4" fill={c} opacity="0.8" />
    <rect x="-1" y="-8" width="2" height="16" rx="1" fill="#47233A" />
  </g>
);

const SCENES: Record<ThemeId, (p: G) => JSX.Element> = {
  meadow: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9E2F7" /><stop offset="1" stopColor="#FFF4DA" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="318" cy="72" r="54" fill="#FFE27A" opacity="0.35" /><circle cx="318" cy="72" r="32" fill="#FFD45C" />
    <Cloud x={92} y={72} /><Cloud x={210} y={46} s={0.75} o={0.85} />
    <path d="M0 205 Q90 150 190 196 T400 186 V300 H0Z" fill="#A9DA98" />
    <path d="M0 238 Q120 186 240 232 T400 226 V300 H0Z" fill="#7CC26B" />
    <path d="M0 272 Q140 246 260 270 T400 266 V300 H0Z" fill="#62AE55" />
    <Flower x={58} y={250} c="#FF8FA3" /><Flower x={96} y={262} c="#FFFFFF" s={0.8} /><Flower x={300} y={248} c="#B48CF2" />
    <Flower x={340} y={262} c="#FF8FA3" s={0.85} /><Flower x={190} y={266} c="#FFB347" s={0.9} />
  </>),
  night: ({ g }) => (<>
    <defs>
      <linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141B45" /><stop offset="1" stopColor="#3D4D8F" /></linearGradient>
      <radialGradient id={g('m')}><stop offset="0" stopColor="#FFF3C4" stopOpacity="0.55" /><stop offset="1" stopColor="#FFF3C4" stopOpacity="0" /></radialGradient>
    </defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    {[[30, 40], [80, 90], [130, 30], [170, 75], [220, 25], [250, 110], [40, 140], [360, 150], [110, 150], [200, 140], [380, 40], [290, 150]].map(([x, y], i) => <Star key={i} x={x} y={y} r={i % 3 ? 1.4 : 2.2} o={i % 2 ? 0.7 : 1} />)}
    <Sparkle x={60} y={70} s={0.9} /><Sparkle x={240} y={60} s={0.7} /><Sparkle x={150} y={110} s={0.6} />
    <circle cx="315" cy="78" r="70" fill={`url(#${g('m')})`} /><circle cx="315" cy="78" r="30" fill="#FFF0B8" />
    <circle cx="305" cy="70" r="5" fill="#F2DE95" /><circle cx="324" cy="88" r="3.5" fill="#F2DE95" />
    <path d="M0 220 Q110 172 220 214 T400 200 V300 H0Z" fill="#2B3A73" />
    <path d="M0 252 Q140 212 270 248 T400 244 V300 H0Z" fill="#212E5E" />
    <g transform="translate(96 214)"><rect x="0" y="0" width="44" height="34" fill="#E9D8B4" /><path d="M-6 2 L22 -22 L50 2Z" fill="#B8574A" /><rect x="15" y="12" width="13" height="12" fill="#FFD45C" /><rect x="34" y="-16" width="7" height="14" fill="#B8574A" /></g>
  </>),
  sea: ({ g }) => (<>
    <defs>
      <linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFC9A8" /><stop offset="1" stopColor="#FFEFD6" /></linearGradient>
      <linearGradient id={g('w')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#58C0CC" /><stop offset="1" stopColor="#1C7590" /></linearGradient>
    </defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="210" cy="176" r="44" fill="#FF9F6B" />
    <Cloud x={84} y={62} s={0.8} o={0.8} /><Cloud x={320} y={84} s={0.65} o={0.75} />
    <path d="M60 46 q6 -6 12 0 q6 -6 12 0" stroke="#8C5A4A" strokeWidth="2" fill="none" /><path d="M110 64 q5 -5 10 0 q5 -5 10 0" stroke="#8C5A4A" strokeWidth="2" fill="none" />
    <rect y="172" width="400" height="128" fill={`url(#${g('w')})`} />
    {[196, 222, 250, 276].map((y, i) => <path key={y} d={`M${-20 + i * 9} ${y} q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0`} stroke="#fff" strokeOpacity="0.45" strokeWidth="2.2" fill="none" />)}
    <g transform="translate(286 168)"><path d="M-30 0 H30 L20 14 H-20Z" fill="#C0533A" /><path d="M0 -2 V-56 L30 -6Z" fill="#fff" /><path d="M-3 -2 V-44 L-26 -6Z" fill="#FFE1C6" /></g>
    <g transform="translate(90 252)"><ellipse rx="14" ry="8" fill="#FFB347" /><path d="M12 0 L24 -8 V8Z" fill="#FFB347" /><circle cx="-7" cy="-2" r="1.8" fill="#1F3540" /></g>
    <g transform="translate(150 280) scale(-0.8 0.8)"><ellipse rx="14" ry="8" fill="#FF8FA3" /><path d="M12 0 L24 -8 V8Z" fill="#FF8FA3" /><circle cx="-7" cy="-2" r="1.8" fill="#1F3540" /></g>
  </>),
  garden: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE3EC" /><stop offset="1" stopColor="#FFF7EE" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="70" cy="64" r="26" fill="#FFD45C" opacity="0.9" />
    <path d="M0 250 Q100 226 200 248 T400 240 V300 H0Z" fill="#9BD38A" />
    {[[70, 250, 1.6, '#FF7BA5'], [150, 236, 2.1, '#FFC94D'], [240, 246, 1.8, '#B48CF2'], [325, 232, 2.3, '#FF7BA5'], [380, 256, 1.3, '#FFFFFF'], [20, 262, 1.2, '#B48CF2']].map(([x, y, s, c], i) => (
      <g key={i}><path d={`M${x} ${y} Q${(x as number) + 8} ${(y as number) + 30} ${x} 300`} stroke="#4E8A3A" strokeWidth="3" fill="none" />
        <ellipse cx={(x as number) + 10} cy={(y as number) + 26} rx="9" ry="4" fill="#6CB25A" transform={`rotate(-30 ${(x as number) + 10} ${(y as number) + 26})`} />
        <Flower x={x as number} y={y as number} c={c as string} s={s as number} /></g>
    ))}
    <Butterfly x={120} y={120} c="#FF9F6B" /><Butterfly x={280} y={96} c="#8FC7FF" s={0.8} /><Butterfly x={210} y={160} c="#C2477E" s={0.6} />
    <path d="M120 120 q30 30 70 10 q30 -14 60 20" stroke="#C2477E" strokeOpacity="0.35" strokeWidth="1.6" strokeDasharray="3 5" fill="none" />
  </>),
  sky: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9ED4FF" /><stop offset="1" stopColor="#EAF7FF" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    {['#FF6B6B', '#FFA94D', '#FFD45C', '#69DB7C', '#4DABF7', '#9775FA'].map((c, i) => <path key={c} d={`M${40 + i * 13} 260 A${160 - i * 13} ${160 - i * 13} 0 0 1 ${360 - i * 13} 260`} stroke={c} strokeWidth="13" fill="none" />)}
    <Cloud x={52} y={252} s={1.3} /><Cloud x={350} y={252} s={1.3} />
    <g transform="translate(300 80)"><path d="M0 -30 C24 -30 30 -6 18 14 L6 30 H-6 L-18 14 C-30 -6 -24 -30 0 -30Z" fill="#FF6B6B" /><path d="M0 -30 C10 -30 12 -6 6 14 L2 30 H-2 L-6 14 C-12 -6 -10 -30 0 -30Z" fill="#FFD45C" />
      <path d="M-5 30 L-5 40 M5 30 L5 40" stroke="#8C5A4A" strokeWidth="1.4" /><rect x="-7" y="40" width="14" height="10" rx="2" fill="#B07A4A" /></g>
    <g transform="translate(110 92) scale(0.6)"><path d="M0 -30 C24 -30 30 -6 18 14 L6 30 H-6 L-18 14 C-30 -6 -24 -30 0 -30Z" fill="#4DABF7" /><path d="M0 -30 C10 -30 12 -6 6 14 L2 30 H-2 L-6 14 C-12 -6 -10 -30 0 -30Z" fill="#fff" />
      <path d="M-5 30 L-5 40 M5 30 L5 40" stroke="#8C5A4A" strokeWidth="2" /><rect x="-7" y="40" width="14" height="10" rx="2" fill="#B07A4A" /></g>
    <Cloud x={210} y={50} s={0.7} o={0.9} />
  </>),
  forest: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D5F0DD" /><stop offset="1" stopColor="#F7FBEA" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="200" cy="80" r="34" fill="#FFE08A" />
    <path d="M0 200 Q100 170 200 196 T400 186 V300 H0Z" fill="#B7DDB0" />
    <Pine x={40} y={206} s={1.1} c="#5FAF73" /><Pine x={330} y={196} s={1.2} c="#5FAF73" /><Pine x={130} y={200} s={0.9} c="#7CC48A" />
    <path d="M0 246 Q120 222 230 244 T400 238 V300 H0Z" fill="#8CC084" />
    <Pine x={80} y={262} s={1.5} /><Pine x={250} y={258} s={1.3} c="#3E8E5E" /><Pine x={372} y={266} s={1.6} />
    <g transform="translate(176 270)"><rect x="-4" y="-4" width="8" height="14" rx="3" fill="#FFF5E6" /><path d="M-16 -2 Q0 -26 16 -2Z" fill="#E5533D" /><circle cx="-6" cy="-9" r="2.4" fill="#fff" /><circle cx="5" cy="-12" r="2" fill="#fff" /></g>
    <Butterfly x={300} y={110} c="#FFB347" s={0.7} />
  </>),
  space: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1B0F42" /><stop offset="1" stopColor="#4B2A86" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    {[[20, 30], [70, 110], [120, 40], [160, 200], [210, 60], [260, 250], [330, 30], [370, 120], [40, 230], [300, 170], [100, 270], [380, 270]].map(([x, y], i) => <Star key={i} x={x} y={y} r={i % 3 ? 1.3 : 2} o={i % 2 ? 0.7 : 1} />)}
    <Sparkle x={90} y={80} /><Sparkle x={350} y={210} s={0.8} /><Sparkle x={230} y={130} s={0.6} />
    <g transform="translate(300 90)"><circle r="38" fill="#FF9F6B" /><path d="M-30 -10 Q0 4 32 -8" stroke="#E07A4A" strokeWidth="5" fill="none" opacity="0.6" /><ellipse rx="62" ry="13" fill="none" stroke="#FFD45C" strokeWidth="5" transform="rotate(-18)" /></g>
    <circle cx="70" cy="200" r="22" fill="#6BD4FF" /><circle cx="62" cy="194" r="5" fill="#A8E6FF" />
    <g transform="translate(190 190) rotate(30)">
      <path d="M0 -50 C14 -36 16 -10 14 20 H-14 C-16 -10 -14 -36 0 -50Z" fill="#F4F1FF" />
      <circle cy="-16" r="8" fill="#6BD4FF" stroke="#7A4FD0" strokeWidth="3" />
      <path d="M-14 6 L-26 26 L-14 22Z M14 6 L26 26 L14 22Z" fill="#E5533D" />
      <path d="M-9 20 Q0 48 9 20Z" fill="#FFB347" /><path d="M-5 20 Q0 36 5 20Z" fill="#FFE08A" />
    </g>
  </>),
};

/** A small leafy flourish for page corners. */
export function Sprig({ color, className, style }: { color: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 60 30" className={className} style={style} aria-hidden>
      <path d="M2 26 Q30 26 56 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      {[[14, 24, -20], [26, 20, -30], [38, 14, -40], [48, 9, -50]].map(([x, y, r], i) => (
        <g key={i}><ellipse cx={x} cy={y - 5} rx="5" ry="2.6" fill={color} opacity="0.85" transform={`rotate(${r} ${x} ${y - 5})`} />
          <ellipse cx={x + 3} cy={y + 3} rx="4.5" ry="2.3" fill={color} opacity="0.55" transform={`rotate(${(r as number) + 50} ${x + 3} ${y + 3})`} /></g>
      ))}
    </svg>
  );
}
