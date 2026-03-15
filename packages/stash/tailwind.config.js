/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#6da67a',
        'primary-light': '#a8d5b6',
        'secondary': '#8baab5',
        'accent': '#d4b896',
        'sage': {
          light: '#e8f0ea',
          medium: '#c5d9cb',
          dark: '#3a5a42',
        },
        'glass': {
          DEFAULT: 'rgba(255, 255, 255, 0.55)',
          border: 'rgba(255, 255, 255, 0.4)',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'zen': '0 8px 32px 0 rgba(106, 135, 115, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        'zen': '24px',
      }
    },
  },
  plugins: [],
}
