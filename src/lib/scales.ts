import type { TKey } from '../i18n';
export const SCALES = ['mobility', 'sitting', 'communication', 'feeding', 'breathing', 'sleep', 'pain', 'mood'] as const;
export type Scale = (typeof SCALES)[number];
export const scaleName = (s: Scale) => `sc_${s}` as TKey;
export const scaleLabel = (s: Scale, v: number) => `sc_${s}_${v}` as TKey;
export const scaleColor = (i: number) => `var(--p${(i % 5) + 1})`;
