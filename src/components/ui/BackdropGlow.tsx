import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme/theme';

/** Força do verde no centro de cada mancha (0 a 1). Baixa de propósito: só para o vidro ter o que desfocar. */
const TOP_STRENGTH = 0.14;
const BOTTOM_STRENGTH = 0.08;

/**
 * Fundo das telas: duas manchas de verde bem suaves (em cima à direita e embaixo
 * à esquerda) sobre o quase preto. Fica parado atrás da rolagem, então os
 * cartões de vidro passam por cima e ganham cor no desfoque.
 */
export function BackdropGlow() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="bgTop" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.lime} stopOpacity={TOP_STRENGTH} />
            <Stop offset="0.55" stopColor={colors.lime} stopOpacity={TOP_STRENGTH * 0.35} />
            <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="bgBottom" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.lime} stopOpacity={BOTTOM_STRENGTH} />
            <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={width * 0.85} cy={height * 0.08} rx={width * 0.95} ry={height * 0.42} fill="url(#bgTop)" />
        <Ellipse cx={width * 0.05} cy={height * 0.78} rx={width * 0.8} ry={height * 0.32} fill="url(#bgBottom)" />
      </Svg>
    </View>
  );
}
