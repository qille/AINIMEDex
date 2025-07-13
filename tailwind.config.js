/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-custom': 'linear-gradient(135deg, #000000, #1a1a3d, #000066)',
      },
      colors: {
        'primary-red': '#ff0000',
        'primary-purple': '#800080',
        'primary-pink': '#ff69b4',
        'primary-blue': '#0000ff',
      },
    },
  },
  plugins: [],
}