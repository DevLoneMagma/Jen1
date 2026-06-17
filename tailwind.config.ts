import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'jen1-red': '#E50914',
        'jen1-black': '#0A0A0A',
        'jen1-dark': '#111111',
        'jen1-card': '#181818',
        'jen1-gray': '#B3B3B3',
        'jen1-dimgray': '#4D4D4D',
      },
      fontFamily: {
        archivo: ['var(--font-archivo)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      fontSize: {
        // Display scale — used with font-archivo for hero, headers, logo.
        // Tuned tracking/leading per size since tight tracking that reads
        // well at 96px reads cramped at 18px.
        'display-hero': ['clamp(2.75rem, 6vw, 5.5rem)', { lineHeight: '0.98', letterSpacing: '-0.01em' }],
        'display-xl':   ['3rem',    { lineHeight: '1.0',  letterSpacing: '-0.005em' }],
        'display-lg':   ['2.25rem', { lineHeight: '1.05', letterSpacing: '0' }],
        'display-md':   ['1.5rem',  { lineHeight: '1.1',  letterSpacing: '0.005em' }],
        'display-sm':   ['1.125rem', { lineHeight: '1.15', letterSpacing: '0.01em' }],
        // UI scale — used with font-inter for body, metadata, buttons, badges.
        'ui-lg':   ['1rem',     { lineHeight: '1.5' }],
        'ui-base': ['0.875rem', { lineHeight: '1.5' }],
        'ui-sm':   ['0.8125rem', { lineHeight: '1.4' }],
        'ui-xs':   ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.02em' }],
        'ui-2xs':  ['0.625rem', { lineHeight: '1.3', letterSpacing: '0.03em' }],
      },
      backgroundImage: {
        'gradient-hero-right': 'linear-gradient(to right, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.3) 70%, transparent 100%)',
        'gradient-hero-bottom': 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        fadeIn: 'fadeIn 0.4s ease forwards',
        scaleIn: 'scaleIn 0.25s ease forwards',
      },
    },
  },
  plugins: [],
}

export default config
