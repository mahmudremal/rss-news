/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [...Array(3)].map(
    (u, i) =>
      `./${[...Array(i)].map((o) => "**/").join("")}*.{txt,html,htm,php,js,jsx,ts,tsx}`,
  ),
  theme: {
    extend: {
      colors: {},
      fontFamily: {
        // sans: ["Inter", "sans-serif"],
      },
      zIndex: {
        100: "100",
        999: "999",
      },
      screens: {
        "3xl": "1920px",
      },
    },
  },
  // plugins: [require("daisyui")],
  // corePlugins: {
  //   preflight: false,
  // },
  // safelist: [
  //   {
  //     pattern: /xpo_/,
  //   },
  // ],
};
