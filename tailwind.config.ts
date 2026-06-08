import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      borderRadius: {
        sm:  "5px",
        DEFAULT: "8px",
        md:  "8px",
        lg:  "10px",
        xl:  "14px",
        "2xl": "18px",
        full: "9999px",
      },
      colors: {
        ink:    "#070708",
        char:   "#0d0d0f",
        graph:  "#15151a",
        edge:   "#1d1d23",
        line:   "#26262e",
        text:   "#ededee",
        dim:    "#9a9aa1",
        sub:    "#5a5a62",
        mute:   "#3b3b42",
        accent: "#c5ff3d",
        pass:   "#7be17b",
        warn:   "#ffb547",
        fail:   "#ff5d5d",
        info:   "#4d9cf4",
        background: "#0b0b0c",
        page:       "#111113",
        surface:    "#1e1e22",
        overlay:    "#26262b",
        foreground: "#e4e4e5",
        subtle:     "#9e9fa0",
        muted:      "#5f6060",
        "accent-muted": "rgba(95,109,205,0.15)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Manrope",
          "Onest",
          "Golos Text",
          "IBM Plex Sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "var(--font-sans)",
          "Manrope",
          "Onest",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.012em",
        tighter2: "-0.01em",
      },
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
