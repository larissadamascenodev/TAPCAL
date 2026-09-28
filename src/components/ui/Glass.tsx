import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, gradients, radius, spacing } from '@/theme/theme';

export type GlassProps = ViewProps & {
  /** Força do desfoque (iOS e web). No Android fica só o preenchimento translúcido. */
  intensity?: number;
  /** Arredondamento; padrão = radius.xxl (30, como nos mockups) */
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
 * Cartão de vidro líquido — a base visual de todos os blocos do app.
 * Borda fina clara (mais clara em cima) + desfoque do que está atrás + brilho diagonal.
 */
export function Glass({
  intensity = 40,
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
  const useBlur = Platform.OS !== 'android';

  return (
    <View
      style={[
        styles.base,
        { borderRadius: rounded },
        !useBlur && { backgroundColor: colors.panel2 },
        style,
      ]}
      {...rest}>
      {useBlur && <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />}
      {/* vidro líquido: brilho diagonal + reflexo suave no canto de cima */}
      <LinearGradient
        pointerEvents="none"
        colors={strong ? gradients.glassStrong : gradients.glass}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.glassFillStrong, 'transparent']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      {tint && (
        <LinearGradient
          pointerEvents="none"
          colors={tint}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
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
    borderColor: colors.line,
    borderTopColor: colors.glassHighlight,
  },
  padding: {
    padding: spacing.lg,
  },
});
