import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentCaps } from '@/components/ui/SegmentCaps';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { proteinTip } from '@/lib/tips';
import { colors, fonts, macroColors, radius, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

const COLS = [
  { key: 'proteinG', label: 'Proteína' },
  { key: 'carbsG', label: 'Carbo' },
  { key: 'fatG', label: 'Gordura' },
] as const;

type Props = {
  eaten: Macros;
  goal: Macros;
  /** Mostra a dica do que falta (só faz sentido para hoje). */
  showTip?: boolean;
};

/**
 * Resumo do dia no topo das Refeições: calorias comidas, quanto falta, a barra
 * de cápsulas, os três macros em colunas e a dica de proteína.
 */
export function DaySummary({ eaten, goal, showTip }: Props) {
  const left = goal.kcal - eaten.kcal;
  const over = left < 0;
  const tip = showTip ? proteinTip(goal.proteinG, eaten.proteinG) : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.top}>
        <Text style={styles.big}>
          {formatInt(eaten.kcal)}
          <Text style={styles.of}> de {formatInt(goal.kcal)} kcal</Text>
        </Text>
        <View style={[styles.chip, over ? styles.chipWarn : styles.chipLime]}>
          <Text style={[styles.chipText, { color: over ? colors.warnText : colors.lime }]}>
            {over ? `${formatInt(-left)} acima` : `faltam ${formatInt(left)}`}
          </Text>
        </View>
      </View>

      <SegmentCaps fraction={goal.kcal ? eaten.kcal / goal.kcal : 0} count={30} style={styles.caps} />

      <View style={styles.cols}>
        {COLS.map(({ key, label }) => (
          <View key={key} style={styles.col} accessible accessibilityLabel={`${label}: ${formatInt(eaten[key])} de ${formatInt(goal[key])} gramas`}>
            <Text variant="caption" tone="secondary" style={styles.colLabel}>
              {label}
            </Text>
            <Text style={styles.colValue}>
              {formatInt(eaten[key])}
              <Text style={styles.colOf}> / {formatInt(goal[key])} g</Text>
            </Text>
            <ProgressBar value={goal[key] ? eaten[key] / goal[key] : 0} color={macroColors[key]} height={5} style={styles.colBar} />
          </View>
        ))}
      </View>

      {tip && (
        <View style={styles.tip}>
          <Ionicons name="trending-up" size={16} color={colors.lime} />
          <Text variant="caption" tone="secondary" style={styles.tipText}>
            Faltam <Text style={styles.tipStrong}>{tip.missingG} g de proteína</Text>. Um filé de frango grelhado de{' '}
            {tip.chickenG} g resolve.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 2,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  big: {
    flexShrink: 1,
    fontFamily: fonts.display.bold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  of: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    letterSpacing: 0,
    color: colors.ink3,
  },
  chip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  chipLime: {
    backgroundColor: colors.limeTint,
    borderColor: colors.limeEdge,
  },
  chipWarn: {
    backgroundColor: colors.warnTint,
    borderColor: colors.warnEdge,
  },
  chipText: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  caps: {
    marginTop: 14,
  },
  cols: {
    flexDirection: 'row',
    gap: 14,
    marginTop: spacing.lg,
  },
  col: {
    flex: 1,
  },
  colLabel: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
  },
  colValue: {
    marginTop: 3,
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  colOf: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.ink3,
  },
  colBar: {
    marginTop: 7,
  },
  tip: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: spacing.lg,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  tipText: {
    flex: 1,
    lineHeight: 19,
  },
  tipStrong: {
    fontFamily: fonts.body.bold,
    color: colors.lime,
  },
});
