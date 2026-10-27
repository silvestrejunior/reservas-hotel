/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#107c41', // Microsoft Excel / Fluent Emerald Forest Green
          700: '#0e6d39',
          800: '#0b5a2f',
          900: '#084423',
          950: '#032311',
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#107c41',
          700: '#0e6d39',
          800: '#0b5a2f',
          900: '#084423',
        }
      }
    },
  },
  plugins: [],
}
