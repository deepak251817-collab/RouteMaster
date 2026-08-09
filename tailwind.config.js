/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111111',
        mist: '#f7f2ea',
        clay: '#d6c7b2',
        ember: '#ff6a3d',
        moss: '#1e7f5b',
        steel: '#2a4e7e',
        sun: '#ffd34f'
      },
      boxShadow: {
        glow: '0 12px 30px rgba(15, 23, 42, 0.2)'
      }
    }
  },
  plugins: []
}
