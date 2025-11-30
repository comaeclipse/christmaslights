/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        midnight: '#0f172a',
        holly: '#15803d',
        berry: '#dc2626',
        gold: '#fbbf24',
      }
    },
  },
  plugins: [],
}
