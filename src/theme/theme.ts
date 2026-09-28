/**
 * Tema do TapCal — fonte única de cores, fontes, espaçamentos e raios.
 * Toda tela e componente deve importar daqui; nada de cor "solta" no código.
 */

export const colors = {
  // Fundos
  ground: '#0A0A0D',
  panel: '#111116',
  panel2: '#16161C',

  // Vidro (cartões e barra flutuante)
  glassFill: 'rgba(255,255,255,0.05)',
  glassFillStrong: 'rgba(255,255,255,0.08)',
  line: 'rgba(255,255,255,0.09)',
  line2: 'rgba(255,255,255,0.16)',

  // Texto
  ink: '#F4F1EE',
  ink2: 'rgba(244,241,238,0.66)',
  ink3: 'rgba(244,241,238,0.42)',
  onEmber: '#2A0C02',

  // Marca e acentos
  ember: '#FF6A45',
  ember2: '#FF9A5C',
  gold: '#FFC56B',
  iris: '#9A8CFF',
  ok: '#8FF0BF',
  tide: '#5CC8FF',
} as const;

/** Degradê principal (botão primário, medidor, destaques). */
export const gradients = {
  ember: [colors.gold, colors.ember2, colors.ember] as const,
  // Brilho do topo: laranja que some no fundo escuro
  topGlow: ['rgba(255,106,69,0.34)', 'rgba(255,154,92,0.12)', 'rgba(10,10,13,0)'] as const,
};

/**
 * Famílias carregadas em src/app/_layout.tsx via @expo-google-fonts.
 * Sora = títulos e números; Manrope = texto corrido e rótulos.
 */
export const fonts = {
  display: {
    medium: 'Sora_500Medium',
    semibold: 'Sora_600SemiBold',
    bold: 'Sora_700Bold',
  },
  body: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Estilos de texto nomeados, usados pelo componente <Text variant="…">. */
export const typography = {
  display: { fontFamily: fonts.display.bold, fontSize: 40, lineHeight: 42, letterSpacing: -1.6 },
  title: { fontFamily: fonts.display.semibold, fontSize: 28, lineHeight: 32, letterSpacing: -0.9 },
  heading: { fontFamily: fonts.display.semibold, fontSize: 19, lineHeight: 24, letterSpacing: -0.4 },
  body: { fontFamily: fonts.body.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.body.semibold, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.body.medium, fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  number: { fontFamily: fonts.display.semibold, fontSize: 22, lineHeight: 26, letterSpacing: -0.5 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Medidas da barra inferior flutuante — as telas usam para não ficar atrás dela. */
export const tabBar = {
  height: 64,
  bottomGap: 12,
  sideGap: 20,
  plusSize: 56,
} as const;

export const theme = { colors, gradients, fonts, spacing, radius, typography, tabBar } as const;
export default theme;
