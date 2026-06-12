import type { Config } from "tailwindcss";

/**
 * Design System TORQUE
 * ---------------------------------------------------------------------------
 * Tokens centrais da marca. Toda a UI consome estes valores — nenhum
 * componente define cor/tipografia/sombra "na mão".
 *
 * Identidade: técnica e premium-esportiva. Base em grafite (ink) editorial
 * com um único acento "ignição" (laranja) reservado a CTAs, ofertas e estados
 * ativos. Neutros levemente quentes para dar respiro e sofisticação.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    // Breakpoints mobile-first.
    screens: {
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    container: {
      center: true,
      padding: { DEFAULT: "1rem", lg: "2rem" },
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        // Marca — grafite editorial (preto suavizado, menos agressivo que #000)
        ink: {
          DEFAULT: "#23272F",
          900: "#16181D",
          800: "#22262E",
          700: "#333944",
          600: "#4B5360",
          500: "#6B7280",
        },
        // Acento "ignição" — CTAs, selos, foco
        flame: {
          DEFAULT: "#FF5A1F",
          50: "#FFF2EC",
          100: "#FFE0D2",
          200: "#FFC0A4",
          300: "#FF9B6E",
          400: "#FF7A45",
          500: "#FF5A1F",
          600: "#E8430C",
          700: "#BC3308",
          800: "#902810",
          900: "#75230F",
        },
        // Neutros quentes
        neutral: {
          0: "#FFFFFF",
          50: "#FAF9F7",
          100: "#F3F1ED",
          200: "#E7E3DC",
          300: "#D4CEC4",
          400: "#A8A096",
          500: "#7C746A",
          600: "#5A534B",
          700: "#403B35",
          800: "#2A2622",
          900: "#1A1714",
        },
        // Semânticas
        success: { DEFAULT: "#1F9D55", soft: "#E5F5EC" },
        danger: { DEFAULT: "#D92D20", soft: "#FCE9E7" },
        warning: { DEFAULT: "#D9920B", soft: "#FBF1DC" },
        info: { DEFAULT: "#2563EB", soft: "#E5EDFD" },
      },
      fontFamily: {
        // display (títulos com presença editorial) + corpo
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Escala harmônica (~1.2 minor third)
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.125rem", { lineHeight: "1.7rem" }],
        xl: ["1.375rem", { lineHeight: "1.85rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.75rem", { lineHeight: "2.1rem", letterSpacing: "-0.015em" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
        "4xl": ["3rem", { lineHeight: "3.1rem", letterSpacing: "-0.025em" }],
        "5xl": ["3.75rem", { lineHeight: "3.9rem", letterSpacing: "-0.03em" }],
      },
      spacing: {
        // Escala 4/8px já é padrão do Tailwind; reforços úteis
        "4.5": "1.125rem",
        "13": "3.25rem",
        "18": "4.5rem",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        // Sombras sutis (nada pesado)
        xs: "0 1px 2px 0 rgb(14 15 18 / 0.05)",
        sm: "0 1px 3px 0 rgb(14 15 18 / 0.08), 0 1px 2px -1px rgb(14 15 18 / 0.06)",
        DEFAULT: "0 4px 12px -2px rgb(14 15 18 / 0.08), 0 2px 6px -2px rgb(14 15 18 / 0.05)",
        md: "0 10px 24px -6px rgb(14 15 18 / 0.12), 0 4px 8px -4px rgb(14 15 18 / 0.06)",
        lg: "0 22px 48px -12px rgb(14 15 18 / 0.18)",
        focus: "0 0 0 3px rgb(255 90 31 / 0.35)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "slide-up": "slide-up 0.35s cubic-bezier(0.22,1,0.36,1)",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};

export default config;
