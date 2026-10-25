import type { Lang } from './store';

const en = {
  carePlan: 'Our care plan', carePlanSub: 'Team, goals and meetings in one place',
  team: 'Our team', addMember: 'Add a team member', role: 'Role', name: 'Name', phone: 'Phone', place: 'Hospital or place', mainContactTag: 'Main contact', makeMain: 'Make main contact',
  goals: 'Goals', addGoal: 'Add a goal', area: 'Who leads this', goal: 'Goal', atHome: 'What we do at home', reviewBy: 'Review by', status: 'Status',
  todo: 'Not started', doing: 'Working on it', done: 'Achieved',
  meetings: 'Team meetings and reviews', addMeeting: 'Add a meeting', date: 'Date', who: 'Who was there', decided: 'What we decided', nextReview: 'Next review',
  sharePlan: 'Share the plan', planHint: 'Write what your team agrees, so everyone, at the hospital, near home and in the family, works to the same plan.',
  fromBookPlan: 'From the book: before you leave hospital', save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', empty: 'Nothing added yet.',
  therapy: 'Therapy play', therapySub: 'Home exercises as a game',
  therapyIntro: 'Add the exercises your therapist showed you. Your child does them as a game: each one fills a balloon, launches a rocket or grows a flower.',
  addExercise: 'Add an exercise', exName: 'Exercise name (as your therapist calls it)', exArea: 'Therapy', exKind: 'Type', count: 'Count (times)', hold: 'Hold (seconds)', target: 'How many', theme: 'Game',
  exNote: 'How to do it (what the therapist said)', play: 'Play', again: 'Again', today: 'Today', streak: '{n} days in a row', week: 'This week', noEx: 'No exercises yet. Ask your therapist which exercises to do at home, and add them here.',
  tap: 'Tap for each one', start: 'Start', pause: 'Pause', well: 'Well done!', rightAmount: 'From the book: the right amount', physio: 'Physiotherapy', ot: 'Occupational therapy', speech: 'Speech and swallowing', other: 'Other',
  help: 'Schemes and help', helpSub: 'Welfare schemes and organisations',
  helpIntro: 'Schemes, amounts and rules change and differ from state to state. Always check the details with the hospital social worker.',
  schemes: 'Government schemes', finders: 'Find every scheme you qualify for', palliative: 'Palliative care centres near you', orgs: 'Organisations and support groups', myContacts: 'Our own contacts', addContact: 'Add a contact', open: 'Open website', find: 'Find online', call: 'Call',
  india: 'All India', kerala: 'Kerala', karnataka: 'Karnataka', reviewed: 'List checked {d}. Tell us if something has changed.', fromBookHelp: 'From the book: money, papers and help', whatFor: 'What it helps with',
};
type K = keyof typeof en;
const ml: Record<K, string> = {
  carePlan: 'ഞങ്ങളുടെ പരിചരണ പദ്ധതി', carePlanSub: 'സംഘം, ലക്ഷ്യങ്ങൾ, യോഗങ്ങൾ ഒരിടത്ത്',
  team: 'ഞങ്ങളുടെ സംഘം', addMember: 'സംഘാംഗത്തെ ചേർക്കുക', role: 'ചുമതല', name: 'പേര്', phone: 'ഫോൺ', place: 'ആശുപത്രി / സ്ഥലം', mainContactTag: 'പ്രധാന ബന്ധം', makeMain: 'പ്രധാന ബന്ധമാക്കുക',
  goals: 'ലക്ഷ്യങ്ങൾ', addGoal: 'ലക്ഷ്യം ചേർക്കുക', area: 'ആരാണ് നയിക്കുന്നത്', goal: 'ലക്ഷ്യം', atHome: 'വീട്ടിൽ ഞങ്ങൾ ചെയ്യുന്നത്', reviewBy: 'വിലയിരുത്തേണ്ട തീയതി', status: 'നില',
  todo: 'തുടങ്ങിയിട്ടില്ല', doing: 'ചെയ്തുകൊണ്ടിരിക്കുന്നു', done: 'നേടി',
  meetings: 'സംഘ യോഗങ്ങളും വിലയിരുത്തലുകളും', addMeeting: 'യോഗം ചേർക്കുക', date: 'തീയതി', who: 'ആരൊക്കെ ഉണ്ടായിരുന്നു', decided: 'എന്ത് തീരുമാനിച്ചു', nextReview: 'അടുത്ത വിലയിരുത്തൽ',
  sharePlan: 'പദ്ധതി പങ്കിടുക', planHint: 'സംഘം തീരുമാനിക്കുന്നത് എഴുതിവയ്ക്കൂ, ആശുപത്രിയിലും വീടിനടുത്തും കുടുംബത്തിലും എല്ലാവരും ഒരേ പദ്ധതി പിന്തുടരാൻ.',
  fromBookPlan: 'പുസ്തകത്തിൽ നിന്ന്: ആശുപത്രി വിടും മുമ്പ്', save: 'സൂക്ഷിക്കുക', cancel: 'റദ്ദാക്കുക', delete: 'ഒഴിവാക്കുക', edit: 'മാറ്റുക', empty: 'ഇതുവരെ ഒന്നും ചേർത്തിട്ടില്ല.',
  therapy: 'തെറാപ്പി കളി', therapySub: 'വീട്ടിലെ വ്യായാമങ്ങൾ ഒരു കളിയായി',
  therapyIntro: 'തെറാപ്പിസ്റ്റ് കാണിച്ചുതന്ന വ്യായാമങ്ങൾ ചേർക്കൂ. കുട്ടി അവ ഒരു കളിയായി ചെയ്യും: ഓരോന്നും ബലൂൺ വീർപ്പിക്കും, റോക്കറ്റ് പറത്തും, അല്ലെങ്കിൽ പൂവ് വിരിയിക്കും.',
  addExercise: 'വ്യായാമം ചേർക്കുക', exName: 'വ്യായാമത്തിന്റെ പേര് (തെറാപ്പിസ്റ്റ് പറയുന്നതുപോലെ)', exArea: 'തെറാപ്പി', exKind: 'തരം', count: 'എണ്ണം (തവണ)', hold: 'പിടിച്ചുനിർത്തൽ (സെക്കൻഡ്)', target: 'എത്ര', theme: 'കളി',
  exNote: 'എങ്ങനെ ചെയ്യണം (തെറാപ്പിസ്റ്റ് പറഞ്ഞത്)', play: 'കളിക്കാം', again: 'വീണ്ടും', today: 'ഇന്ന്', streak: 'തുടർച്ചയായി {n} ദിവസം', week: 'ഈ ആഴ്ച', noEx: 'ഇതുവരെ വ്യായാമങ്ങളില്ല. വീട്ടിൽ ചെയ്യേണ്ട വ്യായാമങ്ങൾ ഏതെന്ന് തെറാപ്പിസ്റ്റിനോട് ചോദിച്ച് ഇവിടെ ചേർക്കൂ.',
  tap: 'ഓരോന്നിനും തൊടൂ', start: 'തുടങ്ങുക', pause: 'നിർത്തുക', well: 'മിടുക്കൻ!', rightAmount: 'പുസ്തകത്തിൽ നിന്ന്: ശരിയായ അളവ്', physio: 'ഫിസിയോതെറാപ്പി', ot: 'ഒക്യുപേഷണൽ തെറാപ്പി', speech: 'സംസാരവും വിഴുങ്ങലും', other: 'മറ്റുള്ളവ',
  help: 'പദ്ധതികളും സഹായവും', helpSub: 'ക്ഷേമ പദ്ധതികളും സംഘടനകളും',
  helpIntro: 'പദ്ധതികളും തുകകളും നിയമങ്ങളും മാറിക്കൊണ്ടിരിക്കും, ഓരോ സംസ്ഥാനത്തും വ്യത്യസ്തവുമാണ്. വിശദാംശങ്ങൾ എപ്പോഴും ആശുപത്രിയിലെ സോഷ്യൽ വർക്കറോട് ഉറപ്പാക്കൂ.',
  schemes: 'സർക്കാർ പദ്ധതികൾ', finders: 'അർഹതയുള്ള എല്ലാ പദ്ധതികളും കണ്ടെത്താം', palliative: 'അടുത്തുള്ള പാലിയേറ്റീവ് കേന്ദ്രങ്ങൾ', orgs: 'സംഘടനകളും സഹായ ഗ്രൂപ്പുകളും', myContacts: 'ഞങ്ങളുടെ സ്വന്തം ബന്ധങ്ങൾ', addContact: 'ബന്ധം ചേർക്കുക', open: 'വെബ്സൈറ്റ് തുറക്കുക', find: 'ഓൺലൈനിൽ തിരയുക', call: 'വിളിക്കുക',
  india: 'ഇന്ത്യ മുഴുവൻ', kerala: 'കേരളം', karnataka: 'കർണാടക', reviewed: '{d}-ൽ പരിശോധിച്ച പട്ടിക. എന്തെങ്കിലും മാറിയിട്ടുണ്ടെങ്കിൽ അറിയിക്കൂ.', fromBookHelp: 'പുസ്തകത്തിൽ നിന്ന്: പണം, രേഖകൾ, സഹായം', whatFor: 'എന്തിന് സഹായിക്കും',
};
const kn: Record<K, string> = {
  carePlan: 'ನಮ್ಮ ಆರೈಕೆ ಯೋಜನೆ', carePlanSub: 'ತಂಡ, ಗುರಿಗಳು ಮತ್ತು ಸಭೆಗಳು ಒಂದೇ ಕಡೆ',
  team: 'ನಮ್ಮ ತಂಡ', addMember: 'ತಂಡದ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ', role: 'ಪಾತ್ರ', name: 'ಹೆಸರು', phone: 'ಫೋನ್', place: 'ಆಸ್ಪತ್ರೆ / ಸ್ಥಳ', mainContactTag: 'ಮುಖ್ಯ ಸಂಪರ್ಕ', makeMain: 'ಮುಖ್ಯ ಸಂಪರ್ಕ ಮಾಡಿ',
  goals: 'ಗುರಿಗಳು', addGoal: 'ಗುರಿ ಸೇರಿಸಿ', area: 'ಯಾರು ನಡೆಸುತ್ತಾರೆ', goal: 'ಗುರಿ', atHome: 'ಮನೆಯಲ್ಲಿ ನಾವು ಮಾಡುವುದು', reviewBy: 'ಪರಿಶೀಲನೆ ದಿನಾಂಕ', status: 'ಸ್ಥಿತಿ',
  todo: 'ಆರಂಭಿಸಿಲ್ಲ', doing: 'ನಡೆಯುತ್ತಿದೆ', done: 'ಸಾಧಿಸಿದೆ',
  meetings: 'ತಂಡದ ಸಭೆಗಳು ಮತ್ತು ಪರಿಶೀಲನೆಗಳು', addMeeting: 'ಸಭೆ ಸೇರಿಸಿ', date: 'ದಿನಾಂಕ', who: 'ಯಾರು ಇದ್ದರು', decided: 'ಏನು ತೀರ್ಮಾನಿಸಿದೆವು', nextReview: 'ಮುಂದಿನ ಪರಿಶೀಲನೆ',
  sharePlan: 'ಯೋಜನೆ ಹಂಚಿಕೊಳ್ಳಿ', planHint: 'ತಂಡ ಒಪ್ಪಿದ್ದನ್ನು ಬರೆದಿಡಿ, ಆಸ್ಪತ್ರೆಯಲ್ಲಿ, ಮನೆ ಹತ್ತಿರ ಮತ್ತು ಕುಟುಂಬದಲ್ಲಿ ಎಲ್ಲರೂ ಒಂದೇ ಯೋಜನೆಯಂತೆ ಮಾಡಲು.',
  fromBookPlan: 'ಪುಸ್ತಕದಿಂದ: ಆಸ್ಪತ್ರೆ ಬಿಡುವ ಮೊದಲು', save: 'ಉಳಿಸಿ', cancel: 'ರದ್ದು', delete: 'ಅಳಿಸಿ', edit: 'ಬದಲಿಸಿ', empty: 'ಇನ್ನೂ ಏನೂ ಸೇರಿಸಿಲ್ಲ.',
  therapy: 'ಥೆರಪಿ ಆಟ', therapySub: 'ಮನೆಯ ವ್ಯಾಯಾಮಗಳು ಆಟವಾಗಿ',
  therapyIntro: 'ಥೆರಪಿಸ್ಟ್ ತೋರಿಸಿದ ವ್ಯಾಯಾಮಗಳನ್ನು ಸೇರಿಸಿ. ಮಗು ಅವನ್ನು ಆಟವಾಗಿ ಮಾಡುತ್ತದೆ: ಪ್ರತಿಯೊಂದೂ ಬಲೂನ್ ಊದುತ್ತದೆ, ರಾಕೆಟ್ ಹಾರಿಸುತ್ತದೆ ಅಥವಾ ಹೂ ಅರಳಿಸುತ್ತದೆ.',
  addExercise: 'ವ್ಯಾಯಾಮ ಸೇರಿಸಿ', exName: 'ವ್ಯಾಯಾಮದ ಹೆಸರು (ಥೆರಪಿಸ್ಟ್ ಕರೆಯುವಂತೆ)', exArea: 'ಥೆರಪಿ', exKind: 'ಬಗೆ', count: 'ಎಣಿಕೆ (ಬಾರಿ)', hold: 'ಹಿಡಿದಿಡುವುದು (ಸೆಕೆಂಡ್)', target: 'ಎಷ್ಟು', theme: 'ಆಟ',
  exNote: 'ಹೇಗೆ ಮಾಡುವುದು (ಥೆರಪಿಸ್ಟ್ ಹೇಳಿದ್ದು)', play: 'ಆಡೋಣ', again: 'ಮತ್ತೆ', today: 'ಇಂದು', streak: 'ಸತತ {n} ದಿನ', week: 'ಈ ವಾರ', noEx: 'ಇನ್ನೂ ವ್ಯಾಯಾಮಗಳಿಲ್ಲ. ಮನೆಯಲ್ಲಿ ಯಾವ ವ್ಯಾಯಾಮ ಮಾಡಬೇಕೆಂದು ಥೆರಪಿಸ್ಟ್ ಅವರನ್ನು ಕೇಳಿ ಇಲ್ಲಿ ಸೇರಿಸಿ.',
  tap: 'ಪ್ರತಿಯೊಂದಕ್ಕೂ ಒತ್ತಿ', start: 'ಆರಂಭ', pause: 'ನಿಲ್ಲಿಸಿ', well: 'ಶಭಾಷ್!', rightAmount: 'ಪುಸ್ತಕದಿಂದ: ಸರಿಯಾದ ಪ್ರಮಾಣ', physio: 'ಫಿಸಿಯೋಥೆರಪಿ', ot: 'ಆಕ್ಯುಪೇಷನಲ್ ಥೆರಪಿ', speech: 'ಮಾತು ಮತ್ತು ನುಂಗುವಿಕೆ', other: 'ಇತರೆ',
  help: 'ಯೋಜನೆಗಳು ಮತ್ತು ನೆರವು', helpSub: 'ಕಲ್ಯಾಣ ಯೋಜನೆಗಳು ಮತ್ತು ಸಂಸ್ಥೆಗಳು',
  helpIntro: 'ಯೋಜನೆಗಳು, ಮೊತ್ತಗಳು ಮತ್ತು ನಿಯಮಗಳು ಬದಲಾಗುತ್ತವೆ ಮತ್ತು ರಾಜ್ಯದಿಂದ ರಾಜ್ಯಕ್ಕೆ ಬೇರೆ. ವಿವರಗಳನ್ನು ಯಾವಾಗಲೂ ಆಸ್ಪತ್ರೆಯ ಸಮಾಜ ಕಾರ್ಯಕರ್ತರೊಂದಿಗೆ ಖಚಿತಪಡಿಸಿ.',
  schemes: 'ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು', finders: 'ಅರ್ಹವಾದ ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ', palliative: 'ಹತ್ತಿರದ ಉಪಶಾಮಕ ಆರೈಕೆ ಕೇಂದ್ರಗಳು', orgs: 'ಸಂಸ್ಥೆಗಳು ಮತ್ತು ಬೆಂಬಲ ಗುಂಪುಗಳು', myContacts: 'ನಮ್ಮ ಸ್ವಂತ ಸಂಪರ್ಕಗಳು', addContact: 'ಸಂಪರ್ಕ ಸೇರಿಸಿ', open: 'ವೆಬ್‌ಸೈಟ್ ತೆರೆಯಿರಿ', find: 'ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಹುಡುಕಿ', call: 'ಕರೆ ಮಾಡಿ',
  india: 'ಇಡೀ ಭಾರತ', kerala: 'ಕೇರಳ', karnataka: 'ಕರ್ನಾಟಕ', reviewed: '{d} ರಲ್ಲಿ ಪರಿಶೀಲಿಸಿದ ಪಟ್ಟಿ. ಏನಾದರೂ ಬದಲಾಗಿದ್ದರೆ ತಿಳಿಸಿ.', fromBookHelp: 'ಪುಸ್ತಕದಿಂದ: ಹಣ, ದಾಖಲೆಗಳು ಮತ್ತು ನೆರವು', whatFor: 'ಯಾವುದಕ್ಕೆ ನೆರವು',
};
export const CT = { en, ml, kn } as Record<Lang, Record<K, string>>;
export const ct = (lang: Lang, k: K, v: Record<string, string | number> = {}) => CT[lang][k].replace(/\{(\w+)\}/g, (_, x) => String(v[x] ?? ''));
