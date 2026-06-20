/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          500: '#5b6cf9',
          600: '#4654e0',
          700: '#3a45b8',
        },
      },
    },
  },
  plugins: [],
};
