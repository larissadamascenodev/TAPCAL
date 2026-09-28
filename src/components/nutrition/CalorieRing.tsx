import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { colors, fonts } from '@/theme/theme';

type Props = {
  eaten: number;
  goal: number;
  size?: number;
};

/** Anel pequeno do resumo da Alimentação: quanto da meta já foi, e quanto resta no meio. */
export function CalorieRing({ eaten, goal, size = 104 }: Props) {
  const stroke = 10;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const frac = goal > 0 ? Math.min(1, eaten / goal) : 0;
  const left = goal - eaten;
  const over = left < 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.limeLight} />
            <Stop offset="0.5" stopColor={colors.lime} />
            <Stop offset="1" stopColor={colors.limeDeep} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        {frac > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#ringGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${frac * c} ${c}`}
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.value}>{formatInt(Math.abs(left))}</Text>
        <Text variant="caption" tone="secondary" style={styles.caption}>
          {over ? 'acima' : 'restantes'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontFamily: fonts.display.bold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -1,
  },
  caption: {
    fontFamily: fonts.body.semibold,
    fontSize: 10,
    lineHeight: 13,
  },
});
