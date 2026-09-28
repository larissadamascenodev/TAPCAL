import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/theme/theme';

export type GlassProps = ViewProps & {
  /** Força do desfoque (iOS e web). No Android fica só o preenchimento translúcido. */
  intensity?: number;
  /** Arredondamento; padrão = radius.xl (28, como nos mockups) */
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
 * Cartão de vidro fosco — a base visual de todos os blocos do app.
 * Borda fina clara + desfoque do que está atrás + leve preenchimento branco.
 */
export function Glass({
  intensity = 30,
  rounded = radius.xl,
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
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? colors.glassFillStrong : colors.glassFill },
        ]}
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
  },
  padding: {
    padding: spacing.lg,
  },
});
