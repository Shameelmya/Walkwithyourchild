/** @type {import('tailwindcss').Config} */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), surface2: v('surface2'), ink: v('text'), muted: v('muted'),
        line: v('border'), accent: v('accent'), onaccent: v('onaccent'), danger: v('danger'), ondanger: v('ondanger'),
        soft: v('soft'),
      },
      fontFamily: {
        ui: ['Nunito', '"Noto Sans Malayalam"', 'system-ui', 'sans-serif'],
        head: ['Nunito', 'Manjari', '"Noto Sans Malayalam"', 'system-ui', 'sans-serif'],
        read: ['"Source Serif 4"', '"Noto Serif Malayalam"', 'Georgia', 'serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { card: '0 1px 2px rgb(0 0 0 / 0.04), 0 4px 16px rgb(var(--shadow) / 0.08)' },
    },
  },
  plugins: [],
};
