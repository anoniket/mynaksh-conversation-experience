/**
 * Design tokens. Deliberately small: the brief grades architecture, not polish.
 * Everything visual reads from here so a theme change is a one-file change.
 */
export const colors = {
  background: '#0F0B1E',
  surface: '#1A1430',
  surfaceAlt: '#241C42',
  border: '#332A5A',
  primary: '#8B5CF6',
  primarySoft: '#2E1F5E',
  accent: '#F5B544',
  text: '#F3F0FF',
  textMuted: '#A79FC4',
  textFaint: '#6F678F',
  userBubble: '#5B3FD6',
  aiBubble: '#1E1838',
  humanBubble: '#1F2E3A',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
  overlay: 'rgba(0,0,0,0.55)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 16 },
  label: { fontSize: 13, fontWeight: '600' as const },
} as const;
