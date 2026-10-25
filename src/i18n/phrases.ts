import type { Lang } from '../lib/store';

// What each talk-board card says aloud, for languages added after Malayalam and Kannada. Same order as PHRASES in lib/talk.ts.
// A language that is not listed here speaks the English sentence.
export const EXTRA_PHRASES: Partial<Record<Lang, string[]>> = {
  ta: [
    'எனக்கு உணவு வேண்டும்.', 'எனக்குத் தண்ணீர் வேண்டும்.', 'எனக்கு வலிக்கிறது.', 'எனக்குக் கழிவறைக்குப் போக வேண்டும்.', 'எனக்கு அம்மா வேண்டும்.', 'எனக்கு அப்பா வேண்டும்.',
    'தயவுசெய்து எனக்கு ஒரு பாட்டுப் பாடுங்கள்.', 'எனக்குத் தூங்க வேண்டும்.', 'ஆம்.', 'வேண்டாம், எனக்கு இது வேண்டாம்.', 'எனக்கு இன்னும் வேண்டும்.', 'போதும், நிறுத்துங்கள்.',
    'எனக்குச் சூடாக இருக்கிறது.', 'எனக்குக் குளிர்கிறது.', 'என்னை அணைத்துக்கொள்ளுங்கள்.', 'எனக்கு வெளியே போக வேண்டும்.',
  ],
};
