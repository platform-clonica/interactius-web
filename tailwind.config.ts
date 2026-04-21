import type { Config } from 'tailwindcss'

/**
 * Tailwind configuration — Interactius 2026
 *
 * Design philosophy:
 * - Override total. No usamos los defaults de Tailwind (paletas 50–900, font sizes genéricos,
 *   screens default, etc.) para impedir que aparezcan clases fuera del sistema visual.
 * - Dos capas de tokens: primitivos (valores crudos extraídos de Figma) y semánticos
 *   (aliases por uso). Los componentes deben consumir preferentemente semánticos.
 * - `fontSize` arrays `[size, { lineHeight, letterSpacing }]` — escribir `text-section` aplica
 *   los tres valores a la vez. Las utilidades `leading-*` y `tracking-*` solo se usan
 *   excepcionalmente.
 * - Colores de acento (lavender, bordeaux, emerald, opal) se exponen pero su uso está
 *   restringido a fondos de work cards. No van en texto, botones, bordes ni iconos.
 * - Las opacidades Tailwind (`bg-dark/50`, `text-fg/60`) están permitidas. Contraste AA se
 *   valida manualmente por componente.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    // ----- Breakpoints -----
    // Override total: mapea 1:1 al sistema definido en el brief.
    // mobile ≤480 · tablet portrait ≤768 · tablet landscape ≤900 · desktop ≤1280 · large ≤1440
    screens: {
      sm: '480px',
      md: '768px',
      lg: '900px',
      xl: '1280px',
      '2xl': '1440px',
    },

    // ----- Colors -----
    // Paleta finita, plana, sin escalas 50–900. Primitivos y semánticos en el mismo nivel.
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',

      // Primitivos — valores crudos extraídos de Figma
      dark: '#1c1a17',
      'pure-white': '#ffffff',
      grey: '#e8e6e3',
      'warm-light': '#f5f2ed',
      'warm-dark': '#e0dad2',
      opal: '#b0b5b0',
      lavender: '#ab8cd9',
      bordeaux: '#99335f',
      emerald: '#5999a6',
      purple: '#8a38f5',
      alert: '#f01111',

      // Semánticos — alias por uso. Preferir estos en componentes.
      fg: '#1c1a17', // texto principal
      bg: '#f5f2ed', // fondo global
      surface: '#ffffff', // fondo de cards, paneles, secciones que se superponen
      muted: '#e8e6e3', // bordes, separadores, estados disabled
    },

    // ----- Typography -----
    // Self-hosted via next/font. Las variables --font-* se inyectan desde app/[locale]/layout.tsx
    fontFamily: {
      serif: ['var(--font-ibm-plex-serif)', 'Georgia', 'serif'],
      mono: ['var(--font-ibm-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
    },
    fontSize: {
      // [size, { lineHeight, letterSpacing }]
      // Fijos — diferencia de 2px en estos rangos es imperceptible (−2px vs original)
      caption: ['10px', { lineHeight: '1.5', letterSpacing: '0' }],
      micro: ['12px', { lineHeight: '1.5', letterSpacing: '0' }],
      'card-sm': ['14px', { lineHeight: '1.5', letterSpacing: '0' }],
      label: ['16px', { lineHeight: '1.5', letterSpacing: '0' }],
      // Fluidos — clamp(mín@480px, slope·100vw + intercept, máx@1440px)
      // Fórmula Utopia: slope = (max−min)/(1440−480), intercept = min − slope·480
      // Todos los valores reducidos −2px respecto a la escala original.
      'body-sm': ['clamp(14px, calc(0.21vw + 15px), 18px)', { lineHeight: '1.5', letterSpacing: '0' }],
      body: ['clamp(16px, calc(0.42vw + 16px), 22px)', { lineHeight: '1.5', letterSpacing: '0' }],
      'title-mono': ['clamp(20px, calc(0.63vw + 17px), 26px)', { lineHeight: '1.5', letterSpacing: '0' }],
      subtitle: ['clamp(24px, calc(0.83vw + 20px), 32px)', { lineHeight: '1.0', letterSpacing: '0' }],
      'title-sm': ['clamp(26px, calc(0.83vw + 22px), 34px)', { lineHeight: '1.2', letterSpacing: '0' }],
      section: ['clamp(30px, calc(1.04vw + 25px), 40px)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      title: ['clamp(34px, calc(1.25vw + 28px), 46px)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      display: ['clamp(46px, calc(3.33vw + 30px), 78px)', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
      super: ['clamp(78px, calc(14.58vw + 8px), 218px)', { lineHeight: '0.70', letterSpacing: '-0.04em' }],
    },

    // ----- Spacing -----
    // Base escalar + aliases a CSS custom properties para las fórmulas fluidas.
    // Las vars viven en globals.css para que JS animado pueda leerlas también.
    spacing: {
      px: '1px',
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      10: '40px',
      12: '48px',
      14: '56px',
      16: '64px',
      18: '72px',
      20: '80px',
      24: '96px',
      28: '112px',
      32: '128px',
      40: '160px',
      48: '192px',

      // Section paddings estáticos por breakpoint (para overrides manuales)
      'section-xs': '48px', // ≤480
      'section-sm': '64px', // ≤768
      'section-md': '80px', // ≤900

      // Section padding fluido (valor por defecto recomendado)
      section: 'var(--s-section)',

      // Layout anchors
      sidebar: 'var(--sidebar-w)',
      'grid-margin': 'var(--grid-margin)',
      'grid-gutter': 'var(--grid-gutter)',

      // MenuOverlay — gaps entre columnas de nav y redes sociales
      'menu-col': '60px',
      'menu-social': '100px',
    },

    // ----- Max width -----
    maxWidth: {
      none: 'none',
      full: '100%',
      grid: '1440px',
      'grid-outer': 'calc(1440px + 2 * var(--grid-margin))',
      prose: '65ch',
      article: '800px',
    },

    // ----- Border radius -----
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '4px',
      md: '8px',
      lg: '16px',
      full: '9999px',
    },

    // ----- Borders -----
    borderWidth: {
      DEFAULT: '1px',
      0: '0',
      1: '1px',
      2: '2px',
    },

    // ----- Motion -----
    // Único easing del proyecto. Coincide con --ease en globals.css.
    transitionTimingFunction: {
      DEFAULT: 'cubic-bezier(.16, 1, .3, 1)',
      expo: 'cubic-bezier(.16, 1, .3, 1)',
      linear: 'linear',
    },
    transitionDuration: {
      DEFAULT: '550ms',
      fast: '200ms',
      mid: '550ms',
      slow: '1100ms',
      'line-reveal': '1200ms',
      // MenuOverlay — transiciones asimétricas (apertura más lenta que cierre)
      'menu-in': '600ms',
      'menu-out': '400ms',
    },
    transitionProperty: {
      DEFAULT: 'color, background-color, border-color, opacity, transform, clip-path',
      colors: 'color, background-color, border-color',
      opacity: 'opacity',
      transform: 'transform',
      'clip-path': 'clip-path',
      all: 'all',
      none: 'none',
    },

    // ----- Z-index -----
    // Keys semánticos alineados al stacking context del sistema.
    zIndex: {
      '-1': '-1',
      auto: 'auto',
      0: '0',
      content: '2',
      'intro-active': '5',
      sidebar: '50',
      'menu-overlay': '150',
      header: '200',
      'hero-fixed': '400',
      'page-transition': '500',
      modal: '1000',
    },

    // ----- Grid -----
    gridTemplateColumns: {
      1: 'repeat(1, minmax(0, 1fr))',
      2: 'repeat(2, minmax(0, 1fr))',
      3: 'repeat(3, minmax(0, 1fr))',
      4: 'repeat(4, minmax(0, 1fr))',
      5: 'repeat(5, minmax(0, 1fr))',
      6: 'repeat(6, minmax(0, 1fr))',
      12: 'repeat(12, minmax(0, 1fr))',
      work: 'repeat(12, minmax(0, 1fr))',
    },
    gridColumn: {
      auto: 'auto',
      'span-1': 'span 1 / span 1',
      'span-2': 'span 2 / span 2',
      'span-3': 'span 3 / span 3',
      'span-4': 'span 4 / span 4',
      'span-5': 'span 5 / span 5',
      'span-6': 'span 6 / span 6',
      'span-7': 'span 7 / span 7',
      'span-8': 'span 8 / span 8',
      'span-9': 'span 9 / span 9',
      'span-10': 'span 10 / span 10',
      'span-11': 'span 11 / span 11',
      'span-12': 'span 12 / span 12',
      'span-full': '1 / -1',
    },

    // ----- Aspect ratio -----
    aspectRatio: {
      auto: 'auto',
      square: '1 / 1',
      '4/3': '4 / 3',
      '3/2': '3 / 2',
      '16/9': '16 / 9',
      '3/4': '3 / 4',
      '2/3': '2 / 3',
    },

    // ----- Cursor -----
    cursor: {
      auto: 'auto',
      default: 'default',
      pointer: 'pointer',
      wait: 'wait',
      text: 'text',
      'not-allowed': 'not-allowed',
    },

    // extend solo para cosas ortogonales al sistema visual que no vale la pena listar arriba.
    extend: {
      opacity: {
        // Explícitos para evitar que aparezcan opacidades arbitrarias en revisión
        0: '0',
        10: '0.1',
        20: '0.2',
        30: '0.3',
        40: '0.4',
        50: '0.5',
        60: '0.6',
        70: '0.7',
        80: '0.8',
        90: '0.9',
        100: '1',
      },
    },
  },
  corePlugins: {
    // No hay container nativo de Tailwind — usamos .section-inner en globals.css
    container: false,
  },
  plugins: [],
}

export default config
