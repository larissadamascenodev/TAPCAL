import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { formatDecimal } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import type { Exercise } from '@/types';

type Props = {
  index: number;
  exercise: Exercise;
  lastWeightKg: number | null;
  freshRecord: boolean;
};

/** Linha da lista de exercícios: número, nome, séries × repetições e última carga. */
export function ExerciseRow({ index, exercise, lastWeightKg, freshRecord }: Props) {
  const reps = exercise.targetReps.replace('-', '–');
  const last = lastWeightKg != null ? ` · última: ${formatDecimal(lastWeightKg)} kg` : '';
  return (
    <View style={styles.row}>
      <View style={styles.num}>
        <Text style={styles.numText}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.info}>
        <Text variant="bodyStrong" style={styles.name}>
          {exercise.name}
        </Text>
        <Text variant="caption" tone="muted">
          {exercise.targetSets} × {reps}
          {last}
        </Text>
      </View>
      {freshRecord && (
        <Text style={styles.pr} accessibilityLabel="Recorde recente">
          PR
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg + 2,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  num: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gridLine,
  },
  numText: {
    fontFamily: fonts.display.semibold,
    fontSize: 13,
    color: colors.ink2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    lineHeight: 19,
  },
  pr: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.gold,
  },
});
