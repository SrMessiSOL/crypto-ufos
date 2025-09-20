/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}', // Scans all JS/TS/JSX/TSX files in src
    './src/**/*.css', // Includes CSS modules
    './app/**/*.{js,ts,jsx,tsx}', // Scans App Router files (if using Next.js App Router)
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      orbitron: ['Orbitron', 'sans-serif'],
      colors: {
        'sky-blue': '#00C4FF', // Bright, playful blue for accents
        'golden-yellow': '#FFD60A', // Warm yellow for highlights
        'neon-cyan': '#00f7ff',
        'neon-pink': '#ff00ff',
        'neon-magenta': '#e91e63',
        silver: { 500: '#A0AEC0' },
        bronze: { 500: '#CD7F32' },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
      },
      animation: {
        pulse: 'pulse 2s infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
      },
    },
  },
  plugins: [],
};