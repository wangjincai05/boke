/** @type {import('tailwindcss').Config} */
import typography from "@tailwindcss/typography";

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        border: "var(--color-border)",
        ring: "var(--color-ring)",
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
            color: "var(--color-foreground)",
            a: {
              color: "var(--color-primary)",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
            },
            code: {
              color: "var(--color-primary)",
              backgroundColor: "var(--color-accent)",
              padding: "0.125rem 0.375rem",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              backgroundColor: "var(--color-card)",
              color: "var(--color-card-foreground)",
              border: "1px solid var(--color-border)",
            },
            blockquote: {
              borderLeftColor: "var(--color-primary)",
              color: "var(--color-muted-foreground)",
              fontStyle: "italic",
            },
            strong: {
              color: "var(--color-foreground)",
              fontWeight: "600",
            },
            h1: { color: "var(--color-foreground)" },
            h2: { color: "var(--color-foreground)" },
            h3: { color: "var(--color-foreground)" },
            h4: { color: "var(--color-foreground)" },
          },
        },
        invert: {
          css: {
            color: "var(--color-foreground)",
            a: {
              color: "var(--color-primary)",
            },
            code: {
              backgroundColor: "var(--color-accent)",
            },
            pre: {
              backgroundColor: "var(--color-card)",
            },
            blockquote: {
              borderLeftColor: "var(--color-primary)",
              color: "var(--color-muted-foreground)",
            },
          },
        },
      },
    },
  },
  plugins: [typography],
};