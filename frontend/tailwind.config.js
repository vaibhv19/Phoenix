/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We will define premium curated colors here
        brand: {
          dark: '#0B0F19',
          card: '#161C2A',
          border: '#2A3447',
          accent: '#3B82F6',
          accentHover: '#2563EB',
          textMuted: '#94A3B8'
        }
      }
    },
  },
  plugins: [],
}
