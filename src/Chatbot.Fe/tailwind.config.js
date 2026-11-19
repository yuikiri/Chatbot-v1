/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          surface: '#f6f5f4',
          ink: '#000000',
          body: 'rgba(0, 0, 0, 0.85)',
          muted: 'rgba(0, 0, 0, 0.54)',
          subtle: 'rgba(0, 0, 0, 0.36)',
          border: 'rgba(0, 0, 0, 0.08)',
          borderStrong: 'rgba(0, 0, 0, 0.14)',
          blue: '#0075de',
          blueHover: '#0062bd',
          bluePressed: '#005bab',
          blueTint: '#e6f3fe',
          blueLink: '#097fe8',
          green: '#1aae39',
          greenWash: '#d0f4d8',
          amber: '#ffb110',
          amberWash: '#fef3c7',
          coral: '#f64932',
          coralWash: '#ffe4e6',
          indigo: '#1313ba',
          indigoWash: '#e0e7ff',
          lavender: '#6b21a8',
          lavenderWash: '#eadbfa',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['Newsreader', '"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        'notion-xs': '4px',
        'notion-sm': '8px',
        'notion-md': '12px',
        'notion-full': '9999px',
      },
      boxShadow: {
        'notion-hairline': '0 0 0 1px rgba(0, 0, 0, 0.08)',
        'notion-under-rule': '0 1px 0 0 rgba(0, 0, 0, 0.1)',
        'notion-soft': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.05)',
        'notion-float': '0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
      },
      letterSpacing: {
        'notion-display': '-0.035em',
        'notion-heading': '-0.022em',
        'notion-body': '-0.011em',
        'notion-table': '0.04em',
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.75' },
        }
      }
    },
  },
  plugins: [],
}
