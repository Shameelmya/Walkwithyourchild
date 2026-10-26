import type { Lang } from '../../lib/store';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';
import { bn } from './bn';
import { ur } from './ur';

/** Translations of texts the code holds only in English (plus Malayalam/Kannada), keyed by the exact English text. */
const XT: Partial<Record<Lang, Record<string, string>>> = { hi, ta, te, bn, ur };
export const xt = (lang: Lang, en: string) => XT[lang]?.[en] ?? en;
