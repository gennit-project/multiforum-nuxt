module.exports = {
  content: [
    "./pages/**/*.vue",
    "./components/**/*.vue",
    "./layouts/**/*.vue",
    "./app.vue",
    "./plugins/**/*.js",
    "./nuxt.config.{js,ts}",
  ],
  darkMode: "class",
  important: true,
  theme: {
    fontWeight: {
      thin: "100",
      light: "300",
      normal: "400",
      medium: "600",
      bold: "700",
      black: "900",
    },
    fontSize: {
      xs: ".75rem",
      sm: ".875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "4rem",
      "7xl": "5rem",
      "8xl": "6rem",
      "9xl": "7rem",
    },
    colors: {
      gray: {
        900: "#0d1117",
        800: "#0d1117",
        700: "#161b22",
        600: "#30363d",
        500: "#484f58",
        400: "#7c7d80",
        300: "#b4b5b7",
        200: "#e3e4e5",
        100: "#f5f5f6",
      },
      white: "#ffffff",
      black: "#000000",
      blue: {
        900: "#0e1e2f",
        800: "#3a464f",
        700: "#385970",
        600: "#1164a3",
        500: "#1d9bd1",
        400: "#8bd0f0",
        300: "#b3daf5",
        200: "#d1f6ff",
        100: "#ebf2f7",
      },
      red: {
        900: "#2b0e0e",
        800: "#3c1212",
        700: "#4e1717",
        600: "#6a1d1d",
        500: "#8f2525",
        400: "#ef6b73",
        300: "#f4b5bd",
        200: "#f9e3e5",
        100: "#fdf5f6",
      },
      purple: {
        900: "#1e0e2b",
        800: "#27123c",
        700: "#33174e",
        600: "#451d6a",
        500: "#5b258f",
        400: "#b36bef",
        300: "#dcb5f4",
        200: "#f1e3f9",
        100: "#faf5fd",
      },
      yellow: {
        900: "#2b1c0e",
        800: "#3c2712",
        700: "#4e3317",
        600: "#6a451d",
        500: "#8f5b25",
        400: "#efb36b",
        300: "#f4dcb5",
        200: "#f9f1e3",
        100: "#fdfaf5",
      },
      green: {
        900: "#0e1e0e",
        800: "#1a331a",
        700: "#235023",
        600: "#2e6a2e",
        500: "#3f8f3f",
        400: "#73ef73",
        300: "#b5f4b5",
        200: "#e3f9e3",
        100: "#f5fdf5",
      },
    },
    container: {
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      colors: {
        "red-transparent": "rgba(255, 0, 0, 0.1)",
        "green-transparent": "rgba(0, 255, 0, 0.1)",
        "blue-transparent": "rgba(0, 0, 255, 0.1)",
        "blue-transparent-lighter": "rgba(162, 248, 252, 0.25)",
        "yellow-transparent": "rgba(255, 255, 0, 0.1)",
      },
      typography: () => ({
        DEFAULT: {
          css: {
            ul: {
              listStyleType: "disc",
              wordWrap: "break-word",
            },
            ol: {
              listStyleType: "decimal",
              wordWrap: "break-word",
            },
            li: {
              wordWrap: "break-word",
            },
            p: {
              wordWrap: "break-word",
            },
            h1: {
              textDecoration: "none",
              wordWrap: "break-word",
              fontSize: "2rem",
            },
            h2: {
              textDecoration: "none",
              wordWrap: "break-word",
              fontSize: "1.5rem",
            },
            h3: {
              textDecoration: "none",
              wordWrap: "break-word",
              fontSize: "1rem",
            },
            h4: {
              textDecoration: "none",
              wordWrap: "break-word",
            },
            h5: {
              textDecoration: "none",
              wordWrap: "break-word",
            },
            h6: {
              textDecoration: "none",
              wordWrap: "break-word",
            },
          },
        },
      }),
    },
  },
  variants: {
    extend: {
      backgroundColor: ["even"],
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
  purge: false,
};
