import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { colors, fonts, gradients, radius } from '@/theme/theme';

import { Text } from './Text';

const H = 58;
/** Espessura da borda de luz. */
const EDGE = 2;

/** A luz dá uma volta completa a cada 3,2 s. */
const SPIN = {
  animationName: {
    from: { transform: [{ rotate: '0deg' }] },
    to: { transform: [{ rotate: '360deg' }] },
  },
  animationDuration: 3200,
  animationIterationCount: 'infinite' as const,
  animationTimingFunction: 'linear' as const,
};

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botão principal (CONTINUAR, SALVAR, INICIAR): pílula de vidro com duas marcas
 * de luz no verde do app girando em volta.
 */
export function NeonButton({ label, onPress, disabled, style }: Props) {
  const reduce = useReducedMotion();
  const [width, setWidth] = useState(0);
  // O degradê é um quadrado do tamanho da diagonal: girando, sempre cobre a pílula toda.
  const d = Math.ceil(Math.hypot(width, H));
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.glow, disabled && styles.disabled, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        onLayout={onLayout}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', width: d, height: d, left: (width - d) / 2, top: (H - d) / 2 }, !reduce && !disabled && SPIN]}>
            <LinearGradient colors={gradients.neonRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
        <View pointerEvents="none" style={styles.inner}>
          <LinearGradient
            colors={gradients.neonGlass}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Brilho suave em volta (só iOS: no Android a sombra colorida não existe)
  glow: {
    borderRadius: radius.pill,
    ...Platform.select({
      ios: { shadowColor: colors.lime, shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
      default: {},
    }),
  },
  pill: {
    height: H,
    borderRadius: radius.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.frostCardEdge,
  },
  inner: {
    position: 'absolute',
    top: EDGE,
    left: EDGE,
    right: EDGE,
    bottom: EDGE,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.neonInner,
    // Vidro: borda de reflexo em cima, mais clara que o resto
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderTopColor: colors.glassHighlight,
  },
  label: {
    fontFamily: fonts.display.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 3,
    color: colors.ink,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
