/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f2eeff',
          100: '#e4ddff',
          200: '#cabbff',
          300: '#af99ff',
          400: '#9577ff',
          500: '#7b55ff',  // Dracula Purple
          600: '#6244cc',
          700: '#4a3399',
          800: '#312266',
          900: '#191133',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#282a36',  // Dracula Background
          800: '#21222c',  // Dracula Current Line
          900: '#191a21',  // Dracula Darker
        },
        dracula: {
          background: '#282a36',
          current: '#44475a',
          foreground: '#f8f8f2',
          comment: '#6272a4',
          cyan: '#8be9fd',
          green: '#50fa7b',
          orange: '#ffb86c',
          pink: '#ff79c6',
          purple: '#bd93f9',
          red: '#ff5555',
          yellow: '#f1fa8c',
        }
      },
      spacing: {
        sidebar: '280px',
        header: '64px',
      },
      maxWidth: {
        sidebar: '280px',
      },
      minWidth: {
        sidebar: '80px',
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#f8f8f2',
            a: {
              color: '#8be9fd',
              '&:hover': {
                color: '#ff79c6',
              },
            },
            strong: {
              color: '#ff79c6',
            },
            code: {
              color: '#50fa7b',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  corePlugins: {
    preflight: true,
  },
} 