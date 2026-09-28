import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { CalorieGauge } from '@/components/home/CalorieGauge';
import { WaterTile } from '@/components/home/WaterTile';
import { WeekStrip } from '@/components/home/WeekStrip';
import { WeightCard } from '@/components/home/WeightCard';
import { WorkoutTile } from '@/components/home/WorkoutTile';
import { MacroBars } from '@/components/nutrition/MacroBars';
import { EmptyState, Glass, Screen, Text, toast } from '@/components/ui';
import { formatInt, greeting } from '@/lib/format';
import { loggedDates, streak, weightTrend } from '@/lib/progress';
import { dayTotals } from '@/lib/totals';
import { estimatedMinutes, planForDate, shortFocus } from '@/lib/workout';
import { goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, spacing } from '@/theme/theme';

/** Seções que ainda não existem: abrem a página "Em breve". */
const SECTIONS = [
  { key: 'jornada', label: 'Jornada' },
  { key: 'receitas', label: 'Receitas' },
  { key: 'mercado', label: 'Mercado' },
  { key: 'caneta', label: 'Caneta' },
  { key: 'relatorios', label: 'Relatórios' },
] as const;

const WATER_STEP = 250;

export default function InicioScreen() {
  const state = useAppStore();
  const { profile, today: day, history, weights, workoutPlans, sessions, activeSession } = state;
  const { addWater, startSession } = state;
  const today = day.date;
  const { width } = useWindowDimensions();

  const plan = useMemo(() => goalPlan(state, today), [state, today]);
  const eaten = dayTotals(day);
  const logged = useMemo(() => loggedDates(day, history), [day, history]);
  const trend = useMemo(() => weightTrend(weights, today), [weights, today]);

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
    <Screen gap={0}>
      <View style={styles.top}>
        <View style={styles.who}>
          <LinearGradient colors={[colors.ember, colors.iris, colors.ember]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.hello}>
            {greeting()},{'\n'}
            {profile.name}
          </Text>
        </View>
        {days > 0 && (
          <View style={styles.pill} accessible accessibilityLabel={`${days} dias seguidos registrando`}>
            <Ionicons name="flame-outline" size={14} color={colors.ember2} />
            <Text style={styles.pillText}>{days}</Text>
          </View>
        )}
      </View>

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

      <View style={styles.block}>
        <WeekStrip today={today} logged={logged} />
      </View>

      <View style={[styles.block, styles.gauge]}>
        <CalorieGauge eaten={eaten.kcal} goal={plan.targetKcal} width={gaugeWidth} />
      </View>

      <View style={styles.meta}>
        <Meta label="Meta" value={formatInt(plan.targetKcal)} />
        <Meta label="Consumidas" value={formatInt(eaten.kcal)} divider />
        <Meta
          label={plan.dailyAdjustmentKcal < 0 ? 'Déficit' : plan.dailyAdjustmentKcal > 0 ? 'Superávit' : 'Ajuste'}
          value={plan.dailyAdjustmentKcal === 0 ? '0' : `${plan.dailyAdjustmentKcal > 0 ? '+' : '−'}${formatInt(Math.abs(plan.dailyAdjustmentKcal))}`}
          divider
        />
      </View>

      <View style={styles.block}>
        <MacroBars eaten={eaten} goal={plan.macros} size="lg" />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Registrar refeição pela foto"
        onPress={() => router.push({ pathname: '/em-breve', params: { secao: 'scanner' } })}
        style={({ pressed }) => [styles.blockLg, pressed && styles.pressed]}>
        <Glass flush contentStyle={styles.tap}>
          <LinearGradient colors={gradients.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tapIcon}>
            <Ionicons name="hand-left-outline" size={20} color={colors.onEmber} />
          </LinearGradient>
          <View style={styles.tapText}>
            <Text style={styles.tapTitle}>Toque duas vezes para registrar</Text>
            <Text variant="caption" tone="secondary">
              Foto do prato vira calorias em segundos
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.ink3} />
        </Glass>
      </Pressable>

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

function Meta({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <View style={[styles.metaCol, divider && styles.metaDivider]}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.avatarFill,
  },
  avatarText: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
  },
  hello: {
    fontFamily: fonts.display.semibold,
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: -0.7,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillText: {
    fontFamily: fonts.body.semibold,
    fontSize: 13,
  },
  tabs: {
    marginTop: 18,
    marginHorizontal: -spacing.lg,
  },
  tabsRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    justifyContent: 'center',
    backgroundColor: colors.frostFill,
    borderWidth: 1,
    borderColor: colors.frostEdge,
  },
  tabText: {
    fontFamily: fonts.body.semibold,
    fontSize: 15,
    color: colors.white,
  },
  block: {
    marginTop: 20,
  },
  blockLg: {
    marginTop: spacing.xl,
  },
  gauge: {
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    marginTop: 18,
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaDivider: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  metaValue: {
    fontFamily: fonts.display.semibold,
    fontSize: 16,
    lineHeight: 21,
  },
  tap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  tapIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapText: {
    flex: 1,
  },
  tapTitle: {
    fontFamily: fonts.display.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
});
