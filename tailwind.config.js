/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black:   '#0A0B0C',
          dark:    '#111318',
          darker:  '#0D0F13',
          gold:    '#C8922A',
          'gold-dark': '#8A6320',
          'gold-muted': '#6B4F1A',
          red:     '#B91C1C',
          'red-dark': '#991B1B',
          white:   '#F5F5F3',
          muted:   '#94A3B8',
          slate:   '#475569',
          border:  '#1F2428',
          'border-light': '#2A2F37',
        }
      },
      fontFamily: {
        headline: ['var(--font-bebas)', 'Impact', 'sans-serif'],
        body:     ['var(--font-ibm-plex-sans)', 'system-ui', 'sans-serif'],
        mono:     ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #0A0B0C 0%, #111318 50%, #0A0B0C 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C8922A 0%, #8A6320 100%)',
        'card-gradient': 'linear-gradient(180deg, transparent 40%, rgba(10,11,12,0.95) 100%)',
      },
      animation: {
        'ticker': 'ticker 40s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#94A3B8',
            a: { color: '#C8922A', '&:hover': { color: '#F5F5F3' } },
            h1: { color: '#F5F5F3', fontFamily: 'var(--font-bebas)' },
            h2: { color: '#F5F5F3' },
            h3: { color: '#C8922A' },
            strong: { color: '#F5F5F3' },
            blockquote: { borderLeftColor: '#C8922A', color: '#94A3B8' },
          }
        }
      }
    },
  },
  plugins: [],
}
