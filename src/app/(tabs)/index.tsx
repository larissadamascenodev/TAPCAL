import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CalorieGauge, GaugeStats } from '@/components/home/CalorieGauge';
import { DateStrip } from '@/components/home/DateStrip';
import { MacroRows } from '@/components/home/MacroRows';
import { MealShortcuts } from '@/components/home/MealShortcuts';
import { WaterTile } from '@/components/home/WaterTile';
import { WeightCard } from '@/components/home/WeightCard';
import { WorkoutTile } from '@/components/home/WorkoutTile';
import { TabPage } from '@/components/navigation/TabPage';
import { EmptyState, Screen, SectionHeader, toast } from '@/components/ui';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { mealTargets } from '@/lib/goals';
import { weightTrend } from '@/lib/progress';
import { dayTotals } from '@/lib/totals';
import { formatInt } from '@/lib/format';
import { minutosEstimados } from '@/lib/treino/plano';
import { estadoDoDia, planoAtivo } from '@/lib/treino/semana';
import { burnedOn, goalPlan, workoutToday } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/theme';

const WATER_STEP = 250;

export default function InicioScreen() {
  const state = useAppStore();
  const { profile, today: day, weights, sessaoAtiva } = state;
  const { addWater, comecarTreino } = state;
  const today = day.date;
  const { width } = useWindowDimensions();

  const plan = useMemo(() => goalPlan(state, today), [state, today]);
  const eaten = dayTotals(day);
  const trend = useMemo(() => weightTrend(weights, today), [weights, today]);
  const gaugeTap = useDoubleTap(() => router.push('/scanner'));

  if (!profile || !plan) {
    return (
      <Screen>
        <EmptyState icon="person-outline" title="Crie seu perfil" message="Seu resumo do dia aparece aqui depois do cadastro." />
      </Screen>
    );
  }

  const workout = workoutToday(state, today);
  const doneToday = workout ? estadoDoDia(planoAtivo(state.planos), state.sessoes, workout.dia, today).tipo === 'feito' : false;
  // Kcal dos treinos de hoje: aumentam o orçamento do dia.
  const burned = burnedOn(state, today);
  const budget = plan.targetKcal + burned;

  const onWater = () => {
    const next = day.waterMl + WATER_STEP;
    addWater(WATER_STEP);
    toast(next >= plan.waterMl && day.waterMl < plan.waterMl ? 'Meta de água batida' : '+250 ml registrados');
  };

  const onWorkout = () => {
    if (!sessaoAtiva && workout) comecarTreino(workout.id);
    router.push('/treino-sessao');
  };

  const workoutTile = sessaoAtiva
    ? { title: 'Em andamento', subtitle: 'Toque para continuar', action: 'Continuar' }
    : workout && doneToday
      ? { title: workout.nome, subtitle: burned ? `Concluído · ${formatInt(burned)} kcal` : 'Concluído hoje' }
      : workout
        ? {
            title: workout.nome,
            subtitle: `${workout.exercicios.length} exercícios · ${minutosEstimados(workout)} min`,
            action: 'Iniciar',
          }
        : { title: 'Descanso', subtitle: 'Dia de recuperar' };

  const gaugeWidth = Math.min(340, width - spacing.lg * 2);

  return (
    <TabPage gap={0}>
      <DateStrip today={today} />

      <Pressable
        onPress={gaugeTap}
        accessibilityHint="Toque duas vezes para fotografar um prato"
        style={styles.gauge}>
        <CalorieGauge eaten={eaten.kcal} goal={budget} width={gaugeWidth} />
      </Pressable>
      <View style={styles.stats}>
        <GaugeStats eaten={eaten.kcal} goal={budget} adjustment={plan.dailyAdjustmentKcal} burned={burned} />
      </View>

      <MacroRows eaten={eaten} goal={plan.macros} style={styles.macros} />

      <View style={styles.section}>
        <SectionHeader title="Refeições de hoje" action="Ver diário" onAction={() => router.push('/alimentacao')} />
      </View>
      <MealShortcuts
        meals={day.meals}
        targets={mealTargets(plan.targetKcal)}
        onAdd={(meal) => router.push({ pathname: '/busca', params: { refeicao: meal } })}
        onNew={() => router.push('/scanner')}
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
    </TabPage>
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
