import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { CheckCircle } from '@/components/ui/CheckCircle';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { Text } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { SAMPLE_WEEK_PLAN } from '@/data/foodPlanSample';
import { fromDateKey } from '@/lib/dates';
import { formatInt } from '@/lib/format';
import { GOAL_LABELS } from '@/lib/goals';
import { DEFAULT_MEAL_TIMES } from '@/lib/meals';
import { colors, fonts, radius, spacing } from '@/theme/theme';
import { MEAL_LABELS, type DateKey, type Goal, type Macros } from '@/types';

import { TimelineNode } from './TimelineNode';

const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const;
const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const DAY_OPTIONS = DAYS.map((label, i) => ({ key: String(i), label }));

/** Segunda = 0 … domingo = 6. */
function weekdayIndex(date: DateKey): number {
  return (fromDateKey(date).getDay() + 6) % 7;
}

const key = (day: number, meal: number, food: number) => `${day}-${meal}-${food}`;

type Props = {
  today: DateKey;
  goal: Goal;
  macros: Macros;
  onMarket: () => void;
};

/**
 * Aba Plano: cardápio da semana feito pela IA, na mesma linha do tempo das
 * refeições, com check no que já comeu. Por enquanto, com dados de exemplo.
 */
export function PlanPane({ today, goal, macros, onMarket }: Props) {
  const todayIdx = weekdayIndex(today);
  const [day, setDay] = useState(todayIdx);
  // No exemplo, o café de hoje já vem marcado.
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(SAMPLE_WEEK_PLAN[todayIdx][0].foods.map((_, f) => key(todayIdx, 0, f))),
  );
  const plan = SAMPLE_WEEK_PLAN[day];
  const total = plan.reduce((s, m) => s + m.foods.reduce((t, f) => t + f.kcal, 0), 0);

  const toggle = (k: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  return (
    <View>
      <View style={styles.ai}>
        <View style={styles.eyebrow}>
          <Ionicons name="sparkles" size={13} color={colors.lime} />
          <Text style={styles.eyebrowText}>PLANO COM IA</Text>
        </View>
        <Text style={styles.h2}>Seu cardápio da semana</Text>
        <Text variant="caption" tone="secondary" style={styles.lede}>
          Montado para as suas metas: {formatInt(macros.kcal)} kcal e {formatInt(macros.proteinG)} g de proteína por dia, com
          comida do dia a dia e porções fáceis de medir.
        </Text>
        <View style={styles.chips}>
          {[GOAL_LABELS[goal], '4 refeições', 'Sem restrições'].map((c) => (
            <View key={c} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>
        <View style={styles.actions}>
          <Button
            label="Gerar novo plano"
            size="md"
            style={styles.primary}
            icon={<Ionicons name="refresh" size={16} color={colors.onLime} />}
            onPress={() => toast('Em breve a IA monta um plano novo')}
          />
          <Button label="Preferências" size="md" variant="secondary" onPress={() => toast('Em breve você escolhe suas preferências')} />
        </View>
      </View>

      <SegmentedTabs options={DAY_OPTIONS} value={String(day)} onChange={(k) => setDay(Number(k))} height={48} style={styles.days} />

      <View style={styles.dayHead}>
        <Text style={styles.dayName}>{DAY_NAMES[day]}</Text>
        <Text variant="caption" tone="muted" style={styles.dayTotal}>
          <Text style={styles.dayTotalNum}>{formatInt(total)}</Text> kcal no dia
        </Text>
      </View>

      <View style={styles.timeline}>
        {plan.map((m, mi) => {
          const kcal = m.foods.reduce((t, f) => t + f.kcal, 0);
          const allDone = m.foods.every((_, fi) => checked.has(key(day, mi, fi)));
          return (
            <TimelineNode key={m.meal} time={DEFAULT_MEAL_TIMES[m.meal]} done={allDone} last={mi === plan.length - 1}>
              <View style={styles.mealHead}>
                <Text style={styles.mealTitle}>{MEAL_LABELS[m.meal]}</Text>
                <Text style={styles.mealKcal}>
                  {formatInt(kcal)}
                  <Text style={styles.unit}> kcal</Text>
                </Text>
              </View>
              {m.foods.map((f, fi) => {
                const k = key(day, mi, fi);
                const on = checked.has(k);
                return (
                  <Pressable
                    key={k}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={`${f.name}, ${f.portion}`}
                    onPress={() => toggle(k)}
                    style={styles.food}>
                    <CheckCircle checked={on} />
                    <View style={styles.foodText}>
                      <Text style={[styles.foodName, on && styles.foodDone]}>{f.name}</Text>
                      <Text variant="caption" tone="muted" style={styles.foodPortion}>
                        {f.portion}
                      </Text>
                    </View>
                    <Text style={styles.foodKcal}>{formatInt(f.kcal)}</Text>
                  </Pressable>
                );
              })}
            </TimelineNode>
          );
        })}
      </View>

      <Button
        label="Montar lista do mercado"
        icon={<Ionicons name="cart-outline" size={18} color={colors.onLime} />}
        fullWidth
        onPress={onMarket}
      />
      <Text variant="caption" tone="muted" style={styles.fine}>
        O plano é uma sugestão feita por IA a partir das suas metas. Se você tem alguma condição de saúde, revise com um
        nutricionista.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ai: {
    paddingTop: spacing.xs,
    paddingHorizontal: 2,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eyebrowText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    color: colors.lime,
  },
  h2: {
    marginTop: 8,
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  lede: {
    marginTop: 6,
    fontSize: 13.5,
    lineHeight: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  chip: {
    height: 28,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    justifyContent: 'center',
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipText: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primary: {
    flex: 1,
  },
  days: {
    marginTop: 22,
  },
  dayHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 20,
    paddingHorizontal: 2,
  },
  dayName: {
    fontFamily: fonts.display.semibold,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  dayTotal: {
    fontFamily: fonts.body.bold,
  },
  dayTotalNum: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  timeline: {
    marginTop: 18,
  },
  mealHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  mealTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  mealKcal: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
    color: colors.ink3,
  },
  food: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  foodText: {
    flex: 1,
    minWidth: 0,
  },
  foodName: {
    fontFamily: fonts.body.bold,
    fontSize: 14.5,
    lineHeight: 19,
  },
  foodDone: {
    color: colors.ink2,
  },
  foodPortion: {
    fontSize: 12,
    lineHeight: 16,
  },
  foodKcal: {
    fontFamily: fonts.display.semibold,
    fontSize: 14,
    color: colors.ink2,
    fontVariant: ['tabular-nums'],
  },
  fine: {
    marginTop: 12,
    paddingHorizontal: 2,
    fontSize: 11.5,
    lineHeight: 17,
  },
});
