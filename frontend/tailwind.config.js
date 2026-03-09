/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#2a9d8f',
          50: '#f0faf9',
          100: '#d0f0ed',
          200: '#a1e0db',
          300: '#6bc9c2',
          400: '#3fb0a6',
          500: '#2a9d8f',
          600: '#207d72',
          700: '#1d645c',
          800: '#1b504a',
          900: '#1a433e',
        },
        amber: {
          DEFAULT: '#e9a825',
          50: '#fefbf3',
          100: '#fef3dc',
          200: '#fce4b4',
          300: '#f9d082',
          400: '#f5b94f',
          500: '#e9a825',
          600: '#d18b17',
          700: '#ad6b15',
          800: '#8c5418',
          900: '#734517',
        }
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
