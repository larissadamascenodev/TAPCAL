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
const PASSAGEM_MS = 1800;
const ESPERA_MS = 250;
/** Comprimento de cada risco de luz (pontos). */
const RISCO = 44;

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botão principal (CONTINUAR, SALVAR, INICIAR, CONCLUIR SÉRIE): pílula de
 * vidro escuro com o contorno verde fixo. Quando o botão aparece, quatro luzes
 * claras saem do meio (duas em cima, duas embaixo), correm pela linha para os
 * dois lados e se encontram no meio das pontas, e somem. Depois fica parado —
 * só volta a acontecer quando o botão aparecer de novo.
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

  // Do meio de cima e do meio de baixo até o meio de cada ponta, seguindo a linha.
  const m = EDGE / 2;
  const r = R - m;
  const cx = width / 2;
  const xe = R; // centro da curva da esquerda
  const xd = width - R; // centro da curva da direita
  const caminhos = [
    `M${cx} ${m}H${xd}A${r} ${r} 0 0 1 ${width - m} ${R}`,
    `M${cx} ${m}H${xe}A${r} ${r} 0 0 0 ${m} ${R}`,
    `M${cx} ${H - m}H${xd}A${r} ${r} 0 0 0 ${width - m} ${R}`,
    `M${cx} ${H - m}H${xe}A${r} ${r} 0 0 1 ${m} ${R}`,
  ];
  const total = Math.max(0, cx - R) + (Math.PI * r) / 2 + RISCO;
  const luz = useAnimatedProps(() => {
    const t = p.get();
    // acende no começo, some no encontro
    const alfa = t <= 0 ? 0 : t < 0.2 ? t / 0.2 : t > 0.75 ? Math.max(0, (1 - t) / 0.25) : 1;
    return { strokeDashoffset: RISCO - t * total, strokeOpacity: alfa * 0.85 };
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
            {caminhos.map((d) => (
              <AnimatedPath key={d} d={d} fill="none" stroke={colors.limeHighlight} strokeWidth={EDGE} strokeLinecap="round" strokeDasharray={`${RISCO} ${total * 2}`} animatedProps={luz} />
            ))}
          </Svg>
        )}
        <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {label.toUpperCase()}
        </Text>
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
    paddingHorizontal: 24,
    fontSize: 13.5,
    lineHeight: 18,
    letterSpacing: 2.4,
    color: colors.ink,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
