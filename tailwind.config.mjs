/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "hsl(240, 10%, 98%)",
        foreground: "hsl(240, 10%, 3%)",
        card: {
          DEFAULT: "hsl(0, 0%, 100%)",
          foreground: "hsl(240, 10%, 10%)",
        },
        primary: {
          DEFAULT: "hsl(243, 75%, 59%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        secondary: {
          DEFAULT: "hsl(240, 5%, 84%)",
          foreground: "hsl(240, 10%, 30%)",
        },
        muted: {
          DEFAULT: "hsl(240, 5%, 96%)",
          foreground: "hsl(240, 5%, 46%)",
        },
        accent: {
          DEFAULT: "hsl(240, 5%, 96%)",
          foreground: "hsl(240, 10%, 10%)",
        },
        border: "hsl(240, 6%, 90%)",
        ring: "hsl(243, 75%, 59%)",
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: "calc(var(--radius) - 4px)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
          },
        },
      },
    },
  },
  plugins: [],
};