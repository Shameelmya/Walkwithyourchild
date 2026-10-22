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
        ui: ['"Google Sans"', '"Noto Sans Malayalam"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
        head: ['"Google Sans"', '"Noto Sans Malayalam"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
        display: ['"Google Sans"', '"Noto Sans Malayalam"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
        read: ['"Google Sans"', '"Noto Sans Malayalam"', '"Noto Sans Kannada"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: { card: '0 1px 2px rgb(var(--shadow) / 0.05), 0 12px 32px -14px rgb(var(--shadow) / 0.22)', lift: '0 18px 40px -16px rgb(var(--shadow) / 0.45)', nav: '0 -6px 30px -10px rgb(var(--shadow) / 0.25)' },
    },
  },
  plugins: [],
};
