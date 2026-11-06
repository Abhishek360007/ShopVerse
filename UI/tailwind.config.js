/** @type {import('tailwindcss').Config} */

// Theme colours come from CSS variables (see index.css) so light/dark can switch at runtime.
const themed = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: themed('ink'),         // page background
        surface: themed('surface'), // cards
        raised: themed('raised'),   // inputs, chips, hover states
        fg: themed('fg'),           // main text
        muted: themed('muted'),     // secondary text
        line: 'rgb(var(--fg) / 0.1)',
        brand: {
          purple: '#a855f7',
          pink: '#ec4899',
          blue: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        shell: '1392px',
      },
    },
  },
  plugins: [],
};
