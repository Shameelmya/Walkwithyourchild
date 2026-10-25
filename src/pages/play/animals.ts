import type { Lang } from '../../lib/store';

type N = { en: string } & Partial<Record<Lang, string>>;
const n = (en: string, ml: string, kn: string): N => ({ en, ml, kn });
export type Group = 'farm' | 'wild' | 'birds' | 'water';
export interface Animal { id: string; e: string; g: Group; name: N; says: N }
export const ANIMALS: Animal[] = [
  { id: 'cat', e: '🐱', g: 'farm', name: n('cat', 'പൂച്ച', 'ಬೆಕ್ಕು'), says: n('Meow!', 'മ്യാവൂ!', 'ಮಿಯಾಂವ್!') },
  { id: 'dog', e: '🐶', g: 'farm', name: n('dog', 'നായ', 'ನಾಯಿ'), says: n('Woof woof!', 'ബൗ ബൗ!', 'ಬೌ ಬೌ!') },
  { id: 'cow', e: '🐄', g: 'farm', name: n('cow', 'പശു', 'ಹಸು'), says: n('Moo!', 'അംബേ!', 'ಅಂಬಾ!') },
  { id: 'goat', e: '🐐', g: 'farm', name: n('goat', 'ആട്', 'ಮೇಕೆ'), says: n('Meh meh!', 'മേ മേ!', 'ಮೇ ಮೇ!') },
  { id: 'sheep', e: '🐑', g: 'farm', name: n('sheep', 'ചെമ്മരിയാട്', 'ಕುರಿ'), says: n('Baa baa!', 'ബാ ബാ!', 'ಬಾ ಬಾ!') },
  { id: 'horse', e: '🐴', g: 'farm', name: n('horse', 'കുതിര', 'ಕುದುರೆ'), says: n('Neigh!', 'ഹീ ഹീ ഹീ!', 'ಹೀ ಹೀ ಹೀ!') },
  { id: 'donkey', e: '🫏', g: 'farm', name: n('donkey', 'കഴുത', 'ಕತ್ತೆ'), says: n('Hee-haw!', 'ഹീ ഹോ!', 'ಹೀ ಹಾ!') },
  { id: 'pig', e: '🐷', g: 'farm', name: n('pig', 'പന്നി', 'ಹಂದಿ'), says: n('Oink oink!', 'ഓങ്ക് ഓങ്ക്!', 'ಓಂಕ್ ಓಂಕ್!') },
  { id: 'hen', e: '🐔', g: 'farm', name: n('hen', 'കോഴി', 'ಕೋಳಿ'), says: n('Cluck cluck!', 'കൊക്കൊക്കോ!', 'ಕೊಕ್ ಕೊಕ್!') },
  { id: 'rooster', e: '🐓', g: 'farm', name: n('rooster', 'പൂവൻകോഴി', 'ಹುಂಜ'), says: n('Cock-a-doodle-doo!', 'കൊക്കരക്കോ!', 'ಕೊಕ್ಕೊರೊಕ್ಕೋ!') },
  { id: 'duck', e: '🦆', g: 'farm', name: n('duck', 'താറാവ്', 'ಬಾತುಕೋಳಿ'), says: n('Quack quack!', 'ക്വാക്ക് ക്വാക്ക്!', 'ಕ್ವಾಕ್ ಕ್ವಾಕ್!') },
  { id: 'mouse', e: '🐭', g: 'farm', name: n('mouse', 'എലി', 'ಇಲಿ'), says: n('Squeak!', 'ചീ ചീ!', 'ಚೀ ಚೀ!') },
  { id: 'lion', e: '🦁', g: 'wild', name: n('lion', 'സിംഹം', 'ಸಿಂಹ'), says: n('Roar!', 'ഗർർർ!', 'ಘರ್ರ್!') },
  { id: 'tiger', e: '🐯', g: 'wild', name: n('tiger', 'കടുവ', 'ಹುಲಿ'), says: n('Grrr!', 'ഗർർ!', 'ಗರ್ರ್!') },
  { id: 'elephant', e: '🐘', g: 'wild', name: n('elephant', 'ആന', 'ಆನೆ'), says: n('Pawoo!', 'പാവൂ!', 'ಪಾವೂ!') },
  { id: 'monkey', e: '🐒', g: 'wild', name: n('monkey', 'കുരങ്ങൻ', 'ಕೋತಿ'), says: n('Ooh ooh aah aah!', 'ഊ ഊ ആ ആ!', 'ಊ ಊ ಆ ಆ!') },
  { id: 'bear', e: '🐻', g: 'wild', name: n('bear', 'കരടി', 'ಕರಡಿ'), says: n('Grrrr!', 'ഗർർർ!', 'ಗರ್ರ್ರ್!') },
  { id: 'wolf', e: '🐺', g: 'wild', name: n('wolf', 'ചെന്നായ', 'ತೋಳ'), says: n('Awooo!', 'ഊഊഊ!', 'ಊಊಊ!') },
  { id: 'snake', e: '🐍', g: 'wild', name: n('snake', 'പാമ്പ്', 'ಹಾವು'), says: n('Hiss!', 'ശ്ശ്ശ്!', 'ಸ್ಸ್ಸ್!') },
  { id: 'frog', e: '🐸', g: 'wild', name: n('frog', 'തവള', 'ಕಪ್ಪೆ'), says: n('Ribbit!', 'പേക്രോം!', 'ವಟರ್ ವಟರ್!') },
  { id: 'bee', e: '🐝', g: 'wild', name: n('bee', 'തേനീച്ച', 'ಜೇನುನೊಣ'), says: n('Buzz!', 'ങ്ങ്ങ്ങ്!', 'ಝೇಂ!') },
  { id: 'crow', e: '🐦‍⬛', g: 'birds', name: n('crow', 'കാക്ക', 'ಕಾಗೆ'), says: n('Caw caw!', 'കാ കാ!', 'ಕಾ ಕಾ!') },
  { id: 'bird', e: '🐦', g: 'birds', name: n('sparrow', 'കുരുവി', 'ಗುಬ್ಬಚ್ಚಿ'), says: n('Tweet tweet!', 'ചിൽ ചിൽ!', 'ಚಿಂವ್ ಚಿಂವ್!') },
  { id: 'parrot', e: '🦜', g: 'birds', name: n('parrot', 'തത്ത', 'ಗಿಳಿ'), says: n('Squawk!', 'കീ കീ!', 'ಕೀ ಕೀ!') },
  { id: 'owl', e: '🦉', g: 'birds', name: n('owl', 'മൂങ്ങ', 'ಗೂಬೆ'), says: n('Hoo hoo!', 'ഹൂ ഹൂ!', 'ಹೂ ಹೂ!') },
  { id: 'peacock', e: '🦚', g: 'birds', name: n('peacock', 'മയിൽ', 'ನವಿಲು'), says: n('May-awe!', 'ക്യാവോ!', 'ಕ್ಯಾವೋ!') },
  { id: 'eagle', e: '🦅', g: 'birds', name: n('eagle', 'പരുന്ത്', 'ಹದ್ದು'), says: n('Screech!', 'ക്രീ!', 'ಕ್ರೀ!') },
  { id: 'chick', e: '🐥', g: 'birds', name: n('chick', 'കോഴിക്കുഞ്ഞ്', 'ಕೋಳಿಮರಿ'), says: n('Peep peep!', 'ചീപ് ചീപ്!', 'ಚೀಪ್ ಚೀಪ್!') },
  { id: 'pigeon', e: '🕊️', g: 'birds', name: n('pigeon', 'പ്രാവ്', 'ಪಾರಿವಾಳ'), says: n('Coo coo!', 'കുറുകുറു!', 'ಗುಟರ್ ಗೂ!') },
  { id: 'fish', e: '🐟', g: 'water', name: n('fish', 'മീൻ', 'ಮೀನು'), says: n('Blub blub!', 'ബ്ലബ് ബ്ലബ്!', 'ಬ್ಲಬ್ ಬ್ಲಬ್!') },
  { id: 'dolphin', e: '🐬', g: 'water', name: n('dolphin', 'ഡോൾഫിൻ', 'ಡಾಲ್ಫಿನ್'), says: n('Eee eee!', 'ഈ ഈ!', 'ಈ ಈ!') },
  { id: 'whale', e: '🐳', g: 'water', name: n('whale', 'തിമിംഗലം', 'ತಿಮಿಂಗಿಲ'), says: n('Wooo!', 'ഊഊ!', 'ಊಊ!') },
];
export const GROUPS: { g: Group; e: string; name: N }[] = [
  { g: 'farm', e: '🏡', name: n('Home and farm', 'വീടും കൃഷിയിടവും', 'ಮನೆ ಮತ್ತು ಹೊಲ') },
  { g: 'wild', e: '🌳', name: n('Forest', 'കാട്', 'ಕಾಡು') },
  { g: 'birds', e: '🪶', name: n('Birds', 'പക്ഷികൾ', 'ಹಕ್ಕಿಗಳು') },
  { g: 'water', e: '🌊', name: n('Water', 'വെള്ളം', 'ನೀರು') },
];
