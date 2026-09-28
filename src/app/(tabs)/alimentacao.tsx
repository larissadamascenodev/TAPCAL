import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { CalorieRing } from '@/components/nutrition/CalorieRing';
import { GoalWarnings } from '@/components/nutrition/GoalWarnings';
import { MacroBars } from '@/components/nutrition/MacroBars';
import { MealCard } from '@/components/nutrition/MealCard';
import {
  confirmDestructive,
  EmptyState,
  Glass,
  IconButton,
  Screen,
  SectionHeader,
  Text,
  toast,
} from '@/components/ui';
import { addDays, daysBetween } from '@/lib/dates';
import { emptyDay, HISTORY_DAYS } from '@/lib/day';
import { formatDayMonth, formatInt } from '@/lib/format';
import { dayTotals } from '@/lib/totals';
import { dayLogFor, goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, spacing } from '@/theme/theme';
import { MEAL_TYPES, type FoodItem, type MealType } from '@/types';

function dayLabel(date: string, today: string): string {
  const diff = daysBetween(date, today);
  if (diff === 0) return `Hoje, ${formatDayMonth(date)}`;
  if (diff === 1) return `Ontem, ${formatDayMonth(date)}`;
  return formatDayMonth(date);
}

export default function AlimentacaoScreen() {
  const state = useAppStore();
  const removeFood = useAppStore((s) => s.removeFood);
  const today = state.today.date;
  const [date, setDate] = useState(today);

  // Se o dia virou com a tela aberta, volta para o novo "hoje".
  const shownDate = date > today ? today : date;
  const isToday = shownDate === today;
  const day = dayLogFor(state, shownDate) ?? emptyDay(shownDate);
  const plan = useMemo(() => goalPlan(state, today), [state, today]);
  const eaten = dayTotals(day);
  const filled = MEAL_TYPES.filter((m) => day.meals[m].length > 0).length;
  const canGoBack = daysBetween(shownDate, today) < HISTORY_DAYS;

  if (!plan) {
    return (
      <Screen>
        <Text style={styles.h1}>Alimentação</Text>
        <EmptyState icon="person-outline" title="Crie seu perfil" message="As metas do dia aparecem aqui depois do cadastro." />
      </Screen>
    );
  }

  const onDelete = (meal: MealType, item: FoodItem) =>
    confirmDestructive('Apagar alimento?', `${item.name} · ${formatInt(item.kcal)} kcal`, 'Apagar', () => {
      removeFood(meal, item.id);
      toast('Alimento apagado');
    });

  const adjustment = plan.dailyAdjustmentKcal;
  const adjustmentLabel = adjustment < 0 ? 'Déficit' : adjustment > 0 ? 'Superávit' : 'Ajuste';

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.h1}>Alimentação</Text>
        <IconButton
          icon="search"
          label="Buscar alimento"
          onPress={() => router.push('/busca')}
        />
      </View>

      <Glass flush rounded={22} contentStyle={styles.dates}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dia anterior"
          disabled={!canGoBack}
          hitSlop={6}
          onPress={() => setDate(addDays(shownDate, -1))}
          style={[styles.dateBtn, !canGoBack && styles.disabled]}>
          <Ionicons name="chevron-back" size={16} color={colors.ink2} />
        </Pressable>
        <Text style={styles.dateLabel}>{dayLabel(shownDate, today)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Próximo dia"
          disabled={isToday}
          hitSlop={6}
          onPress={() => setDate(addDays(shownDate, 1))}
          style={[styles.dateBtn, isToday && styles.disabled]}>
          <Ionicons name="chevron-forward" size={16} color={colors.ink2} />
        </Pressable>
      </Glass>

      <Glass flush contentStyle={styles.summary}>
        <View style={styles.summaryTop}>
          <CalorieRing eaten={eaten.kcal} goal={plan.targetKcal} />
          <View style={styles.facts}>
            <Fact label="Meta" value={`${formatInt(plan.targetKcal)} kcal`} />
            <Fact label="Consumidas" value={`${formatInt(eaten.kcal)} kcal`} />
            <Fact
              label={adjustmentLabel}
              value={adjustment === 0 ? 'manutenção' : `${adjustment > 0 ? '+' : '−'}${formatInt(Math.abs(adjustment))} kcal`}
            />
          </View>
        </View>
        <View style={styles.divider} />
        <MacroBars eaten={eaten} goal={plan.macros} />
      </Glass>

      {isToday && <GoalWarnings warnings={plan.warnings} />}

      <SectionHeader title="Refeições" aside={`${filled} de 4`} />
      {MEAL_TYPES.map((meal) => (
        <MealCard
          key={meal}
          meal={meal}
          items={day.meals[meal]}
          onAdd={isToday ? () => router.push({ pathname: '/busca', params: { refeicao: meal } }) : undefined}
          onPressItem={isToday ? (item) => onDelete(meal, item) : undefined}
        />
      ))}
      {!isToday && (
        <Text variant="caption" tone="muted" style={styles.readonly}>
          Dias anteriores ficam só para consulta.
        </Text>
      )}
    </Screen>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  h1: {
    fontFamily: fonts.display.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1,
  },
  dates: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
  },
  dateBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateLabel: {
    fontFamily: fonts.display.semibold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.3,
  },
  summary: {
    padding: 18,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  facts: {
    flex: 1,
    gap: 10,
  },
  fact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factValue: {
    fontFamily: fonts.display.semibold,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: colors.track,
    marginTop: spacing.lg,
    marginBottom: 14,
  },
  readonly: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
