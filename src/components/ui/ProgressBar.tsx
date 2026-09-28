import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/theme';

type Props = {
  /** De 0 a 1 (valores fora disso são cortados). */
  value: number;
  color: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

/** Barrinha de progresso (macros, séries). */
export function ProgressBar({ value, color, height = 5, style }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
});
