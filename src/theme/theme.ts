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
  // Vidro dos cartões: quase transparente, borda fina e mais clara em cima (reflexo)
  frostCardFill: 'rgba(255,255,255,0.035)',
  frostCardEdge: 'rgba(255,255,255,0.12)',
  frostCardEdgeTop: 'rgba(255,255,255,0.30)',
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

  // Neutros de apoio
  white: '#FFFFFF',
  shadow: '#000000',
  avatarFill: '#15161A',
  toastFill: 'rgba(30,30,36,0.94)',
  photoScrim: 'rgba(0,0,0,0.35)',
  // Mapa muscular: corpo apagado, músculo principal em verde neon, secundários em verde mais claro
  bodyFill: 'rgba(255,255,255,0.10)',
  bodyEdge: 'rgba(255,255,255,0.22)',
  musclePrimary: '#D1FB39',
  muscleSecondary: 'rgba(209,251,57,0.40)',
  // Mapa de calor dos músculos (relatório): pouco → muito
  muscleHeat1: 'rgba(209,251,57,0.22)',
  muscleHeat2: 'rgba(209,251,57,0.55)',
  // Miolo do botão neon: vidro escuro quase fechado, para a luz aparecer só na borda
  neonInner: 'rgba(22,23,26,0.94)',
  // Fundo atrás da folha de edição: leve sobre o desfoque; sem desfoque (Android), bem mais fechado
  modalScrim: 'rgba(5,5,6,0.45)',
  modalScrimSolid: 'rgba(5,5,6,0.85)',
  // Vidro da folha de edição: um véu escuro por baixo para o texto ficar legível
  sheetGlass: 'rgba(12,12,15,0.55)',
  handle: 'rgba(255,255,255,0.2)',
  dashed: 'rgba(255,255,255,0.14)',
  divider: 'rgba(255,255,255,0.10)',
  gridLine: 'rgba(255,255,255,0.06)',
  ticks: 'rgba(255,255,255,0.20)',
  frostFill: 'rgba(255,255,255,0.14)',
  frostEdge: 'rgba(255,255,255,0.38)',
  frostActive: 'rgba(244,245,240,0.92)',
  tagFill: 'rgba(10,10,12,0.62)',
  tagGlass: 'rgba(5,5,6,0.5)',

  // Abas em pílula (Alimentação, dias do plano)
  segTrack: 'rgba(20,20,23,0.8)',
  segEdge: 'rgba(255,255,255,0.10)',
  hairline: 'rgba(255,255,255,0.08)',
  railLine: 'rgba(255,255,255,0.12)',
  capOff: 'rgba(255,255,255,0.08)',


  // Prato de vidro das refeições e receitas
  plateHi: 'rgba(255,255,255,0.34)',
  plateLo: 'rgba(255,255,255,0.06)',
  plateEdge: 'rgba(255,255,255,0.4)',

  headerFill: 'rgba(5,5,6,0.72)',

  // Mostrador de traços (tempo de treino e descanso): aceso, apagado e o brilho do traço da vez
  tracoAceso: 'rgba(255,255,255,0.85)',
  tracoApagado: 'rgba(255,255,255,0.12)',
  tracoBrilho: 'rgba(209,251,57,0.28)',
  // Selo verde (completo, recorde): neon um pouco translúcido, com a letra escura
  seloVerde: 'rgba(209,251,57,0.86)',
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
  // Botão primário
  accent: [colors.limeLight, colors.lime] as const,
  // Barra de baixo e botão +: vidro um pouco mais claro
  glassStrong: ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)'] as const,
  // Reflexo do vidro dos cartões: luz no canto de cima que some até o meio
  glassSheen: ['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)'] as const,
  // Linha do tempo do treino: reflexo de vidro no exercício atual (sem verde), da esquerda para a direita
  timelineAtual: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)', 'rgba(255,255,255,0)'] as const,
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
  // Base da foto do prato no resultado: escurece até o tom do fundo, sob o vidro
  photoFade: ['rgba(5,5,6,0)', 'rgba(5,5,6,1)'] as const,
  // Borda do botão neon: verde neon e menta girando em volta do vidro, com um trecho mais fraco
  // Só o verde do app: duas marcas de luz que giram em volta, sumindo entre elas
  // Contorno inteiro aceso, com a cor passando devagar em volta (claro → verde → escuro → verde)
  neonRing: ['#EEFFA8', '#D1FB39', 'rgba(169,224,28,0.55)', '#D1FB39', '#EEFFA8'] as const,
  // Miolo de vidro do botão neon: reflexo mais claro em cima
  neonGlass: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'] as const,
  // Véu sobre a foto desfocada atrás da folha de vidro: fechado no topo (emenda
  // com a foto), depois deixa passar a cor do prato
  ambientVeil: ['rgba(5,5,6,1)', 'rgba(5,5,6,0.72)', 'rgba(5,5,6,0.72)'] as const,
  // Linha verde que varre a foto durante a análise
  sweep: ['rgba(209,251,57,0)', colors.lime, 'rgba(209,251,57,0)'] as const,
  // Chama da sequência de dias: contorno, miolo e o anel da semana
  flameOuter: ['#E8321A', '#FF6A1F', '#FFB23A'] as const,
  flameCore: ['#FFFFFF', '#FFF6CF', '#FFE38A'] as const,
  flameRing: ['#FFC23A', '#FF5A2A'] as const,
  // Fundo das refeições (atrás do prato de vidro)
  visual: {
    cafe_da_manha: ['#8A5A2E', '#3A2412', '#1A120B'],
    almoco: ['#5E7A1E', '#2A3810', '#12170A'],
    lanche: ['#9A3F4E', '#44202A', '#1C0F13'],
    jantar: ['#3E3C8C', '#1E1D45', '#0E0E1E'],
  } satisfies Record<string, readonly [string, string, string]>,
  visualScrim: ['rgba(5,5,6,0)', 'rgba(5,5,6,0.78)'] as const,
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
  height: 68,
  bottomGap: 8,
  sideGap: 16,
  plusSize: 68,
} as const;

export const theme = { colors, macroColors, gradients, fonts, spacing, radius, typography, tabBar } as const;
export default theme;
