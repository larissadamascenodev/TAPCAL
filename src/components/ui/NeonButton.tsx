import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { colors, fonts, gradients, radius } from '@/theme/theme';

import { Text } from './Text';

const H = 58;
const R = H / 2;
/** Espessura do contorno. */
const EDGE = 1.5;
/** A luz passa uma vez só, devagar, logo depois que o botão aparece. */
const PASSAGEM_MS = 1600;
const ESPERA_MS = 250;
/** Comprimento do risco de luz (pontos). */
const RISCO = 70;

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botão principal (CONTINUAR, SALVAR, INICIAR, CONCLUIR SÉRIE): pílula de
 * vidro escuro com o contorno verde fixo. Quando o botão aparece, uma luz
 * clara passa uma vez pela borda de cima (da esquerda para a direita) e pela
 * de baixo (da direita para a esquerda), com um brilho suave, e some. Depois
 * fica parado — só volta a acontecer quando o botão aparecer de novo.
 */
export function NeonButton({ label, onPress, disabled, style }: Props) {
  const reduce = useReducedMotion();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const p = useSharedValue(0);
  const liga = width > 0 && !reduce && !disabled;
  useEffect(() => {
    if (liga) p.set(withDelay(ESPERA_MS, withTiming(1, { duration: PASSAGEM_MS, easing: Easing.inOut(Easing.cubic) })));
  }, [liga, p]);

  // Bordas retas de cima e de baixo (entre as curvas).
  const m = EDGE / 2;
  const reta = Math.max(0, width - 2 * R);
  const cima = `M${R} ${m}H${R + reta}`;
  const baixo = `M${R + reta} ${H - m}H${R}`;
  const total = reta + RISCO;
  const luz = useAnimatedProps(() => {
    const t = p.get();
    // acende no começo, apaga no fim
    const alfa = t <= 0 ? 0 : t < 0.15 ? t / 0.15 : t > 0.8 ? Math.max(0, (1 - t) / 0.2) : 1;
    return { strokeDashoffset: RISCO - t * total, strokeOpacity: alfa };
  });

  return (
    <View style={[styles.glow, disabled && styles.disabled, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        onLayout={onLayout}
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}>
        <View pointerEvents="none" style={styles.inner}>
          <LinearGradient colors={gradients.neonGlass} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 1 }} style={StyleSheet.absoluteFill} />
        </View>
        {width > 0 && (
          <Svg width={width} height={H} style={styles.svg} pointerEvents="none">
            <Rect x={m} y={m} width={width - EDGE} height={H - EDGE} rx={R - m} fill="none" stroke={colors.neonContorno} strokeWidth={EDGE} />
            {[cima, baixo].map((d) => (
              <AnimatedPath key={`${d}-halo`} d={d} fill="none" stroke={colors.neonHalo} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${RISCO} ${total * 2}`} animatedProps={luz} />
            ))}
            {[cima, baixo].map((d) => (
              <AnimatedPath key={d} d={d} fill="none" stroke={colors.limeHighlight} strokeWidth={EDGE + 0.5} strokeLinecap="round" strokeDasharray={`${RISCO} ${total * 2}`} animatedProps={luz} />
            ))}
          </Svg>
        )}
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
      ios: { shadowColor: colors.lime, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
      default: {},
    }),
  },
  pill: {
    height: H,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.neonInner,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
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
