import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { colors, fonts, macroColors, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

const ROWS = [
  { key: 'proteinG', label: 'Proteína' },
  { key: 'carbsG', label: 'Carboidrato' },
  { key: 'fatG', label: 'Gordura' },
] as const;

type Props = {
  eaten: Macros;
  goal: Macros;
  style?: StyleProp<ViewStyle>;
};

/** Macros direto na tela: bolinha e barra na cor de cada um, comido / meta. */
export function MacroRows({ eaten, goal, style }: Props) {
  return (
    <View style={[styles.rows, style]}>
      {ROWS.map(({ key, label }) => (
        <View key={key} accessible accessibilityLabel={`${label}: ${formatInt(eaten[key])} de ${formatInt(goal[key])} gramas`}>
          <View style={styles.top}>
            <View style={styles.name}>
              <View style={[styles.dot, { backgroundColor: macroColors[key], shadowColor: macroColors[key] }]} />
              <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.value}>
              <Text style={styles.strong}>{formatInt(eaten[key])}</Text> / {formatInt(goal[key])} g
            </Text>
          </View>
          <ProgressBar value={goal[key] ? eaten[key] / goal[key] : 0} color={macroColors[key]} height={7} style={styles.bar} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 19,
  },
  value: {
    fontFamily: fonts.body.medium,
    fontSize: 14,
    lineHeight: 19,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  strong: {
    fontFamily: fonts.body.bold,
    color: colors.ink,
  },
  bar: {
    marginTop: 7,
  },
});
