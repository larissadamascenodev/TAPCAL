import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { colors, fonts } from '@/theme/theme';

// Geometria do mockup: caixa 340 × 262, centro (170, 170), arco de 240°.
const VB_W = 340;
const VB_H = 262;
const CX = 170;
const CY = 170;
const R = 140;
const R_TICKS = 116;
const SWEEP = 240;
const START = 210; // graus, sentido trigonométrico

function point(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY - r * Math.sin(a) };
}

function arc(r: number) {
  const a = point(r, START);
  const b = point(r, START - SWEEP);
  return `M ${a.x} ${a.y} A ${r} ${r} 0 1 1 ${b.x} ${b.y}`;
}

const LEN = (R * SWEEP * Math.PI) / 180;
const TICKS_LEN = (R_TICKS * SWEEP * Math.PI) / 180;

type Props = {
  eaten: number;
  goal: number;
  width: number;
};

/**
 * Medidor da Início: arco de 240° que enche conforme come, com as calorias
 * restantes no centro. Passou da meta: o arco fica cheio e o centro mostra o excesso.
 */
export function CalorieGauge({ eaten, goal, width }: Props) {
  const frac = goal > 0 ? Math.min(1, Math.max(0, eaten / goal)) : 0;
  const left = goal - eaten;
  const over = left < 0;
  const dot = point(R, START - frac * SWEEP);
  const height = (width / VB_W) * VB_H;
  const valueSize = Math.round(width * 0.17);

  return (
    <View
      style={{ width, height }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={over ? `${formatInt(-left)} calorias acima da meta` : `${formatInt(left)} calorias restantes de ${formatInt(goal)}`}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.gold} />
            <Stop offset="0.55" stopColor={colors.ember2} />
            <Stop offset="1" stopColor={colors.ember} />
          </LinearGradient>
        </Defs>
        <Path
          d={arc(R_TICKS)}
          stroke={colors.ticks}
          strokeWidth={7}
          fill="none"
          strokeDasharray={`${TICKS_LEN * 0.0035} ${TICKS_LEN * 0.0215}`}
        />
        <Path d={arc(R)} stroke={colors.track} strokeWidth={18} strokeLinecap="round" fill="none" />
        {frac > 0 && (
          <>
            {/* brilho por baixo do arco */}
            <Path
              d={arc(R)}
              stroke={colors.ember}
              strokeOpacity={0.18}
              strokeWidth={30}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${frac * LEN} ${LEN}`}
            />
            <Path
              d={arc(R)}
              stroke="url(#gaugeGrad)"
              strokeWidth={18}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${frac * LEN} ${LEN}`}
            />
          </>
        )}
        <Circle cx={dot.x} cy={dot.y} r={6} fill={colors.gaugeDot} />
      </Svg>

      <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
        <Text style={[styles.value, { fontSize: valueSize, lineHeight: Math.round(valueSize * 1.05) }]}>
          {formatInt(Math.abs(left))}
        </Text>
        <Text tone="secondary" variant="caption">
          {over ? 'kcal acima da meta' : 'kcal restantes'}
        </Text>
      </View>

      <View style={styles.ends}>
        <Text variant="label" tone="muted">
          0
        </Text>
        <Text variant="label" tone="muted">
          {formatInt(goal)} kcal
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingTop: '27%',
  },
  value: {
    fontFamily: fonts.display.bold,
    letterSpacing: -3,
    fontVariant: ['tabular-nums'],
  },
  ends: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: -2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
