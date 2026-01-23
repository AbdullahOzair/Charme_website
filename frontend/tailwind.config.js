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
          50: '#fdf4f3',
          100: '#fce8e6',
          200: '#f9d5d1',
          300: '#f4b5ae',
          400: '#ec8b7f',
          500: '#e06454',
          600: '#cc4637',
          700: '#ab372a',
          800: '#8e3127',
          900: '#762e26',
          950: '#40140f',
        },
        secondary: {
          50: '#f9f7f4',
          100: '#f1ece3',
          200: '#e2d7c6',
          300: '#d0bda2',
          400: '#bca07c',
          500: '#ad8963',
          600: '#a07757',
          700: '#85614a',
          800: '#6d5040',
          900: '#594336',
          950: '#2f221b',
        },
        accent: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d0dce8',
          300: '#a7bfd4',
          400: '#789dbb',
          500: '#5781a4',
          600: '#446889',
          700: '#385470',
          800: '#31485d',
          900: '#2c3e4f',
          950: '#1d2834',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
