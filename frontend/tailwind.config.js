/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans JP', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1a56db',
          light: '#3b7af7',
          dark: '#1240a8',
        },
        income: '#10b981',
        expense: '#ef4444',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
