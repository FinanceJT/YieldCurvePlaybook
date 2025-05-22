/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: "#195076",
        accent: "#25AAE1",
      },
    },
  },
  plugins: [],
};
