import { EMBEDDED_FONT_STYLES } from "./fontStyles.js";

/**
 * Premium CSS styles aligned with the main app design system
 * Includes embedded fonts, color palette, and premium design tokens
 */

export const PREMIUM_BASE_STYLES = `
${EMBEDDED_FONT_STYLES}

/* =========================
   Design tokens & variables
   ========================= */
:root {
  /* Typography */
  --font-primary: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;

  /* Brand colors */
  --color-primary: #4f46e5;      /* indigo-600 */
  --color-primary-light: #818cf8; /* indigo-400 */
  --color-accent: #06b6d4;       /* cyan-500 */
  --color-highlight: #d946ef;    /* fuchsia-500 */

  /* Neutrals */
  --color-bg: #ffffff;
  --color-fg: #0b1220;           /* ink */
  --color-muted: #64748b;        /* slate-500 */
  --color-border: #e2e8f0;       /* slate-200 */
  --color-surface: #ffffff;
  --color-surface-2: #f8fafc;    /* slate-50 */
  --color-surface-3: #f1f5f9;    /* slate-100 */

  /* Semantic colors */
  --color-success: #16a34a;      /* green-600 */
  --color-warning: #f59e0b;      /* amber-500 */
  --color-danger: #ef4444;       /* red-500 */
  --color-info: #3b82f6;         /* blue-500 */

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.07);
  --shadow-lg: 0 10px 24px rgba(15, 23, 42, 0.1);
  --shadow-xl: 0 20px 40px rgba(15, 23, 42, 0.12);
  --shadow-premium: 0 1px 1px rgba(15, 23, 42, 0.04), 0 18px 50px rgba(15, 23, 42, 0.1);

  /* Radius */
  --radius-sm: 0.5rem;   /* 8px */
  --radius-md: 0.875rem; /* 14px */
  --radius-lg: 1.25rem;  /* 20px */
  --radius-xl: 1.5rem;   /* 24px */

  /* Spacing scale (matching Tailwind) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
}

/* =========================
   Base styles
   ========================= */
@page {
  size: A4;
  margin: 14mm;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-primary);
  color: var(--color-fg);
  font-size: 13px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* =========================
   Typography
   ========================= */
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-fg);
  letter-spacing: -0.02em;
}

h1 {
  font-size: 28px;
  font-weight: 900;
  margin-bottom: 12px;
}

h2 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}

p {
  margin-bottom: 12px;
  line-height: 1.7;
}

strong, b {
  font-weight: 700;
}

.text-sm {
  font-size: 12px;
}

.text-muted {
  color: var(--color-muted);
}

/* =========================
   Layout utilities
   ========================= */
.container {
  max-width: 100%;
}

.section {
  margin-bottom: var(--space-8);
  break-inside: avoid;
  page-break-inside: avoid;
}

.page-break {
  break-before: page;
  page-break-before: always;
}

.avoid-break {
  break-inside: avoid;
  page-break-inside: avoid;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* =========================
   Premium components
   ========================= */

/* Card with premium gradient background */
.card {
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #fafbfc 100%
  );
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
}

.card-premium {
  background: linear-gradient(
    135deg,
    #ffffff 0%,
    var(--color-surface-2) 100%
  );
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-premium);
}

/* Badge/Pill */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--color-border);
  background: var(--color-surface-2);
}

.badge-primary {
  background: rgba(79, 70, 229, 0.1);
  color: var(--color-primary);
  border-color: rgba(79, 70, 229, 0.2);
}

.badge-accent {
  background: rgba(6, 182, 212, 0.1);
  color: var(--color-accent);
  border-color: rgba(6, 182, 212, 0.2);
}

.badge-success {
  background: rgba(22, 163, 74, 0.1);
  color: var(--color-success);
  border-color: rgba(22, 163, 74, 0.2);
}

/* Divider */
.divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-6) 0;
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: var(--space-4);
  margin-bottom: var(--space-6);
  border-bottom: 2px solid var(--color-border);
}

.header-title {
  font-size: 24px;
  font-weight: 900;
  margin-bottom: 8px;
  color: var(--color-fg);
  letter-spacing: -0.02em;
}

.header-meta {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 6px;
}

.logo {
  height: 48px;
  object-fit: contain;
}

/* Stat box */
.stat-box {
  text-align: center;
  padding: var(--space-5);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-2) 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.stat-value {
  font-size: 32px;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Progress bar */
.progress-bar {
  height: 28px;
  background: var(--color-surface-3);
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.08);
}

.progress-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  transition: width 0.3s ease;
  border-radius: var(--radius-sm);
}

/* Alert/Note box */
.note {
  padding: var(--space-4);
  background: var(--color-surface-2);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--radius-sm);
  font-size: 12px;
  line-height: 1.5;
  color: #334155;
}

.note-info {
  border-left-color: var(--color-info);
  background: rgba(59, 130, 246, 0.05);
}

.note-success {
  border-left-color: var(--color-success);
  background: rgba(22, 163, 74, 0.05);
}

.note-warning {
  border-left-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
}

/* =========================
   Print optimization
   ========================= */
@media print {
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .section {
    break-inside: avoid;
  }

  .avoid-break {
    break-inside: avoid;
  }

  .card, .card-premium {
    box-shadow: none;
    border: 1px solid var(--color-border);
  }
}
`;

/**
 * Utility function to create color variants
 */
export function getColorWithOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Generate a CSS gradient for premium cards
 */
export function getPremiumGradient(
  color1: string = "#ffffff",
  color2: string = "#f8fafc",
  deg: number = 135
): string {
  return `linear-gradient(${deg}deg, ${color1} 0%, ${color2} 100%)`;
}
