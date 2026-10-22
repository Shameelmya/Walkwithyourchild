/** Small calm inline illustrations for empty states. */
export function Illus({ kind = 'leaf', size = 120 }: { kind?: 'leaf' | 'book' | 'heart' | 'pills' | 'calendar' | 'people' | 'box' | 'chart' | 'doc'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 120 120', 'aria-hidden': true } as const;
  const bg = <circle cx="60" cy="60" r="54" fill="rgb(var(--soft))" />;
  switch (kind) {
    case 'book': return <svg {...common}>{bg}<path d="M28 40c12-6 22-6 32 2 10-8 20-8 32-2v44c-12-6-22-6-32 2-10-8-20-8-32-2z" fill="rgb(var(--surface))" stroke="var(--p1)" strokeWidth="3" strokeLinejoin="round" /><path d="M60 42v44" stroke="var(--p1)" strokeWidth="3" /></svg>;
    case 'heart': return <svg {...common}>{bg}<path d="M60 88s-26-15-26-33a14 14 0 0 1 26-7 14 14 0 0 1 26 7c0 18-26 33-26 33z" fill="var(--p3)" opacity=".85" /></svg>;
    case 'pills': return <svg {...common}>{bg}<rect x="30" y="50" width="44" height="20" rx="10" fill="var(--p1)" transform="rotate(-30 52 60)" /><circle cx="80" cy="74" r="12" fill="var(--pi)" /></svg>;
    case 'calendar': return <svg {...common}>{bg}<rect x="32" y="36" width="56" height="50" rx="8" fill="rgb(var(--surface))" stroke="var(--p5)" strokeWidth="3" /><path d="M32 50h56" stroke="var(--p5)" strokeWidth="3" /><circle cx="60" cy="68" r="6" fill="var(--p3)" /></svg>;
    case 'people': return <svg {...common}>{bg}<circle cx="46" cy="50" r="10" fill="var(--p2)" /><circle cx="74" cy="50" r="10" fill="var(--p4)" /><path d="M30 84c2-12 9-18 16-18s14 6 16 18M58 84c2-12 9-18 16-18s14 6 16 18" fill="none" stroke="var(--p2)" strokeWidth="4" strokeLinecap="round" /></svg>;
    case 'box': return <svg {...common}>{bg}<rect x="32" y="50" width="56" height="34" rx="6" fill="var(--p4)" opacity=".85" /><path d="M28 50h64l-6-12H34z" fill="var(--p4)" /><path d="M60 62c-4-4-10 0-6 5l6 5 6-5c4-5-2-9-6-5z" fill="#fff" /></svg>;
    case 'chart': return <svg {...common}>{bg}<path d="M30 80 C45 60, 55 70, 65 55 S 85 45, 92 40" fill="none" stroke="var(--p5)" strokeWidth="4" strokeLinecap="round" /><circle cx="65" cy="55" r="5" fill="var(--p3)" /></svg>;
    case 'doc': return <svg {...common}>{bg}<path d="M40 30h28l14 14v46H40z" fill="rgb(var(--surface))" stroke="var(--pp)" strokeWidth="3" strokeLinejoin="round" /><path d="M48 58h26M48 68h26M48 78h16" stroke="var(--pp)" strokeWidth="3" strokeLinecap="round" /></svg>;
    default: return <svg {...common}>{bg}<path d="M40 82c0-26 18-42 44-44-2 26-18 44-44 44z" fill="var(--p2)" opacity=".85" /><path d="M40 82l30-30" stroke="rgb(var(--surface))" strokeWidth="3" strokeLinecap="round" /></svg>;
  }
}
