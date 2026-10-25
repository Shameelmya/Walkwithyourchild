/** @type {import('tailwindcss').Config} */
// Latin first, then one Noto face for each script the app is offered in (add a face here when a language is added).
const FONTS = ['"Google Sans"', '"Noto Sans Malayalam"', '"Noto Sans Kannada"', '"Noto Sans Devanagari"', '"Noto Sans Tamil"', '"Noto Sans Telugu"', '"Noto Sans Bengali"', '"Noto Nastaliq Urdu"', 'system-ui', 'sans-serif'];
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
        ui: FONTS,
        head: FONTS,
        display: FONTS,
        read: FONTS,
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { card: '0 1px 2px rgb(var(--shadow) / 0.05), 0 12px 32px -14px rgb(var(--shadow) / 0.22)', lift: '0 18px 40px -16px rgb(var(--shadow) / 0.45)', nav: '0 -6px 30px -10px rgb(var(--shadow) / 0.25)' },
    },
  },
  plugins: [],
};
