/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#172026",
        slatewash: "#eef3f5",
        tealcore: "#0f766e",
        saffron: "#d97706",
        plum: "#7c3aed"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(23, 32, 38, 0.08)"
      }
    }
  },
  plugins: []
};
