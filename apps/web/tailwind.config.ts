import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aegis: {
          50: '#F5F7FA',
          100: '#E4E7EB',
          200: '#CBD2D9',
          300: '#9AA5B1',
          400: '#7B8794',
          500: '#52606D',
          600: '#3E4C59',
          700: '#253040',
          800: '#151D29',
          850: '#0E1522',
          900: '#080D17',
          950: '#04070D',
        },
        gold: {
          400: '#E5C058',
          500: '#D4AF37',
          600: '#B89626',
        },
        stellar: {
          blue: '#14B6F7',
          purple: '#6E3AEE',
          dark: '#0B0D1B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(212, 175, 55, 0.15)',
        'blue-glow': '0 0 25px -5px rgba(20, 182, 247, 0.2)',
      },
    },
  },
  plugins: [],
};

export default config;
