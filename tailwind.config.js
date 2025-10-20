/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f5fd',
          100: '#cde9fb',
          200: '#9bd3f7',
          300: '#69bdf2',
          400: '#37a7ee',
          500: '#13a4ec',
          600: '#0e7fb9',
          700: '#0a5a86',
          800: '#063553',
          900: '#021020',
          950: '#010810',
        },
        "background-light": "#f0f7ff",
        "background-dark": "#101c22",
        "text-light": "#0d171b",
        "text-dark": "#ffffff",
        "card-light": "#ffffff",
        "card-dark": "#1a2831",
        "success-light": "#078836",
        "success-dark": "#34d399",
        "accent-positive": "#078836",
        "accent-negative": "#e73508",
        "subtle-light": "#e7eff3",
        "subtle-dark": "#2a3c47",
        "muted-light": "#4c809a",
        "muted-dark": "#a1b3bf",
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "Inter", "Noto Sans", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "full": "9999px"
      },
      animation: {
        'bounce-gentle': 'bounce 2s infinite',
        'pulse-soft': 'pulse 3s infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'confetti': 'confetti 3s linear infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        confetti: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)', opacity: '0' },
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}