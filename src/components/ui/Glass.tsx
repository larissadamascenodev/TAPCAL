import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, radius, spacing } from '@/theme/theme';

export type GlassProps = ViewProps & {
  /** Força do desfoque (iOS e web). No Android fica só o preenchimento translúcido. */
  intensity?: number;
  /** Arredondamento; padrão = radius.lg */
  rounded?: number;
  /** Tira o padding interno padrão. */
  flush?: boolean;
  /** Preenchimento um pouco mais claro, para cartões em destaque. */
  strong?: boolean;
};

/**
 * Cartão de vidro fosco — a base visual de todos os blocos do app.
 * Borda fina clara + desfoque do que está atrás + leve preenchimento branco.
 */
export function Glass({
  intensity = 30,
  rounded = radius.lg,
  flush = false,
  strong = false,
  style,
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
      <View style={!flush && styles.padding}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line2,
  },
  padding: {
    padding: spacing.lg,
  },
});
