module.exports = {
  content: ["./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        "metal-dark": "#0b0f12",
        "metal-mid": "#14171a",
        "metal-light": "#262a2e",
        "gold-glow": "#d4af37"
      },
      boxShadow: {
        "gold-glow": "0 6px 20px rgba(212,175,55,0.12), 0 1px 0 rgba(212,175,55,0.06)"
      }
    }
  },
  plugins: []
};
