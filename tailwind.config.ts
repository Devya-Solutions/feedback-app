import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sora: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        cairo: ['var(--font-cairo)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0A0A0A',
          900: '#0F0F0F',
          850: '#141414',
          800: '#1A1A1A',
          750: '#1F1F1F',
          700: '#262626',
          600: '#333333',
          500: '#525252',
          400: '#737373',
          300: '#A3A3A3',
          200: '#D4D4D4',
          100: '#F5F5F5',
        },
      },
      borderRadius: {
        lg: '14px',
        md: '10px',
        sm: '8px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
