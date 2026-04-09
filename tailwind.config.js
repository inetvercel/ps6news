/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ps: {
          blue: '#0070d1',
          darkblue: '#003087',
          lightblue: '#0099ff',
          gray: '#f5f5f5',
          darkgray: '#333333',
          border: '#e5e5e5',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-gaming': 'linear-gradient(135deg, #003087 0%, #0070cc 50%, #00D9FF 100%)',
        'grid-pattern': 'linear-gradient(rgba(0, 48, 135, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 48, 135, 0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
      boxShadow: {
        'neon': '0 0 20px rgba(0, 217, 255, 0.5)',
        'neon-lg': '0 0 30px rgba(0, 217, 255, 0.6)',
        'gaming': '0 10px 40px rgba(0, 48, 135, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 217, 255, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 217, 255, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
