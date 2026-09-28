import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { formatDecimal } from '@/lib/format';
import { fonts, macroColors, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

const BARS = [
  { key: 'proteinG', label: 'Proteína' },
  { key: 'carbsG', label: 'Carboidrato' },
  { key: 'fatG', label: 'Gordura' },
] as const;

type Props = {
  /** Gramas da porção (ou do prato). */
  value: Macros;
  /** Meta do dia: a barra mostra quanto a porção representa dela. */
  goal?: Macros | null;
  style?: StyleProp<ViewStyle>;
};

/** Os três macros lado a lado: nome, gramas e a barrinha em relação à meta do dia. */
export function MacroBars({ value, goal, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      {BARS.map(({ key, label }) => (
        <View key={key} style={styles.bar} accessible accessibilityLabel={`${label}: ${formatDecimal(value[key], 0)} gramas`}>
          <Text variant="caption" tone="secondary" style={styles.label}>
            {label}
          </Text>
          <Text style={styles.value}>{formatDecimal(value[key], 0)} g</Text>
          <ProgressBar value={goal?.[key] ? value[key] / goal[key] : 0} color={macroColors[key]} height={6} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  bar: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontFamily: fonts.body.semibold,
  },
  value: {
    marginBottom: 4,
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 22,
    fontVariant: ['tabular-nums'],
  },
});
