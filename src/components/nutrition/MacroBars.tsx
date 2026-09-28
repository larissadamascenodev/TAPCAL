import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { fonts, macroColors, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

const ROWS = [
  { key: 'proteinG', label: 'Proteína' },
  { key: 'carbsG', label: 'Carbo' },
  { key: 'fatG', label: 'Gordura' },
] as const;

type Props = {
  eaten: Macros;
  goal: Macros;
  /** Tamanho do número (Início usa maior). */
  size?: 'md' | 'lg';
};

/** Proteína, carbo e gordura: comido / meta, com barrinha na cor de cada macro. */
export function MacroBars({ eaten, goal, size = 'md' }: Props) {
  return (
    <View style={styles.row}>
      {ROWS.map(({ key, label }) => (
        <View key={key} style={styles.col} accessible accessibilityLabel={`${label}: ${formatInt(eaten[key])} de ${formatInt(goal[key])} gramas`}>
          <Text variant="label" tone="secondary" style={styles.label}>
            {label}
          </Text>
          <Text style={[styles.value, size === 'lg' && styles.valueLg]}>
            {formatInt(eaten[key])}
            <Text variant="caption" tone="muted" style={styles.goal}>
              {` / ${formatInt(goal[key])}g`}
            </Text>
          </Text>
          <ProgressBar value={goal[key] ? eaten[key] / goal[key] : 0} color={macroColors[key]} style={styles.bar} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  col: {
    flex: 1,
  },
  label: {
    letterSpacing: 1.1,
  },
  value: {
    marginTop: 5,
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  valueLg: {
    fontSize: 20,
    lineHeight: 26,
  },
  goal: {
    fontFamily: fonts.body.medium,
    fontSize: 12,
  },
  bar: {
    marginTop: 7,
  },
});
