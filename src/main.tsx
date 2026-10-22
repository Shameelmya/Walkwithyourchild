import '@fontsource/google-sans/latin-400.css';
import '@fontsource/google-sans/latin-500.css';
import '@fontsource/google-sans/latin-700.css';
import '@fontsource/noto-sans-malayalam/malayalam-400.css';
import '@fontsource/noto-sans-malayalam/malayalam-700.css';
import '@fontsource/noto-sans-kannada/kannada-400.css';
import '@fontsource/noto-sans-kannada/kannada-700.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
