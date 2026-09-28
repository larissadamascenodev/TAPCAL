import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { HOME_HEADER_H, HomeHeader } from '@/components/home/HomeHeader';
import { MascotHero } from '@/components/home/MascotHero';
import { TodayCard } from '@/components/home/TodayCard';
import { WaterTile } from '@/components/home/WaterTile';
import { WeightCard } from '@/components/home/WeightCard';
import { WorkoutTile } from '@/components/home/WorkoutTile';
import { EmptyState, Screen, Text, toast } from '@/components/ui';
import { useDoubleTap } from '@/hooks/useDoubleTap';
import { mascotMood } from '@/lib/mascot';
import { loggedDates, streak, weightTrend } from '@/lib/progress';
import { dayTotals } from '@/lib/totals';
import { estimatedMinutes, planForDate, shortFocus } from '@/lib/workout';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, spacing } from '@/theme/theme';

/** Seções que ainda não existem: abrem a página "Em breve". */
const SECTIONS = [
  { key: 'jornada', label: 'Jornada' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'mercado', label: 'Mercado' },
  { key: 'caneta', label: 'Caneta' },
  { key: 'relatorios', label: 'Relatórios' },
] as const;

const WATER_STEP = 250;

/** Rolou além disto: o nome aparece no topo. */
const SCROLLED_AT = 150;

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
  const cardTap = useDoubleTap(() => router.push('/scanner'));

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
  const firstName = profile.name.trim().split(/\s+/)[0] ?? profile.name;
  const { mood, message } = mascotMood({
    name: firstName,
    eatenKcal: eaten.kcal,
    goalKcal: plan.targetKcal,
    proteinG: eaten.proteinG,
    proteinGoalG: plan.macros.proteinG,
    waterMl: day.waterMl,
    waterGoalMl: plan.waterMl,
    streakDays: days,
    hour: new Date().getHours(),
  });

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

  const heroWidth = Math.min(340, width - spacing.lg * 2);

  return (
    <Screen
      gap={0}
      topOffset={HOME_HEADER_H}
      onScrollY={(y) => setScrolled(y > SCROLLED_AT)}
      overlay={<HomeHeader name={profile.name} streakDays={days} scrolled={scrolled} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsRow}>
        {SECTIONS.map((s) => (
          <Pressable
            key={s.key}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/em-breve', params: { secao: s.key } })}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}>
            <Text style={styles.tabText}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.hero}>
        <MascotHero eaten={eaten.kcal} goal={plan.targetKcal} mood={mood} message={message} width={heroWidth} />
      </View>

      <View style={styles.block}>
        <TodayCard goalKcal={plan.targetKcal} eaten={eaten} goal={plan.macros} onPress={cardTap} />
      </View>

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
  tabs: {
    marginHorizontal: -spacing.lg,
  },
  tabsRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: colors.frostFill,
    borderWidth: 1,
    borderColor: colors.frostEdge,
  },
  tabText: {
    fontFamily: fonts.body.semibold,
    fontSize: 16,
    color: colors.white,
  },
  hero: {
    marginTop: 10,
  },
  block: {
    marginTop: 14,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
});
