/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#09111b',
        panel: '#111d29',
        mint: '#70e4c3',
        caution: '#f4c15d',
        danger: '#ff7078',
      },
    },
  },
  plugins: [],
};
