// ─── Design System ──────────────────────────────────────────────────────────
// Aesthetic: Sleek dark, glowing accent, breathing room, AI-mechanic feel
//
// NOTE ON LIGHT/DARK: colors below that differ between modes now reference
// CSS custom properties (var(--color-bg) etc.) instead of hardcoded hex.
// Those variables are defined once, for both :root (dark) and html.light
// (light), in app/components/layout-shell.tsx. Toggling the `.light` class
// on <html> is what actually switches them — every page that imports this
// theme file picks up the change automatically, no per-page changes needed.
//
// NOTE ON BRANDING: the accent color below comes from lib/config/brand.ts,
// not a hardcoded hex. The key is still named `red` for backward
// compatibility with every page already built against T.colors.red — swap
// BRAND.primaryColor in brand.ts to re-skin the whole app's accent color.
// Semantic colors (green/amber/red-status = success/warning/danger) are
// intentionally NOT brand-linked — those mean the same thing for any club.

import { BRAND } from '@/lib/config/brand'

// Converts BRAND.primaryColor (hex) into an rgba() string at a given alpha,
// so glow/shadow effects stay tied to the brand color instead of a second
// set of hardcoded literals that would drift out of sync when re-skinning.
function brandRgba(alpha: number): string {
  const hex = BRAND.primaryColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const theme = {

  // ── Core colours ──────────────────────────────────────────────────────────
  colors: {
    // Brand
    red:          BRAND.primaryColor,
    redGlow:      BRAND.primaryColorGlow,
    redGlowStrong:BRAND.primaryColorGlowStrong,

    // Surfaces — dark layered system (mode-aware via CSS vars)
    bg:           'var(--color-bg)',            // page background
    surface:      'var(--color-surface)',        // cards, panels
    surfaceHover: 'var(--color-surface-hover)',  // card hover state
    surfaceRaised:'var(--color-surface-raised)', // elevated elements, modals
    border:       'var(--color-border)',         // subtle borders
    borderBright: 'var(--color-border-bright)',  // slightly more visible borders

    // Text (mode-aware via CSS vars)
    textPrimary:  'var(--color-text-primary)',   // headings, key values
    textSecondary:'var(--color-text-secondary)', // labels, secondary info
    textMuted:    'var(--color-text-muted)',     // placeholder, disabled
    textInverse:  '#0a0a0a',                     // text on red backgrounds (constant)

    // Status
    green:        '#22c55e',
    greenGlow:    'rgba(34, 197, 94, 0.12)',
    amber:        '#f59e0b',
    amberGlow:    'rgba(245, 158, 11, 0.12)',
    redStatus:    '#ef4444',
    redStatusGlow:'rgba(239, 68, 68, 0.12)',
  },

  // ── Typography ────────────────────────────────────────────────────────────
  type: {
    // Page headers
    pageTitle:   { fontSize: '22px', fontWeight: '700', letterSpacing: '-0.02em' },
    pageSubtitle:{ fontSize: '13px', fontWeight: '400', letterSpacing: '0.01em' },

    // Section headers inside cards
    sectionTitle:{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' as const },

    // Data values
    statValue:   { fontSize: '32px', fontWeight: '700', letterSpacing: '-0.03em' },
    statLabel:   { fontSize: '11px', fontWeight: '500', letterSpacing: '0.08em', textTransform: 'uppercase' as const },

    // Body
    body:        { fontSize: '14px', fontWeight: '400' },
    bodySmall:   { fontSize: '12px', fontWeight: '400' },
    caption:     { fontSize: '11px', fontWeight: '400', letterSpacing: '0.02em' },

    // Mono — for data, codes, times
    mono:        { fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: '13px' },
  },

  // ── Spacing ───────────────────────────────────────────────────────────────
  space: {
    pagePadding: '32px 36px',
    cardPadding: '24px',
    gap:         '16px',
    gapLarge:    '24px',
  },

  // ── Borders & radius ──────────────────────────────────────────────────────
  radius: {
    sm:   '6px',
    md:   '10px',
    lg:   '14px',
    xl:   '20px',
    pill: '999px',
  },

  // ── Shadows & glows ───────────────────────────────────────────────────────
  shadow: {
    card:      '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
    cardHover: '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
    redGlow:   `0 0 20px ${brandRgba(0.3)}, 0 0 40px ${brandRgba(0.1)}`,
    redGlowSm: `0 0 10px ${brandRgba(0.2)}`,
    elevated:  '0 8px 32px rgba(0,0,0,0.6)',
  },

  // ── Reusable component styles ─────────────────────────────────────────────
  card: {
    background:   'var(--color-surface)',
    border:       '1px solid var(--color-border)',
    borderRadius: '14px',
    boxShadow:    '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
    padding:      '24px',
    marginBottom: '16px',
  } as React.CSSProperties,

  cardHover: {
    background:   'var(--color-surface-hover)',
    border:       '1px solid var(--color-border-bright)',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
  } as React.CSSProperties,

  // Active / selected card — red glow border
  cardActive: {
    background:   'var(--color-surface)',
    border:       `1px solid ${BRAND.primaryColor}`,
    borderRadius: '14px',
    boxShadow:    `0 0 0 1px ${brandRgba(0.3)}, 0 0 20px ${brandRgba(0.1)}`,
    padding:      '24px',
  } as React.CSSProperties,

  input: {
    background:   'var(--color-surface-hover)',
    border:       '1px solid var(--color-border-bright)',
    borderRadius: '8px',
    color:        'var(--color-text-primary)',
    fontSize:     '14px',
    fontFamily:   'inherit',
    outline:      'none',
    padding:      '10px 14px',
    width:        '100%',
    boxSizing:    'border-box' as const,
  } as React.CSSProperties,

  // ── Button variants ───────────────────────────────────────────────────────
  btn: {
    primary: {
      background:   BRAND.primaryColor,
      color:        '#fff',
      border:       'none',
      borderRadius: '8px',
      fontSize:     '13px',
      fontWeight:   '600',
      fontFamily:   'inherit',
      cursor:       'pointer',
      padding:      '10px 20px',
      transition:   'box-shadow 0.2s ease, background 0.2s ease',
    } as React.CSSProperties,

    secondary: {
      background:   'var(--color-surface-raised)',
      color:        'var(--color-text-primary)',
      border:       '1px solid var(--color-border-bright)',
      borderRadius: '8px',
      fontSize:     '13px',
      fontWeight:   '600',
      fontFamily:   'inherit',
      cursor:       'pointer',
      padding:      '10px 20px',
      transition:   'border-color 0.2s ease',
    } as React.CSSProperties,

    ghost: {
      background:   'transparent',
      color:        'var(--color-text-secondary)',
      border:       '1px solid var(--color-border)',
      borderRadius: '8px',
      fontSize:     '12px',
      fontWeight:   '500',
      fontFamily:   'inherit',
      cursor:       'pointer',
      padding:      '6px 14px',
    } as React.CSSProperties,

    danger: {
      background:   'rgba(239,68,68,0.1)',
      color:        '#ef4444',
      border:       '1px solid rgba(239,68,68,0.2)',
      borderRadius: '8px',
      fontSize:     '13px',
      fontWeight:   '600',
      fontFamily:   'inherit',
      cursor:       'pointer',
      padding:      '10px 20px',
    } as React.CSSProperties,
  },

  // ── Period toggle pills (Reports, Dashboard filters) ──────────────────────
  periodBtn: (active: boolean) => ({
    padding:      '6px 14px',
    borderRadius: '6px',
    fontFamily:   'inherit',
    cursor:       'pointer',
    fontSize:     '12px',
    fontWeight:   active ? '600' : '400',
    border:       active ? 'none' : '1px solid var(--color-border)',
    background:   active ? BRAND.primaryColor : 'transparent',
    color:        active ? '#fff' : 'var(--color-text-secondary)',
    transition:   'all 0.15s ease',
  } as React.CSSProperties),

  // ── Status badges ─────────────────────────────────────────────────────────
  badge: {
    green:  { background: 'rgba(34,197,94,0.1)',   color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)'   },
    amber:  { background: 'rgba(245,158,11,0.1)',  color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)'  },
    red:    { background: 'rgba(239,68,68,0.1)',   color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)'   },
    blue:   { background: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)'  },
    purple: { background: 'rgba(168,85,247,0.1)',  color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)'  },
    muted:  { background: 'rgba(136,136,136,0.1)', color: '#888888', border: '1px solid rgba(136,136,136,0.2)' },
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: {
    borderTop: '1px solid var(--color-border)',
    margin: '0',
  } as React.CSSProperties,

  // ── Scrollbar (apply to globals.css) ──────────────────────────────────────
  // ::-webkit-scrollbar { width: 4px; height: 4px }
  // ::-webkit-scrollbar-track { background: #0a0a0a }
  // ::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 4px }
  // ::-webkit-scrollbar-thumb:hover { background: <BRAND.primaryColor> }
}

export type Theme = typeof theme