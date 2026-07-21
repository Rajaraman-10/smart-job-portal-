module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        data: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
