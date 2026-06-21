// ─── Virgin Active Padel — Design System ───────────────────────────────────
// Aesthetic: Sleek dark, glowing red accents, breathing room, AI-mechanic feel

export const theme = {

  // ── Core colours ──────────────────────────────────────────────────────────
  colors: {
    // Brand
    red:          '#e00a09',
    redGlow:      'rgba(224, 10, 9, 0.15)',
    redGlowStrong:'rgba(224, 10, 9, 0.25)',

    // Surfaces — dark layered system
    bg:           '#0a0a0a',   // page background
    surface:      '#111111',   // cards, panels
    surfaceHover: '#161616',   // card hover state
    surfaceRaised:'#1a1a1a',   // elevated elements, modals
    border:       '#222222',   // subtle borders
    borderBright: '#2e2e2e',   // slightly more visible borders

    // Text
    textPrimary:  '#f0f0f0',   // headings, key values
    textSecondary:'#888888',   // labels, secondary info
    textMuted:    '#444444',   // placeholder, disabled
    textInverse:  '#0a0a0a',   // text on red backgrounds

    // Status
    green:        '#22c55e',
    greenGlow:    'rgba(34, 197, 94, 0.12)',
    amber:        '#f59e0b',
    amberGlow:    'rgba(245, 158, 11, 0.12)',
    redStatus:    '#ef4444',
    redStatusGlow:'rgba(239, 68, 68, 0.12)',

    // Light mode overrides (toggled via class on <html>)
    light: {
      bg:           '#f4f4f4',
      surface:      '#ffffff',
      surfaceHover: '#fafafa',
      surfaceRaised:'#f0f0f0',
      border:       '#e8e8e8',
      borderBright: '#d8d8d8',
      textPrimary:  '#0a0a0a',
      textSecondary:'#666666',
      textMuted:    '#aaaaaa',
    }
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
    redGlow:   '0 0 20px rgba(224,10,9,0.3), 0 0 40px rgba(224,10,9,0.1)',
    redGlowSm: '0 0 10px rgba(224,10,9,0.2)',
    elevated:  '0 8px 32px rgba(0,0,0,0.6)',
  },

  // ── Reusable component styles ─────────────────────────────────────────────
  card: {
    background:   '#111111',
    border:       '1px solid #222222',
    borderRadius: '14px',
    boxShadow:    '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
    padding:      '24px',
    marginBottom: '16px',
  } as React.CSSProperties,

  cardHover: {
    background:   '#161616',
    border:       '1px solid #2e2e2e',
    boxShadow:    '0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
  } as React.CSSProperties,

  // Active / selected card — red glow border
  cardActive: {
    background:   '#111111',
    border:       '1px solid #e00a09',
    borderRadius: '14px',
    boxShadow:    '0 0 0 1px rgba(224,10,9,0.3), 0 0 20px rgba(224,10,9,0.1)',
    padding:      '24px',
  } as React.CSSProperties,

  input: {
    background:   '#161616',
    border:       '1px solid #2e2e2e',
    borderRadius: '8px',
    color:        '#f0f0f0',
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
      background:   '#e00a09',
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
      background:   '#1a1a1a',
      color:        '#f0f0f0',
      border:       '1px solid #2e2e2e',
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
      color:        '#888888',
      border:       '1px solid #222222',
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
    border:       active ? 'none' : '1px solid #222222',
    background:   active ? '#e00a09' : 'transparent',
    color:        active ? '#fff' : '#888888',
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
    borderTop: '1px solid #1e1e1e',
    margin: '0',
  } as React.CSSProperties,

  // ── Scrollbar (apply to globals.css) ──────────────────────────────────────
  // ::-webkit-scrollbar { width: 4px; height: 4px }
  // ::-webkit-scrollbar-track { background: #0a0a0a }
  // ::-webkit-scrollbar-thumb { background: #2e2e2e; border-radius: 4px }
  // ::-webkit-scrollbar-thumb:hover { background: #e00a09 }
}

export type Theme = typeof theme