/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        // Default Tailwind: sm=640, md=768, lg=1024, xl=1280, 2xl=1536
        '3xl': '1920px',  // Large desktop / TV
        '4xl': '2560px',  // 4K / Projector
      },
      colors: {
        green: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      keyframes: {
        slideRight: {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        popIn: {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(-10px)' },
          to:   { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0)' },
          '60%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-right': 'slideRight 0.25s ease',
        'slide-up':    'slideUp 0.25s ease',
        'pop-in':      'popIn 0.15s ease',
        'toast-in':    'toastIn 0.3s ease',
        'bounce-in':   'bounceIn 0.5s ease',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        // Larger base sizes for TV/projector
        '3xl-base': ['1.125rem', { lineHeight: '1.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
