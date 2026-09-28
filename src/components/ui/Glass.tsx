import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, gradients, radius, spacing } from '@/theme/theme';

export type GlassProps = ViewProps & {
  /** Arredondamento; padrão = radius.xxl (30). */
  rounded?: number;
  /** Tira o padding interno padrão. */
  flush?: boolean;
  /** Preenchimento um pouco mais claro, para cartões em destaque. */
  strong?: boolean;
  /** Degradê diagonal por cima do vidro (ex.: cartão de treino). */
  tint?: readonly [string, string, ...string[]];
  /** Camada entre o vidro e o conteúdo (ex.: a água enchendo o cartão). */
  underlay?: ReactNode;
  /** Estilo do contêiner interno (o que tem o padding). */
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Cartão de vidro — a base visual de todos os blocos do app.
 * Vidro líquido sem desfoque: quase transparente (3,5% de branco), um reflexo
 * de luz no canto de cima e borda fina, bem mais clara em cima.
 */
export function Glass({
  rounded = radius.xxl,
  flush = false,
  strong = false,
  tint,
  underlay,
  style,
  contentStyle,
  children,
  ...rest
}: GlassProps) {
  return (
    <View style={[styles.base, { borderRadius: rounded }, style]} {...rest}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, strong ? styles.fillStrong : styles.fill]} />
      <LinearGradient
        pointerEvents="none"
        colors={gradients.glassSheen}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      {tint && (
        <LinearGradient pointerEvents="none" colors={tint} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      {underlay}
      <View style={[!flush && styles.padding, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.frostCardEdge,
    borderTopColor: colors.frostCardEdgeTop,
  },
  fill: {
    backgroundColor: colors.frostCardFill,
  },
  fillStrong: {
    backgroundColor: colors.glassFillStrong,
  },
  padding: {
    padding: spacing.lg,
  },
});
