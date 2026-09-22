// ─── Brand Configuration ─────────────────────────────────────────────────────
// Everything club/company-specific lives here. When this becomes a product
// for other clubs, this is the one file that changes — the name, the logo,
// and the accent color propagate everywhere else automatically because
// every page pulls colors from theme.ts (which reads from here), and every
// page that shows the brand name imports BRAND.name / BRAND.productName
// instead of hardcoding the string.
//
// What this does NOT cover: semantic colors (green/amber/red-status in
// theme.ts) — those mean "success/warning/danger" and shouldn't change
// per brand. Only the accent/primary color is brand-specific.

export const BRAND = {
  name: 'Virgin Active',
  productName: 'Padel Club Manager',
  tagline: 'Club operations platform',

  // Used for Excel/report/document title banners — deliberately separate
  // from `name` + `productName` since a report header often reads
  // differently than the in-app nav (e.g. "VIRGIN ACTIVE PADEL" vs.
  // "Virgin Active — Padel Club Manager").
  reportHeader: 'VIRGIN ACTIVE PADEL',

  // Swap this file at public/logo.png (or update the path) to change the mark.
  logoPath: '/logo.png',

  // The one accent color used throughout theme.ts as `colors.red`. The key
  // name stays "red" in theme.ts for backward compatibility with pages
  // already built against T.colors.red — only the *value* changes here.
  primaryColor: '#e00a09',
  primaryColorGlow: 'rgba(224, 10, 9, 0.15)',
  primaryColorGlowStrong: 'rgba(224, 10, 9, 0.25)',
} as const