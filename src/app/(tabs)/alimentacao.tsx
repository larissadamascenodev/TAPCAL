import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';

import { DateStrip } from '@/components/home/DateStrip';
import { DaySummary } from '@/components/nutrition/DaySummary';
import { GoalWarnings } from '@/components/nutrition/GoalWarnings';
import { MealTimeline } from '@/components/nutrition/MealTimeline';
import { TabPage } from '@/components/navigation/TabPage';
import { EmptyState, Text } from '@/components/ui';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { daysBetween } from '@/lib/dates';
import { emptyDay } from '@/lib/day';
import { mealTargets } from '@/lib/goals';
import { dayTotals } from '@/lib/totals';
import { burnedOn, dayLogFor, goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, spacing } from '@/theme/theme';
import type { FoodItem, MealType } from '@/types';

type Tab = 'refeicoes' | 'plano';

const TABS = [
  { key: 'refeicoes', label: 'Refeições' },
  { key: 'plano', label: 'Plano' },
] as const;

/** Altura das abas fixas logo abaixo do topo. */
const TABS_H = 52 + spacing.md;
/** Quantos dias para trás a faixa de datas mostra. */
const PAST_DAYS = 13;

export default function AlimentacaoScreen() {
  const state = useAppStore();
  const today = state.today.date;
  const scrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<Tab>('refeicoes');
  const [date, setDate] = useState(today);

  // Se o dia virou com a tela aberta, volta para o novo "hoje".
  const shownDate = date > today ? today : date;
  const isToday = shownDate === today;
  const day = dayLogFor(state, shownDate) ?? emptyDay(shownDate);
  const plan = useMemo(() => goalPlan(state, today), [state, today]);
  const eaten = dayTotals(day);

  const changeTab = (next: Tab) => {
    setTab(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const tabsBar = (
    <View style={styles.tabsWrap}>
      <SegmentedTabs options={TABS} value={tab} onChange={changeTab} />
    </View>
  );

  const addTo = (meal: MealType) => router.push({ pathname: '/busca', params: { refeicao: meal } });
  const editItem = (meal: MealType, item: FoodItem) =>
    router.push({ pathname: '/editar-alimento', params: { refeicao: meal, id: item.id } });
  const pastLabel = daysBetween(shownDate, today) === 1 ? 'Ontem' : 'Este dia';

  if (!plan) {
    return (
      <TabPage>
        <EmptyState icon="person-outline" title="Crie seu perfil" message="As metas do dia aparecem aqui depois do cadastro." />
      </TabPage>
    );
  }

  return (
    <TabPage scrollRef={scrollRef} below={tabsBar} belowHeight={TABS_H} gap={0}>
      {tab === 'refeicoes' && (
        <>
          <DateStrip today={today} past={PAST_DAYS} future={3} selected={shownDate} onSelect={setDate} />
          <View style={styles.block}>
            <DaySummary eaten={eaten} goal={{ ...plan.macros, kcal: plan.macros.kcal + burnedOn(state, shownDate) }} showTip={isToday} />
          </View>
          {isToday && plan.warnings.length > 0 && (
            <View style={styles.block}>
              <GoalWarnings warnings={plan.warnings} />
            </View>
          )}
          <View style={styles.timeline}>
            <MealTimeline
              meals={day.meals}
              targets={mealTargets(plan.targetKcal)}
              onAdd={isToday ? addTo : undefined}
              onPressItem={isToday ? editItem : undefined}
            />
          </View>
          {isToday ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/scanner')}
              style={({ pressed }) => [styles.newMeal, pressed && styles.pressed]}>
              <Ionicons name="add" size={18} color={colors.ink2} />
              <Text variant="caption" tone="secondary" style={styles.newMealText}>
                Nova refeição
              </Text>
            </Pressable>
          ) : (
            <Text variant="caption" tone="muted" style={styles.readonly}>
              {pastLabel} fica só para consulta.
            </Text>
          )}
        </>
      )}
      {tab === 'plano' && (
        <View style={styles.pane}>
          <EmptyState
            icon="sparkles-outline"
            title="Plano com IA · em breve"
            message="Aqui a IA vai montar o seu cardápio da semana a partir das suas metas, com check no que você já comeu."
          />
        </View>
      )}
    </TabPage>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    marginTop: spacing.md,
  },
  block: {
    marginTop: 14,
  },
  timeline: {
    marginTop: 26,
  },
  pane: {
    marginTop: spacing.sm,
  },
  newMeal: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newMealText: {
    fontFamily: fonts.body.bold,
    fontSize: 13.5,
  },
  readonly: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
