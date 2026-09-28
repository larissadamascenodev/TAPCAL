/**
 * Tema do TapCal — fonte única de cores, fontes, espaçamentos e raios.
 * Toda tela e componente deve importar daqui; nada de cor "solta" no código.
 */

export const colors = {
  // Fundos: quase preto, sem luzes coloridas (mockups em design-reference/)
  ground: '#050506',
  panel: '#0C0C0F',
  panel2: '#16161A',

  // Vidro líquido (cartões, barra flutuante e botões)
  glassFill: 'rgba(255,255,255,0.06)',
  glassFillStrong: 'rgba(255,255,255,0.12)',
  glassSubtle: 'rgba(255,255,255,0.035)',
  glassHighlight: 'rgba(255,255,255,0.22)',
  line: 'rgba(255,255,255,0.14)',
  line2: 'rgba(255,255,255,0.24)',
  lineSoft: 'rgba(255,255,255,0.07)',
  track: 'rgba(255,255,255,0.10)',
  navFill: 'rgba(28,28,34,0.55)',
  navActive: 'rgba(255,255,255,0.14)',

  // Texto
  ink: '#F4F5F0',
  ink2: 'rgba(244,245,240,0.66)',
  ink3: 'rgba(244,245,240,0.42)',
  onLime: '#152000',
  onInk: '#101113',

  // Marca e acentos
  lime: '#D1FB39',
  lime2: '#E4FF7A',
  limeLight: '#EEFFA8',
  limeDeep: '#A9E01C',
  gold: '#FFC56B',
  iris: '#9A8CFF',
  irisSoft: '#B9AFFF',
  mint: '#2ED3A0',
  ok: '#8FF0BF',
  tide: '#57B8FF',
  warn: '#FF8A5C',
  warnText: '#FFB08A',

  // Tons translúcidos dos acentos
  limeTint: 'rgba(209,251,57,0.16)',
  limeEdge: 'rgba(209,251,57,0.45)',
  limeWash: 'rgba(209,251,57,0.08)',
  okTint: 'rgba(122,230,170,0.14)',
  tideTint: 'rgba(87,184,255,0.18)',
  tideEdge: 'rgba(87,184,255,0.35)',
  tideText: '#CDEEFF',
  irisTint: 'rgba(154,140,255,0.12)',
  irisEdge: 'rgba(154,140,255,0.35)',
  goldTint: 'rgba(255,197,107,0.06)',
  goldEdge: 'rgba(255,197,107,0.28)',
  warnTint: 'rgba(255,138,92,0.16)',
  warnEdge: 'rgba(255,138,92,0.40)',
  okFill: 'rgba(122,230,170,0.18)',
  limeLine: '#D1FB39',
  limeHighlight: '#F7FFE0',
  gaugeDot: '#F7FFE0',

  // Balão de fala do mascote
  bubble: '#F4F5F0',
  onBubble: '#15161A',

  // Neutros de apoio
  white: '#FFFFFF',
  shadow: '#000000',
  avatarFill: '#15161A',
  toastFill: 'rgba(30,30,36,0.94)',
  photoScrim: 'rgba(0,0,0,0.35)',
  handle: 'rgba(255,255,255,0.2)',
  dashed: 'rgba(255,255,255,0.14)',
  divider: 'rgba(255,255,255,0.10)',
  gridLine: 'rgba(255,255,255,0.06)',
  ticks: 'rgba(255,255,255,0.20)',
  frostFill: 'rgba(255,255,255,0.14)',
  frostEdge: 'rgba(255,255,255,0.38)',
  frostActive: 'rgba(244,245,240,0.92)',
  tagFill: 'rgba(10,10,12,0.62)',
  headerFill: 'rgba(5,5,6,0.72)',
} as const;

/** Cor de cada macro, igual em todas as telas. */
export const macroColors = {
  proteinG: colors.lime,
  carbsG: colors.mint,
  fatG: colors.iris,
} as const;

/** Degradês do app. */
export const gradients = {
  // Medidor e barra principal: verde claro → verde neon
  lime: [colors.limeLight, colors.lime, colors.limeDeep] as const,
  // Medidor quando passa da meta
  over: [colors.lime, '#FFB25C', '#FF7A59'] as const,
  // Barra do dia no cartão "Total de hoje" (e quando passa da meta)
  bar: [colors.limeLight, colors.lime] as const,
  barOver: [colors.lime, colors.warn] as const,
  // Botão primário
  accent: [colors.limeLight, colors.lime] as const,
  // Vidro líquido: brilho diagonal por cima do desfoque
  glass: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.035)', 'rgba(255,255,255,0.06)'] as const,
  // Barra de baixo e botão +: vidro um pouco mais claro
  glassStrong: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)'] as const,
  // Topo fixo da Início ao rolar: escurece e some para baixo, sem linha marcada
  header: ['rgba(5,5,6,0.9)', 'rgba(5,5,6,0.7)', 'rgba(5,5,6,0.25)', 'rgba(5,5,6,0)'] as const,
  // Anel do avatar
  avatar: [colors.lime, colors.mint, colors.lime] as const,
  // Cartão de treino: violeta suave que some no vidro
  workout: ['rgba(154,140,255,0.22)', 'rgba(255,255,255,0.04)'] as const,
  // Treino de hoje: verde suave que some no vidro
  workoutHero: ['rgba(209,251,57,0.18)', 'rgba(255,255,255,0.04)'] as const,
  // Água: azul que enche o cartão
  water: ['rgba(87,184,255,0.30)', 'rgba(87,184,255,0.06)'] as const,
  // Linha verde que varre a foto durante a análise
  sweep: ['rgba(209,251,57,0)', colors.lime, 'rgba(209,251,57,0)'] as const,
  // Chama da sequência de dias
  flameOuter: ['#FF3D1F', '#FF7A1A', '#FFC23A'] as const,
  flameInner: ['#FFB02E', '#FFE27A', '#FFF6CC'] as const,
};

/**
 * Cores do Tapi, o mascote (plástico branco brilhante com detalhes verdes).
 * Ficam aqui para o desenho não ter cor solta.
 */
export const mascotColors = {
  shell: ['#FFFFFF', '#F7F9FA', '#E1E6EA', '#C5CDD4', '#AEB8C1'],
  body: ['#FFFFFF', '#EEF1F4', '#C9D1D8', '#A9B3BC'],
  occlusion: '#8A96A2',
  rim: ['#EDFF9E', '#D1FB39', '#A9DA1E', '#86B80F'],
  limeSoft: ['#F2FFC2', '#CFF53F', '#8FC012'],
  face: ['#FFFFFF', '#F3F6F8', '#DCE3E8'],
  eye: ['#1A1E23', '#07090B', '#1F3A06', '#7DBB14', '#DDFF6E'],
  ball: ['#FFFFFF', '#EEF2F5', '#B4BEC7'],
  cup: ['#F7FFD9', '#DDF7A0', '#B7E24A'],
  seam: '#9AA6B1',
  seamBody: '#9FAAB4',
  coreFill: '#EFFBCB',
  cupRing: '#E7FF8C',
  eyeLine: '#F2FFB8',
  heartEdge: '#8DBE12',
  ink: '#16181B',
  mouth: '#23262A',
  tongue: '#FF8FA3',
  blush: '#FF9FB0',
  drop: '#8FD3FF',
  thought: '#F4F5F0',
  white: '#FFFFFF',
  black: '#000000',
} as const;

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
  height: 68,
  bottomGap: 8,
  sideGap: 16,
  plusSize: 68,
} as const;

export const theme = { colors, macroColors, gradients, mascotColors, fonts, spacing, radius, typography, tabBar } as const;
export default theme;
