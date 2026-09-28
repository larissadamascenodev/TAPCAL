import { StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/Glass';
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
};

/** Cartão dos macronutrientes: comido / meta, com bolinha e barra na cor de cada um. */
export function MacrosCard({ eaten, goal }: Props) {
  return (
    <Glass contentStyle={styles.content}>
      <Text style={styles.title}>Macronutrientes</Text>
      <View style={styles.rows}>
        {ROWS.map(({ key, label }) => (
          <View
            key={key}
            accessible
            accessibilityLabel={`${label}: ${formatInt(eaten[key])} de ${formatInt(goal[key])} gramas`}>
            <View style={styles.top}>
              <View style={styles.name}>
                <View style={[styles.dot, { backgroundColor: macroColors[key], shadowColor: macroColors[key] }]} />
                <Text style={styles.label}>{label}</Text>
              </View>
              <Text style={styles.value}>
                <Text style={styles.strong}>{formatInt(eaten[key])}</Text> / {formatInt(goal[key])} g
              </Text>
            </View>
            <ProgressBar
              value={goal[key] ? eaten[key] / goal[key] : 0}
              color={macroColors[key]}
              height={7}
              style={styles.bar}
            />
          </View>
        ))}
      </View>
    </Glass>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  title: {
    fontFamily: fonts.body.medium,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink2,
  },
  rows: {
    gap: 14,
    marginTop: spacing.lg,
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
