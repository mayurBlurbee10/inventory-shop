/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./Plugins/**/*.jsx",
    "./Plugins/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(0, 0, 0)',  // primaryColor
        },
        secondary: {
          DEFAULT: 'rgb(255, 255, 255)',  // secondaryColor
        },
        background: {
          DEFAULT: 'rgb(255, 255, 255)',  // backgroundColor
          gray: 'rgb(245, 245, 245)',
        },
        text: {
          DEFAULT: '#333333',  // textColor
        },
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        }
      },
      fontFamily: {
        'lato': ['Lato', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
