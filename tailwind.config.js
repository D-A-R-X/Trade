/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#131722',
        cardBg: '#1e222d',
        borderBg: '#2a2e39',
        accentGreen: '#089981',
        accentRed: '#f23645',
        accentBlue: '#2962ff',
        accentCyan: '#00bcd4',
      },
    },
  },
  plugins: [],
}
