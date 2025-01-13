/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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
        }
      },
      fontFamily: {
        'lato':  ['Lato', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
