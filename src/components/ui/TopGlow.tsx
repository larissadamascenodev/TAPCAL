import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '@/theme/theme';

type Props = {
  /** Altura da aura a partir do topo da tela. */
  height?: number;
  /** Troca a mancha da direita por violeta (tela de treino). */
  accent?: 'ember' | 'iris';
};

/**
 * "Aura" do topo das telas, como nos mockups: manchas radiais laranja e dourada,
 * desfocadas, que somem no fundo escuro. Feita com gradientes radiais do SVG
 * porque o filtro de desfoque do CSS não existe no React Native.
 */
export function TopGlow({ height = 560, accent = 'ember' }: Props) {
  const { width } = useWindowDimensions();
  const right = accent === 'iris' ? colors.iris : colors.ember2;

  return (
    <View pointerEvents="none" style={[styles.wrap, { height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="g1" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={colors.ember} stopOpacity={0.85} />
            <Stop offset="0.45" stopColor={colors.ember} stopOpacity={0.32} />
            <Stop offset="1" stopColor={colors.ember} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g2" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={right} stopOpacity={0.5} />
            <Stop offset="1" stopColor={right} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g3" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={colors.emberDeep} stopOpacity={0.45} />
            <Stop offset="1" stopColor={colors.emberDeep} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="g4" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={colors.gold} stopOpacity={0.2} />
            <Stop offset="1" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.ground} stopOpacity={0} />
            <Stop offset="0.38" stopColor={colors.ground} stopOpacity={0.25} />
            <Stop offset="0.7" stopColor={colors.ground} stopOpacity={0.8} />
            <Stop offset="0.94" stopColor={colors.ground} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Ellipse cx={width * 0.45} cy={30} rx={width * 0.55} ry={260} fill="url(#g1)" />
        <Ellipse cx={width * 0.95} cy={90} rx={width * 0.42} ry={190} fill="url(#g2)" />
        <Ellipse cx={0} cy={260} rx={width * 0.36} ry={160} fill="url(#g3)" />
        <Ellipse cx={width * 0.55} cy={360} rx={width * 0.45} ry={130} fill="url(#g4)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#fade)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
});
