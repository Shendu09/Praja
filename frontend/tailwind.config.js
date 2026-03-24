/** @type {import('tailwindcss').Config} */
import colors from 'tailwindcss/colors'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        saffron: { DEFAULT: '#FF9933', dark: '#E6821A' },
        navyIndia: { DEFAULT: '#0F1F3D', light: '#1A2F5A' },
        indiaGreen: { DEFAULT: '#138808', light: '#1AAD0A' },
        teal: { ...colors.teal, DEFAULT: colors.teal[500] },
        white: '#FFFFFF',
        red: { DEFAULT: '#E53935' },
        amber: { DEFAULT: '#FFC107' },
      },
      fontFamily: {
        rajdhani: ['Rajdhani', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
