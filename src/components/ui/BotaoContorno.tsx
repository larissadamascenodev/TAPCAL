import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors, fonts } from '@/theme/theme';

import { Text } from './Text';

const H = 58;
const TRACO = 1.5;
/** Uma volta da luz em volta do botão (ms): devagar, sem nada brusco. */
const VOLTA_MS = 6500;
/** Tamanho do trecho de luz, em fração do contorno: só uma luzinha. */
const TRECHO = 0.1;

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Contorno da pílula, começando no canto de cima à esquerda e seguindo no sentido do relógio. */
function pilula(w: number, h: number, m: number) {
  const r = h / 2 - m;
  const x0 = m + r;
  const x1 = w - m - r;
  const d = `M${x0} ${m}H${x1}A${r} ${r} 0 0 1 ${x1} ${h - m}H${x0}A${r} ${r} 0 0 1 ${x0} ${m}Z`;
  return { d, perimetro: 2 * Math.max(0, x1 - x0) + 2 * Math.PI * r };
}

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Botão de ação do treino: pílula de vidro escuro com um trecho de luz verde
 * que desliza contínuo em volta dela (o mesmo efeito da linha do card do
 * treino em andamento).
 */
export function BotaoContorno({ label, onPress, disabled, style }: Props) {
  const reduce = useReducedMotion();
  const [w, setW] = useState(0);
  const { d, perimetro } = pilula(w, H, TRACO / 2);
  const p = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(p);
    p.set(0);
    if (reduce || disabled || !w) return;
    p.set(withRepeat(withTiming(1, { duration: VOLTA_MS, easing: Easing.linear }), -1));
  }, [p, reduce, disabled, w]);
  const trecho = perimetro * TRECHO;
  const luz = useAnimatedProps(() => ({ strokeDashoffset: -p.get() * perimetro }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed, disabled && styles.disabled, style]}>
      {w > 0 && (
        <Svg width={w} height={H} style={styles.svg} pointerEvents="none">
          <Path d={d} fill="none" stroke={colors.line} strokeWidth={1} />
          {/* brilho largo e fraco por baixo, e o fio de luz por cima */}
          <AnimatedPath d={d} fill="none" stroke={colors.tracoBrilho} strokeWidth={TRACO * 3} strokeLinecap="round" strokeDasharray={`${trecho} ${perimetro - trecho}`} animatedProps={luz} />
          <AnimatedPath d={d} fill="none" stroke={colors.limeLight} strokeWidth={TRACO} strokeLinecap="round" strokeDasharray={`${trecho} ${perimetro - trecho}`} animatedProps={luz} />
        </Svg>
      )}
      <View pointerEvents="none" style={styles.brilho} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: H,
    borderRadius: H / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neonInner,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  brilho: {
    position: 'absolute',
    top: 1,
    left: H / 2,
    right: H / 2,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  label: {
    fontFamily: fonts.display.bold,
    fontSize: 14,
    letterSpacing: 3.6,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
