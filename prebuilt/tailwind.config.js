module.exports = {
  darkMode: 'class',
  content: [
    './prebuilt/**/*.{html,njk,js}',
    './prebuilt/.eleventy.js'
  ],
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
