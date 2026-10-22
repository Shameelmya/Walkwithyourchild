import { defineConfig } from '@playwright/test';
import fs from 'node:fs';

const local = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  reporter: 'line',
  use: {
    baseURL: 'http://localhost:4173',
    launchOptions: fs.existsSync(local) ? { executablePath: local } : {},
    acceptDownloads: true,
  },
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 60_000 },
});
