import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { formatDecimal, formatInt } from '@/lib/format';
import { colors, fonts, macroColors, radius, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

/** Calorias e os três macros da porção, em quatro quadradinhos lado a lado. */
export function MacroChips({ value }: { value: Macros }) {
  return (
    <View style={styles.row}>
      <Chip label="Calorias" value={formatInt(value.kcal)} unit="kcal" />
      <Chip label="Proteína" value={formatDecimal(value.proteinG)} unit="g" color={macroColors.proteinG} />
      <Chip label="Carbo" value={formatDecimal(value.carbsG)} unit="g" color={macroColors.carbsG} />
      <Chip label="Gordura" value={formatDecimal(value.fatG)} unit="g" color={macroColors.fatG} />
    </View>
  );
}

function Chip({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <View style={styles.chip}>
      <View style={styles.label}>
        {color && <View style={[styles.dot, { backgroundColor: color }]} />}
        <Text variant="caption" tone="secondary" style={styles.labelText}>
          {label}
        </Text>
      </View>
      <Text style={styles.value}>
        {value}
        <Text variant="caption" tone="muted">
          {' '}
          {unit}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: radius.lg - 2,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  labelText: {
    fontFamily: fonts.body.semibold,
    fontSize: 11,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  value: {
    marginTop: 4,
    fontFamily: fonts.display.semibold,
    fontSize: 16,
  },
});
