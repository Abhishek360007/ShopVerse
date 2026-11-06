/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#0b0a12',        // page background
        surface: '#15141d',    // cards
        raised: '#1d1b27',     // inputs, chips, hover states
        line: 'rgba(255,255,255,0.08)',
        muted: '#a1a1b5',
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
