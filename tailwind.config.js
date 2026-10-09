/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          green: 'var(--primary)',
          greenlight: 'var(--primary)',
          amber: 'var(--warning)',
          soil: 'var(--ink)'
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'sans-serif']
      }
    }
  },
  plugins: []
}
