import { type Config } from 'tailwindcss';

export default {
  prefix: '',
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        brand: {
          '50': '#FFF2DF',
          '100': '#FFE5BF',
          '200': '#FFD99F',
          '300': '#FFCC7F',
          '400': '#FFC56F',
          '500': '#FFBF5F',
          '600': '#CC994C',
          '700': '#997339',
          '800': '#664C26',
          '900': '#332613'
        },
        primary: {
          '50': '#D5D6D8',
          '100': '#ABADB0',
          '200': '#808589',
          '300': '#565C61',
          '400': '#41474E',
          '500': '#2C333A',
          '600': '#23292E',
          '700': '#1A1F23',
          '800': '#121417',
          '900': '#090A0C'
        },
        white: {
          default: '#FFFFFF',
          '50': '#FAFAFA',
          '100': '#F6F6F6',
          '200': '#F1F1F1',
          '300': '#EDEDED',
          '400': '#EAEAEA',
          '500': '#E8E8E8',
          '600': '#BABABA',
          '700': '#8B8B8B',
          '800': '#5D5D5D',
          '900': '#2E2E2E'
        },
        success: {
          '50': '#D8F5E1',
          '100': '#B0EAC2',
          '200': '#89E0A4',
          '300': '#61D585',
          '400': '#4ED076',
          '500': '#3ACB67',
          '600': '#2EA252',
          '700': '#237A3E',
          '800': '#175129',
          '900': '#0C2915'
        },
        text: {
          '900': '#121518'
        },
        error: {
          '50': '#FADDDD',
          '100': '#F5BBBB',
          '200': '#F09A9A',
          '300': '#EB7878',
          '400': '#E96767',
          '500': '#E65656',
          '600': '#B84545',
          '700': '#8A3434',
          '800': '#5C2222',
          '900': '#2E1111'
        },
        warning: {
          '50': '#F9F5DF',
          '100': '#F2EBBF',
          '200': '#ECE09E',
          '300': '#E5D67E',
          '400': '#E2D16E',
          '500': '#DFCC5E',
          '600': '#B2A34B',
          '700': '#867A38',
          '800': '#595226',
          '900': '#2D2913'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      fontFamily: {
        heading: ['Clash Display', 'sans-serif'] // Adding Clash Display as a heading font
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
} satisfies Config;
