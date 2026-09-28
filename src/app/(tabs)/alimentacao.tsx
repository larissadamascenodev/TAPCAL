import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/home/DateStrip';
import { DaySummary } from '@/components/nutrition/DaySummary';
import { GoalWarnings } from '@/components/nutrition/GoalWarnings';
import { MarketPane } from '@/components/nutrition/MarketPane';
import { MealTimeline } from '@/components/nutrition/MealTimeline';
import { PlanPane } from '@/components/nutrition/PlanPane';
import { RecipesPane } from '@/components/nutrition/RecipesPane';
import { confirmDestructive, EmptyState, Screen, Text, toast } from '@/components/ui';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { daysBetween } from '@/lib/dates';
import { emptyDay } from '@/lib/day';
import { formatInt } from '@/lib/format';
import { mealTargets } from '@/lib/goals';
import { dayTotals } from '@/lib/totals';
import { dayLogFor, goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, spacing } from '@/theme/theme';
import type { FoodItem, MealType } from '@/types';

type Tab = 'refeicoes' | 'plano' | 'receitas' | 'mercado';

const TABS = [
  { key: 'refeicoes', label: 'Refeições' },
  { key: 'plano', label: 'Plano' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'mercado', label: 'Mercado' },
] as const;

/** Altura da faixa das abas fixa no topo (sem a área segura). */
const TABS_H = 52 + spacing.md;
/** Quantos dias para trás a faixa de datas mostra. */
const PAST_DAYS = 13;

export default function AlimentacaoScreen() {
  const state = useAppStore();
  const removeFood = useAppStore((s) => s.removeFood);
  const today = state.today.date;
  const insets = useSafeAreaInsets();
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
    <View pointerEvents="box-none" style={[styles.tabsWrap, { paddingTop: insets.top + spacing.sm }]}>
      <LinearGradient pointerEvents="none" colors={gradients.header} locations={[0, 0.45, 0.75, 1]} style={styles.tabsFade} />
      <SegmentedTabs options={TABS} value={tab} onChange={changeTab} />
    </View>
  );

  if (!plan) {
    return (
      <Screen>
        <EmptyState icon="person-outline" title="Crie seu perfil" message="As metas do dia aparecem aqui depois do cadastro." />
      </Screen>
    );
  }

  const onDelete = (meal: MealType, item: FoodItem) =>
    confirmDestructive('Apagar alimento?', `${item.name} · ${formatInt(item.kcal)} kcal`, 'Apagar', () => {
      removeFood(meal, item.id);
      toast('Alimento apagado');
    });

  const addTo = (meal: MealType) => router.push({ pathname: '/busca', params: { refeicao: meal } });
  const pastLabel = daysBetween(shownDate, today) === 1 ? 'Ontem' : 'Este dia';

  return (
    <Screen scrollRef={scrollRef} topOffset={TABS_H} overlay={tabsBar} gap={0}>
      {tab === 'refeicoes' && (
        <>
          <DateStrip today={today} past={PAST_DAYS} future={3} selected={shownDate} onSelect={setDate} />
          <View style={styles.block}>
            <DaySummary eaten={eaten} goal={plan.macros} showTip={isToday} />
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
              onPressItem={isToday ? onDelete : undefined}
            />
          </View>
          {isToday ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/adicionar')}
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
          <PlanPane today={today} goal={state.profile?.goal ?? 'manter'} macros={plan.macros} onMarket={() => changeTab('mercado')} />
        </View>
      )}
      {tab === 'receitas' && (
        <View style={styles.pane}>
          <RecipesPane kcalLeft={plan.targetKcal - dayTotals(state.today).kcal} />
        </View>
      )}
      {tab === 'mercado' && (
        <View style={styles.pane}>
          <MarketPane today={today} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tabsFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: -28,
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
