import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { WeightCard } from '@/components/home/WeightCard';
import { TabPage } from '@/components/navigation/TabPage';
import { EmptyState, Glass, IconButton, SectionHeader, Text, toast } from '@/components/ui';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatDayMonth, formatDecimal, formatInt, formatLiters } from '@/lib/format';
import { bmi, GOAL_LABELS, PACE_LABELS, ROUTINE_LABELS } from '@/lib/goals';
import { loggedDates, streak, weightProgress, weightTrend } from '@/lib/progress';
import { treinosNoMes } from '@/lib/treino/plano';
import { currentWeightKg, goalPlan } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/theme';

/** "Sentada (escritório, estudo)" → "Sentada". */
const shortRoutine = (label: string) => label.split(' (')[0];

export default function ResultadosScreen() {
  const state = useAppStore();
  const { profile, today: day, history, weights, sessoes } = state;
  const today = day.date;
  const plan = useMemo(() => goalPlan(state, today), [state, today]);
  const trend = useMemo(() => weightTrend(weights, today), [weights, today]);
  const current = currentWeightKg(state);

  if (!profile || !plan || current == null) {
    return (
      <TabPage>
        <Text style={styles.h1}>Resultados</Text>
        <EmptyState icon="person-outline" title="Crie seu perfil" message="Seus dados e resultados aparecem aqui depois do cadastro." />
      </TabPage>
    );
  }

  const days = streak(loggedDates(day, history), today);
  const progress = weightProgress(profile.startWeightKg, current, profile.targetWeightKg);
  const losing = profile.targetWeightKg < profile.startWeightKg;
  const keeping = profile.goal === 'manter' || progress.totalKg === 0;
  const startBmi = bmi(profile.startWeightKg, profile.heightCm);
  const workouts = treinosNoMes(sessoes, today);
  const adj = plan.dailyAdjustmentKcal;

  return (
    <TabPage>
      <View style={styles.header}>
        <Text style={styles.h1}>Resultados</Text>
        <IconButton icon="create-outline" label="Editar dados" onPress={() => toast('Em breve você edita seus dados aqui')} />
      </View>

      <View style={styles.who}>
        <LinearGradient colors={gradients.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
          </View>
        </LinearGradient>
        <View style={styles.whoText}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text variant="caption" tone="secondary">
            {plan.age} anos · {formatDecimal(profile.heightCm / 100, 2)} m · {profile.sex === 'feminino' ? 'Feminino' : 'Masculino'}
          </Text>
          <View style={styles.chips}>
            <Chip label={GOAL_LABELS[profile.goal]} />
            {profile.goal !== 'manter' && <Chip label={PACE_LABELS[profile.pace]} />}
          </View>
        </View>
      </View>

      <SectionHeader title="Seu progresso" aside={`desde ${formatDayMonth(profile.createdAt.slice(0, 10))}`} />
      <Glass contentStyle={styles.progress}>
        <Text variant="label" tone="muted">
          {keeping ? 'Seu peso hoje' : losing ? 'Você já perdeu' : 'Você já ganhou'}
        </Text>
        <Text style={styles.big}>
          {keeping ? `${formatDecimal(current)} kg` : `${losing ? '−' : '+'}${formatDecimal(progress.doneKg)} kg`}
          {!keeping && <Text style={styles.bigOf}> de {formatDecimal(progress.totalKg)} kg</Text>}
        </Text>
        {!keeping && (
          <>
            <ProgressBar value={progress.fraction} color={colors.lime} height={10} style={styles.bar} />
            <View style={styles.ends}>
              <End label="Início" value={profile.startWeightKg} />
              <End label="Hoje" value={current} />
              <End label="Meta" value={profile.targetWeightKg} />
            </View>
          </>
        )}
      </Glass>

      <View style={styles.tiles}>
        <Tile label="IMC" value={formatDecimal(plan.bmi)} note={`era ${formatDecimal(startBmi)} no início`} />
        <Tile label="Sequência" value={String(days)} unit={days === 1 ? 'dia' : 'dias'} note="registrando comida" />
      </View>
      <View style={styles.tiles}>
        <Tile
          label="Falta"
          value={formatDecimal(progress.leftKg)}
          unit="kg"
          note={plan.weeksToGoal != null ? `meta em ~${Math.max(1, Math.round(plan.weeksToGoal))} semanas` : 'para a meta'}
        />
        <Tile label="Treinos" value={String(workouts)} unit="no mês" note="concluídos" />
      </View>

      {trend && (
        <WeightCard
          trend={trend}
          today={today}
          targetKg={profile.targetWeightKg}
          weeksToGoal={plan.weeksToGoal}
          losing={profile.goal === 'emagrecer'}
          onAdd={() => router.push('/peso')}
        />
      )}

      <SectionHeader title="Dados iniciais" />
      <Glass flush>
        <Row label="Começou em" value={formatDayMonth(profile.createdAt.slice(0, 10))} />
        <Row label="Peso inicial" value={`${formatDecimal(profile.startWeightKg)} kg`} />
        <Row label="Meta de peso" value={`${formatDecimal(profile.targetWeightKg)} kg`} />
        <Row label="Altura" value={`${formatDecimal(profile.heightCm / 100, 2)} m`} />
        <Row label="Rotina de trabalho" value={shortRoutine(ROUTINE_LABELS[profile.workRoutine])} onPress={() => router.push('/rotina')} />
        <Row label="Usa caneta (GLP-1)" value={profile.usesGlp1 ? 'Sim' : 'Não'} last />
      </Glass>

      <SectionHeader title="Metas do dia" aside="calculadas para você" />
      <Glass flush>
        <Row label="Calorias" value={`${formatInt(plan.targetKcal)} kcal`} accent />
        <Row label="Proteína" value={`${formatInt(plan.macros.proteinG)} g`} />
        <Row label="Carboidrato" value={`${formatInt(plan.macros.carbsG)} g`} />
        <Row label="Gordura" value={`${formatInt(plan.macros.fatG)} g`} />
        <Row label="Água" value={`${formatLiters(plan.waterMl)} L`} />
        <Row label="Gasto diário estimado" value={`${formatInt(plan.tdeeKcal)} kcal`} />
        <Row
          label={adj < 0 ? 'Déficit planejado' : adj > 0 ? 'Superávit planejado' : 'Ajuste planejado'}
          value={adj === 0 ? 'manutenção' : `${adj > 0 ? '+' : '−'}${formatInt(Math.abs(adj))} kcal`}
          last
        />
      </Glass>
    </TabPage>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function End({ label, value }: { label: string; value: number }) {
  return (
    <Text variant="caption" tone="muted" style={styles.end}>
      {label} <Text style={styles.endValue}>{formatDecimal(value)} kg</Text>
    </Text>
  );
}

function Tile({ label, value, unit, note }: { label: string; value: string; unit?: string; note: string }) {
  return (
    <Glass style={styles.tile} contentStyle={styles.tileContent}>
      <Text variant="label" tone="muted">
        {label}
      </Text>
      <Text style={styles.tileValue}>
        {value}
        {unit ? <Text style={styles.tileUnit}> {unit}</Text> : null}
      </Text>
      <Text variant="caption" tone="secondary" style={styles.tileNote}>
        {note}
      </Text>
    </Glass>
  );
}

type RowProps = { label: string; value: string; accent?: boolean; last?: boolean; onPress?: () => void };

function Row({ label, value, accent, last, onPress }: RowProps) {
  const content = (
    <>
      <Text tone="secondary" style={styles.rowLabel}>
        {label}
      </Text>
      <View style={styles.rowEnd}>
        <Text style={[styles.rowValue, accent && styles.rowAccent]}>{value}</Text>
        {onPress && <Ionicons name="chevron-forward" size={16} color={colors.ink3} />}
      </View>
    </>
  );
  if (!onPress) return <View style={[styles.row, !last && styles.rowLine]}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Toque para mudar`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && styles.rowPressed]}>
      {content}
    </Pressable>
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
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: spacing.xs,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.avatarFill,
  },
  avatarText: {
    fontFamily: fonts.display.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  whoText: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.display.semibold,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
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
  progress: {
    padding: 20,
  },
  big: {
    marginTop: 6,
    fontFamily: fonts.display.bold,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -2,
    color: colors.lime,
    fontVariant: ['tabular-nums'],
  },
  bigOf: {
    fontFamily: fonts.body.semibold,
    fontSize: 15,
    letterSpacing: 0,
    color: colors.ink2,
  },
  bar: {
    marginTop: 14,
  },
  ends: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  end: {
    fontFamily: fonts.body.bold,
    fontSize: 12,
  },
  endValue: {
    fontFamily: fonts.body.bold,
    color: colors.ink,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
  },
  tileContent: {
    padding: spacing.lg,
  },
  tileValue: {
    marginTop: spacing.sm,
    fontFamily: fonts.display.bold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  tileUnit: {
    fontFamily: fonts.body.semibold,
    fontSize: 12.5,
    letterSpacing: 0,
    color: colors.ink3,
  },
  tileNote: {
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  rowLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  rowLabel: {
    flexShrink: 1,
    fontFamily: fonts.body.semibold,
    fontSize: 14,
    lineHeight: 19,
  },
  rowValue: {
    fontFamily: fonts.body.bold,
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowPressed: {
    backgroundColor: colors.glassFill,
  },
  rowAccent: {
    color: colors.lime,
  },
});
