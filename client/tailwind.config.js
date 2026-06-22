/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yt: {
          red: '#FF0000',
          dark: '#0F0F0F',
          card: '#212121',
          hover: '#3F3F3F',
          border: '#3F3F3F',
          text: '#F1F1F1',
          muted: '#AAAAAA',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};