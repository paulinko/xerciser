import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // New custom colors
        sky_blue: {
          DEFAULT: '#8ecae6',
          '100': '#0d2e3d',
          '200': '#1b5c7a',
          '300': '#288ab7',
          '400': '#51aed9',
          '500': '#8ecae6',
          '600': '#a5d5eb',
          '700': '#bbdff0',
          '800': '#d2eaf5',
          '900': '#e8f4fa',
        },
        blue_green: {
          DEFAULT: '#219ebc',
          '100': '#071f25',
          '200': '#0d3e4b',
          '300': '#145d70',
          '400': '#1a7d95',
          '500': '#219ebc',
          '600': '#39bcdc',
          '700': '#6bcce5',
          '800': '#9cddee',
          '900': '#ceeef6',
        },
        prussian_blue: {
          DEFAULT: '#023047',
          '100': '#00090e',
          '200': '#01131c',
          '300': '#011c2a',
          '400': '#012638',
          '500': '#023047',
          '600': '#04699b',
          '700': '#06a3f1',
          '800': '#54c3fb',
          '900': '#a9e1fd',
        },
        selective_yellow: {
          DEFAULT: '#ffb703',
          '100': '#342500',
          '200': '#684b00',
          '300': '#9c7000',
          '400': '#d09500',
          '500': '#ffb703',
          '600': '#ffc637',
          '700': '#ffd569',
          '800': '#ffe39b',
          '900': '#fff1cd',
        },
        ut_orange: {
          DEFAULT: '#fb8500',
          '100': '#321b00',
          '200': '#643500',
          '300': '#965000',
          '400': '#c86b00',
          '500': '#fb8500',
          '600': '#ff9e2f',
          '700': '#ffb663',
          '800': '#ffce97',
          '900': '#ffe7cb',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;