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
      {/* parte cheia e parte vazia dividem a largura na proporção exata */}
      <View style={{ flex: pct, borderRadius: height / 2, backgroundColor: color }} />
      <View style={{ flex: 100 - pct }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
});
