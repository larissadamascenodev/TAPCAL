/**
 * Tema do TapCal — fonte única de cores, fontes, espaçamentos e raios.
 * Toda tela e componente deve importar daqui; nada de cor "solta" no código.
 */

export const colors = {
  // Fundos (valores dos mockups em design-reference/)
  ground: '#08080B',
  panel: '#0C0C10',
  panel2: '#16161C',

  // Vidro (cartões e barra flutuante)
  glassFill: 'rgba(255,255,255,0.055)',
  glassFillStrong: 'rgba(255,255,255,0.09)',
  glassSubtle: 'rgba(255,255,255,0.035)',
  line: 'rgba(255,255,255,0.11)',
  line2: 'rgba(255,255,255,0.22)',
  lineSoft: 'rgba(255,255,255,0.07)',
  track: 'rgba(255,255,255,0.08)',
  navFill: 'rgba(28,28,34,0.72)',
  navActive: 'rgba(255,255,255,0.10)',

  // Texto
  ink: '#F6F4F1',
  ink2: 'rgba(246,244,241,0.62)',
  ink3: 'rgba(246,244,241,0.38)',
  onEmber: '#2A0C02',
  onInk: '#0B0B0E',

  // Marca e acentos
  ember: '#FF6A45',
  ember2: '#FF9A5C',
  gold: '#FFC56B',
  iris: '#9A8CFF',
  irisSoft: '#B9AFFF',
  ok: '#8FF0BF',
  tide: '#5CC8FF',

  // Tons translúcidos dos acentos
  emberTint: 'rgba(255,106,69,0.12)',
  emberEdge: 'rgba(255,106,69,0.55)',
  okTint: 'rgba(122,230,170,0.14)',
  tideTint: 'rgba(92,200,255,0.18)',
  tideEdge: 'rgba(92,200,255,0.35)',
  tideText: '#CDEEFF',
  irisTint: 'rgba(154,140,255,0.12)',
  irisEdge: 'rgba(154,140,255,0.35)',
  goldTint: 'rgba(255,197,107,0.06)',
  goldEdge: 'rgba(255,197,107,0.28)',
  emberWash: 'rgba(255,106,69,0.08)',
  okFill: 'rgba(122,230,170,0.18)',
  emberDeep: '#C44828',
  emberLine: '#FF8A55',
  emberHighlight: '#FFD9C7',
  gaugeDot: '#FFF3EC',

  // Neutros de apoio
  white: '#FFFFFF',
  shadow: '#000000',
  avatarFill: '#15151A',
  toastFill: 'rgba(30,30,36,0.94)',
  photoScrim: 'rgba(0,0,0,0.35)',
  handle: 'rgba(255,255,255,0.2)',
  dashed: 'rgba(255,255,255,0.14)',
  divider: 'rgba(255,255,255,0.10)',
  gridLine: 'rgba(255,255,255,0.06)',
  ticks: 'rgba(255,255,255,0.22)',
  frostFill: 'rgba(255,255,255,0.20)',
  frostEdge: 'rgba(255,255,255,0.45)',
  tagFill: 'rgba(10,10,12,0.62)',
} as const;

/** Cor de cada macro, igual em todas as telas. */
export const macroColors = {
  proteinG: colors.ember,
  carbsG: colors.gold,
  fatG: colors.iris,
} as const;

/** Degradê principal (botão primário, medidor, destaques). */
export const gradients = {
  ember: [colors.gold, colors.ember2, colors.ember] as const,
  // Botão + e botões de ação: laranja → laranja claro, como nos mockups
  fab: [colors.ember, colors.ember2] as const,
  // Cartão de treino: violeta suave que some no vidro
  workout: ['rgba(154,140,255,0.22)', 'rgba(255,255,255,0.04)'] as const,
  // Treino de hoje: laranja suave que some no vidro
  workoutHero: ['rgba(255,106,69,0.20)', 'rgba(255,255,255,0.04)'] as const,
  // Água: azul que enche o cartão
  water: ['rgba(92,200,255,0.28)', 'rgba(92,200,255,0.08)'] as const,
  // Linha dourada que varre a foto durante a análise
  sweep: ['rgba(255,197,107,0)', colors.gold, 'rgba(255,197,107,0)'] as const,
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
  xxl: 30,
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
  bottomGap: 8,
  sideGap: 16,
  plusSize: 64,
} as const;

export const theme = { colors, macroColors, gradients, fonts, spacing, radius, typography, tabBar } as const;
export default theme;
