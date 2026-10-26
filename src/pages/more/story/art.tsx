import { useId } from 'react';

/** Illustrated themes for story books. Drawn as SVG so they work offline, print sharply and fill any box. */
export const THEMES = ['meadow', 'night', 'sea', 'garden', 'sky', 'forest', 'space', 'backwaters', 'monsoon', 'underwater', 'jungle', 'farm', 'city', 'snow', 'mountains', 'dino', 'circus', 'train', 'festival', 'birthday', 'castle', 'school'] as const;
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
  backwaters: { paper: '#FFFAF0', ink: '#1F3A30', accent: '#2E8B7A', deep: '#1F6B5C', onDeep: '#FFF1DC' },
  monsoon: { paper: '#F5F8FB', ink: '#24364A', accent: '#3C6E9E', deep: '#2C4E70', onDeep: '#FFFFFF' },
  underwater: { paper: '#F2FAFF', ink: '#12364F', accent: '#1B6FA0', deep: '#13507A', onDeep: '#E6F7FF' },
  jungle: { paper: '#F7FBEF', ink: '#1F3A1C', accent: '#2E7D32', deep: '#1E5E24', onDeep: '#FFF6C9' },
  farm: { paper: '#FFFBF0', ink: '#3A2A1C', accent: '#C8443A', deep: '#9E3328', onDeep: '#FFF6DD' },
  city: { paper: '#FBF8FF', ink: '#272C4A', accent: '#4F5A8C', deep: '#3D4675', onDeep: '#FFE08A' },
  snow: { paper: '#F7FBFF', ink: '#1E3150', accent: '#3A7BC8', deep: '#2A5C99', onDeep: '#FFFFFF' },
  mountains: { paper: '#FAFBF6', ink: '#24304A', accent: '#5E719C', deep: '#3F4F78', onDeep: '#FDF4E4' },
  dino: { paper: '#FFFBEF', ink: '#24391C', accent: '#43A047', deep: '#2E6B30', onDeep: '#FFE0A8' },
  circus: { paper: '#FFFAF3', ink: '#3A1C1C', accent: '#E5533D', deep: '#B23A2A', onDeep: '#FFF4E0' },
  train: { paper: '#FAFDF5', ink: '#2A2A2A', accent: '#E5533D', deep: '#2F6FD6', onDeep: '#FFFFFF' },
  festival: { paper: '#FFF8F0', ink: '#3A1F4A', accent: '#B5651D', deep: '#3A1F5C', onDeep: '#FFE9A8' },
  birthday: { paper: '#FFF8FB', ink: '#47233A', accent: '#E0569B', deep: '#B03A78', onDeep: '#FFF8E7' },
  castle: { paper: '#FCF8FF', ink: '#3A2350', accent: '#8A5CC2', deep: '#5E3A8C', onDeep: '#FFE9F4' },
  school: { paper: '#FFFBF2', ink: '#2E2A1C', accent: '#D9822B', deep: '#A65E1A', onDeep: '#FFF8E6' },
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
  backwaters: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD3A8" /><stop offset="1" stopColor="#FFF1DC" /></linearGradient>
      <linearGradient id={g('w')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FC8B8" /><stop offset="1" stopColor="#2E8B7A" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="300" cy="120" r="34" fill="#FFB067" />
    <path d="M0 176 Q100 160 200 172 T400 168 V190 H0Z" fill="#5E9E5A" />
    <rect y="186" width="400" height="114" fill={`url(#${g('w')})`} />
    {[206, 236, 266].map((y, i) => <path key={y} d={`M${i * 14} ${y} q24 -6 48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0`} stroke="#fff" strokeOpacity="0.4" strokeWidth="2" fill="none" />)}
    {[[40, 186, -8], [76, 184, 6], [348, 184, -4]].map(([x, y, r], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
        <path d="M0 0 Q6 -50 2 -96" stroke="#7A5134" strokeWidth="6" fill="none" strokeLinecap="round" />
        {[-70, -30, 10, 50, 90, 140].map((a) => <path key={a} d="M2 -96 q24 -6 40 18" stroke="#3E8E4A" strokeWidth="7" fill="none" strokeLinecap="round" transform={`rotate(${a} 2 -96)`} />)}
      </g>
    ))}
    <g transform="translate(200 214)">
      <path d="M-62 0 H62 Q56 18 40 20 H-40 Q-56 18 -62 0Z" fill="#7A4A2A" />
      <path d="M-46 0 V-18 Q0 -46 46 -18 V0Z" fill="#D9A55B" /><path d="M-46 -18 Q0 -46 46 -18" stroke="#8C5A2E" strokeWidth="3" fill="none" />
      <rect x="-30" y="-14" width="10" height="10" fill="#FFF1DC" /><rect x="-5" y="-16" width="10" height="12" fill="#FFF1DC" /><rect x="20" y="-14" width="10" height="10" fill="#FFF1DC" />
    </g>
  </>),
  monsoon: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8DA4BF" /><stop offset="1" stopColor="#DDE7EF" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <g fill="#6C7F96"><ellipse cx="90" cy="50" rx="70" ry="26" /><ellipse cx="140" cy="40" rx="50" ry="26" /><ellipse cx="290" cy="56" rx="80" ry="28" /><ellipse cx="340" cy="44" rx="50" ry="24" /></g>
    {Array.from({ length: 34 }, (_, i) => <path key={i} d={`M${(i * 37) % 400} ${80 + ((i * 53) % 150)} l-6 16`} stroke="#4E6A8C" strokeWidth="2" strokeLinecap="round" opacity="0.7" />)}
    <path d="M0 250 Q200 230 400 250 V300 H0Z" fill="#7DAA6B" />
    <ellipse cx="130" cy="268" rx="48" ry="8" fill="#9FC0DE" /><ellipse cx="300" cy="276" rx="36" ry="6" fill="#9FC0DE" />
    <g transform="translate(250 180)"><path d="M-50 0 A50 50 0 0 1 50 0 Q37 -8 25 0 Q12 -8 0 0 Q-12 -8 -25 0 Q-37 -8 -50 0Z" fill="#E5533D" /><path d="M0 -50 V0" stroke="#B23A2A" strokeWidth="2" /><path d="M0 0 V46 q0 10 -10 10" stroke="#5A3A2A" strokeWidth="4" fill="none" strokeLinecap="round" /></g>
    <g transform="translate(130 262)"><path d="M-20 0 H20 L12 8 H-12Z" fill="#fff" /><path d="M0 0 V-18 L12 0Z" fill="#fff" /></g>
  </>),
  underwater: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7FD3F0" /><stop offset="1" stopColor="#1B5E8C" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    {[60, 150, 260, 340].map((x, i) => <path key={x} d={`M${x} 0 L${x + 40} 0 L${x + 90 - i * 10} 300 L${x + 30} 300Z`} fill="#fff" opacity="0.07" />)}
    <path d="M0 272 Q100 256 200 270 T400 266 V300 H0Z" fill="#E8D3A2" />
    {[30, 70, 330, 370].map((x, i) => <path key={x} d={`M${x} 280 q-12 -30 0 -60 q12 -30 0 -60`} stroke={i % 2 ? '#3FA36B' : '#2E8B57'} strokeWidth="7" fill="none" strokeLinecap="round" />)}
    <g transform="translate(200 270)" fill="#FF7B8A"><path d="M0 0 V-40 M0 -24 L-16 -40 M0 -18 L16 -34" stroke="#FF7B8A" strokeWidth="7" strokeLinecap="round" /></g>
    {[[120, 120, '#FFB347', 1], [260, 90, '#FFE066', 0.8], [300, 180, '#FF8FA3', 1.1]].map(([x, y, c, s], i) => (
      <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><ellipse rx="16" ry="10" fill={c as string} /><path d="M14 0 L28 -10 V10Z" fill={c as string} /><circle cx="-8" cy="-2" r="2" fill="#1F3540" /></g>
    ))}
    <g transform="translate(110 220)"><ellipse cx="0" cy="-10" rx="20" ry="18" fill="#B48CF2" />{[-16, -8, 0, 8, 16].map((x) => <path key={x} d={`M${x} 2 q${x / 3} 14 ${x / 2 + 4} 22`} stroke="#B48CF2" strokeWidth="5" fill="none" strokeLinecap="round" />)}<circle cx="-7" cy="-12" r="3" fill="#2A1F4A" /><circle cx="7" cy="-12" r="3" fill="#2A1F4A" /></g>
    {[[180, 60, 5], [190, 40, 3], [320, 50, 4], [80, 70, 3]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.5" />)}
  </>),
  jungle: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CDEFC4" /><stop offset="1" stopColor="#F6FBE6" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="200" cy="70" r="30" fill="#FFE08A" />
    {[[0, 0, 40, '#2E7D32'], [400, 0, 140, '#388E3C'], [0, 300, -40, '#43A047'], [400, 300, 220, '#2E7D32'], [200, 300, 270, '#66BB6A']].map(([x, y, r, c], i) => (
      <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><path d="M0 0 Q60 -30 120 0 Q60 30 0 0Z" fill={c as string} /><path d="M0 0 H116" stroke="#1B5E20" strokeWidth="2" opacity="0.5" /></g>
    ))}
    {[60, 150, 250, 340].map((x) => <path key={x} d={`M${x} 0 q10 40 0 80 q-10 40 0 70`} stroke="#5D8C3A" strokeWidth="3" fill="none" />)}
    <g transform="translate(150 150)"><circle r="20" fill="#8D5B3A" /><circle cx="0" cy="4" r="12" fill="#E9C9A0" /><circle cx="-18" cy="-6" r="7" fill="#8D5B3A" /><circle cx="18" cy="-6" r="7" fill="#8D5B3A" /><circle cx="-5" cy="0" r="2.4" fill="#2D1B10" /><circle cx="5" cy="0" r="2.4" fill="#2D1B10" /><path d="M-5 8 q5 4 10 0" stroke="#2D1B10" strokeWidth="1.6" fill="none" /></g>
    <g transform="translate(280 130)"><ellipse rx="16" ry="12" fill="#1F2A44" /><path d="M10 -6 Q34 -4 30 6 Q20 4 10 2Z" fill="#FFB347" /><circle cx="6" cy="-4" r="2.4" fill="#fff" /><path d="M-10 8 L-22 22" stroke="#1F2A44" strokeWidth="5" /></g>
  </>),
  farm: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE6FA" /><stop offset="1" stopColor="#FFF6DD" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="70" cy="60" r="28" fill="#FFD45C" /><Cloud x={260} y={58} s={0.8} />
    <path d="M0 200 Q200 170 400 200 V300 H0Z" fill="#9CCF6E" />
    <g transform="translate(250 130)"><rect x="0" y="30" width="100" height="70" fill="#C8443A" /><path d="M-8 32 L50 -4 L108 32Z" fill="#8E2E26" /><rect x="34" y="56" width="32" height="44" fill="#fff" /><path d="M34 56 L66 100 M66 56 L34 100" stroke="#C8443A" strokeWidth="3" /><rect x="40" y="10" width="20" height="16" fill="#fff" /></g>
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={10 + i * 24} y={206} width="6" height="34" fill="#E9D3A8" />)}
    <rect x="6" y="214" width="214" height="5" fill="#E9D3A8" /><rect x="6" y="230" width="214" height="5" fill="#E9D3A8" />
    <g transform="translate(120 252)"><ellipse rx="34" ry="18" fill="#fff" /><circle cx="-10" cy="-4" r="7" fill="#2D2D2D" /><circle cx="14" cy="4" r="6" fill="#2D2D2D" /><ellipse cx="38" cy="-12" rx="14" ry="11" fill="#fff" /><ellipse cx="44" cy="-8" rx="7" ry="5" fill="#FFB3B3" /><path d="M-24 16 V30 M-8 16 V30 M14 16 V30 M28 16 V30" stroke="#fff" strokeWidth="6" /></g>
  </>),
  city: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFB39A" /><stop offset="1" stopColor="#FFE7C7" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="320" cy="90" r="30" fill="#FFF3C4" />
    {[[10, 120, 50, '#7A86B8'], [64, 90, 44, '#5E6A9E'], [112, 140, 60, '#8E99C9'], [176, 70, 50, '#5E6A9E'], [230, 120, 48, '#7A86B8'], [282, 100, 56, '#4F5A8C'], [342, 130, 52, '#8E99C9']].map(([x, y, w, c], i) => (
      <g key={i}><rect x={x} y={y} width={w} height={300 - (y as number)} fill={c as string} />
        {Array.from({ length: 12 }, (_, k) => <rect key={k} x={(x as number) + 8 + (k % 3) * ((w as number) / 3 - 2)} y={(y as number) + 12 + Math.floor(k / 3) * 22} width="8" height="10" fill={(k + i) % 3 ? '#FFE08A' : '#3D4675'} />)}</g>
    ))}
    <rect y="252" width="400" height="48" fill="#4A4A55" /><path d="M0 276 H400" stroke="#fff" strokeWidth="3" strokeDasharray="18 14" />
    <g transform="translate(120 238)"><rect x="0" y="0" width="110" height="34" rx="6" fill="#FFC93C" /><rect x="8" y="6" width="20" height="12" fill="#BFE6FA" /><rect x="34" y="6" width="20" height="12" fill="#BFE6FA" /><rect x="60" y="6" width="20" height="12" fill="#BFE6FA" /><rect x="86" y="6" width="18" height="16" fill="#BFE6FA" /><circle cx="24" cy="36" r="8" fill="#2D2D2D" /><circle cx="88" cy="36" r="8" fill="#2D2D2D" /></g>
  </>),
  snow: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#A9CBEA" /><stop offset="1" stopColor="#EAF4FF" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <path d="M0 200 Q120 160 240 196 T400 186 V300 H0Z" fill="#F7FBFF" />
    <path d="M0 246 Q140 222 270 244 T400 240 V300 H0Z" fill="#fff" />
    {[[50, 220, 1.2], [340, 214, 1.4], [380, 236, 0.9]].map(([x, y, s], i) => <g key={i}><Pine x={x} y={y} s={s} c="#2E7D5B" /><path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -62 L10 -44 H-10Z M-14 -24 L14 -24 L18 -16 H-18Z" fill="#fff" /></g>)}
    <g transform="translate(200 230)"><circle cy="10" r="30" fill="#fff" stroke="#DCE8F5" strokeWidth="2" /><circle cy="-34" r="20" fill="#fff" stroke="#DCE8F5" strokeWidth="2" /><circle cx="-6" cy="-38" r="2.6" fill="#2D2D2D" /><circle cx="6" cy="-38" r="2.6" fill="#2D2D2D" /><path d="M0 -33 L14 -30 L0 -28Z" fill="#FF8A3D" /><rect x="-20" y="-20" width="40" height="7" rx="3" fill="#E5533D" /><circle cy="2" r="2.6" fill="#2D2D2D" /><circle cy="14" r="2.6" fill="#2D2D2D" /><rect x="-16" y="-66" width="32" height="12" fill="#2D2D2D" /><rect x="-22" y="-56" width="44" height="5" fill="#2D2D2D" /></g>
    {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i * 43) % 400} cy={(i * 71) % 220} r={i % 3 ? 2 : 3} fill="#fff" />)}
  </>),
  mountains: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9FD0F5" /><stop offset="1" stopColor="#FDF4E4" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="80" cy="70" r="26" fill="#FFD45C" />
    <path d="M-20 230 L110 70 L240 230Z" fill="#7C8FB5" /><path d="M110 70 L140 108 L124 104 L110 116 L96 102 L84 106Z" fill="#fff" />
    <path d="M150 230 L290 50 L430 230Z" fill="#5E719C" /><path d="M290 50 L322 92 L304 88 L290 100 L274 86 L260 90Z" fill="#fff" />
    <path d="M0 230 Q200 210 400 230 V300 H0Z" fill="#6FB07A" />
    <path d="M110 262 Q200 248 300 262 Q200 280 110 262Z" fill="#7FC2E0" />
    <Pine x={40} y={246} s={0.8} /><Pine x={360} y={250} s={0.9} /><Pine x={330} y={256} s={0.7} c="#3E8E5E" />
  </>),
  dino: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE0A8" /><stop offset="1" stopColor="#FFF6E2" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <path d="M280 200 L330 110 L350 110 L400 200Z" fill="#9A6B4F" /><path d="M330 110 q10 -30 -4 -50 M340 110 q16 -24 8 -44" stroke="#B0B0B0" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.7" /><path d="M330 110 L340 124 L350 110Z" fill="#FF7043" />
    <path d="M0 210 Q200 180 400 210 V300 H0Z" fill="#8BC34A" />
    <g transform="translate(150 230)"><ellipse rx="64" ry="34" fill="#4CAF50" /><path d="M40 -16 Q90 -60 82 -110" stroke="#4CAF50" strokeWidth="22" fill="none" strokeLinecap="round" /><ellipse cx="88" cy="-114" rx="18" ry="12" fill="#4CAF50" /><circle cx="94" cy="-118" r="3" fill="#1B3A1B" /><path d="M-60 -6 Q-110 0 -126 26" stroke="#4CAF50" strokeWidth="16" fill="none" strokeLinecap="round" /><rect x="-44" y="20" width="16" height="30" rx="6" fill="#43A047" /><rect x="24" y="20" width="16" height="30" rx="6" fill="#43A047" />{[-30, -10, 10].map((x) => <circle key={x} cx={x} cy="-14" r="6" fill="#81C784" />)}</g>
    <g transform="translate(330 250)"><path d="M0 0 Q4 -40 0 -70" stroke="#7A5134" strokeWidth="6" fill="none" />{[-60, -20, 20, 60, 100, 150].map((a) => <path key={a} d="M0 -70 q20 -4 34 14" stroke="#2E7D32" strokeWidth="6" fill="none" strokeLinecap="round" transform={`rotate(${a} 0 -70)`} />)}</g>
  </>),
  circus: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9E3FF" /><stop offset="1" stopColor="#FFF4E0" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <Cloud x={70} y={60} s={0.8} /><Cloud x={330} y={70} s={0.7} />
    <path d="M0 250 H400 V300 H0Z" fill="#8BC34A" />
    <g transform="translate(200 250)">
      {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${-120 + i * 30} 0 L0 -150 L${-90 + i * 30} 0Z`} fill={i % 2 ? '#fff' : '#E5533D'} />)}
      <path d="M-120 0 Q-60 -20 0 0 Q60 -20 120 0" fill="none" />
      <path d="M-24 0 Q0 -60 24 0Z" fill="#7A2A20" />
      <path d="M0 -150 V-180" stroke="#7A5134" strokeWidth="3" /><path d="M0 -180 L24 -172 L0 -164Z" fill="#FFD45C" />
    </g>
    <path d="M0 30 Q100 70 200 40 T400 30" stroke="#7A5134" strokeWidth="1.5" fill="none" />
    {Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${i * 34 + 6} ${38 + Math.sin(i) * 8} l10 18 l10 -18Z`} fill={['#E5533D', '#FFD45C', '#4DABF7', '#69DB7C'][i % 4]} />)}
  </>),
  train: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BDE8FF" /><stop offset="1" stopColor="#F2FBE9" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <path d="M0 180 Q100 140 200 176 T400 160 V300 H0Z" fill="#A8D88E" />
    <path d="M0 240 H400" stroke="#8C6A4F" strokeWidth="4" />{Array.from({ length: 20 }, (_, i) => <rect key={i} x={i * 20} y="238" width="10" height="10" fill="#8C6A4F" />)}
    <g transform="translate(40 200)">
      {[['#4DABF7', 0], ['#FFD45C', 70], ['#69DB7C', 140]].map(([c, x]) => <g key={x as number} transform={`translate(${x} 0)`}><rect width="62" height="34" rx="5" fill={c as string} /><rect x="8" y="6" width="18" height="12" fill="#fff" /><rect x="34" y="6" width="18" height="12" fill="#fff" /><circle cx="14" cy="38" r="7" fill="#2D2D2D" /><circle cx="48" cy="38" r="7" fill="#2D2D2D" /></g>)}
      <g transform="translate(210 -14)"><rect width="80" height="48" rx="6" fill="#E5533D" /><rect x="10" y="-22" width="16" height="24" fill="#2D2D2D" /><rect x="44" y="6" width="26" height="18" fill="#fff" /><path d="M80 48 L96 48 L86 30Z" fill="#2D2D2D" /><circle cx="18" cy="52" r="9" fill="#2D2D2D" /><circle cx="60" cy="52" r="9" fill="#2D2D2D" /></g>
      {[[226, -50, 12], [210, -74, 16], [186, -100, 20]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.9 - i * 0.2} />)}
    </g>
  </>),
  festival: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A1F5C" /><stop offset="1" stopColor="#7A3E8C" /></linearGradient>
      <radialGradient id={g('f')}><stop offset="0" stopColor="#FFE9A8" /><stop offset="1" stopColor="#FFB347" stopOpacity="0" /></radialGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <path d="M0 20 Q100 70 200 30 T400 20" stroke="#E9C46A" strokeWidth="1.5" fill="none" />
    {[[60, 52, '#FF6B6B'], [140, 52, '#FFD45C'], [230, 40, '#69DB7C'], [320, 36, '#4DABF7']].map(([x, y, c], i) => (
      <g key={i} transform={`translate(${x} ${y})`}><path d="M0 0 V10" stroke="#E9C46A" strokeWidth="1.5" /><rect x="-12" y="10" width="24" height="30" rx="10" fill={c as string} /><rect x="-8" y="8" width="16" height="4" fill="#E9C46A" /><rect x="-8" y="38" width="16" height="4" fill="#E9C46A" /></g>
    ))}
    {[[90, 120], [200, 150], [310, 110], [40, 170], [360, 170]].map(([x, y], i) => <Sparkle key={i} x={x} y={y} s={0.8} />)}
    <path d="M0 250 H400 V300 H0Z" fill="#5A2E6E" />
    {[60, 130, 200, 270, 340].map((x) => (
      <g key={x} transform={`translate(${x} 250)`}><circle cy="-24" r="24" fill={`url(#${g('f')})`} /><path d="M-18 0 Q0 18 18 0Z" fill="#D9822B" /><path d="M-18 0 H18" stroke="#B5651D" strokeWidth="3" /><path d="M0 -2 Q-6 -12 0 -24 Q6 -12 0 -2Z" fill="#FFD45C" /></g>
    ))}
  </>),
  birthday: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE3F0" /><stop offset="1" stopColor="#FFF8E7" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <path d="M0 20 Q200 70 400 20" stroke="#C2477E" strokeWidth="1.5" fill="none" />
    {Array.from({ length: 11 }, (_, i) => { const x = 18 + i * 36; const y = 26 + Math.sin((i / 10) * Math.PI) * 22; return <path key={i} d={`M${x - 12} ${y} L${x + 12} ${y} L${x} ${y + 22}Z`} fill={['#FF6B6B', '#FFD45C', '#4DABF7', '#69DB7C', '#B48CF2'][i % 5]} />; })}
    {[[60, 120, '#FF6B6B'], [340, 110, '#4DABF7'], [370, 150, '#FFD45C']].map(([x, y, c], i) => <g key={i}><ellipse cx={x as number} cy={y as number} rx="20" ry="25" fill={c as string} /><path d={`M${x} ${(y as number) + 25} q6 20 -4 50`} stroke="#999" strokeWidth="1.2" fill="none" /></g>)}
    <path d="M0 270 H400 V300 H0Z" fill="#F7D7A8" />
    <g transform="translate(200 270)"><rect x="-70" y="-40" width="140" height="40" rx="6" fill="#FF9EC3" /><rect x="-56" y="-76" width="112" height="38" rx="6" fill="#FFF0F6" /><path d="M-70 -30 q17 12 35 0 t35 0 t35 0 t35 0" stroke="#fff" strokeWidth="5" fill="none" />
      {[-34, 0, 34].map((x) => <g key={x}><rect x={x - 3} y="-98" width="6" height="22" fill={x ? '#4DABF7' : '#69DB7C'} /><path d={`M${x} -100 q-5 -8 0 -16 q5 8 0 16Z`} fill="#FFB347" /></g>)}</g>
    {Array.from({ length: 24 }, (_, i) => <rect key={i} x={(i * 61) % 400} y={90 + ((i * 37) % 150)} width="5" height="9" fill={['#FF6B6B', '#FFD45C', '#4DABF7', '#69DB7C'][i % 4]} transform={`rotate(${i * 40} ${(i * 61) % 400} ${90 + ((i * 37) % 150)})`} />)}
  </>),
  castle: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E7D4FF" /><stop offset="1" stopColor="#FFF1F6" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <Cloud x={70} y={70} s={0.8} /><Cloud x={330} y={60} s={0.7} />
    <path d="M0 230 Q200 200 400 230 V300 H0Z" fill="#A5D68C" />
    <g transform="translate(200 230)" fill="#F4E9FF" stroke="#B9A3D9" strokeWidth="2">
      <rect x="-70" y="-90" width="140" height="90" />
      {[-90, 60].map((x) => <g key={x}><rect x={x} y="-130" width="30" height="130" /><path d={`M${x - 6} -130 L${x + 15} -170 L${x + 36} -130Z`} fill="#C2477E" stroke="none" /><path d={`M${x + 15} -170 V-186`} stroke="#7A5134" /><path d={`M${x + 15} -186 L${x + 30} -180 L${x + 15} -174Z`} fill="#FFD45C" stroke="none" /></g>)}
      <rect x="-20" y="-150" width="40" height="60" /><path d="M-26 -150 L0 -196 L26 -150Z" fill="#8A5CC2" stroke="none" />
      {[-70, -50, -30, -10, 10, 30, 50].map((x) => <rect key={x} x={x} y="-100" width="12" height="10" />)}
      <path d="M-18 0 V-30 Q0 -50 18 -30 V0Z" fill="#8C5A4A" stroke="none" />
      <rect x="-6" y="-136" width="12" height="18" rx="6" fill="#FFE08A" stroke="none" />
    </g>
    <path d="M182 300 Q200 260 218 230" stroke="#E8D3A2" strokeWidth="18" fill="none" />
  </>),
  school: ({ g }) => (<>
    <defs><linearGradient id={g('s')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE6FA" /><stop offset="1" stopColor="#FFF8E6" /></linearGradient></defs>
    <rect width="400" height="300" fill={`url(#${g('s')})`} />
    <circle cx="340" cy="56" r="24" fill="#FFD45C" /><Cloud x={80} y={52} s={0.7} />
    <path d="M0 230 H400 V300 H0Z" fill="#9CCF6E" />
    <g transform="translate(120 230)"><rect x="0" y="-100" width="170" height="100" fill="#F6C58C" /><path d="M-10 -100 L85 -150 L180 -100Z" fill="#C8443A" /><circle cx="85" cy="-118" r="14" fill="#fff" stroke="#7A5134" strokeWidth="2" /><path d="M85 -118 V-127 M85 -118 L92 -114" stroke="#7A5134" strokeWidth="2" />
      {[14, 54, 100, 140].map((x) => <rect key={x} x={x} y="-80" width="22" height="20" fill="#BFE6FA" stroke="#fff" strokeWidth="2" />)}
      <rect x="70" y="-46" width="30" height="46" fill="#8C5A4A" /><path d="M140 -150 V-180" stroke="#555" strokeWidth="2" /><path d="M140 -180 h22 v8 h-22Z" fill="#FF9933" /><path d="M140 -172 h22 v8 h-22Z" fill="#fff" /><path d="M140 -164 h22 v8 h-22Z" fill="#138808" /></g>
    <g transform="translate(20 236)"><rect width="86" height="36" rx="6" fill="#FFC93C" /><rect x="8" y="6" width="16" height="12" fill="#BFE6FA" /><rect x="30" y="6" width="16" height="12" fill="#BFE6FA" /><rect x="52" y="6" width="16" height="12" fill="#BFE6FA" /><circle cx="20" cy="38" r="7" fill="#2D2D2D" /><circle cx="68" cy="38" r="7" fill="#2D2D2D" /></g>
    <g transform="translate(350 230)"><rect x="-5" y="-50" width="10" height="50" fill="#7A5134" /><circle cy="-66" r="28" fill="#5FAF73" /></g>
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
