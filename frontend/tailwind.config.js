/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#F8F5F0', // Warm Ivory
          bone: '#F5F1EA',     // Soft Bone
          cream: '#FAF7F2',    // Cloud Cream
        },
        pastel: {
          lavender: '#D9D1E8',
          lilac: '#CFC5E6',
          sage: '#C7D7C4',
          mint: '#DDE7DB',
          blue: '#D6E4F0',
          sky: '#E5EEF8',
          rose: '#EFD7D7',
          peach: '#F2DDD0',
          coral: '#F3D7CC',
        },
        charcoal: '#2D2D2D',
        graphite: '#444444',
        slateMuted: '#63666A',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
