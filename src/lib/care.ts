import type { Lang } from './store';
import type { Block, Book } from './content';

type N = { en: string } & Partial<Record<Lang, string>>;
/** A place in the book: the section under the n-th heading of a chapter (same in every language). */
export interface Src { c: string; h: number }
export interface Condition {
  id: string; e: string; tile: string; name: N;
  /** What the book says, word for word. */
  src: Src[];
  /** Team members the book itself names for this. */
  roles: string[];
  emergency?: boolean;
  /** The book has no separate section for this word; we show what it says on the nearest topic. */
  nearest?: boolean;
  to?: string;
}
const n = (en: string, ml: string, kn: string): N => ({ en, ml, kn });
export const ROLES: Record<string, N> = {
  doctor: n('Doctor (neurologist or paediatrician)', 'ഡോക്ടർ (ന്യൂറോളജിസ്റ്റ് / ശിശുരോഗ വിദഗ്ധൻ)', 'ವೈದ್ಯರು (ನರರೋಗ / ಮಕ್ಕಳ ತಜ್ಞರು)'),
  nurse: n('Nurse', 'നഴ്സ്', 'ನರ್ಸ್'),
  physio: n('Physiotherapist', 'ഫിസിയോതെറാപ്പിസ്റ്റ്', 'ಫಿಸಿಯೋಥೆರಪಿಸ್ಟ್'),
  ot: n('Occupational therapist', 'ഒക്യുപേഷണൽ തെറാപ്പിസ്റ്റ്', 'ಆಕ್ಯುಪೇಷನಲ್ ಥೆರಪಿಸ್ಟ್'),
  speech: n('Speech and swallowing therapist', 'സംസാര-വിഴുങ്ങൽ തെറാപ്പിസ്റ്റ്', 'ಮಾತು ಮತ್ತು ನುಂಗುವ ಥೆರಪಿಸ್ಟ್'),
  diet: n('Dietitian', 'ഡയറ്റീഷ്യൻ', 'ಆಹಾರ ತಜ್ಞರು'),
  pharm: n('Pharmacist', 'ഫാർമസിസ്റ്റ്', 'ಫಾರ್ಮಸಿಸ್ಟ್'),
  palliative: n('Palliative or supportive care team', 'പാലിയേറ്റീവ് / സഹായ പരിചരണ സംഘം', 'ಉಪಶಾಮಕ / ಬೆಂಬಲ ಆರೈಕೆ ತಂಡ'),
  team: n('Your care team', 'നിങ്ങളുടെ ചികിത്സാസംഘം', 'ನಿಮ್ಮ ಆರೈಕೆ ತಂಡ'),
  social: n('Medical social worker', 'മെഡിക്കൽ സോഷ്യൽ വർക്കർ', 'ವೈದ್ಯಕೀಯ ಸಮಾಜ ಕಾರ್ಯಕರ್ತ'),
  psych: n('Psychologist or counsellor', 'സൈക്കോളജിസ്റ്റ് / കൗൺസിലർ', 'ಮನಶ್ಶಾಸ್ತ್ರಜ್ಞ / ಆಪ್ತಸಲಹೆಗಾರ'),
  local: n('Local doctor or PHC', 'നാട്ടിലെ ഡോക്ടർ / പ്രാഥമികാരോഗ്യ കേന്ദ്രം', 'ಸ್ಥಳೀಯ ವೈದ್ಯರು / ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ'),
  asha: n('ASHA worker', 'ആശാ പ്രവർത്തക', 'ಆಶಾ ಕಾರ್ಯಕರ್ತೆ'),
  family: n('Family member', 'കുടുംബാംഗം', 'ಕುಟುಂಬದ ಸದಸ್ಯರು'),
};
export const CONDITIONS: Condition[] = [
  { id: 'seizure', e: '⚡', tile: 't-rose', name: n('Seizure', 'ഫിറ്റ്സ് (അപസ്മാരം)', 'ಮೂರ್ಛೆ (ಫಿಟ್ಸ್)'), src: [{ c: 'c5', h: 0 }], roles: ['doctor'], emergency: true, to: '/seizure' },
  { id: 'breathing', e: '🫁', tile: 't-rose', name: n('Breathing difficulty', 'ശ്വാസതടസ്സം', 'ಉಸಿರಾಟದ ತೊಂದರೆ'), src: [{ c: 'c11', h: 3 }], roles: ['team'], emergency: true },
  { id: 'eating', e: '🥄', tile: 't-amber', name: n('Eating, drinking and choking', 'ഭക്ഷണം, വെള്ളം, ശ്വാസംമുട്ടൽ', 'ಊಟ, ನೀರು ಮತ್ತು ಉಸಿರುಗಟ್ಟುವಿಕೆ'), src: [{ c: 'c5', h: 1 }, { c: 'c11', h: 2 }], roles: ['speech', 'diet', 'nurse'] },
  { id: 'pain', e: '🤕', tile: 't-coral', name: n('Pain, crying and sleep', 'വേദന, കരച്ചിൽ, ഉറക്കം', 'ನೋವು, ಅಳು ಮತ್ತು ನಿದ್ದೆ'), src: [{ c: 'c5', h: 5 }, { c: 'c11', h: 4 }], roles: ['doctor', 'palliative'] },
  { id: 'stiffness', e: '🦵', tile: 't-violet', name: n('Stiffness, spasms and posture (dystonia)', 'പേശികൾ മുറുകൽ, ഇരിപ്പ് (ഡിസ്റ്റോണിയ)', 'ಸ್ನಾಯು ಬಿಗಿತ, ಭಂಗಿ (ಡಿಸ್ಟೋನಿಯಾ)'), src: [{ c: 'c5', h: 3 }], roles: ['physio', 'ot', 'doctor'], nearest: true },
  { id: 'balance', e: '🚶', tile: 't-blue', name: n('Walking and balance (ataxia)', 'നടത്തവും ബാലൻസും (അറ്റാക്സിയ)', 'ನಡಿಗೆ ಮತ್ತು ಸಮತೋಲನ (ಅಟಾಕ್ಸಿಯಾ)'), src: [{ c: 'c11', h: 0 }, { c: 'c5', h: 3 }], roles: ['physio', 'ot', 'doctor'], nearest: true },
  { id: 'regression', e: '🔄', tile: 't-mint', name: n('Losing skills (regression)', 'കഴിവുകൾ കുറയുന്നത് (റിഗ്രഷൻ)', 'ಕೌಶಲ ಕಡಿಮೆಯಾಗುವುದು (ರಿಗ್ರೆಷನ್)'), src: [{ c: 'c2', h: 6 }, { c: 'c11', h: 0 }, { c: 'c11', h: 5 }, { c: 'c11', h: 1 }], roles: ['team', 'speech'] },
  { id: 'skin', e: '🩹', tile: 't-green', name: n('Skin, toileting and comfort', 'തൊലി, മലമൂത്രവിസർജനം, സുഖം', 'ಚರ್ಮ, ಶೌಚ ಮತ್ತು ಆರಾಮ'), src: [{ c: 'c5', h: 4 }], roles: ['nurse'] },
  { id: 'medicine', e: '💊', tile: 't-mint', name: n('Medicines and reactions', 'മരുന്നുകളും പ്രതികരണങ്ങളും', 'ಔಷಧಿಗಳು ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆಗಳು'), src: [{ c: 'c5', h: 2 }], roles: ['doctor', 'pharm'] },
];
/** The care team in the book: who is in it, one person to call, what palliative care offers, and how the social worker helps. */
export const TEAM_SRC: Src[] = [{ c: 'c9', h: 0 }, { c: 'c9', h: 1 }, { c: 'c9', h: 6 }, { c: 'c9', h: 7 }];

/** The blocks under a heading, up to the next heading, with their index in the chapter. */
export function section(book: Book, s: Src): { b: Block; i: number; c: string }[] {
  const ch = book.chapters.find((c) => c.id === s.c); if (!ch) return [];
  const hs = ch.blocks.map((b, i) => (b.t === 'h' ? i : -1)).filter((i) => i >= 0);
  const from = hs[s.h]; if (from === undefined) return [];
  const to = hs[s.h + 1] ?? ch.blocks.length;
  return ch.blocks.slice(from, to).map((b, k) => ({ b, i: from + k, c: s.c }));
}

/** The roles a family can put in their team, in the order the book lists them. */
export const TEAM_ROLES = ['doctor', 'palliative', 'nurse', 'social', 'physio', 'ot', 'speech', 'diet', 'psych', 'local', 'asha', 'pharm', 'family'];
/** The book's checklist "Before you leave hospital: your care plan". */
export const PLAN_SRC: Src[] = [{ c: 'c9', h: 2 }, { c: 'c9', h: 3 }];
/** The book on exercises: gently, every day, and the right amount. */
export const EXERCISE_SRC: Src[] = [{ c: 'c5', h: 3 }];
/** The book on money, papers and help. */
export const HELP_SRC: Src[] = [{ c: 'c8', h: 0 }, { c: 'c8', h: 4 }, { c: 'c8', h: 5 }];
