import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Glass } from '@/components/ui/Glass';
import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { proteinTip } from '@/lib/tips';
import { colors, fonts, macroColors, radius, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

/** Ordem da referência: cada macro ocupa um terço do anel, no sentido horário a partir do topo. */
const MACROS = [
  { key: 'carbsG', label: 'Carboidratos' },
  { key: 'proteinG', label: 'Proteínas' },
  { key: 'fatG', label: 'Gorduras' },
] as const;

const RING = 176;
const STROKE = 11;
const R = (RING - STROKE) / 2;
/** Espaço entre os três arcos, em graus. */
const GAP = 16;
/** Tracinhos da régua ao lado de cada macro. */
const RUNGS = 12;

type Props = {
  eaten: Macros;
  goal: Macros;
  /** Pílula no meio do anel (ex.: "Dia 12"). */
  dayLabel: string;
  /** Mostra a dica do que falta (só faz sentido para hoje). */
  showTip?: boolean;
};

function frac(value: number, goal: number): number {
  return goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
}

/** Arco de `from` a `to` graus (0° = topo, sentido horário). */
function arc(from: number, to: number): string {
  const c = RING / 2;
  const pt = (deg: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `${(c + R * Math.cos(a)).toFixed(2)} ${(c + R * Math.sin(a)).toFixed(2)}`;
  };
  return `M ${pt(from)} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${pt(to)}`;
}

/**
 * Resumo do dia no topo das Refeições: anel dividido entre os três macros, com
 * as calorias no meio, e ao lado cada macro com a sua régua e "comido/meta".
 */
export function DaySummary({ eaten, goal, dayLabel, showTip }: Props) {
  const over = eaten.kcal > goal.kcal;
  const tip = showTip ? proteinTip(goal.proteinG, eaten.proteinG) : null;
  // A ponta arredondada avança meia espessura: desconta para o vão ficar do tamanho certo.
  const cap = ((STROKE / 2) / R) * (180 / Math.PI);

  return (
    <Glass>
      <View style={styles.row}>
        <View
          style={styles.ring}
          accessible
          accessibilityLabel={`${formatInt(eaten.kcal)} de ${formatInt(goal.kcal)} calorias`}>
          <Svg width={RING} height={RING}>
            {MACROS.map(({ key }, i) => {
              const start = i * 120 + GAP / 2 + cap;
              const end = (i + 1) * 120 - GAP / 2 - cap;
              const f = frac(eaten[key], goal[key]);
              return [
                <Path key={`${key}-t`} d={arc(start, end)} stroke={colors.track} strokeWidth={STROKE} strokeLinecap="round" fill="none" />,
                f > 0 && (
                  <Path
                    key={`${key}-f`}
                    d={arc(start, start + Math.max(0.5, (end - start) * f))}
                    stroke={macroColors[key]}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    fill="none"
                  />
                ),
              ];
            })}
          </Svg>
          <View style={styles.center} pointerEvents="none">
            <View style={styles.pill}>
              <Text style={styles.pillText}>{dayLabel}</Text>
            </View>
            <View style={styles.kcalRow}>
              <Ionicons name="nutrition-outline" size={22} color={over ? colors.warnText : colors.ink} />
              <Text style={[styles.kcal, over && { color: colors.warnText }]}>{formatInt(eaten.kcal)}</Text>
            </View>
            <Text style={styles.goal}>
              {over ? `${formatInt(eaten.kcal - goal.kcal)} acima` : `de ${formatInt(goal.kcal)} kcal`}
            </Text>
          </View>
        </View>

        <View style={styles.side}>
          {MACROS.map(({ key, label }) => {
            const on = Math.round(frac(eaten[key], goal[key]) * RUNGS);
            return (
              <View
                key={key}
                style={styles.macro}
                accessible
                accessibilityLabel={`${label}: ${formatInt(eaten[key])} de ${formatInt(goal[key])} gramas`}>
                <View style={styles.ladder}>
                  {Array.from({ length: RUNGS }, (_, r) => (
                    <View
                      key={r}
                      style={[styles.rung, { backgroundColor: RUNGS - r <= on ? macroColors[key] : colors.track }]}
                    />
                  ))}
                </View>
                <View style={styles.macroText}>
                  <Text style={styles.amount}>
                    {formatInt(eaten[key])}
                    <Text style={styles.amountOf}>/{formatInt(goal[key])}g</Text>
                  </Text>
                  <Text style={[styles.label, { color: macroColors[key] }]} numberOfLines={1}>
                    {label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
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
    </Glass>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  ring: {
    width: RING,
    height: RING,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  pillText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 16,
    color: colors.ink2,
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  kcal: {
    fontFamily: fonts.display.semibold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
    fontVariant: ['tabular-nums'],
  },
  goal: {
    marginTop: 2,
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    lineHeight: 16,
    color: colors.ink3,
    fontVariant: ['tabular-nums'],
  },
  side: {
    flex: 1,
    gap: 16,
  },
  macro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ladder: {
    gap: 2,
  },
  rung: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  macroText: {
    flex: 1,
    minWidth: 0,
  },
  amount: {
    fontFamily: fonts.display.semibold,
    fontSize: 17,
    lineHeight: 21,
    fontVariant: ['tabular-nums'],
  },
  amountOf: {
    fontFamily: fonts.body.bold,
    fontSize: 12.5,
    color: colors.ink3,
  },
  label: {
    marginTop: 2,
    fontFamily: fonts.body.semibold,
    fontSize: 13,
    lineHeight: 17,
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
