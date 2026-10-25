import '@fontsource/google-sans/latin-400.css';
import '@fontsource/google-sans/latin-500.css';
import '@fontsource/google-sans/latin-600.css';
import '@fontsource/google-sans/latin-700.css';
import '@fontsource/google-sans/malayalam-400.css';
import '@fontsource/google-sans/malayalam-500.css';
import '@fontsource/google-sans/malayalam-600.css';
import '@fontsource/google-sans/malayalam-700.css';
import '@fontsource/noto-sans-kannada/kannada-400.css';
import '@fontsource/noto-sans-kannada/kannada-500.css';
import '@fontsource/noto-sans-kannada/kannada-600.css';
import '@fontsource/noto-sans-kannada/kannada-700.css';
import '@fontsource/noto-sans-tamil/tamil-400.css';
import '@fontsource/noto-sans-tamil/tamil-500.css';
import '@fontsource/noto-sans-tamil/tamil-600.css';
import '@fontsource/noto-sans-tamil/tamil-700.css';
import '@fontsource/noto-sans-telugu/telugu-400.css';
import '@fontsource/noto-sans-telugu/telugu-500.css';
import '@fontsource/noto-sans-telugu/telugu-600.css';
import '@fontsource/noto-sans-telugu/telugu-700.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Lets :active press styles show on iOS Safari.
document.addEventListener('touchstart', () => {}, { passive: true });

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
