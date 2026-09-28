import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors, gradients } from '@/theme/theme';

// Geometria do mockup: caixa 340 × 262, centro (170, 170), arco de 240°.
export const GAUGE_VB_W = 340;
export const GAUGE_VB_H = 262;
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
 * Arco de 240° da Início, que enche em verde conforme come. O centro fica livre
 * para o mascote. Passou da meta: o arco fica cheio e esquenta para laranja.
 */
export function CalorieGauge({ eaten, goal, width }: Props) {
  const frac = goal > 0 ? Math.min(1, Math.max(0, eaten / goal)) : 0;
  const over = goal > 0 && eaten > goal;
  const dot = point(R, START - frac * SWEEP);
  const height = (width / GAUGE_VB_W) * GAUGE_VB_H;
  const stops = over ? gradients.over : gradients.lime;
  const glow = over ? colors.warn : colors.lime;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${GAUGE_VB_W} ${GAUGE_VB_H}`}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={stops[0]} />
            <Stop offset="0.5" stopColor={stops[1]} />
            <Stop offset="1" stopColor={stops[2]} />
          </LinearGradient>
        </Defs>
        <Path
          d={arc(R_TICKS)}
          stroke={colors.ticks}
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${TICKS_LEN * 0.0035} ${TICKS_LEN * 0.0215}`}
        />
        <Path d={arc(R)} stroke={colors.track} strokeWidth={16} strokeLinecap="round" fill="none" />
        {frac > 0 && (
          <>
            {/* brilho por baixo do arco */}
            <Path
              d={arc(R)}
              stroke={glow}
              strokeOpacity={0.22}
              strokeWidth={30}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${frac * LEN} ${LEN}`}
            />
            <Path
              d={arc(R)}
              stroke="url(#gaugeGrad)"
              strokeWidth={16}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${frac * LEN} ${LEN}`}
            />
          </>
        )}
        <Circle cx={dot.x} cy={dot.y} r={6} fill={colors.gaugeDot} />
      </Svg>
    </View>
  );
}
