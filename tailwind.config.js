/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          main: 'var(--app-text-main)',
          sub: 'var(--app-text-sub)',
          muted: 'var(--app-text-muted)',
          glass: 'var(--app-surface-glass)',
          solid: 'var(--app-surface-solid)',
          surface: 'var(--app-surface-muted)',
          border: 'var(--app-border-main)',
          'border-light': 'var(--app-border-light)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        scaleIn: 'scaleIn 0.4s ease-out backwards',
        pulseTimer: 'pulseTimer 2s infinite',
      },
      keyframes: {
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseTimer: {
          '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '70%': { boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        }
      }
    },
  },
  plugins: [],
}
