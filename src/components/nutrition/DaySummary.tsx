import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { formatInt } from '@/lib/format';
import { proteinTip } from '@/lib/tips';
import { kcalSplit } from '@/lib/totals';
import { colors, fonts, macroColors, spacing } from '@/theme/theme';
import type { Macros } from '@/types';

/** Ordem das fatias no anel (sentido horário a partir do topo) e da lista ao lado. */
const MACROS = [
  { key: 'carbsG', label: 'Carboidratos' },
  { key: 'proteinG', label: 'Proteínas' },
  { key: 'fatG', label: 'Gorduras' },
] as const;

const RING = 184;
const STROKE = 16;
const R = (RING - STROKE) / 2;
/** Vão visível entre uma fatia e outra, em graus. */
const GAP = 7;
/** Quanto a ponta arredondada avança além do arco, em graus. */
const CAP = (STROKE / 2 / R) * (180 / Math.PI);
/** Tracinhos da régua ao lado de cada macro. */
const RUNGS = 12;

type Props = {
  eaten: Macros;
  goal: Macros;
  /** Mostra a dica do que falta (só faz sentido para hoje). */
  showTip?: boolean;
};

function frac(value: number, goal: number): number {
  return goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0;
}

type Slice = { key: string; color: string; share: number };

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
 * Anel de calorias: o anel inteiro é a meta; cada macro é uma fatia das calorias
 * comidas e a fatia apagada é o que ainda falta. Fatias com pontas arredondadas e
 * um vão entre elas.
 */
function KcalRing({ slices }: { slices: Slice[] }) {
  const shown = slices.filter((s) => s.share > 0);
  if (shown.length === 1) {
    const c = RING / 2;
    return <Circle cx={c} cy={c} r={R} stroke={shown[0].color} strokeWidth={STROKE} fill="none" />;
  }
  // Onde cada fatia começa: soma das anteriores.
  const starts = shown.map((_, i) => shown.slice(0, i).reduce((sum, p) => sum + p.share, 0));
  return (
    <>
      {shown.map((s, i) => {
        const from = starts[i] * 360;
        const to = (starts[i] + s.share) * 360;
        let a = from + GAP / 2 + CAP;
        let b = to - GAP / 2 - CAP;
        // Fatia menor que as pontas: vira um pontinho no meio do seu espaço.
        if (b <= a) a = b = (from + to) / 2;
        return (
          <Path key={s.key} d={arc(a, Math.max(b, a + 0.01))} stroke={s.color} strokeWidth={STROKE} strokeLinecap="round" fill="none" />
        );
      })}
    </>
  );
}

/**
 * Resumo do dia no topo das Refeições: o anel de calorias (comidas de meta no
 * meio) e, ao lado, cada macro com a sua régua e "comido/meta".
 */
export function DaySummary({ eaten, goal, showTip }: Props) {
  const over = eaten.kcal > goal.kcal;
  const tip = showTip ? proteinTip(goal.proteinG, eaten.proteinG) : null;
  const split = kcalSplit(eaten, goal.kcal);
  const slices: Slice[] = [
    ...MACROS.map(({ key }) => ({ key, color: macroColors[key], share: split[key] })),
    { key: 'rest', color: colors.track, share: split.rest },
  ];

  return (
    <View>
      <View style={styles.row}>
        <View
          style={styles.ring}
          accessible
          accessibilityLabel={`${formatInt(eaten.kcal)} de ${formatInt(goal.kcal)} calorias`}>
          <Svg width={RING} height={RING}>
            <KcalRing slices={slices} />
          </Svg>
          <View style={styles.center} pointerEvents="none">
            <Text style={[styles.kcal, over && { color: colors.warnText }]}>{formatInt(eaten.kcal)}</Text>
            <Text style={styles.goal}>de {formatInt(goal.kcal)} kcal</Text>
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
    </View>
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
  kcal: {
    fontFamily: fonts.display.bold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.6,
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
    marginTop: spacing.xl,
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
