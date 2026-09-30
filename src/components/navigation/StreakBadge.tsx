import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { STREAK_MILESTONE, streakMilestoneFraction } from '@/lib/progress';
import { colors, fonts, gradients, radius } from '@/theme/theme';

const RING = 32;
const R = 14.6;
/** Menor, com o treino aberto: abre espaço para a pílula do tempo no meio do topo. */
const ESCALA_COMPACTA = 0.8;

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
export function StreakBadge({ days, compacto }: { days: number; compacto?: boolean }) {
  const reduce = useReducedMotion();
  const k = compacto ? ESCALA_COMPACTA : 1;
  const ring = RING * k;
  const r = R * k;
  const c = 2 * Math.PI * r;
  const chama = 16 * k;
  const fraction = streakMilestoneFraction(days);
  const toWeek = days > 0 ? STREAK_MILESTONE - Math.round(fraction * STREAK_MILESTONE) : STREAK_MILESTONE;
  const [o0, o1, o2] = gradients.flameOuter;
  const [c0, , c2] = gradients.flameCore;
  const [r0, r1] = gradients.flameRing;

  return (
    <View
      style={[styles.pill, compacto && styles.pillCompacta]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${days} ${days === 1 ? 'dia seguido' : 'dias seguidos'} registrando${toWeek > 0 ? `; faltam ${toWeek} para fechar a semana` : ''}`}>

      <View style={[styles.ring, { width: ring, height: ring }]}>
        <Svg width={ring} height={ring} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="stRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={r0} />
              <Stop offset="1" stopColor={r1} />
            </SvgGradient>
          </Defs>
          <G rotation={-90} origin={`${ring / 2}, ${ring / 2}`}>
            <Circle cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke={colors.line} strokeWidth={2.2 * k} />
            {fraction > 0 && (
              <Circle
                cx={ring / 2}
                cy={ring / 2}
                r={r}
                fill="none"
                stroke="url(#stRing)"
                strokeWidth={2.2 * k}
                strokeLinecap="round"
                strokeDasharray={`${fraction * c} ${c}`}
              />
            )}
          </G>
        </Svg>

        {/* chama limpa, sem brilho em volta: contorno quente e miolo claro */}
        <Animated.View style={[styles.flame, { width: chama, height: chama }, !reduce && SWAY]}>
          <Svg width={chama} height={chama} viewBox="0 0 24 24">
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

      <Text style={[styles.days, compacto && styles.daysCompacto]}>{days}</Text>
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
  pillCompacta: {
    height: 34,
    paddingLeft: 3,
    paddingRight: 10,
    gap: 5,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: {
    transformOrigin: 'bottom',
  },
  days: {
    fontFamily: fonts.display.bold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
  daysCompacto: {
    fontSize: 14,
    lineHeight: 18,
  },
});
