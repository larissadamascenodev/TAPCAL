import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/theme';

type Props = {
  /** Quanto está cheio, de 0 a 1. */
  fraction: number;
  /** Quantas cápsulas a barra tem. */
  count?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Barra de cápsulas que acendem em verde, na mesma linguagem do velocímetro:
 * as primeiras mais apagadas, a última (onde você está) mais clara.
 */
export function SegmentCaps({ fraction, count = 30, height = 9, style }: Props) {
  const on = Math.round(Math.max(0, Math.min(1, fraction)) * count);
  return (
    <View style={[styles.row, style]} accessible accessibilityRole="progressbar" accessibilityValue={{ now: Math.round(fraction * 100), min: 0, max: 100 }}>
      {Array.from({ length: count }, (_, i) => {
        const lit = i < on;
        const head = lit && i === on - 1;
        return (
          <View
            key={i}
            style={[
              styles.cap,
              { height, borderRadius: height / 2 },
              lit && { backgroundColor: head ? colors.gaugeDot : colors.lime, opacity: head ? 1 : 0.4 + (0.6 * i) / Math.max(1, on - 1) },
              head && styles.head,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  cap: {
    flex: 1,
    backgroundColor: colors.capOff,
  },
  head: {
    shadowColor: colors.lime,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
});
