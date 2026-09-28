import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { STREAK_MILESTONE, streakMilestoneFraction } from '@/lib/progress';
import { colors, fonts, gradients, radius } from '@/theme/theme';

const RING = 32;
const R = 14.6;
const C = 2 * Math.PI * R;

/** A chama balança de leve, a partir da base. */
const SWAY = {
  animationName: {
    '0%': { transform: [{ scaleY: 1 }, { skewX: '0deg' }] },
    '50%': { transform: [{ scaleY: 1.06 }, { skewX: '-2deg' }] },
    '100%': { transform: [{ scaleY: 0.98 }, { skewX: '2deg' }] },
  },
  animationDuration: 1600,
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
  const [c0, , c2] = gradients.flameCore;
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
            <SvgGradient id="stRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={r0} />
              <Stop offset="1" stopColor={r1} />
            </SvgGradient>
          </Defs>
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

        {/* chama limpa, sem brilho em volta: contorno quente e miolo claro */}
        <Animated.View style={[styles.flame, !reduce && SWAY]}>
          <Svg width={16} height={16} viewBox="0 0 24 24">
            <Defs>
              <SvgGradient id="stO" x1="0.5" y1="1" x2="0.5" y2="0">
                <Stop offset="0" stopColor={o0} />
                <Stop offset="0.55" stopColor={o1} />
                <Stop offset="1" stopColor={o2} />
              </SvgGradient>
              <SvgGradient id="stC" x1="0.5" y1="1" x2="0.5" y2="0">
                <Stop offset="0" stopColor={c2} />
                <Stop offset="1" stopColor={c0} />
              </SvgGradient>
            </Defs>
            <Path
              d="M12 1.8c.5 2.7 2.2 4.5 3.8 6.2 1.9 2 3.7 4.1 3.7 7.3a7.5 7.5 0 0 1-15 0c0-2.5 1.1-4.4 2.6-5.8.2 1.7 1 3 2.2 3.5-.3-4.4 1-8.1 2.7-11.2z"
              fill="url(#stO)"
            />
            <Path d="M12.2 12c1.1 1.7 3.4 3 3.4 5.4a3.6 3.6 0 0 1-7.2 0c0-1.4.6-2.4 1.5-3.1.1.9.6 1.6 1.2 1.8-.1-1.7.3-3 1.1-4.1z" fill="url(#stC)" />
          </Svg>
        </Animated.View>
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
    width: 16,
    height: 16,
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
