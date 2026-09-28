import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, Glass, IconButton, Screen, SectionHeader, Text } from '@/components/ui';
import { StatTile } from '@/components/ui/StatTile';
import { ExerciseRow } from '@/components/workout/ExerciseRow';
import { WeekSplit } from '@/components/workout/WeekSplit';
import { addDays } from '@/lib/dates';
import { formatTons } from '@/lib/format';
import {
  estimatedMinutes,
  isFreshRecord,
  lastWeightFor,
  planForDate,
  weekStats,
} from '@/lib/workout';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, spacing } from '@/theme/theme';
import type { WorkoutPlan } from '@/types';

/** Próximo treino a partir de amanhã (para os dias de descanso). */
function nextPlan(plans: WorkoutPlan[], today: string): { plan: WorkoutPlan; inDays: number } | null {
  for (let i = 1; i <= 7; i++) {
    const plan = planForDate(plans, addDays(today, i));
    if (plan) return { plan, inDays: i };
  }
  return null;
}

export default function TreinoScreen() {
  const { today: day, workoutPlans, sessions, activeSession, startSession } = useAppStore();
  const today = day.date;

  if (!workoutPlans.length) {
    return (
      <Screen glowAccent="iris">
        <Text style={styles.h1}>Treino</Text>
        <EmptyState icon="barbell-outline" title="Nenhum treino montado" message="Monte sua divisão da semana para começar." />
      </Screen>
    );
  }

  const todayPlan = planForDate(workoutPlans, today);
  const doneToday = sessions.some((s) => s.date === today);
  const upcoming = todayPlan ? null : nextPlan(workoutPlans, today);
  const shown = todayPlan ?? upcoming?.plan ?? null;
  const stats = weekStats(sessions, workoutPlans, today);
  const activePlan = activeSession ? workoutPlans.find((p) => p.id === activeSession.planId) : null;

  const start = (plan: WorkoutPlan) => {
    startSession(plan.id);
    router.push('/treino-sessao');
  };

  return (
    <Screen glowAccent="iris">
      <View style={styles.header}>
        <Text style={styles.h1}>Treino</Text>
        <IconButton
          icon="time-outline"
          label="Histórico"
          onPress={() => router.push({ pathname: '/em-breve', params: { secao: 'historico' } })}
        />
      </View>

      <WeekSplit today={today} plans={workoutPlans} sessions={sessions} />

      <Glass flush tint={gradients.workoutHero} contentStyle={styles.hero}>
        <Ionicons name="barbell" size={120} color={colors.lineSoft} style={styles.heroArt} />
        {activeSession && activePlan ? (
          <>
            <Text variant="label" tone="muted">
              Em andamento
            </Text>
            <Text style={styles.heroTitle}>{activePlan.focus}</Text>
            <Button label="Continuar treino" icon={<Ionicons name="play" size={12} color={colors.onEmber} />} onPress={() => router.push('/treino-sessao')} style={styles.heroBtn} size="md" />
          </>
        ) : todayPlan ? (
          <>
            <Text variant="label" tone="muted">
              Hoje · {todayPlan.name}
            </Text>
            <Text style={styles.heroTitle}>{todayPlan.focus}</Text>
            <View style={styles.tags}>
              <Tag text={`${todayPlan.exercises.length} exercícios`} />
              <Tag text={`~${estimatedMinutes(todayPlan)} min`} />
            </View>
            {doneToday ? (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.ok} />
                <Text variant="bodyStrong" style={{ color: colors.ok }}>
                  Treino de hoje concluído
                </Text>
              </View>
            ) : (
              <Button
                label="Começar treino"
                icon={<Ionicons name="play" size={12} color={colors.onEmber} />}
                onPress={() => start(todayPlan)}
                style={styles.heroBtn}
                size="md"
              />
            )}
          </>
        ) : (
          <>
            <Text variant="label" tone="muted">
              Hoje · descanso
            </Text>
            <Text style={styles.heroTitle}>Dia de recuperar</Text>
            {upcoming && (
              <Text tone="secondary" style={styles.heroNote}>
                {upcoming.inDays === 1 ? 'Amanhã' : `Em ${upcoming.inDays} dias`}: {upcoming.plan.focus.toLowerCase()}
              </Text>
            )}
          </>
        )}
      </Glass>

      <View style={styles.stats}>
        <StatTile label="Esta semana" value={`${stats.done} / ${stats.planned}`} />
        <StatTile label="Volume" value={`${formatTons(stats.volumeKg)} t`} />
        <StatTile label="Recordes" value={String(stats.records)} />
      </View>

      {shown && (
        <>
          <SectionHeader
            title={todayPlan ? 'Exercícios de hoje' : 'Próximo treino'}
            aside={shown.name}
          />
          <View style={styles.list}>
            {shown.exercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                index={i}
                exercise={ex}
                lastWeightKg={lastWeightFor(sessions, ex.id)}
                freshRecord={isFreshRecord(sessions, ex.id)}
              />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={styles.tag}>
      <Text variant="caption" tone="secondary" style={styles.tagText}>
        {text}
      </Text>
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
  hero: {
    padding: 18,
    minHeight: 196,
  },
  heroArt: {
    position: 'absolute',
    right: -10,
    bottom: -18,
    transform: [{ rotate: '-20deg' }],
  },
  heroTitle: {
    marginTop: spacing.sm,
    maxWidth: '75%',
    fontFamily: fonts.display.bold,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -1.2,
  },
  heroNote: {
    marginTop: spacing.sm,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },
  tag: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 13,
    justifyContent: 'center',
    backgroundColor: colors.track,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tagText: {
    fontFamily: fonts.body.bold,
    fontSize: 11,
  },
  heroBtn: {
    marginTop: spacing.lg,
    height: 48,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
});
