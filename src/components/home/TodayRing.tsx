import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { dayFraction } from '@/lib/dates';
import { colors } from '@/theme/theme';

const SIZE = 40;
const R = 18.5;
const C = 2 * Math.PI * R;

/** Anel do dia de hoje, que vai fechando conforme as horas passam (atualiza a cada minuto). */
export function TodayRing({ color = colors.white }: { color?: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const frac = Math.max(0.02, dayFraction(now));
  return (
    <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
      <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke={colors.line} strokeWidth={2.2} />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeDasharray={`${frac * C} ${C}`}
        />
      </G>
    </Svg>
  );
}
