/** @type {import('tailwindcss').Config}
 * Cyvora design tokens — derived directly from DESIGN.md.
 * "Institutional Modernism": Deep Trust Blue + Signal Green, Public Sans /
 * Work Sans, 8px grid, low-contrast outlines instead of heavy shadows.
 */
module.exports = {
  content: ['./**/*.html', './assets/js/**/*.js'],
  // Classes applied at runtime by quiz.js / templates that Tailwind's static
  // scan can miss. Safelisted so they're always in the compiled CSS.
  safelist: [
    'bg-secondary/10', 'bg-error/10', 'text-secondary', 'text-error',
    'border-secondary', 'border-error', 'hover:border-primary', 'hover:bg-primary/5',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#002869',
        'on-primary': '#ffffff',
        'primary-container': '#0b3d91',
        'on-primary-container': '#8dadff',
        'inverse-primary': '#b1c5ff',
        secondary: '#006d3b',
        'on-secondary': '#ffffff',
        'secondary-container': '#78f8a6',
        'on-secondary-container': '#00723d',
        tertiary: '#262d33',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#3c434a',
        'on-tertiary-container': '#a9afb8',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        background: '#f9f9fc',
        'on-background': '#1a1c1e',
        surface: '#f9f9fc',
        'on-surface': '#1a1c1e',
        'on-surface-variant': '#434652',
        'surface-variant': '#e2e2e5',
        'surface-dim': '#dadadc',
        'surface-bright': '#f9f9fc',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f3f6',
        'surface-container': '#eeeef0',
        'surface-container-high': '#e8e8ea',
        'surface-container-highest': '#e2e2e5',
        outline: '#747783',
        'outline-variant': '#c4c6d3',
        'inverse-surface': '#2f3133',
        'inverse-on-surface': '#f0f0f3',
        'surface-tint': '#345baf',
        'primary-fixed': '#dae2ff',
        'primary-fixed-dim': '#b1c5ff',
        'on-primary-fixed': '#001947',
        'on-primary-fixed-variant': '#144296',
        'secondary-fixed': '#7bfba8',
        'secondary-fixed-dim': '#5dde8e',
        'on-secondary-fixed': '#00210e',
        'on-secondary-fixed-variant': '#00522b',
        'tertiary-fixed': '#dde3ec',
        'tertiary-fixed-dim': '#c1c7d0',
        'on-tertiary-fixed': '#161c23',
        'on-tertiary-fixed-variant': '#41474f',
      },
      fontFamily: {
        sans: ['Public Sans', 'system-ui', 'sans-serif'],
        display: ['Public Sans', 'system-ui', 'sans-serif'],
        label: ['Work Sans', 'system-ui', 'sans-serif'],
      },
      // Type scale from DESIGN.md — [size, { lineHeight, letterSpacing, fontWeight }]
      fontSize: {
        'display-lg': ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '500' }],
        'label-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.04em', fontWeight: '600' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        unit: '8px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '32px',
        gutter: '24px',
        'margin-desktop': '48px',
        'section-gap': '64px',
      },
      maxWidth: {
        container: '1440px',
      },
      borderRadius: {
        // DESIGN.md: refined desktop radii. Chips 4px, cards/buttons 6–8px.
        sm: '0.25rem',   // 4px — status chips, icons/media
        DEFAULT: '0.375rem', // 6px — buttons, inputs
        md: '0.5rem',    // 8px — cards, containers
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      boxShadow: {
        // Level 2 hover: soft 8% blue-tinted, per DESIGN.md elevation
        'level-2': '0 4px 12px rgba(11, 61, 145, 0.08)',
        'level-2-lg': '0 8px 24px rgba(11, 61, 145, 0.10)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
      },
    },
  },
  plugins: [],
}
