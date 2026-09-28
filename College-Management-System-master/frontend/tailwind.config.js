/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(2,6,23,0.06), 0 8px 24px rgba(2,6,23,0.08)",
        softer: "0 1px 1px rgba(2,6,23,0.05), 0 10px 30px rgba(2,6,23,0.10)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '40%': { opacity: '1', transform: 'scale(1.02) translateY(0)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.4))' },
          '50%': { opacity: '0.8', transform: 'scale(1.02)', filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.7))' },
        },
        'blob-spin': {
          '0%': { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1) rotate(120deg)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9) rotate(240deg)' },
          '100%': { transform: 'translate(0, 0) scale(1) rotate(360deg)' },
        }
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'pop-in': 'pop-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up-fade': 'slide-up-fade 0.5s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blob-spin': 'blob-spin 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
