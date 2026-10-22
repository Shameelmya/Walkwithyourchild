/** Simple line-art pictures for the colouring book. Each region can be filled with a tap. viewBox 0 0 300 300. */
export type Region = ['rect' | 'circle' | 'ellipse' | 'polygon' | 'path', Record<string, number | string>];
export interface Picture { id: string; regions: Region[]; lines?: string[] }

const bg: Region = ['rect', { x: 4, y: 4, width: 292, height: 292 }];
const star = (cx: number, cy: number, r: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`); }
  return p.join(' ');
};

export const PICTURES: Picture[] = [
  { id: 'house', regions: [bg, ['rect', { x: 4, y: 230, width: 292, height: 66 }], ['circle', { cx: 250, cy: 52, r: 24 }],
    ['rect', { x: 188, y: 72, width: 22, height: 45 }], ['rect', { x: 70, y: 130, width: 160, height: 104 }], ['polygon', { points: '52,136 150,60 248,136' }],
    ['rect', { x: 130, y: 176, width: 40, height: 58, rx: 4 }], ['rect', { x: 86, y: 150, width: 32, height: 30 }], ['rect', { x: 182, y: 150, width: 32, height: 30 }]] },
  { id: 'flower', regions: [bg, ['polygon', { points: '108,232 192,232 178,286 122,286' }], ['rect', { x: 145, y: 140, width: 10, height: 92 }],
    ['path', { d: 'M150 200 C120 180 100 190 92 205 C110 212 132 210 150 200Z' }], ['path', { d: 'M150 185 C180 165 200 175 208 190 C190 197 168 195 150 185Z' }],
    ...[0, 1, 2, 3, 4, 5].map((i): Region => ['circle', { cx: +(150 + 34 * Math.cos((i * Math.PI) / 3)).toFixed(1), cy: +(105 + 34 * Math.sin((i * Math.PI) / 3)).toFixed(1), r: 24 }]),
    ['circle', { cx: 150, cy: 105, r: 20 }]] },
  { id: 'fish', regions: [bg, ['polygon', { points: '210,150 278,100 278,200' }], ['polygon', { points: '115,100 150,58 172,104' }], ['ellipse', { cx: 135, cy: 150, rx: 90, ry: 58 }],
    ['path', { d: 'M150 96 Q170 150 150 204 L168 200 Q186 150 168 100Z' }], ['circle', { cx: 92, cy: 136, r: 11 }], ['circle', { cx: 42, cy: 70, r: 11 }], ['circle', { cx: 62, cy: 40, r: 8 }], ['circle', { cx: 36, cy: 26, r: 6 }]] },
  { id: 'butterfly', regions: [bg, ['ellipse', { cx: 102, cy: 112, rx: 52, ry: 42 }], ['ellipse', { cx: 198, cy: 112, rx: 52, ry: 42 }], ['ellipse', { cx: 108, cy: 196, rx: 40, ry: 34 }], ['ellipse', { cx: 192, cy: 196, rx: 40, ry: 34 }],
    ['circle', { cx: 95, cy: 108, r: 14 }], ['circle', { cx: 205, cy: 108, r: 14 }], ['ellipse', { cx: 150, cy: 158, rx: 11, ry: 62 }], ['circle', { cx: 150, cy: 88, r: 14 }]],
    lines: ['M144 78 Q130 50 118 46', 'M156 78 Q170 50 182 46'] },
  { id: 'car', regions: [bg, ['rect', { x: 4, y: 240, width: 292, height: 56 }], ['polygon', { points: '82,152 114,100 196,100 228,152' }], ['rect', { x: 36, y: 150, width: 228, height: 62, rx: 14 }],
    ['polygon', { points: '98,150 120,112 148,112 148,150' }], ['polygon', { points: '160,150 160,112 190,112 212,150' }], ['circle', { cx: 92, cy: 214, r: 27 }], ['circle', { cx: 208, cy: 214, r: 27 }],
    ['circle', { cx: 92, cy: 214, r: 10 }], ['circle', { cx: 208, cy: 214, r: 10 }], ['rect', { x: 244, y: 166, width: 16, height: 12, rx: 3 }]] },
  { id: 'boat', regions: [bg, ['circle', { cx: 62, cy: 62, r: 26 }], ['path', { d: 'M4 220 Q41 205 78 220 T152 220 T226 220 T296 220 V292 Q296 296 292 296 H8 Q4 296 4 292Z' }],
    ['rect', { x: 146, y: 66, width: 8, height: 136 }], ['polygon', { points: '156,76 156,192 228,192' }], ['polygon', { points: '144,92 144,192 88,192' }], ['polygon', { points: '58,200 242,200 212,242 88,242' }]] },
  { id: 'tree', regions: [bg, ['ellipse', { cx: 150, cy: 276, rx: 138, ry: 22 }], ['rect', { x: 134, y: 168, width: 32, height: 104 }],
    ['circle', { cx: 100, cy: 140, r: 42 }], ['circle', { cx: 200, cy: 140, r: 42 }], ['circle', { cx: 150, cy: 106, r: 62 }],
    ['circle', { cx: 128, cy: 96, r: 10 }], ['circle', { cx: 176, cy: 122, r: 10 }], ['circle', { cx: 104, cy: 150, r: 10 }], ['circle', { cx: 206, cy: 150, r: 10 }]] },
  { id: 'elephant', regions: [bg, ['rect', { x: 112, y: 200, width: 28, height: 58, rx: 8 }], ['rect', { x: 192, y: 200, width: 28, height: 58, rx: 8 }], ['ellipse', { cx: 168, cy: 168, rx: 84, ry: 58 }],
    ['path', { d: 'M58 160 Q40 214 68 244 L82 236 Q62 208 78 170Z' }], ['circle', { cx: 92, cy: 140, r: 44 }], ['ellipse', { cx: 112, cy: 140, rx: 26, ry: 34 }], ['circle', { cx: 76, cy: 126, r: 6 }]],
    lines: ['M250 160 Q270 170 266 196'] },
  { id: 'night', regions: [bg, ['path', { d: 'M196 54 A64 64 0 1 0 196 182 A48 48 0 1 1 196 54Z' }], ['polygon', { points: star(70, 70, 26) }], ['polygon', { points: star(232, 220, 30) }], ['polygon', { points: star(90, 220, 18) }], ['polygon', { points: star(250, 70, 14) }]] },
  { id: 'kite', regions: [bg, ['polygon', { points: '150,36 150,124 222,124' }], ['polygon', { points: '150,36 150,124 78,124' }], ['polygon', { points: '78,124 150,124 150,214' }], ['polygon', { points: '222,124 150,124 150,214' }],
    ['polygon', { points: '140,238 160,226 160,250' }], ['polygon', { points: '120,268 140,256 140,280' }]],
    lines: ['M150 214 Q160 230 150 244 Q140 258 130 270 Q118 284 100 290'] },
];
