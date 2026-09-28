import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CalorieGauge, GaugeStats } from '@/components/home/CalorieGauge';
import { DateStrip } from '@/components/home/DateStrip';
import { HOME_HEADER_H, HomeHeader } from '@/components/home/HomeHeader';
import { MacroRows } from '@/components/home/MacroRows';
import { MealShortcuts } from '@/components/home/MealShortcuts';
import { WaterTile } from '@/components/home/WaterTile';
import { WeightCard } from '@/components/home/WeightCard';
import { WorkoutTile } from '@/components/home/WorkoutTile';
import { EmptyState, Screen, SectionHeader, toast } from '@/components/ui';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { mealTargets } from '@/lib/goals';
import { loggedDates, streak, weightTrend } from '@/lib/progress';
import { dayTotals } from '@/lib/totals';
import { estimatedMinutes, planForDate, shortFocus } from '@/lib/workout';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/theme';

const WATER_STEP = 250;

/** Basta começar a rolar: o nome aparece com um fade e o fundo do topo escurece. */
const SCROLLED_AT = 8;

export default function InicioScreen() {
  const state = useAppStore();
  const { profile, today: day, history, weights, workoutPlans, sessions, activeSession } = state;
  const { addWater, startSession } = state;
  const today = day.date;
  const { width } = useWindowDimensions();
  const [scrolled, setScrolled] = useState(false);

  const plan = useMemo(() => goalPlan(state, today), [state, today]);
  const eaten = dayTotals(day);
  const logged = useMemo(() => loggedDates(day, history), [day, history]);
  const trend = useMemo(() => weightTrend(weights, today), [weights, today]);
  const gaugeTap = useDoubleTap(() => router.push('/scanner'));

  if (!profile || !plan) {
    return (
      <Screen>
        <EmptyState icon="person-outline" title="Crie seu perfil" message="Seu resumo do dia aparece aqui depois do cadastro." />
      </Screen>
    );
  }

  const days = streak(logged, today);
  const workout = planForDate(workoutPlans, today);
  const doneToday = sessions.some((s) => s.date === today);

  const onWater = () => {
    const next = day.waterMl + WATER_STEP;
    addWater(WATER_STEP);
    toast(next >= plan.waterMl && day.waterMl < plan.waterMl ? 'Meta de água batida' : '+250 ml registrados');
  };

  const onWorkout = () => {
    if (!activeSession && workout) startSession(workout.id);
    router.push('/treino-sessao');
  };

  const workoutTile = activeSession
    ? { title: 'Em andamento', subtitle: 'Toque para continuar', action: 'Continuar' }
    : workout && doneToday
      ? { title: shortFocus(workout), subtitle: 'Concluído hoje' }
      : workout
        ? {
            title: shortFocus(workout),
            subtitle: `${workout.exercises.length} exercícios · ${estimatedMinutes(workout)} min`,
            action: 'Iniciar',
          }
        : { title: 'Descanso', subtitle: 'Dia de recuperar' };

  const gaugeWidth = Math.min(340, width - spacing.lg * 2);

  return (
    <Screen
      gap={0}
      topOffset={HOME_HEADER_H}
      onScrollY={(y) => setScrolled(y > SCROLLED_AT)}
      overlay={<HomeHeader name={profile.name.trim()} streakDays={days} scrolled={scrolled} />}>
      <DateStrip today={today} />

      <Pressable
        onPress={gaugeTap}
        accessibilityHint="Toque duas vezes para fotografar um prato"
        style={styles.gauge}>
        <CalorieGauge eaten={eaten.kcal} goal={plan.targetKcal} width={gaugeWidth} />
      </Pressable>
      <View style={styles.stats}>
        <GaugeStats eaten={eaten.kcal} goal={plan.targetKcal} adjustment={plan.dailyAdjustmentKcal} />
      </View>

      <MacroRows eaten={eaten} goal={plan.macros} style={styles.macros} />

      <View style={styles.section}>
        <SectionHeader title="Refeições de hoje" action="Ver diário" onAction={() => router.push('/alimentacao')} />
      </View>
      <MealShortcuts
        meals={day.meals}
        targets={mealTargets(plan.targetKcal)}
        onAdd={(meal) => router.push({ pathname: '/busca', params: { refeicao: meal } })}
        onNew={() => router.push('/adicionar')}
      />

      <View style={[styles.block, styles.tiles]}>
        <WaterTile ml={day.waterMl} goalMl={plan.waterMl} onAdd={onWater} />
        <WorkoutTile
          title={workoutTile.title}
          subtitle={workoutTile.subtitle}
          action={workoutTile.action}
          onPress={workoutTile.action ? onWorkout : undefined}
        />
      </View>

      {trend && (
        <View style={styles.block}>
          <WeightCard
            trend={trend}
            today={today}
            targetKg={profile.targetWeightKg}
            weeksToGoal={plan.weeksToGoal}
            losing={profile.goal === 'emagrecer'}
            onAdd={() => router.push('/peso')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  gauge: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  stats: {
    marginTop: 20,
  },
  macros: {
    marginTop: 26,
  },
  section: {
    marginTop: 18,
    marginBottom: spacing.md,
  },
  block: {
    marginTop: spacing.md,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
});
