export const colors = {
  bg: '#0D0F12',
  bgSoft: '#14171C',
  card: '#181C22',
  card2: '#1F242C',
  border: 'rgba(255,255,255,0.07)',
  txt: '#F2F4F6',
  txt2: '#A6AEB8',
  txt3: '#6B7480',
  acc: '#C8F31D',
  accSoft: 'rgba(200,243,29,0.14)',
  blue: '#5BC8F5',
  orange: '#FF8A5B',
  red: '#FF5B6A',
} as const;

export const radius = {
  lg: 24,
  md: 18,
  sm: 12,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
} as const;

export const typography = {
  label: { fontSize: 12, color: colors.txt3, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const, color: colors.txt },
  num: { fontVariant: ['tabular-nums'] as ('tabular-nums')[], fontWeight: '700' as const, letterSpacing: -0.5 },
} as const;

export const theme = { colors, radius, spacing, typography } as const;
export type Theme = typeof theme;
