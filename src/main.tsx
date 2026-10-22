import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/source-serif-4/latin-400.css';
import '@fontsource/source-serif-4/latin-700.css';
import '@fontsource/manjari/malayalam-400.css';
import '@fontsource/manjari/malayalam-700.css';
import '@fontsource/noto-serif-malayalam/malayalam-400.css';
import '@fontsource/noto-serif-malayalam/malayalam-700.css';
import '@fontsource/noto-sans-malayalam/malayalam-400.css';
import '@fontsource/noto-sans-malayalam/malayalam-700.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
