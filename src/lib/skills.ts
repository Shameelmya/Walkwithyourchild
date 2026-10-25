import type { Lang } from './store';

type N = { en: string } & Partial<Record<Lang, string>>;
const n = (en: string, ml: string, kn: string): N => ({ en, ml, kn });
export interface SkillStep { e: string; t: N }
export interface Skill { id: string; e: string; kind: 'adl' | 'iadl'; name: N; steps: SkillStep[] }
const s = (e: string, en: string, ml: string, kn: string): SkillStep => ({ e, t: n(en, ml, kn) });

/** Everyday tasks broken into small steps. A starting point only: the child's occupational therapist can change any step. */
export const SKILLS: Skill[] = [
  { id: 'hands', e: '🧼', kind: 'adl', name: n('Washing hands', 'കൈ കഴുകൽ', 'ಕೈ ತೊಳೆಯುವುದು'), steps: [
    s('🚰', 'Turn on the tap', 'ടാപ്പ് തുറക്കുക', 'ನಲ್ಲಿ ತೆರೆಯಿರಿ'), s('💧', 'Wet your hands', 'കൈ നനയ്ക്കുക', 'ಕೈ ಒದ್ದೆ ಮಾಡಿ'), s('🧼', 'Take soap', 'സോപ്പ് എടുക്കുക', 'ಸೋಪು ತೆಗೆದುಕೊಳ್ಳಿ'),
    s('👐', 'Rub hands together', 'കൈകൾ തമ്മിൽ ഉരസുക', 'ಕೈಗಳನ್ನು ಉಜ್ಜಿ'), s('🚿', 'Rinse the soap off', 'സോപ്പ് കഴുകിക്കളയുക', 'ಸೋಪು ತೊಳೆಯಿರಿ'), s('🧻', 'Dry your hands', 'കൈ തുടയ്ക്കുക', 'ಕೈ ಒರೆಸಿ')] },
  { id: 'teeth', e: '🪥', kind: 'adl', name: n('Brushing teeth', 'പല്ല് തേയ്ക്കൽ', 'ಹಲ್ಲು ಉಜ್ಜುವುದು'), steps: [
    s('🪥', 'Hold the toothbrush', 'ബ്രഷ് പിടിക്കുക', 'ಬ್ರಷ್ ಹಿಡಿಯಿರಿ'), s('🫧', 'Put a little paste on it', 'അല്പം പേസ്റ്റ് വയ്ക്കുക', 'ಸ್ವಲ್ಪ ಪೇಸ್ಟ್ ಹಾಕಿ'), s('😁', 'Brush the front teeth', 'മുൻപല്ലുകൾ തേയ്ക്കുക', 'ಮುಂದಿನ ಹಲ್ಲು ಉಜ್ಜಿ'),
    s('🦷', 'Brush the back teeth', 'പിൻപല്ലുകൾ തേയ്ക്കുക', 'ಹಿಂದಿನ ಹಲ್ಲು ಉಜ್ಜಿ'), s('💦', 'Spit out', 'തുപ്പുക', 'ಉಗುಳಿ'), s('🚰', 'Rinse the brush', 'ബ്രഷ് കഴുകുക', 'ಬ್ರಷ್ ತೊಳೆಯಿರಿ')] },
  { id: 'eat', e: '🍽️', kind: 'adl', name: n('Eating with a spoon', 'സ്പൂൺ കൊണ്ട് കഴിക്കൽ', 'ಚಮಚದಿಂದ ಊಟ'), steps: [
    s('🪑', 'Sit upright at the table', 'മേശയ്ക്കരികിൽ നിവർന്ന് ഇരിക്കുക', 'ಮೇಜಿನ ಬಳಿ ನೇರವಾಗಿ ಕುಳಿತುಕೊಳ್ಳಿ'), s('🥄', 'Hold the spoon', 'സ്പൂൺ പിടിക്കുക', 'ಚಮಚ ಹಿಡಿಯಿರಿ'), s('🍚', 'Scoop a little food', 'അല്പം ഭക്ഷണം കോരുക', 'ಸ್ವಲ್ಪ ಆಹಾರ ತೆಗೆಯಿರಿ'),
    s('😋', 'Bring it to your mouth', 'വായിലേക്ക് കൊണ്ടുവരിക', 'ಬಾಯಿಗೆ ತನ್ನಿ'), s('⏳', 'Chew and swallow slowly', 'പതുക്കെ ചവച്ചിറക്കുക', 'ನಿಧಾನವಾಗಿ ಅಗಿದು ನುಂಗಿ')] },
  { id: 'cup', e: '🥛', kind: 'adl', name: n('Drinking from a cup', 'കപ്പിൽ നിന്ന് കുടിക്കൽ', 'ಲೋಟದಿಂದ ಕುಡಿಯುವುದು'), steps: [
    s('🤲', 'Hold the cup with both hands', 'രണ്ടു കൈ കൊണ്ടും കപ്പ് പിടിക്കുക', 'ಎರಡೂ ಕೈಯಿಂದ ಲೋಟ ಹಿಡಿಯಿರಿ'), s('⬆️', 'Lift it to your mouth', 'വായിലേക്ക് ഉയർത്തുക', 'ಬಾಯಿಗೆ ಎತ್ತಿ'), s('🥛', 'Take a small sip', 'ഒരു ചെറിയ കവിൾ കുടിക്കുക', 'ಸ್ವಲ್ಪ ಗುಟುಕು ಕುಡಿಯಿರಿ'), s('⬇️', 'Put the cup down', 'കപ്പ് താഴെ വയ്ക്കുക', 'ಲೋಟ ಕೆಳಗಿಡಿ')] },
  { id: 'dress', e: '👕', kind: 'adl', name: n('Putting on a shirt', 'ഷർട്ട് ഇടൽ', 'ಅಂಗಿ ಹಾಕಿಕೊಳ್ಳುವುದು'), steps: [
    s('👕', 'Find the front of the shirt', 'ഷർട്ടിന്റെ മുൻഭാഗം കണ്ടെത്തുക', 'ಅಂಗಿಯ ಮುಂಭಾಗ ಹುಡುಕಿ'), s('💪', 'Put one arm in', 'ഒരു കൈ ഇടുക', 'ಒಂದು ಕೈ ಹಾಕಿ'), s('💪', 'Put the other arm in', 'മറ്റേ കൈയും ഇടുക', 'ಇನ್ನೊಂದು ಕೈ ಹಾಕಿ'),
    s('🙆', 'Pull it over the head', 'തലയിലൂടെ ഇടുക', 'ತಲೆಯ ಮೇಲಿಂದ ಎಳೆಯಿರಿ'), s('⬇️', 'Pull it down', 'താഴേക്ക് വലിക്കുക', 'ಕೆಳಗೆ ಎಳೆಯಿರಿ')] },
  { id: 'hair', e: '💇', kind: 'adl', name: n('Combing hair', 'മുടി ചീകൽ', 'ಕೂದಲು ಬಾಚುವುದು'), steps: [
    s('🪮', 'Hold the comb', 'ചീപ്പ് പിടിക്കുക', 'ಬಾಚಣಿಗೆ ಹಿಡಿಯಿರಿ'), s('🪞', 'Look in the mirror', 'കണ്ണാടിയിൽ നോക്കുക', 'ಕನ್ನಡಿ ನೋಡಿ'), s('↘️', 'Comb from top to bottom', 'മുകളിൽ നിന്ന് താഴേക്ക് ചീകുക', 'ಮೇಲಿನಿಂದ ಕೆಳಗೆ ಬಾಚಿ'), s('😊', 'Smile at yourself', 'കണ്ണാടിയിൽ നോക്കി ചിരിക്കുക', 'ಕನ್ನಡಿಯಲ್ಲಿ ನಗಿ')] },
  { id: 'toilet', e: '🚽', kind: 'adl', name: n('Using the toilet', 'ശൗചാലയം ഉപയോഗിക്കൽ', 'ಶೌಚಾಲಯ ಬಳಕೆ'), steps: [
    s('🙋', 'Tell or show: "I need the toilet"', '"ടോയ്‌ലറ്റിൽ പോകണം" എന്ന് പറയുക / കാണിക്കുക', '"ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಬೇಕು" ಎಂದು ಹೇಳಿ / ತೋರಿಸಿ'), s('🚶', 'Go to the toilet', 'ടോയ്‌ലറ്റിലേക്ക് പോകുക', 'ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಿ'), s('👖', 'Clothes down', 'വസ്ത്രം താഴ്ത്തുക', 'ಬಟ್ಟೆ ಕೆಳಗೆ'),
    s('🚽', 'Sit and go', 'ഇരുന്ന് കാര്യം സാധിക്കുക', 'ಕುಳಿತು ಮಾಡಿ'), s('🧻', 'Clean up', 'വൃത്തിയാക്കുക', 'ಸ್ವಚ್ಛಗೊಳಿಸಿ'), s('👖', 'Clothes up', 'വസ്ത്രം കയറ്റുക', 'ಬಟ್ಟೆ ಮೇಲೆ'), s('🧼', 'Wash hands', 'കൈ കഴുകുക', 'ಕೈ ತೊಳೆಯಿರಿ')] },
  { id: 'bath', e: '🛁', kind: 'adl', name: n('Bath time', 'കുളി', 'ಸ್ನಾನ'), steps: [
    s('🧺', 'Get the towel and clothes ready', 'തോർത്തും വസ്ത്രവും തയ്യാറാക്കുക', 'ಟವೆಲ್ ಮತ್ತು ಬಟ್ಟೆ ಸಿದ್ಧಪಡಿಸಿ'), s('🌡️', 'Check the water is warm, not hot', 'വെള്ളം ചൂട് കൂടുതലല്ലെന്ന് നോക്കുക', 'ನೀರು ತುಂಬಾ ಬಿಸಿ ಇಲ್ಲ ಎಂದು ನೋಡಿ'), s('🫧', 'Wash with soap', 'സോപ്പ് തേച്ച് കുളിക്കുക', 'ಸೋಪಿನಿಂದ ತೊಳೆಯಿರಿ'),
    s('🚿', 'Rinse', 'കഴുകിക്കളയുക', 'ತೊಳೆಯಿರಿ'), s('🧖', 'Dry with the towel', 'തോർത്ത് കൊണ്ട് തുടയ്ക്കുക', 'ಟವೆಲ್‌ನಿಂದ ಒರೆಸಿ'), s('👕', 'Get dressed', 'വസ്ത്രം ധരിക്കുക', 'ಬಟ್ಟೆ ಹಾಕಿ')] },
  { id: 'toys', e: '🧸', kind: 'iadl', name: n('Putting toys away', 'കളിപ്പാട്ടം എടുത്തുവയ്ക്കൽ', 'ಆಟಿಕೆ ಎತ್ತಿಡುವುದು'), steps: [
    s('👀', 'Look for the toys', 'കളിപ്പാട്ടങ്ങൾ നോക്കുക', 'ಆಟಿಕೆಗಳನ್ನು ಹುಡುಕಿ'), s('✋', 'Pick one up', 'ഒന്ന് എടുക്കുക', 'ಒಂದನ್ನು ಎತ್ತಿ'), s('📦', 'Put it in the box', 'പെട്ടിയിൽ ഇടുക', 'ಡಬ್ಬದಲ್ಲಿ ಹಾಕಿ'), s('🔁', 'Do it again until done', 'തീരുന്നതു വരെ ആവർത്തിക്കുക', 'ಮುಗಿಯುವವರೆಗೆ ಮಾಡಿ')] },
  { id: 'table', e: '🍽️', kind: 'iadl', name: n('Helping set the table', 'ഊണുമേശ ഒരുക്കാൻ സഹായിക്കൽ', 'ಊಟದ ಮೇಜು ಸಿದ್ಧಪಡಿಸಲು ಸಹಾಯ'), steps: [
    s('🍽️', 'Bring the plates', 'പാത്രങ്ങൾ കൊണ്ടുവരിക', 'ತಟ್ಟೆಗಳನ್ನು ತನ್ನಿ'), s('🥄', 'Put a spoon by each plate', 'ഓരോ പാത്രത്തിനരികിലും സ്പൂൺ വയ്ക്കുക', 'ಪ್ರತಿ ತಟ್ಟೆಯ ಬಳಿ ಚಮಚ ಇಡಿ'), s('🥛', 'Put a cup for each person', 'ഓരോരുത്തർക്കും ഗ്ലാസ് വയ്ക്കുക', 'ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಲೋಟ ಇಡಿ'), s('📣', 'Call everyone to eat', 'എല്ലാവരെയും കഴിക്കാൻ വിളിക്കുക', 'ಎಲ್ಲರನ್ನೂ ಊಟಕ್ಕೆ ಕರೆಯಿರಿ')] },
  { id: 'fold', e: '👚', kind: 'iadl', name: n('Folding clothes', 'വസ്ത്രം മടക്കൽ', 'ಬಟ್ಟೆ ಮಡಿಸುವುದು'), steps: [
    s('👚', 'Lay the cloth flat', 'തുണി നിവർത്തിയിടുക', 'ಬಟ್ಟೆಯನ್ನು ಹರಡಿ'), s('↔️', 'Fold one side in', 'ഒരു വശം മടക്കുക', 'ಒಂದು ಬದಿ ಮಡಿಸಿ'), s('↔️', 'Fold the other side in', 'മറ്റേ വശം മടക്കുക', 'ಇನ್ನೊಂದು ಬದಿ ಮಡಿಸಿ'), s('⬆️', 'Fold in half', 'പകുതിയായി മടക്കുക', 'ಅರ್ಧಕ್ಕೆ ಮಡಿಸಿ'), s('🗄️', 'Put it on the pile', 'അടുക്കിൽ വയ്ക്കുക', 'ರಾಶಿಯಲ್ಲಿ ಇಡಿ')] },
  { id: 'plant', e: '🪴', kind: 'iadl', name: n('Watering a plant', 'ചെടി നനയ്ക്കൽ', 'ಗಿಡಕ್ಕೆ ನೀರು ಹಾಕುವುದು'), steps: [
    s('🫗', 'Fill a small mug with water', 'ചെറിയ കപ്പിൽ വെള്ളം നിറയ്ക്കുക', 'ಚಿಕ್ಕ ಲೋಟದಲ್ಲಿ ನೀರು ತುಂಬಿ'), s('🚶', 'Walk or wheel to the plant', 'ചെടിയുടെ അടുത്തേക്ക് പോകുക', 'ಗಿಡದ ಬಳಿ ಹೋಗಿ'), s('💧', 'Pour slowly at the bottom', 'ചുവട്ടിൽ പതുക്കെ ഒഴിക്കുക', 'ಬುಡದಲ್ಲಿ ನಿಧಾನವಾಗಿ ಸುರಿಯಿರಿ'), s('🌱', 'Say hello to the plant', 'ചെടിയോട് ഹലോ പറയുക', 'ಗಿಡಕ್ಕೆ ಹಲೋ ಹೇಳಿ')] },
  { id: 'shop', e: '🛒', kind: 'iadl', name: n('Buying something at a shop', 'കടയിൽ നിന്ന് വാങ്ങൽ', 'ಅಂಗಡಿಯಲ್ಲಿ ಖರೀದಿ'), steps: [
    s('📝', 'Choose one thing to buy', 'വാങ്ങാൻ ഒരു സാധനം തിരഞ്ഞെടുക്കുക', 'ಖರೀದಿಸಲು ಒಂದು ವಸ್ತು ಆರಿಸಿ'), s('🙋', 'Show or ask the shopkeeper', 'കടക്കാരനോട് കാണിക്കുക / ചോദിക്കുക', 'ಅಂಗಡಿಯವರಿಗೆ ತೋರಿಸಿ / ಕೇಳಿ'), s('💰', 'Give the money', 'പണം കൊടുക്കുക', 'ಹಣ ಕೊಡಿ'), s('🪙', 'Take the change', 'ബാക്കി വാങ്ങുക', 'ಚಿಲ್ಲರೆ ತೆಗೆದುಕೊಳ್ಳಿ'), s('🙏', 'Say thank you', 'നന്ദി പറയുക', 'ಧನ್ಯವಾದ ಹೇಳಿ')] },
  { id: 'phone', e: '📱', kind: 'iadl', name: n('Calling a family member', 'കുടുംബാംഗത്തെ ഫോൺ വിളിക്കൽ', 'ಕುಟುಂಬದವರಿಗೆ ಕರೆ ಮಾಡುವುದು'), steps: [
    s('📱', 'Pick up the phone', 'ഫോൺ എടുക്കുക', 'ಫೋನ್ ತೆಗೆದುಕೊಳ್ಳಿ'), s('👆', 'Find the photo or name', 'ഫോട്ടോയോ പേരോ കണ്ടെത്തുക', 'ಫೋಟೋ ಅಥವಾ ಹೆಸರು ಹುಡುಕಿ'), s('📞', 'Press call', 'വിളിക്കാൻ അമർത്തുക', 'ಕರೆ ಒತ್ತಿ'), s('👋', 'Say hello', 'ഹലോ പറയുക', 'ಹಲೋ ಹೇಳಿ'), s('🔴', 'Say bye and end the call', 'ബൈ പറഞ്ഞ് കോൾ അവസാനിപ്പിക്കുക', 'ಬೈ ಹೇಳಿ ಕರೆ ಮುಗಿಸಿ')] },
];
