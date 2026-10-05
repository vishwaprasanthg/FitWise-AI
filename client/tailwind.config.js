/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171', // Vibrant neon red
          500: '#ef4444', // Core bold red primary
          600: '#dc2626', // Deep power red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          700: '#33333b',
          750: '#2a2a30',
          800: '#222228', // Elevated border / divider
          850: '#17171c', // Card hover / input surface
          900: '#0f0f13', // Card background
          950: '#070709', // Deep dark black background
        },
        silver: {
          100: '#f8fafc',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
        },
      },
      boxShadow: {
        'silver-sm': '0 2px 8px 0 rgba(220, 225, 240, 0.05), 0 0 0 1px rgba(220, 225, 240, 0.08)',
        'silver': '0 8px 25px -4px rgba(210, 215, 230, 0.07), 0 0 0 1px rgba(220, 225, 240, 0.1)',
        'silver-lg': '0 16px 35px -6px rgba(210, 215, 230, 0.12), 0 0 0 1px rgba(220, 225, 240, 0.15)',
        'red-glow': '0 0 25px -3px rgba(239, 68, 68, 0.4)',
        'red-sm': '0 4px 14px -2px rgba(239, 68, 68, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
