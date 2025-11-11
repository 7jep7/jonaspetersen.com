/**
 * Forgis AI Brand Color Palette
 * Official brand colors for consistent theming
 */
export const FORGIS_COLORS = {
  fire: '#FF4D00',      // Primary CTA, highlights
  tiger: '#FF762B',     // Hover states
  flicker: '#DC4B07',   // Alerts, warnings
  platinum: '#CCD3D6',  // Secondary text
  steel: '#707B84',     // Borders, dividers
  white: '#FFFFFF',     // Text, backgrounds
  gunmetal: '#122128'   // Dark backgrounds
} as const;

/**
 * Helper function to generate Tailwind-compatible CSS variables
 */
export const forgisCssVars = {
  '--forgis-fire': FORGIS_COLORS.fire,
  '--forgis-tiger': FORGIS_COLORS.tiger,
  '--forgis-flicker': FORGIS_COLORS.flicker,
  '--forgis-platinum': FORGIS_COLORS.platinum,
  '--forgis-steel': FORGIS_COLORS.steel,
  '--forgis-white': FORGIS_COLORS.white,
  '--forgis-gunmetal': FORGIS_COLORS.gunmetal,
} as const;
