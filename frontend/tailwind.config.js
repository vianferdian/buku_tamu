/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          light: '#2c4e75',
          DEFAULT: '#0F2744',
          dark: '#081729',
          secondary: '#163A63'
        },
        bgmain: '#F8FAFC',
        textmain: '#172033',
        textsec: '#64748B',
        bordergray: '#E5E7EB'
      }
    },
  },
  plugins: [],
}
