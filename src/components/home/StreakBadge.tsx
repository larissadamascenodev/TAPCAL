import { Platform, StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { STREAK_MILESTONE, streakMilestoneFraction } from '@/lib/progress';
import { colors, fonts, gradients, radius } from '@/theme/theme';

const RING = 32;
const R = 14.6;
const C = 2 * Math.PI * R;

/** A chama tremula de leve: a de fora devagar, o miolo mais rápido. */
const FLICKER = {
  animationName: {
    '0%': { transform: [{ scaleX: 1 }, { scaleY: 1 }, { skewX: '0deg' }] },
    '50%': { transform: [{ scaleX: 0.97 }, { scaleY: 1.05 }, { skewX: '-3deg' }] },
    '100%': { transform: [{ scaleX: 1.02 }, { scaleY: 0.97 }, { skewX: '2.5deg' }] },
  },
  animationDuration: 1700,
  animationIterationCount: 'infinite' as const,
  animationDirection: 'alternate' as const,
  animationTimingFunction: 'ease-in-out' as const,
};
const PULSE = {
  animationName: {
    from: { opacity: 0.8, transform: [{ scaleY: 0.94 }] },
    to: { opacity: 1, transform: [{ scaleY: 1.06 }] },
  },
  animationDuration: 900,
  animationIterationCount: 'infinite' as const,
  animationDirection: 'alternate' as const,
  animationTimingFunction: 'ease-in-out' as const,
};

/**
 * Selo da sequência no topo da Início: pílula de vidro com a chama dentro de
 * um anel que enche até fechar 7 dias seguidos e o número de dias ao lado.
 */
export function StreakBadge({ days }: { days: number }) {
  const reduce = useReducedMotion();
  const fraction = streakMilestoneFraction(days);
  const toWeek = days > 0 ? STREAK_MILESTONE - Math.round(fraction * STREAK_MILESTONE) : STREAK_MILESTONE;
  const [o0, o1, o2] = gradients.flameOuter;
  const [m0, m1, m2] = gradients.flameMid;
  const [c0, c1, c2] = gradients.flameCore;
  const [r0, r1] = gradients.flameRing;

  return (
    <View
      style={styles.pill}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${days} ${days === 1 ? 'dia seguido' : 'dias seguidos'} registrando${toWeek > 0 ? `; faltam ${toWeek} para fechar a semana` : ''}`}>

      <View style={styles.ring}>
        <Svg width={RING} height={RING} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="stGlow" cx="50%" cy="62%" r="50%">
              <Stop offset="0" stopColor={colors.flameGlow} />
              <Stop offset="1" stopColor={colors.flameGlow} stopOpacity={0} />
            </RadialGradient>
            <SvgGradient id="stRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={r0} />
              <Stop offset="1" stopColor={r1} />
            </SvgGradient>
          </Defs>
          <Circle cx={RING / 2} cy={RING / 2} r={RING / 2} fill="url(#stGlow)" />
          <G rotation={-90} origin={`${RING / 2}, ${RING / 2}`}>
            <Circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke={colors.line} strokeWidth={2.2} />
            {fraction > 0 && (
              <Circle
                cx={RING / 2}
                cy={RING / 2}
                r={R}
                fill="none"
                stroke="url(#stRing)"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeDasharray={`${fraction * C} ${C}`}
              />
            )}
          </G>
        </Svg>

        <View style={styles.flame}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.flameOrigin, !reduce && FLICKER]}>
            <Svg width={15} height={19} viewBox="0 0 24 30">
              <Defs>
                <SvgGradient id="stO" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={o0} />
                  <Stop offset="0.5" stopColor={o1} />
                  <Stop offset="1" stopColor={o2} />
                </SvgGradient>
                <SvgGradient id="stM" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor={m0} />
                  <Stop offset="0.65" stopColor={m1} />
                  <Stop offset="1" stopColor={m2} />
                </SvgGradient>
              </Defs>
              <Path
                d="M12 1.5C13.2 6 18.5 8.6 20.6 14.2c2 5.4-.6 11.4-6 13.7-.8.3-1.7.5-2.6.5-5.4 0-9.2-4-9.2-9 0-3.8 2-6.4 3.8-8 0 2.2 1 4 2.4 4.6C8.2 10.6 10.2 5.4 12 1.5z"
                fill="url(#stO)"
              />
              <Path
                d="M12.4 9.5c1 3.3 4.6 5.1 5.2 9.5.5 4-2.2 7-5.6 7-3.3 0-5.6-2.5-5.4-5.6.2-2 1.2-3.4 2.2-4.2.2 1.8 1 2.8 2 3.2-.6-3.8.2-7 1.6-9.9z"
                fill="url(#stM)"
              />
            </Svg>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.flameOrigin, !reduce && PULSE]}>
            <Svg width={15} height={19} viewBox="0 0 24 30">
              <Defs>
                <RadialGradient id="stC" cx="50%" cy="70%" r="60%">
                  <Stop offset="0" stopColor={c0} />
                  <Stop offset="0.6" stopColor={c1} />
                  <Stop offset="1" stopColor={c2} />
                </RadialGradient>
              </Defs>
              <Path d="M12 16.5c.8 1.9 2.8 3.1 2.8 5.7 0 2-1.2 3.4-2.8 3.4s-2.8-1.3-2.7-3.1c.1-2.1 1.9-3.5 2.7-6z" fill="url(#stC)" />
            </Svg>
          </Animated.View>
        </View>
      </View>

      <Text style={styles.days}>{days}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 40,
    paddingLeft: 4,
    paddingRight: 13,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
    borderTopColor: colors.frostCardEdgeTop,
  },
  ring: {
    width: RING,
    height: RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: {
    width: 15,
    height: 19,
    // No iPhone a sombra segue o desenho da chama; na web ela viraria um quadrado.
    ...Platform.select({
      ios: {
        shadowColor: gradients.flameOuter[1],
        shadowOpacity: 0.7,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
  flameOrigin: {
    transformOrigin: 'bottom',
  },
  days: {
    fontFamily: fonts.display.bold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
});
