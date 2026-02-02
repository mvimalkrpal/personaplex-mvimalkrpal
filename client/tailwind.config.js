/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        'ielts': {
          'primary': '#a855f7',
          'secondary': '#d946ef',
          'dark': '#0a0a0f',
          'darker': '#1a0b1e',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ["dark"],
  },
};
