import type { Lang } from './store';

type N = Record<Lang, string>;
const n = (en: string, ml: string, kn: string): N => ({ en, ml, kn });
export interface HelpItem { id: string; e: string; name: string; what: N; where: 'india' | 'kerala' | 'karnataka'; url?: string; phone?: string }
/** Schemes and organisations families can ask about. Rules, amounts and eligibility change: the page always says
 *  to check with the hospital social worker. Links go only to official sites; others open a web search. */
export const REVIEWED = '2026-10';
export const SCHEMES: HelpItem[] = [
  { id: 'udid', e: '🪪', where: 'india', name: 'UDID card (Unique Disability ID)', url: 'https://www.swavlambancard.gov.in',
    what: n('National disability certificate. Opens the door to pensions, concessions and other schemes.', 'ദേശീയ ഭിന്നശേഷി സർട്ടിഫിക്കറ്റ്. പെൻഷൻ, ഇളവുകൾ, മറ്റു പദ്ധതികൾ എന്നിവയിലേക്കുള്ള വഴി.', 'ರಾಷ್ಟ್ರೀಯ ಅಂಗವೈಕಲ್ಯ ಪ್ರಮಾಣಪತ್ರ. ಪಿಂಚಣಿ, ರಿಯಾಯಿತಿ ಮತ್ತು ಇತರ ಯೋಜನೆಗಳಿಗೆ ದಾರಿ.') },
  { id: 'pmjay', e: '🏥', where: 'india', name: 'Ayushman Bharat PM-JAY', url: 'https://pmjay.gov.in',
    what: n('Health insurance for hospital stays for eligible families.', 'അർഹരായ കുടുംബങ്ങൾക്ക് ആശുപത്രി ചികിത്സയ്ക്കുള്ള ആരോഗ്യ ഇൻഷുറൻസ്.', 'ಅರ್ಹ ಕುಟುಂಬಗಳಿಗೆ ಆಸ್ಪತ್ರೆ ಚಿಕಿತ್ಸೆಯ ಆರೋಗ್ಯ ವಿಮೆ.') },
  { id: 'niramaya', e: '🛡️', where: 'india', name: 'Niramaya (National Trust)', url: 'https://thenationaltrust.gov.in',
    what: n('Health insurance for some disabilities, and other National Trust schemes for care and support.', 'ചില ഭിന്നശേഷികൾക്കുള്ള ആരോഗ്യ ഇൻഷുറൻസ്, പരിചരണത്തിനുള്ള മറ്റ് നാഷണൽ ട്രസ്റ്റ് പദ്ധതികൾ.', 'ಕೆಲವು ಅಂಗವೈಕಲ್ಯಗಳಿಗೆ ಆರೋಗ್ಯ ವಿಮೆ ಮತ್ತು ಆರೈಕೆಗಾಗಿ ಇತರ ನ್ಯಾಷನಲ್ ಟ್ರಸ್ಟ್ ಯೋಜನೆಗಳು.') },
  { id: 'nprd', e: '🧬', where: 'india', name: 'National Policy for Rare Diseases',
    what: n('Some listed rare conditions can get help with treatment through Centres of Excellence. Ask the doctor whether your child\'s condition is listed.', 'പട്ടികയിലുള്ള ചില അപൂർവ രോഗങ്ങൾക്ക് സെന്റർ ഓഫ് എക്സലൻസ് വഴി ചികിത്സാ സഹായം ലഭിക്കും. കുട്ടിയുടെ രോഗം പട്ടികയിലുണ്ടോ എന്ന് ഡോക്ടറോട് ചോദിക്കൂ.', 'ಪಟ್ಟಿಯಲ್ಲಿರುವ ಕೆಲವು ಅಪರೂಪದ ಕಾಯಿಲೆಗಳಿಗೆ ಸೆಂಟರ್ ಆಫ್ ಎಕ್ಸಲೆನ್ಸ್ ಮೂಲಕ ಚಿಕಿತ್ಸಾ ಸಹಾಯ. ಮಗುವಿನ ಕಾಯಿಲೆ ಪಟ್ಟಿಯಲ್ಲಿದೆಯೇ ಎಂದು ವೈದ್ಯರನ್ನು ಕೇಳಿ.') },
  { id: 'pension', e: '💰', where: 'india', name: 'Disability pension (state and NSAP)', url: 'https://nsap.nic.in',
    what: n('Monthly pension through the state government and the National Social Assistance Programme. Apply through your panchayat or municipal office.', 'സംസ്ഥാന സർക്കാരിന്റെയും ദേശീയ സാമൂഹിക സഹായ പദ്ധതിയുടെയും പ്രതിമാസ പെൻഷൻ. പഞ്ചായത്ത് / നഗരസഭ ഓഫീസ് വഴി അപേക്ഷിക്കാം.', 'ರಾಜ್ಯ ಸರ್ಕಾರ ಮತ್ತು ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ನೆರವು ಕಾರ್ಯಕ್ರಮದ ಮಾಸಿಕ ಪಿಂಚಣಿ. ಪಂಚಾಯತ್ / ನಗರಸಭೆ ಕಚೇರಿ ಮೂಲಕ ಅರ್ಜಿ.') },
  { id: 'adip', e: '🦽', where: 'india', name: 'ADIP scheme (aids and appliances)', url: 'https://disabilityaffairs.gov.in',
    what: n('Wheelchairs, special chairs and other aids for eligible children, often through camps. Ask for a proper assessment first.', 'അർഹരായ കുട്ടികൾക്ക് വീൽചെയർ, പ്രത്യേക കസേര തുടങ്ങിയ ഉപകരണങ്ങൾ, പലപ്പോഴും ക്യാമ്പുകൾ വഴി. ആദ്യം ശരിയായ പരിശോധന ആവശ്യപ്പെടൂ.', 'ಅರ್ಹ ಮಕ್ಕಳಿಗೆ ಗಾಲಿಕುರ್ಚಿ, ವಿಶೇಷ ಕುರ್ಚಿ ಮುಂತಾದ ಸಾಧನಗಳು, ಹೆಚ್ಚಾಗಿ ಶಿಬಿರಗಳ ಮೂಲಕ. ಮೊದಲು ಸರಿಯಾದ ಪರೀಕ್ಷೆ ಕೇಳಿ.') },
  { id: 'janaushadhi', e: '💊', where: 'india', name: 'Jan Aushadhi stores', url: 'https://janaushadhi.gov.in',
    what: n('Generic medicines at lower cost. Ask the doctor if your child\'s medicines are available there.', 'കുറഞ്ഞ വിലയ്ക്ക് ജനറിക് മരുന്നുകൾ. കുട്ടിയുടെ മരുന്നുകൾ അവിടെ കിട്ടുമോ എന്ന് ഡോക്ടറോട് ചോദിക്കൂ.', 'ಕಡಿಮೆ ಬೆಲೆಗೆ ಜೆನೆರಿಕ್ ಔಷಧಿಗಳು. ಮಗುವಿನ ಔಷಧಿಗಳು ಅಲ್ಲಿ ಸಿಗುತ್ತವೆಯೇ ಎಂದು ವೈದ್ಯರನ್ನು ಕೇಳಿ.') },
  { id: 'rbsk', e: '👶', where: 'india', name: 'RBSK and District Early Intervention Centres', url: 'https://nhm.gov.in',
    what: n('Free child health screening and therapy services at the District Early Intervention Centre (DEIC).', 'ജില്ലാ ഏർലി ഇന്റർവെൻഷൻ സെന്ററിൽ (DEIC) സൗജന്യ ശിശു ആരോഗ്യ പരിശോധനയും തെറാപ്പിയും.', 'ಜಿಲ್ಲಾ ಆರಂಭಿಕ ಮಧ್ಯಸ್ಥಿಕೆ ಕೇಂದ್ರದಲ್ಲಿ (DEIC) ಉಚಿತ ಮಕ್ಕಳ ಆರೋಗ್ಯ ತಪಾಸಣೆ ಮತ್ತು ಥೆರಪಿ.') },
  { id: 'kssm', e: '🌴', where: 'kerala', name: 'Kerala Social Security Mission', url: 'https://socialsecuritymission.gov.in',
    what: n('Kerala schemes such as Aswasakiran (support for carers of bedridden people) and Thalolam (treatment support for children). Ask which ones fit your child.', 'ആശ്വാസകിരണം (കിടപ്പിലായവരെ പരിചരിക്കുന്നവർക്ക് സഹായം), താലോലം (കുട്ടികളുടെ ചികിത്സാ സഹായം) പോലുള്ള കേരള പദ്ധതികൾ. നിങ്ങളുടെ കുട്ടിക്ക് ഏതൊക്കെ ബാധകമാണെന്ന് ചോദിക്കൂ.', 'ಆಶ್ವಾಸಕಿರಣ (ಹಾಸಿಗೆ ಹಿಡಿದವರ ಆರೈಕೆದಾರರಿಗೆ ನೆರವು), ತಾಲೋಲಂ (ಮಕ್ಕಳ ಚಿಕಿತ್ಸಾ ನೆರವು) ಮುಂತಾದ ಕೇರಳ ಯೋಜನೆಗಳು. ನಿಮ್ಮ ಮಗುವಿಗೆ ಯಾವುದು ಅನ್ವಯಿಸುತ್ತದೆ ಎಂದು ಕೇಳಿ.') },
  { id: 'kpalli', e: '🤝', where: 'kerala', name: 'Kerala community palliative care',
    what: n('Most panchayats and municipalities in Kerala run a palliative care unit with a home-care nurse. Ask at your Primary Health Centre.', 'കേരളത്തിലെ മിക്ക പഞ്ചായത്തുകളിലും നഗരസഭകളിലും ഹോം കെയർ നഴ്സുള്ള പാലിയേറ്റീവ് കെയർ യൂണിറ്റുണ്ട്. പ്രാഥമികാരോഗ്യ കേന്ദ്രത്തിൽ ചോദിക്കൂ.', 'ಕೇರಳದ ಹೆಚ್ಚಿನ ಪಂಚಾಯತ್ ಮತ್ತು ನಗರಸಭೆಗಳಲ್ಲಿ ಮನೆ ಆರೈಕೆ ನರ್ಸ್ ಇರುವ ಉಪಶಾಮಕ ಆರೈಕೆ ಘಟಕವಿದೆ. ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರದಲ್ಲಿ ಕೇಳಿ.') },
  { id: 'kdisab', e: '🏛️', where: 'karnataka', name: 'Karnataka: Department for Empowerment of Differently Abled and Senior Citizens',
    what: n('State disability pension, aids and other support in Karnataka. Ask the district office or the hospital social worker.', 'കർണാടകയിലെ ഭിന്നശേഷി പെൻഷൻ, ഉപകരണങ്ങൾ, മറ്റു സഹായങ്ങൾ. ജില്ലാ ഓഫീസിലോ ആശുപത്രി സോഷ്യൽ വർക്കറോടോ ചോദിക്കൂ.', 'ಕರ್ನಾಟಕದಲ್ಲಿ ರಾಜ್ಯ ಅಂಗವೈಕಲ್ಯ ಪಿಂಚಣಿ, ಸಾಧನಗಳು ಮತ್ತು ಇತರ ನೆರವು. ಜಿಲ್ಲಾ ಕಚೇರಿ ಅಥವಾ ಆಸ್ಪತ್ರೆಯ ಸಮಾಜ ಕಾರ್ಯಕರ್ತರನ್ನು ಕೇಳಿ.') },
];
export const ORGS: HelpItem[] = [
  { id: 'telemanas', e: '📞', where: 'india', name: 'Tele-MANAS', phone: '14416',
    what: n('Free mental health support for you, 24 hours, in many languages.', 'നിങ്ങൾക്കുള്ള സൗജന്യ മാനസികാരോഗ്യ പിന്തുണ, 24 മണിക്കൂറും, പല ഭാഷകളിൽ.', 'ನಿಮಗಾಗಿ ಉಚಿತ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಬೆಂಬಲ, 24 ಗಂಟೆ, ಹಲವು ಭಾಷೆಗಳಲ್ಲಿ.') },
  { id: 'nimhans', e: '🏥', where: 'karnataka', name: 'NIMHANS, Bengaluru', url: 'https://nimhans.ac.in',
    what: n('National institute for neurology and mental health, where this book was developed.', 'ഈ പുസ്തകം രൂപപ്പെടുത്തിയ, നാഡീരോഗങ്ങൾക്കും മാനസികാരോഗ്യത്തിനുമുള്ള ദേശീയ സ്ഥാപനം.', 'ಈ ಪುಸ್ತಕವನ್ನು ರೂಪಿಸಿದ, ನರವಿಜ್ಞಾನ ಮತ್ತು ಮಾನಸಿಕ ಆರೋಗ್ಯದ ರಾಷ್ಟ್ರೀಯ ಸಂಸ್ಥೆ.') },
  { id: 'ordi', e: '🧬', where: 'india', name: 'Organization for Rare Diseases India (ORDI)', url: 'https://ordindia.in',
    what: n('Information, a helpline and connections for families living with rare diseases.', 'അപൂർവ രോഗങ്ങളുള്ള കുടുംബങ്ങൾക്ക് വിവരങ്ങൾ, ഹെൽപ്‌ലൈൻ, ബന്ധങ്ങൾ.', 'ಅಪರೂಪದ ಕಾಯಿಲೆಗಳಿರುವ ಕುಟುಂಬಗಳಿಗೆ ಮಾಹಿತಿ, ಸಹಾಯವಾಣಿ ಮತ್ತು ಸಂಪರ್ಕಗಳು.') },
  { id: 'lsdss', e: '🤲', where: 'india', name: 'Lysosomal Storage Disorders Support Society (LSDSS)',
    what: n('Parent-led support group for lysosomal storage disorders.', 'ലൈസോസോമൽ സ്റ്റോറേജ് രോഗങ്ങൾക്കായി മാതാപിതാക്കൾ നയിക്കുന്ന സഹായ സംഘം.', 'ಲೈಸೋಸೋಮಲ್ ಸ್ಟೋರೇಜ್ ಕಾಯಿಲೆಗಳಿಗಾಗಿ ಪೋಷಕರು ನಡೆಸುವ ಬೆಂಬಲ ಗುಂಪು.') },
  { id: 'curesma', e: '💪', where: 'india', name: 'Cure SMA Foundation of India',
    what: n('Support and information for families living with spinal muscular atrophy.', 'സ്പൈനൽ മസ്കുലാർ അട്രോഫിയുള്ള കുടുംബങ്ങൾക്ക് സഹായവും വിവരങ്ങളും.', 'ಸ್ಪೈನಲ್ ಮಸ್ಕ್ಯುಲರ್ ಅಟ್ರೋಫಿ ಇರುವ ಕುಟುಂಬಗಳಿಗೆ ನೆರವು ಮತ್ತು ಮಾಹಿತಿ.') },
  { id: 'iamd', e: '🧑‍🦽', where: 'india', name: 'Indian Association of Muscular Dystrophy',
    what: n('Care, rehabilitation and support for people living with muscular dystrophy.', 'മസ്കുലാർ ഡിസ്ട്രോഫിയുള്ളവർക്ക് പരിചരണം, പുനരധിവാസം, പിന്തുണ.', 'ಮಸ್ಕ್ಯುಲರ್ ಡಿಸ್ಟ್ರೋಫಿ ಇರುವವರಿಗೆ ಆರೈಕೆ, ಪುನರ್ವಸತಿ ಮತ್ತು ಬೆಂಬಲ.') },
  { id: 'pallium', e: '🌿', where: 'kerala', name: 'Pallium India, Thiruvananthapuram', url: 'https://palliumindia.org',
    what: n('Palliative care for children and adults, and help to find a team near you.', 'കുട്ടികൾക്കും മുതിർന്നവർക്കും പാലിയേറ്റീവ് പരിചരണം, അടുത്തുള്ള സംഘത്തെ കണ്ടെത്താൻ സഹായം.', 'ಮಕ್ಕಳು ಮತ್ತು ವಯಸ್ಕರಿಗೆ ಉಪಶಾಮಕ ಆರೈಕೆ, ಹತ್ತಿರದ ತಂಡವನ್ನು ಹುಡುಕಲು ನೆರವು.') },
  { id: 'ipm', e: '🌿', where: 'kerala', name: 'Institute of Palliative Medicine, Kozhikode',
    what: n('Palliative care training and services, linked with community palliative care networks in Kerala.', 'പാലിയേറ്റീവ് പരിചരണ സേവനങ്ങളും പരിശീലനവും, കേരളത്തിലെ സാമൂഹിക പാലിയേറ്റീവ് ശൃംഖലകളുമായി ബന്ധം.', 'ಉಪಶಾಮಕ ಆರೈಕೆ ಸೇವೆ ಮತ್ತು ತರಬೇತಿ, ಕೇರಳದ ಸಮುದಾಯ ಉಪಶಾಮಕ ಜಾಲಗಳೊಂದಿಗೆ ಸಂಪರ್ಕ.') },
];
export const searchUrl = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
